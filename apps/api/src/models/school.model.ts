import { z } from 'zod';
import { eq, type DatabaseTransaction } from '@eduos/database';
import { schoolConfiguration } from '@eduos/database/schema';
import { schoolFeeSchema } from '@eduos/contracts';
import type { SchoolAccess } from '../services/school/policy.js';
export async function readSchoolConfiguration(tx: DatabaseTransaction, access: SchoolAccess) {
  const [row] = await tx
    .select()
    .from(schoolConfiguration)
    .where(eq(schoolConfiguration.institutionId, access.school.id));
  return {
    revision: row?.revision ?? 0,
    settings: z.record(z.string(), z.string()).parse({
      name: access.school.name,
      code: access.school.code,
      timezone: access.school.timezone,
      currency: 'BDT',
      session: '',
      start: '',
      end: '',
      cutoff: '',
      defaultStatus: 'Unmarked',
      correctionRole: 'Admin / Principal',
      evidence: 'Required',
      expenseThreshold: '0',
      weeklyClosure: 'Friday, Saturday',
      ...z.record(z.string(), z.string()).parse(row?.settings ?? {}),
    }),
    categories: z.array(z.string()).parse(row?.categories ?? []),
    feeDefaults: z.array(schoolFeeSchema).parse(row?.feeDefaults ?? []),
  };
}
export type SchoolConfiguration = Awaited<ReturnType<typeof readSchoolConfiguration>>;
