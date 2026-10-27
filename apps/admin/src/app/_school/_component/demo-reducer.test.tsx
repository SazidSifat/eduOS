import { describe, expect, it } from 'vitest';
import { DEMO_TODAY, initialState } from './demo-data';
import { demoReducer } from './demo-reducer';
import { nextBillingDate } from './demo-finance';
import { markCounts } from '../attendance/_component/attendance-model';
import { routineConflicts, unassignedSlots } from '../routine/_component/routine-model';

describe('frontend school financial workflows', () => {
  it('creates no charge or receipt when willing collection is skipped', () => {
    const state = initialState();
    const candidate = state.candidates[0];
    if (!candidate) throw new Error('Missing synthetic candidate');
    const next = demoReducer(state, {
      type: 'candidate-state',
      candidateId: candidate.id,
      state: 'willing',
      nextCall: '',
    });
    expect(next.candidates[0]?.state).toBe('willing');
    expect(next.charges).toEqual(state.charges);
    expect(next.payments).toEqual([]);
  });
  it('does not admit or create financial rows without cash confirmation', () => {
    const state = initialState();
    const candidate = state.candidates.find((c) => c.state === 'willing');
    if (!candidate) throw new Error('Missing synthetic candidate');
    expect(
      demoReducer(state, {
        type: 'admit',
        candidateId: candidate.id,
        fees: state.feeDefaults,
        cashConfirmed: false,
      }),
    ).toBe(state);
  });
  it('records credited admission, allocations and monthly schedule together', () => {
    const state = initialState();
    const candidate = state.candidates.find((c) => c.willingPaid === 50000);
    if (!candidate) throw new Error('Missing synthetic willing credit');
    const next = demoReducer(state, {
      type: 'admit',
      candidateId: candidate.id,
      fees: state.feeDefaults,
      cashConfirmed: true,
    });
    expect(next.candidates.find((c) => c.id === candidate.id)?.state).toBe('admitted');
    expect(next.payments.at(-1)?.amount).toBe(480000);
    expect(next.payments.at(-1)?.allocations.reduce((sum, a) => sum + a.amount, 0)).toBe(480000);
    expect(next.schedules.find((s) => s.candidateId === candidate.id)?.next).toBe('2026-11-26');
    expect(
      demoReducer(next, {
        type: 'admit',
        candidateId: candidate.id,
        fees: state.feeDefaults,
        cashConfirmed: true,
      }),
    ).toBe(next);
  });
  it('rejects duplicate, excessive and foreign-account allocations atomically', () => {
    const state = initialState();
    const charge = state.charges[0];
    const foreign = state.charges.find((c) => c.candidateId !== charge?.candidateId);
    if (!charge || !foreign) throw new Error('Missing synthetic charges');
    for (const allocations of [
      [{ chargeId: charge.id, amount: charge.amount + 1 }],
      [
        { chargeId: charge.id, amount: 1 },
        { chargeId: charge.id, amount: 1 },
      ],
      [{ chargeId: foreign.id, amount: 1 }],
    ]) {
      expect(
        demoReducer(state, {
          type: 'collect',
          candidateId: charge.candidateId,
          allocations,
          date: DEMO_TODAY,
        }),
      ).toBe(state);
    }
  });
  it('restores only allocated balances on reversal and preserves the receipt', () => {
    const state = initialState();
    const charge = state.charges[0];
    if (!charge) throw new Error('Missing synthetic charge');
    const paid = demoReducer(state, {
      type: 'collect',
      candidateId: charge.candidateId,
      allocations: [{ chargeId: charge.id, amount: 40000 }],
      date: DEMO_TODAY,
    });
    const receipt = paid.payments.at(-1);
    if (!receipt) throw new Error('Missing generated receipt');
    expect(paid.charges.find((c) => c.id === charge.id)?.paid).toBe(40000);
    const reversed = demoReducer(paid, {
      type: 'reverse',
      paymentId: receipt.id,
      reason: 'Duplicate synthetic payment',
    });
    expect(reversed.charges.find((c) => c.id === charge.id)?.paid).toBe(0);
    expect(reversed.payments.at(-1)?.amount).toBe(40000);
    expect(reversed.payments.at(-1)?.reversed).toBe('Duplicate synthetic payment');
    expect(demoReducer(reversed, { type: 'reverse', paymentId: receipt.id, reason: 'Again' })).toBe(
      reversed,
    );
  });
  it('uses month-end and leap-year dates for future billing', () => {
    expect(nextBillingDate('2026-01-31')).toBe('2026-02-28');
    expect(nextBillingDate('2028-01-31')).toBe('2028-02-29');
    expect(nextBillingDate('2026-12-31')).toBe('2027-01-31');
  });
  it('requires expense approval and prevents duplicate payment vouchers', () => {
    const state = initialState();
    const pending = state.expenses.find((e) => e.status === 'pending');
    if (!pending) throw new Error('Missing pending synthetic expense');
    expect(
      demoReducer(state, { type: 'expense-pay', id: pending.id }).expenses.find(
        (e) => e.id === pending.id,
      )?.paid,
    ).toBe(false);
    const approved = demoReducer(state, {
      type: 'expense-review',
      id: pending.id,
      approved: true,
      note: 'Evidence checked',
    });
    const paid = demoReducer(approved, { type: 'expense-pay', id: pending.id });
    const repeated = demoReducer(paid, { type: 'expense-pay', id: pending.id });
    expect(paid.expenses.find((e) => e.id === pending.id)?.paid).toBe(true);
    expect(repeated.expenses).toEqual(paid.expenses);
  });
});

