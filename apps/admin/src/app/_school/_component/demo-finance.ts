import type { DemoAction, DemoState, FeeItem, Payment } from './demo-model';
import { DEMO_TODAY } from './demo-data';

export const receiptId = (state: DemoState) =>
  `RCT-2026-${String(319 + state.payments.length).padStart(4, '0')}`;
export function nextBillingDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return '';
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const next = new Date(Date.UTC(year, month, Math.min(day, lastDay)));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`;
}
export function admissionTotal(fees: FeeItem[]) {
  return fees.reduce((sum, fee) => sum + fee.amount, 0);
}
export function validFees(fees: FeeItem[]) {
  return (
    fees.length > 0 &&
    fees.every(
      (f) =>
        f.label.trim() &&
        Number.isSafeInteger(f.amount) &&
        f.amount >= 0 &&
        (f.type !== 'monthly' ||
          (/^\d{4}-\d{2}-\d{2}$/.test(f.start) && (!f.end || f.end >= f.start))),
    )
  );
}
export function financeReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'admit': {
      const candidate = state.candidates.find((c) => c.id === action.candidateId);
      if (!candidate || candidate.state === 'admitted' || !validFees(action.fees)) return state;
      const total = admissionTotal(action.fees);
      let credit =
        state.settings.creditWilling === 'yes' ? Math.min(total, candidate.willingPaid) : 0;
      const cash = total - credit;
      if (cash > 0 && !action.cashConfirmed) return state;
      const allocations: Payment['allocations'] = [];
      const charges = action.fees.map((fee) => {
        const appliedCredit = Math.min(credit, fee.amount);
        credit -= appliedCredit;
        const amount = fee.amount - appliedCredit;
        const id = `${candidate.id}-${fee.id}-${state.payments.length}`;
        if (amount > 0) allocations.push({ chargeId: id, amount });
        return {
          id,
          candidateId: candidate.id,
          label: fee.label,
          period: 'At admission',
          due: DEMO_TODAY,
          amount: fee.amount,
          paid: fee.amount,
        };
      });
      return {
        ...state,
        candidates: state.candidates.map((c) =>
          c.id === candidate.id
            ? { ...c, state: 'admitted', admittedOn: DEMO_TODAY, nextCall: '', fees: action.fees }
            : c,
        ),
        charges: [...state.charges, ...charges],
        payments:
          cash > 0
            ? [
                ...state.payments,
                {
                  id: receiptId(state),
                  candidateId: candidate.id,
                  amount: cash,
                  date: DEMO_TODAY,
                  collector: 'Nusrat Ahmed',
                  kind: 'admission',
                  allocations,
                  reversed: '',
                },
              ]
            : state.payments,
        schedules: [
          ...state.schedules,
          ...action.fees
            .filter((f) => f.type === 'monthly')
            .map((f) => ({
              id: `schedule-${candidate.id}-${f.id}`,
              candidateId: candidate.id,
              label: f.label,
              amount: f.amount,
              next: nextBillingDate(f.start),
              end: f.end,
              active: true,
            })),
        ],
      };
    }
    case 'willing-payment': {
      const candidate = state.candidates.find((c) => c.id === action.candidateId);
      if (
        !candidate ||
        candidate.state !== 'willing' ||
        candidate.willingPaid > 0 ||
        !Number.isSafeInteger(action.amount) ||
        action.amount <= 0
      )
        return state;
      const id = `${candidate.id}-willing`;
      return {
        ...state,
        candidates: state.candidates.map((c) =>
          c.id === candidate.id ? { ...c, willingPaid: action.amount } : c,
        ),
        charges: [
          ...state.charges,
          {
            id,
            candidateId: candidate.id,
            label: 'Willing registration fee',
            period: 'Registration',
            due: DEMO_TODAY,
            amount: action.amount,
            paid: action.amount,
          },
        ],
        payments: [
          ...state.payments,
          {
            id: receiptId(state),
            candidateId: candidate.id,
            amount: action.amount,
            date: DEMO_TODAY,
            collector: 'Nusrat Ahmed',
            kind: 'willing',
            allocations: [{ chargeId: id, amount: action.amount }],
            reversed: '',
          },
        ],
      };
    }
    case 'collect': {
      const candidate = state.candidates.find((c) => c.id === action.candidateId);
      if (
        !candidate ||
        candidate.state !== 'admitted' ||
        action.allocations.length === 0 ||
        new Set(action.allocations.map((a) => a.chargeId)).size !== action.allocations.length
      )
        return state;
      if (
        action.allocations.some((a) => {
          const charge = state.charges.find(
            (c) => c.id === a.chargeId && c.candidateId === candidate.id,
          );
          return (
            !charge ||
            !Number.isSafeInteger(a.amount) ||
            a.amount <= 0 ||
            a.amount > charge.amount - charge.paid
          );
        })
      )
        return state;
      const amount = action.allocations.reduce((sum, a) => sum + a.amount, 0);
      return {
        ...state,
        charges: state.charges.map((c) => ({
          ...c,
          paid: c.paid + (action.allocations.find((a) => a.chargeId === c.id)?.amount ?? 0),
        })),
        payments: [
          ...state.payments,
          {
            id: receiptId(state),
            candidateId: candidate.id,
            amount,
            date: action.date,
            collector: 'Nusrat Ahmed',
            kind: 'school',
            allocations: action.allocations,
            reversed: '',
          },
        ],
      };
    }
    case 'reverse': {
      const payment = state.payments.find((p) => p.id === action.paymentId);
      if (!payment || payment.reversed || !action.reason.trim() || payment.kind !== 'school')
        return state;
      return {
        ...state,
        payments: state.payments.map((p) =>
          p.id === payment.id ? { ...p, reversed: action.reason } : p,
        ),
        charges: state.charges.map((c) => ({
          ...c,
          paid: c.paid - (payment.allocations.find((a) => a.chargeId === c.id)?.amount ?? 0),
        })),
      };
    }
    case 'schedule-stop':
      return {
        ...state,
        schedules: state.schedules.map((s) => (s.id === action.id ? { ...s, active: false } : s)),
      };
    default:
      return state;
  }
}
