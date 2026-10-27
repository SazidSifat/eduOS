import { and, eq, type DatabaseTransaction } from '@eduos/database';
import { institution, institutionModuleGrant, membership } from '@eduos/database/schema';
import { permissionsForRole, type Permission } from '@eduos/permissions';
import { forbidden } from '../../lib/errors.js';
import { AdmissionError } from './errors.js';
import type { CandidateProfile } from '@eduos/contracts';

export async function authorizeAdmissions(
  tx: DatabaseTransaction,
  actorId: string,
  institutionId: string,
  permission: Permission,
  write = false,
) {
  // Same lock order as membership and platform changes. Mutations serialize per school.
  const [school] = await tx
    .select()
    .from(institution)
    .where(eq(institution.id, institutionId))
    .for(write ? 'update' : 'share');
  if (school?.status !== 'active') forbidden();
  const [actor] = await tx
    .select()
    .from(membership)
    .where(and(eq(membership.institutionId, institutionId), eq(membership.userId, actorId)))
    .for('share');
  const permissions = permissionsForRole(actor?.role);
  if (!actor?.active || !permissions.includes(permission)) forbidden();
  const modules = await tx
    .select()
    .from(institutionModuleGrant)
    .where(
      and(
        eq(institutionModuleGrant.institutionId, institutionId),
        eq(institutionModuleGrant.enabled, true),
      ),
    )
    .for('share');
  if (!modules.some((m) => m.module === 'admissions')) forbidden();
  return { school, actor, permissions, modules };
}
export type AdmissionAccess = Awaited<ReturnType<typeof authorizeAdmissions>>;
export function checkAssignment(access: AdmissionAccess, assigneeId: string) {
  if (!access.permissions.includes('admissions.manage') && access.actor.userId !== assigneeId)
    forbidden();
}
export function requireCollection(access: AdmissionAccess) {
  if (
    !access.permissions.includes('fees.collect') ||
    !access.modules.some((m) => m.module === 'fees')
  )
    forbidden();
}
export function requireFullProfile(profile: CandidateProfile, access: AdmissionAccess) {
  const full =
    profile.dateOfBirth &&
    profile.nationality &&
    profile.guardianNationality &&
    (profile.fatherName || profile.motherName);
  if (!full)
    throw new AdmissionError(
      'ADMISSION_DETAILS_REQUIRED',
      'Complete date of birth, nationality and parent details.',
    );
  if (profile.dateOfBirth > new Date().toISOString().slice(0, 10))
    throw new AdmissionError('INVALID_BIRTH_DATE', 'Date of birth cannot be in the future.');
  if (!profile.birthCertificate || !profile.guardianNid) {
    if (!profile.identityException || !access.permissions.includes('admissions.settings'))
      throw new AdmissionError(
        'IDENTITY_DETAILS_REQUIRED',
        'Enter birth certificate and guardian NID details, or ask an Admin to approve an exception.',
      );
  } else if (profile.identityException && !access.permissions.includes('admissions.settings')) {
    throw new AdmissionError(
      'IDENTITY_EXCEPTION_RESTRICTED',
      'Only an Admin or Principal can approve identity exceptions.',
    );
  }
}
