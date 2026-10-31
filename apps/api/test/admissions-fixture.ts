import { randomUUID, randomBytes } from 'node:crypto';
import { hashPassword } from '@eduos/auth/server';
import { eq, inArray } from '@eduos/database';
import {
  schoolFeeReversal,
  schoolFeeAllocation,
  schoolFeePayment,
  monthlyFeePayment,
  monthlyFeeCharge,
  monthlyFeeSchedule,
  admissionFeeItem,
  schoolOperation,
  schoolExpense,
  schoolEvidence,
  schoolConfiguration,
  attendanceCorrection,
  attendanceRegisterMark,
  attendanceRegister,
  classRoutine,
  academicOffering,
  account,
  admissionCandidate,
  admissionCharge,
  admissionConfigurationHistory,
  admissionHistory,
  admissionOperation,
  admissionPayment,
  admissionReceipt,
  admissionSettings,
  followUpReminder,
  membership,
  membershipChange,
  student,
  studentEnrollment,
  enrollmentDateChange,
  user,
} from '@eduos/database/schema';
import {
  candidateCreateSchema,
  candidateDetailSchema,
  type CandidateCreate,
} from '@eduos/contracts';
import { createPlatformFixture } from './platform-fixture.js';
export function createAdmissionsFixture(options: Parameters<typeof createPlatformFixture>[0] = {}) {
  const fixture = createPlatformFixture(options);
  const schools: string[] = [];
  const staff: string[] = [];
  async function createUnconfiguredSchool() {
    const school = await fixture.create();
    schools.push(school.data.id);
    await fixture.request(`/api/v1/platform/institutions/${school.data.id}/modules`, 'PUT', {
      enabledModules: ['admissions', 'fees'],
    });
    return { ...school, base: `/api/v1/institutions/${school.data.id}/admissions` };
  }
  async function createSchool() {
    const school = await fixture.create();
    schools.push(school.data.id);
    await fixture.request(`/api/v1/platform/institutions/${school.data.id}/modules`, 'PUT', {
      enabledModules: ['admissions', 'fees'],
    });
    const base = `/api/v1/institutions/${school.data.id}/admissions`;
    const settings = {
      version: 0,
      reminderDaysBefore: 1,
      beforeTime: '09:00',
      onDateTime: '09:00',
      willingFeeMinor: 10000,
      admissionFeeMinor: 50000,
      creditWillingFee: true,
    };
    const saved = await fixture.request(`${base}/settings`, 'PUT', settings, school.cookie);
    if (saved.status !== 200) throw new Error(`Admission setup failed (${saved.status})`);
    const response = await fixture.request(
      `${base}/offerings`,
      'POST',
      { session: '2027', className: 'Class 6' },
      school.cookie,
    );
    const { offeringSchema } = await import('@eduos/contracts');
    const offering = offeringSchema.parse(await response.json());
    return { ...school, base, offering, settings: { ...settings, version: 1 } };
  }
  async function addStaff(institutionId: string, role: 'admission_officer' | 'teacher') {
    const id = randomUUID();
    staff.push(id);
    const password = randomBytes(24).toString('base64url');
    await fixture.db
      .insert(user)
      .values({ id, name: 'Synthetic Admission Officer', email: `${id}@example.test` });
    await fixture.db.insert(account).values({
      id: randomUUID(),
      userId: id,
      accountId: id,
      providerId: 'credential',
      password: await hashPassword(password),
    });
    await fixture.db.insert(membership).values({ institutionId, userId: id, role });
    return { id, cookie: await fixture.login(`${id}@example.test`, password) };
  }
  function input(
    school: Awaited<ReturnType<typeof createSchool>>,
    state: CandidateCreate['state'] = 'follow_up',
  ): CandidateCreate {
    return candidateCreateSchema.parse({
      operationKey: randomUUID(),
      state,
      offeringId: school.offering.id,
      assigneeId: school.adminId,
      collectWillingFee: false,
      collectAdmissionFee: state === 'admitted',
      followUpDate:
        state === 'follow_up'
          ? new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)
          : null,
      profile: {
        studentName: 'Synthetic Student',
        guardianName: 'Synthetic Guardian',
        relationship: 'Father',
        phone: '01700000000',
        address: 'Synthetic test locality',
        dateOfBirth: '2015-03-10',
        birthCertificate: `2015${String(BigInt(`0x${randomBytes(6).toString('hex')}`))
          .padStart(13, '0')
          .slice(-13)}`,
        nationality: 'Bangladeshi',
        fatherName: 'Synthetic Father',
        motherName: 'Synthetic Mother',
        guardianNid: '1234567890',
        guardianNationality: 'Bangladeshi',
        previousSchool: '',
        source: 'Field visit',
        notes: '',
        identityException: '',
      },
    });
  }
  async function create(school: Awaited<ReturnType<typeof createSchool>>, value = input(school)) {
    const response = await fixture.request(
      `${school.base}/candidates`,
      'POST',
      value,
      school.cookie,
    );
    if (response.status !== 201) throw new Error(`Candidate creation failed (${response.status})`);
    return candidateDetailSchema.parse(await response.json());
  }
  return {
    ...fixture,
    createSchool,
    createUnconfiguredSchool,
    addStaff,
    input,
    createCandidate: create,
    async cleanup() {
      if (schools.length) {
        for (const table of [
          schoolFeeReversal,
          schoolFeeAllocation,
          schoolFeePayment,
          monthlyFeePayment,
          monthlyFeeCharge,
          monthlyFeeSchedule,
          admissionFeeItem,
          schoolOperation,
          schoolExpense,
          schoolEvidence,
          schoolConfiguration,
          attendanceCorrection,
          attendanceRegisterMark,
          attendanceRegister,
          classRoutine,
          membershipChange,
          admissionReceipt,
          admissionPayment,
          admissionCharge,
          followUpReminder,
          admissionHistory,
          admissionOperation,
          admissionConfigurationHistory,
          admissionCandidate,
          enrollmentDateChange,
          studentEnrollment,
          student,
          academicOffering,
          admissionSettings,
        ]) {
          await fixture.db.delete(table).where(inArray(table.institutionId, schools));
        }
      }
      for (const id of staff) {
        await fixture.db
          .update(academicOffering)
          .set({ teacherId: null })
          .where(eq(academicOffering.teacherId, id));
        await fixture.db.delete(membership).where(eq(membership.userId, id));
        await fixture.db.delete(user).where(eq(user.id, id));
      }
      await fixture.cleanup();
    },
  };
}
