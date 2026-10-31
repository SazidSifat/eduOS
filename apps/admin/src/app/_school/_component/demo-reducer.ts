import type { DemoAction, DemoState } from './demo-model';
import { classes, DEMO_TODAY, initialState, roster } from './demo-data';
import { financeReducer, validFees } from './demo-finance';
import {
  resolveRoutine,
  routineConflicts,
  unassignedSlots,
  validPeriods,
} from '../routine/_component/routine-model';

export function demoReducer(
  state: DemoState,
  action: Exclude<DemoAction, { type: 'enrollment-dates' }>,
): DemoState {
  switch (action.type) {
    case 'reset':
      return initialState();
    case 'candidate-save':
      return {
        ...state,
        candidates: state.candidates.some((c) => c.id === action.candidate.id)
          ? state.candidates.map((c) => (c.id === action.candidate.id ? action.candidate : c))
          : [...state.candidates, action.candidate],
      };
    case 'candidate-state':
      return {
        ...state,
        candidates: state.candidates.map((c) =>
          c.id === action.candidateId &&
          c.state !== 'admitted' &&
          (action.state !== 'follow_up' || action.nextCall)
            ? {
                ...c,
                state: action.state,
                nextCall: action.state === 'follow_up' ? action.nextCall : '',
              }
            : c,
        ),
      };
    case 'call':
      return {
        ...state,
        candidates: state.candidates.map((c) =>
          c.id === action.candidateId &&
          c.state === 'follow_up' &&
          action.note.trim() &&
          (action.outcome === 'Not interested' || action.nextCall)
            ? {
                ...c,
                state: action.outcome === 'Not interested' ? 'closed' : c.state,
                nextCall: action.outcome === 'Not interested' ? '' : action.nextCall,
                calls: [
                  { date: DEMO_TODAY, outcome: action.outcome, note: action.note },
                  ...c.calls,
                ],
              }
            : c,
        ),
      };
    case 'admit':
    case 'willing-payment':
    case 'collect':
    case 'reverse':
    case 'schedule-stop':
      return financeReducer(state, action);
    case 'expense-save': {
      if (!Number.isSafeInteger(action.expense.amount) || action.expense.amount <= 0) return state;
      const current = state.expenses.find((e) => e.id === action.expense.id);
      if (current?.paid || current?.status === 'approved') return state;
      return {
        ...state,
        expenses: current
          ? state.expenses.map((e) => (e.id === current.id ? action.expense : e))
          : [action.expense, ...state.expenses],
      };
    }
    case 'expense-review':
      return {
        ...state,
        expenses: state.expenses.map((e) =>
          e.id === action.id && e.status === 'pending' && action.note.trim()
            ? {
                ...e,
                status: action.approved ? 'approved' : 'returned',
                reviewNote: action.note,
                history: [
                  ...e.history,
                  `Nusrat Ahmed ${action.approved ? 'approved' : 'returned'} the request: ${action.note}`,
                ],
              }
            : e,
        ),
      };
    case 'expense-pay':
      return {
        ...state,
        expenses: state.expenses.map((e) =>
          e.id === action.id && e.status === 'approved' && !e.paid
            ? {
                ...e,
                paid: true,
                voucher: `PV-2026-${100 + state.expenses.filter((x) => x.paid).length}`,
                history: [...e.history, 'Nusrat Ahmed confirmed the actual cash payment.'],
              }
            : e,
        ),
      };
    case 'register-select': {
      if (!classes.some((c) => c.id === action.classId) || !/^\d{4}-\d{2}-\d{2}$/.test(action.date))
        return state;
      const id = `${action.date}|${action.classId}`;
      return {
        ...state,
        selectedRegister: id,
        registers: state.registers.some((r) => r.id === id)
          ? state.registers
          : [
              ...state.registers,
              {
                id,
                classId: action.classId,
                date: action.date,
                marks: Object.fromEntries(roster(action.classId).map((s) => [s.id, 'Unmarked'])),
                submitted: false,
                saved: false,
              },
            ],
      };
    }
    case 'attendance-mark':
      return {
        ...state,
        registers: state.registers.map((r) =>
          r.id === state.selectedRegister &&
          !r.submitted &&
          Object.hasOwn(r.marks, action.studentId)
            ? { ...r, marks: { ...r.marks, [action.studentId]: action.mark }, saved: false }
            : r,
        ),
      };
    case 'attendance-bulk':
      return {
        ...state,
        registers: state.registers.map((r) =>
          r.id === state.selectedRegister && !r.submitted
            ? {
                ...r,
                marks: Object.fromEntries(
                  Object.entries(r.marks).map(([id, mark]) => [
                    id,
                    mark === 'Unmarked' ? 'Present' : mark,
                  ]),
                ),
                saved: false,
              }
            : r,
        ),
      };
    case 'attendance-save':
      return {
        ...state,
        registers: state.registers.map((r) =>
          r.id === state.selectedRegister && !r.submitted ? { ...r, saved: true } : r,
        ),
      };
    case 'attendance-submit':
      return {
        ...state,
        registers: state.registers.map((r) =>
          r.id === state.selectedRegister &&
          !r.submitted &&
          Object.values(r.marks).length > 0 &&
          !Object.values(r.marks).includes('Unmarked')
            ? { ...r, submitted: true, saved: true }
            : r,
        ),
      };
    case 'correction-request': {
      const request = action.correction;
      const register = state.registers.find((r) => r.id === request.registerId);
      if (
        !register?.submitted ||
        register.marks[request.studentId] !== request.original ||
        request.original === request.proposed ||
        String(request.proposed) === 'Unmarked' ||
        !request.reason.trim() ||
        state.corrections.some(
          (c) =>
            c.registerId === request.registerId &&
            c.studentId === request.studentId &&
            c.status === 'pending',
        )
      )
        return state;
      return { ...state, corrections: [...state.corrections, request] };
    }
    case 'correction-review': {
      const correction = state.corrections.find((c) => c.id === action.id);
      if (!correction || correction.status !== 'pending') return state;
      return {
        ...state,
        corrections: state.corrections.map((c) =>
          c.id === correction.id ? { ...c, status: action.approved ? 'approved' : 'rejected' } : c,
        ),
        registers: state.registers.map((r) =>
          action.approved && r.id === correction.registerId
            ? { ...r, marks: { ...r.marks, [correction.studentId]: correction.proposed } }
            : r,
        ),
      };
    }
    case 'routine-configure': {
      if (!action.days.length || !validPeriods(action.periods)) return state;
      return {
        ...state,
        routine: {
          ...state.routine,
          days: action.days,
          effective: action.effective,
          periods: action.periods,
          className: action.className,
          lessons: state.routine.lessons.filter(
            (l) => action.days.includes(l.day) && action.periods.some((p) => p.id === l.period),
          ),
          published: false,
        },
      };
    }
    case 'lesson-save': {
      if (
        !state.routine.days.includes(action.lesson.day) ||
        !state.routine.periods.some((p) => p.id === action.lesson.period)
      )
        return state;
      return {
        ...state,
        routine: {
          ...state.routine,
          lessons: [
            ...state.routine.lessons.filter(
              (l) => !(l.day === action.lesson.day && l.period === action.lesson.period),
            ),
            action.lesson,
          ],
          published: false,
        },
      };
    }
    case 'routine-resolve':
      return { ...state, routine: resolveRoutine(state.routine) };
    case 'routine-publish': {
      if (
        routineConflicts(state.routine).length ||
        unassignedSlots(state.routine).length ||
        state.routine.published
      )
        return state;
      const version = Math.max(...state.routineHistory.map((r) => r.version), 0) + 1;
      const routine = { ...state.routine, version, published: true, note: action.note };
      return { ...state, routine, routineHistory: [...state.routineHistory, routine] };
    }
    case 'settings-save':
      return { ...state, settings: { ...state.settings, ...action.values } };
    case 'member-update':
      return {
        ...state,
        members: state.members.map((m) =>
          m.id === action.id ? { ...m, role: action.role, active: action.active } : m,
        ),
      };
    case 'member-save':
      return {
        ...state,
        members: state.members.some((m) => m.id === action.member.id)
          ? state.members.map((m) => (m.id === action.member.id ? action.member : m))
          : [...state.members, action.member],
      };
    case 'offering-save':
      return {
        ...state,
        offerings: state.offerings.some((o) => o.id === action.offering.id)
          ? state.offerings.map((o) => (o.id === action.offering.id ? action.offering : o))
          : [...state.offerings, action.offering],
      };
    case 'category-add':
      return action.category.trim() && !state.categories.includes(action.category.trim())
        ? { ...state, categories: [...state.categories, action.category.trim()] }
        : state;
    case 'fee-defaults':
      return validFees(action.fees) ? { ...state, feeDefaults: action.fees } : state;
  }
}
