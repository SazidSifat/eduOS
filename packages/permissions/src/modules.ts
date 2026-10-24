export const institutionModuleKeys = [
  'academics',
  'admissions',
  'attendance',
  'assessment',
  'fees',
] as const;
export type InstitutionModule = (typeof institutionModuleKeys)[number];