describe('frontend attendance submission and correction', () => {
  it('does not submit an incomplete register', () => {
    const state = initialState();
    const next = demoReducer(state, { type: 'attendance-submit' });
    expect(next.registers.find((r) => r.id === state.selectedRegister)?.submitted).toBe(false);
  });
  it('bulk marking fills only unmarked statuses and freezes a submitted register', () => {
    const state = demoReducer(initialState(), { type: 'attendance-bulk' });
    const register = state.registers.find((r) => r.id === state.selectedRegister);
    if (!register) throw new Error('Missing register');
    expect(markCounts(register)).toEqual({ Present: 31, Absent: 3, Late: 2, Unmarked: 0 });
    const submitted = demoReducer(state, { type: 'attendance-submit' });
    const unchanged = demoReducer(submitted, {
      type: 'attendance-mark',
      studentId: '3-a-1',
      mark: 'Absent',
    });
    expect(unchanged.registers.find((r) => r.id === register.id)?.marks).toEqual(register.marks);
  });
  it('keeps the original status until correction approval and retains its history', () => {
    const state = initialState();
    const request = {
      id: 'COR-1',
      registerId: '2026-10-25|3-a',
      studentId: '3-a-2',
      original: 'Absent',
      proposed: 'Present',
      reason: 'Wrong row selected',
      status: 'pending',
    } as const;
    const requested = demoReducer(state, { type: 'correction-request', correction: request });
    expect(
      requested.registers.find((r) => r.id === request.registerId)?.marks[request.studentId],
    ).toBe('Absent');
    expect(
      demoReducer(requested, {
        type: 'correction-request',
        correction: { ...request, id: 'COR-2' },
      }),
    ).toBe(requested);
    const approved = demoReducer(requested, {
      type: 'correction-review',
      id: 'COR-1',
      approved: true,
    });
    expect(
      approved.registers.find((r) => r.id === request.registerId)?.marks[request.studentId],
    ).toBe('Present');
    expect(approved.corrections[0]).toMatchObject({
      original: 'Absent',
      proposed: 'Present',
      status: 'approved',
    });
  });
});

describe('frontend routine publication', () => {
  it('blocks incomplete or conflicting publication', () => {
    const state = initialState();
    expect(demoReducer(state, { type: 'routine-publish', note: '' })).toBe(state);
    const conflicted = demoReducer(state, {
      type: 'lesson-save',
      lesson: {
        id: 'Monday-4',
        day: 'Monday',
        period: '4',
        subject: 'Mathematics',
        teacher: 'Farhana Akter',
        room: 'Classroom 3-A',
      },
    });
    expect(routineConflicts(conflicted.routine)).toHaveLength(2);
    expect(demoReducer(conflicted, { type: 'routine-publish', note: '' })).toBe(conflicted);
  });
  it('validates fixes before publishing and retains the prior version', () => {
    const state = demoReducer(initialState(), { type: 'routine-resolve' });
    expect(routineConflicts(state.routine)).toEqual([]);
    expect(unassignedSlots(state.routine)).toEqual([]);
    const published = demoReducer(state, { type: 'routine-publish', note: 'Reviewed' });
    expect(published.routineHistory.map((r) => r.version)).toEqual([1, 2]);
    const edited = demoReducer(published, {
      type: 'lesson-save',
      lesson: {
        id: 'Monday-4',
        day: 'Monday',
        period: '4',
        subject: 'Bangla',
        teacher: 'Sharmin Begum',
        room: 'Classroom 3-A',
      },
    });
    expect(edited.routine.published).toBe(false);
    expect(edited.routineHistory.at(-1)?.lessons).toEqual(published.routine.lessons);
  });
});
