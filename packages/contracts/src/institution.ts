import { z } from 'zod';

export const institutionModuleKeys = [
  'academics',
  'admissions',
  'attendance',
  'assessment',
  'fees',
] as const;
export const institutionTypeSchema = z.enum(['kindergarten', 'high_school', 'coaching_center']);
export const institutionStatusSchema = z.enum(['active', 'frozen', 'inactive']);
export const institutionModuleSchema = z.enum(institutionModuleKeys);
