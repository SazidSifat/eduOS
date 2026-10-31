import { and, eq, type DatabaseTransaction } from '@eduos/database';
import { schoolExpense, schoolEvidence } from '@eduos/database/schema';
import { schoolExpenseSchema, type SchoolAction } from '@eduos/contracts';
import { allowed, requireSchool, schoolToday, type SchoolAccess } from '../school/policy.js';
import type { SchoolConfiguration } from '../../models/school.model.js';
import { forbidden, invalidRequest, conflict } from '../../lib/errors.js';
export async function readSchoolExpenses(tx: DatabaseTransaction, access: SchoolAccess) {
  if (!allowed(access, 'expenses.read', 'fees')) return [];
  const rows = await tx
    .select({ data: schoolExpense.data })
    .from(schoolExpense)
    .where(eq(schoolExpense.institutionId, access.school.id))
    .orderBy(schoolExpense.createdAt);
  return rows.map((r) => schoolExpenseSchema.parse(r.data));
}
export async function runSchoolExpense(
  tx: DatabaseTransaction,
  access: SchoolAccess,
  config: SchoolConfiguration,
  action: SchoolAction,
) {
  if (action.type === 'expense-save') {
    requireSchool(access, 'expenses.write', 'fees');
    const e = action.expense;
    const [current] = await tx
      .select()
      .from(schoolExpense)
      .where(and(eq(schoolExpense.institutionId, access.school.id), eq(schoolExpense.id, e.id)));
    const prior = current ? schoolExpenseSchema.parse(current.data) : undefined;
    if (prior?.paid || prior?.status === 'approved') conflict();
    if (
      !['draft', 'pending'].includes(e.status) ||
      !config.categories.includes(e.category) ||
      e.date > schoolToday(access.school.timezone)
    )
      invalidRequest();
    if (e.attachment) {
      const [evidence] = await tx
        .select({ id: schoolEvidence.id })
        .from(schoolEvidence)
        .where(
          and(
            eq(schoolEvidence.institutionId, access.school.id),
            eq(schoolEvidence.id, e.attachment),
          ),
        );
      if (!evidence) forbidden();
    } else if (e.status === 'pending' && config.settings.evidence === 'Required') invalidRequest();
    const data = {
      ...e,
      paid: false,
      reviewNote: '',
      voucher: '',
      paidOn: '',
      paidBy: '',
      history: [
        ...(prior?.history ?? []),
        `${access.name} ${e.status === 'draft' ? 'saved a draft' : 'submitted for approval'}.`,
      ],
    };
    const values = {
      evidenceId: e.attachment || null,
      amountMinor: e.amount,
      status: e.status,
      data,
    };
    if (current)
      await tx
        .update(schoolExpense)
        .set(values)
        .where(and(eq(schoolExpense.institutionId, access.school.id), eq(schoolExpense.id, e.id)));
    else
      await tx
        .insert(schoolExpense)
        .values({ id: e.id, institutionId: access.school.id, ...values });
    return e.id;
  }
  if (action.type !== 'expense-review' && action.type !== 'expense-pay') invalidRequest();
  requireSchool(
    access,
    action.type === 'expense-review' ? 'expenses.review' : 'expenses.pay',
    'fees',
  );
  const [current] = await tx
    .select()
    .from(schoolExpense)
    .where(and(eq(schoolExpense.institutionId, access.school.id), eq(schoolExpense.id, action.id)));
  if (!current) forbidden();
  const prior = schoolExpenseSchema.parse(current.data);
  let data = prior;
  if (action.type === 'expense-review') {
    if (prior.status !== 'pending') conflict();
    if (
      config.settings.expenseReviewer === 'Principal' &&
      prior.amount >= Math.round(Number(config.settings.expenseThreshold ?? '0') * 100) &&
      access.actor.role !== 'principal'
    )
      forbidden();
    data = {
      ...prior,
      status: action.approved ? 'approved' : 'returned',
      reviewNote: action.note,
      history: [
        ...prior.history,
        `${access.name} ${action.approved ? 'approved' : 'returned'}: ${action.note}`,
      ],
    };
  } else {
    if (prior.status !== 'approved' || prior.paid) conflict();
    data = {
      ...prior,
      paid: true,
      paidOn: schoolToday(access.school.timezone),
      paidBy: access.name,
      voucher: `PV-${current.id}`,
      history: [...prior.history, `${access.name} recorded cash payment.`],
    };
  }
  await tx
    .update(schoolExpense)
    .set({ status: data.status, data })
    .where(
      and(eq(schoolExpense.institutionId, access.school.id), eq(schoolExpense.id, current.id)),
    );
  return current.id;
}
