import { create } from 'zustand';

export interface AttendanceDraftState {
  classId: string | null;
  date: string | null;
  marks: Record<string, 'Present' | 'Absent' | 'Late'>;
}

export interface ExpenseFilterState {
  search: string;
  category: string;
  status: string;
  payment: string;
}

export interface PeopleFilterState {
  search: string;
  role: string;
}

export interface RoutineUiState {
  selectedDay: string | null;
  selectedPeriod: number | null;
  conflictsResolved: boolean;
}

export interface FeeAllocationDraft {
  candidateId: string;
  allocations: { chargeId: string; amount: number }[];
  date: string;
  note: string;
}

export interface SchoolUiStore {
  // Attendance UI State
  attendanceDraft: AttendanceDraftState;
  setAttendanceSelection: (classId: string, date: string) => void;
  setStudentMark: (studentId: string, mark: 'Present' | 'Absent' | 'Late') => void;
  setStudentMarksBulk: (marks: Record<string, 'Present' | 'Absent' | 'Late'>) => void;
  clearAttendanceMarks: () => void;

  // Expense Filters
  expenseFilter: ExpenseFilterState;
  setExpenseFilter: (filter: Partial<ExpenseFilterState>) => void;
  resetExpenseFilter: () => void;

  // People & Access Filters
  peopleFilter: PeopleFilterState;
  setPeopleFilter: (filter: Partial<PeopleFilterState>) => void;
  resetPeopleFilter: () => void;

  // Routine UI State
  routineUi: RoutineUiState;
  setRoutineSlot: (day: string | null, period: number | null) => void;
  setConflictsResolved: (resolved: boolean) => void;

  // Fee Collection Draft
  feeDraft: FeeAllocationDraft | null;
  setFeeDraft: (draft: FeeAllocationDraft | null) => void;

  // In-app Notification / Toast
  notificationMessage: string;
  setNotification: (message: string) => void;
  clearNotification: () => void;
}

const defaultExpenseFilter: ExpenseFilterState = {
  search: '',
  category: 'All categories',
  status: 'All states',
  payment: 'All payments',
};

const defaultPeopleFilter: PeopleFilterState = {
  search: '',
  role: 'All school roles',
};

export const useSchoolUiStore = create<SchoolUiStore>((set) => ({
  attendanceDraft: {
    classId: null,
    date: null,
    marks: {},
  },
  setAttendanceSelection: (classId, date) =>
    set((state) => ({
      attendanceDraft: {
        ...state.attendanceDraft,
        classId,
        date,
      },
    })),
  setStudentMark: (studentId, mark) =>
    set((state) => ({
      attendanceDraft: {
        ...state.attendanceDraft,
        marks: {
          ...state.attendanceDraft.marks,
          [studentId]: mark,
        },
      },
    })),
  setStudentMarksBulk: (newMarks) =>
    set((state) => ({
      attendanceDraft: {
        ...state.attendanceDraft,
        marks: {
          ...state.attendanceDraft.marks,
          ...newMarks,
        },
      },
    })),
  clearAttendanceMarks: () =>
    set((state) => ({
      attendanceDraft: {
        ...state.attendanceDraft,
        marks: {},
      },
    })),

  expenseFilter: defaultExpenseFilter,
  setExpenseFilter: (filter) =>
    set((state) => ({
      expenseFilter: { ...state.expenseFilter, ...filter },
    })),
  resetExpenseFilter: () => set({ expenseFilter: defaultExpenseFilter }),

  peopleFilter: defaultPeopleFilter,
  setPeopleFilter: (filter) =>
    set((state) => ({
      peopleFilter: { ...state.peopleFilter, ...filter },
    })),
  resetPeopleFilter: () => set({ peopleFilter: defaultPeopleFilter }),

  routineUi: {
    selectedDay: null,
    selectedPeriod: null,
    conflictsResolved: false,
  },
  setRoutineSlot: (selectedDay, selectedPeriod) =>
    set((state) => ({
      routineUi: { ...state.routineUi, selectedDay, selectedPeriod },
    })),
  setConflictsResolved: (conflictsResolved) =>
    set((state) => ({
      routineUi: { ...state.routineUi, conflictsResolved },
    })),

  feeDraft: null,
  setFeeDraft: (feeDraft) => set({ feeDraft }),

  notificationMessage: '',
  setNotification: (notificationMessage) => set({ notificationMessage }),
  clearNotification: () => set({ notificationMessage: '' }),
}));
