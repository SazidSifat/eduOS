export const institutionTypeLabels = {
  kindergarten: 'Kindergarten',
  high_school: 'High school',
  coaching_center: 'Coaching center',
} as const;
export const institutionStatusLabels = {
  active: 'Active',
  frozen: 'Frozen',
  inactive: 'Deactivated',
} as const;
export const institutionModuleLabels = {
  academics: 'Academic setup',
  admissions: 'Admissions',
  attendance: 'Attendance',
  assessment: 'Assessment and results',
  fees: 'Fees and collections',
} as const;
export const subscriptionStatusLabels = {
  trial: 'Trial',
  active: 'Active',
  past_due: 'Past due',
  cancelled: 'Cancelled',
} as const;
export const subscriptionStatusVariants = {
  trial: 'outline',
  active: 'secondary',
  past_due: 'warning',
  cancelled: 'destructive',
} as const;
