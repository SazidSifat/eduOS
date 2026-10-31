import { randomUUID } from 'node:crypto';
import { and, eq, type DatabaseTransaction } from '@eduos/database';
import {
  admissionCandidate,
  admissionCharge,
  admissionPayment,
  admissionReceipt,
  monthlyFeeSchedule,
  monthlyFeeCharge,
  monthlyFeePayment,
  schoolFeePayment,
  schoolFeeAllocation,
  schoolFeeReversal,
  user,
} from '@eduos/database/schema';
import { type SchoolAction, type SchoolState } from '@eduos/contracts';
import { allowed, requireSchool, schoolToday, type SchoolAccess } from '../school/policy.js';
import { stopMonthlySchedule } from './monthly-billing.js';
import { forbidden, invalidRequest, conflict } from '../../lib/errors.js';
import { allocatedToCharge, schoolAllocatedBalances } from './school-balances.js';
export async function readSchoolFees(
  tx: DatabaseTransaction,
  access: SchoolAccess,
  candidateIds: Set<string>,
) {
  const result: Pick<SchoolState, 'charges' | 'payments' | 'schedules'> = {
    charges: [],
    payments: [],
    schedules: [],
  };
  if (!allowed(access, 'fees.read', 'fees') && !allowed(access, 'admissions.read', 'admissions'))
    return result;
  const monthly = await tx
    .select({
      charge: monthlyFeeCharge,
      schedule: monthlyFeeSchedule,
      paid: monthlyFeePayment.amountMinor,
      receipt: monthlyFeePayment.receiptNumber,
      paidAt: monthlyFeePayment.createdAt,
      collector: user.name,
    })
    .from(monthlyFeeCharge)
    .innerJoin(
      monthlyFeeSchedule,
      and(
        eq(monthlyFeeSchedule.institutionId, monthlyFeeCharge.institutionId),
        eq(monthlyFeeSchedule.id, monthlyFeeCharge.scheduleId),
      ),
    )
    .leftJoin(
      monthlyFeePayment,
      and(
        eq(monthlyFeePayment.institutionId, monthlyFeeCharge.institutionId),
        eq(monthlyFeePayment.chargeId, monthlyFeeCharge.id),
      ),
    )
    .leftJoin(user, eq(user.id, monthlyFeePayment.collectorId))
    .where(eq(monthlyFeeCharge.institutionId, access.school.id));
  const balances = await schoolAllocatedBalances(tx, access.school.id);
  for (const r of monthly.filter((r) => candidateIds.has(r.schedule.candidateId))) {
    result.charges.push({
      id: r.charge.id,
      candidateId: r.schedule.candidateId,
      label: r.schedule.label,
      period: r.charge.dueDate.slice(0, 7),
      due: r.charge.dueDate,
      amount: r.charge.amountMinor,
      paid: (r.paid ?? 0) + (balances.get(r.charge.id) ?? 0),
    });
    if (r.receipt && r.paidAt)
      result.payments.push({
        id: r.receipt,
        candidateId: r.schedule.candidateId,
        amount: r.paid ?? 0,
        date: dateAt(r.paidAt, access.school.timezone),
        collector: r.collector ?? '',
        kind: 'school',
        allocations: [{ chargeId: r.charge.id, amount: r.paid ?? 0 }],
        reversed: '',
      });
  }
  const schedules = await tx
    .select()
    .from(monthlyFeeSchedule)
    .where(eq(monthlyFeeSchedule.institutionId, access.school.id));
  result.schedules = schedules
    .filter((s) => candidateIds.has(s.candidateId))
    .map((s) => ({
      id: s.id,
      candidateId: s.candidateId,
      label: s.label,
      amount: s.amountMinor,
      next: s.nextDueDate,
      end: s.endDate ?? '',
      active: s.active,
    }));
  const receipts = await tx
    .select({
      payment: admissionPayment,
      receipt: admissionReceipt,
      charge: admissionCharge,
      collector: user.name,
    })
    .from(admissionPayment)
    .innerJoin(
      admissionCharge,
      and(
        eq(admissionCharge.institutionId, admissionPayment.institutionId),
        eq(admissionCharge.id, admissionPayment.chargeId),
      ),
    )
    .innerJoin(
      admissionReceipt,
      and(
        eq(admissionReceipt.institutionId, admissionPayment.institutionId),
        eq(admissionReceipt.paymentId, admissionPayment.id),
      ),
    )
    .innerJoin(user, eq(user.id, admissionPayment.collectorId))
    .where(eq(admissionPayment.institutionId, access.school.id));
  for (const r of receipts.filter((r) => candidateIds.has(r.charge.candidateId))) {
    result.charges.push({
      id: r.charge.id,
      candidateId: r.charge.candidateId,
      label: r.charge.kind === 'willing' ? 'Willing registration fee' : 'Admission fees',
      period: 'At admission',
      due: dateAt(r.payment.createdAt, access.school.timezone),
      amount: r.charge.amountMinor,
      paid: r.charge.amountMinor,
    });
    result.payments.push({
      id: r.receipt.number,
      candidateId: r.charge.candidateId,
      amount: r.payment.amountMinor,
      date: dateAt(r.payment.createdAt, access.school.timezone),
      collector: r.collector,
      kind: r.charge.kind === 'willing' ? 'willing' : 'admission',
      allocations: [{ chargeId: r.charge.id, amount: r.payment.amountMinor }],
      reversed: '',
    });
  }
  const payments = await tx
    .select({ payment: schoolFeePayment, collector: user.name, reason: schoolFeeReversal.reason })
    .from(schoolFeePayment)
    .innerJoin(user, eq(user.id, schoolFeePayment.collectorId))
    .leftJoin(
      schoolFeeReversal,
      and(
        eq(schoolFeeReversal.institutionId, schoolFeePayment.institutionId),
        eq(schoolFeeReversal.paymentId, schoolFeePayment.id),
      ),
    )
    .where(eq(schoolFeePayment.institutionId, access.school.id));
  const allocations = await tx
    .select()
    .from(schoolFeeAllocation)
    .where(eq(schoolFeeAllocation.institutionId, access.school.id));
  for (const r of payments.filter((r) => candidateIds.has(r.payment.candidateId)))
    result.payments.push({
      id: r.payment.id,
      candidateId: r.payment.candidateId,
      amount: r.payment.amountMinor,
      date: r.payment.date,
      collector: r.collector,
      kind: 'school',
      reversed: r.reason ?? '',
      allocations: allocations
        .filter((a) => a.paymentId === r.payment.id)
        .map((a) => ({ chargeId: a.chargeId, amount: a.amountMinor })),
    });
  return result;
}
function dateAt(date: Date, timezone: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
export async function runSchoolFees(
  tx: DatabaseTransaction,
  access: SchoolAccess,
  action: SchoolAction,
) {
  requireSchool(access, action.type === 'reverse' ? 'fees.reverse' : 'fees.collect', 'fees');
  if (action.type === 'collect') {
    if (
      new Set(action.allocations.map((a) => a.chargeId)).size !== action.allocations.length ||
      action.date > schoolToday(access.school.timezone)
    )
      invalidRequest();
    const [candidate] = await tx
      .select()
      .from(admissionCandidate)
      .where(
        and(
          eq(admissionCandidate.institutionId, access.school.id),
          eq(admissionCandidate.id, action.candidateId),
          eq(admissionCandidate.state, 'admitted'),
        ),
      );
    if (
      !candidate ||
      (access.actor.role === 'admission_officer' && candidate.assigneeId !== access.actor.userId)
    )
      forbidden();
    let total = 0;
    for (const a of action.allocations) {
      const [charge] = await tx
        .select({ amount: monthlyFeeCharge.amountMinor, legacyPaid: monthlyFeePayment.amountMinor })
        .from(monthlyFeeCharge)
        .innerJoin(
          monthlyFeeSchedule,
          and(
            eq(monthlyFeeSchedule.institutionId, monthlyFeeCharge.institutionId),
            eq(monthlyFeeSchedule.id, monthlyFeeCharge.scheduleId),
          ),
        )
        .leftJoin(
          monthlyFeePayment,
          and(
            eq(monthlyFeePayment.institutionId, monthlyFeeCharge.institutionId),
            eq(monthlyFeePayment.chargeId, monthlyFeeCharge.id),
          ),
        )
        .where(
          and(
            eq(monthlyFeeCharge.institutionId, access.school.id),
            eq(monthlyFeeCharge.id, a.chargeId),
            eq(monthlyFeeSchedule.candidateId, candidate.id),
          ),
        );
      if (!charge) forbidden();
      if (
        a.amount >
        charge.amount -
          (charge.legacyPaid ?? 0) -
          (await allocatedToCharge(tx, access.school.id, a.chargeId))
      )
        conflict();
      total += a.amount;
    }
    if (!Number.isSafeInteger(total) || total > 100000000) invalidRequest();
    const id = randomUUID();
    await tx.insert(schoolFeePayment).values({
      id,
      institutionId: access.school.id,
      candidateId: candidate.id,
      collectorId: access.actor.userId,
      amountMinor: total,
      date: action.date,
    });
    for (const a of action.allocations)
      await tx.insert(schoolFeeAllocation).values({
        institutionId: access.school.id,
        paymentId: id,
        chargeId: a.chargeId,
        amountMinor: a.amount,
      });
    return id;
  }
  if (action.type === 'reverse') {
    const [p] = await tx
      .select()
      .from(schoolFeePayment)
      .where(
        and(
          eq(schoolFeePayment.institutionId, access.school.id),
          eq(schoolFeePayment.id, action.paymentId),
        ),
      );
    if (!p) forbidden();
    const [prior] = await tx
      .select()
      .from(schoolFeeReversal)
      .where(
        and(
          eq(schoolFeeReversal.institutionId, access.school.id),
          eq(schoolFeeReversal.paymentId, p.id),
        ),
      );
    if (prior) conflict();
    await tx.insert(schoolFeeReversal).values({
      institutionId: access.school.id,
      paymentId: p.id,
      actorId: access.actor.userId,
      reason: action.reason,
    });
    return p.id;
  }
  if (action.type === 'schedule-stop') {
    const [schedule] = await tx
      .select()
      .from(monthlyFeeSchedule)
      .where(
        and(
          eq(monthlyFeeSchedule.institutionId, access.school.id),
          eq(monthlyFeeSchedule.id, action.id),
        ),
      );
    if (!schedule) forbidden();
    if (access.actor.role === 'admission_officer') forbidden();
    await stopMonthlySchedule(tx, access.school.id, schedule.candidateId, schedule.id);
    return schedule.id;
  }
  invalidRequest();
}
