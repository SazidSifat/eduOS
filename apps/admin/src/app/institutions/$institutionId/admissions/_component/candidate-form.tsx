import { useLanguage } from '@eduos/ui';
import { useMemo, useState } from 'react';
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { Button, DatePicker, Label } from '@eduos/ui';
import {
  candidateCreateSchema,
  candidateDetailSchema,
  type CandidateCreate,
  type CandidateDetail,
  type CandidateProfile,
} from '@eduos/contracts';
import { apiPost } from '../../../../../lib/api-client';
import { admissionKey, admissionPath } from '../_api/queries';
import { useAdmissions } from './admissions-shell';
import { Choice, FormSection, Toggle } from './form-controls';
import { ProfileFields } from './profile-fields';
import { CandidateSetup } from './candidate-setup';
import { AdmissionFeeEditor } from './admission-fee-editor';

export const emptyProfile: CandidateProfile = {
  studentName: '',
  guardianName: '',
  relationship: '',
  phone: '',
  address: '',
  dateOfBirth: '',
  birthCertificate: '',
  nationality: '',
  fatherName: '',
  motherName: '',
  guardianNid: '',
  guardianNationality: '',
  previousSchool: '',
  source: 'Field visit',
  notes: '',
  identityException: '',
};
export function CandidateForm({
  existing,
  mode = 'follow_up',
  onSaved,
}: {
  existing?: CandidateDetail;
  mode?: CandidateCreate['state'] | 'edit';
  onSaved?: () => void;
}) {
  const { t, money } = useLanguage();

  const { userId, institutionId, setup, access } = useAdmissions();
  const navigate = useNavigate();
  const cache = useQueryClient();
  const [operationKey, setOperationKey] = useState(() => crypto.randomUUID());
  const [requestFingerprint, setRequestFingerprint] = useState('');
  const initialState =
    mode === 'edit' ? (existing?.candidate.state === 'willing' ? 'willing' : 'follow_up') : mode;
  const form = useForm<CandidateCreate>({
    resolver: zodResolver(candidateCreateSchema),
    defaultValues: {
      operationKey,
      state: initialState,
      offeringId: existing?.offeringId ?? '',
      assigneeId: existing?.assigneeId ?? userId,
      profile: existing?.profile ?? emptyProfile,
      followUpDate:
        initialState === 'follow_up' ? (existing?.candidate.followUpDate ?? null) : null,
      collectWillingFee: false,
      collectAdmissionFee: false,
    },
  });
  const state = useWatch({ control: form.control, name: 'state' });
  const collectingWilling = useWatch({ control: form.control, name: 'collectWillingFee' });
  const paidWilling =
    existing?.receipts
      .filter((r) => r.kind === 'willing')
      .reduce((sum, r) => sum + r.amountMinor, 0) ?? 0;
  const willingAmount = existing?.willingFeeMinor ?? setup.settings.willingFeeMinor;
  const canCollect = access.permissions.includes('fees.collect') && access.modules.includes('fees');
  const offerings = useMemo(
    () => setup.offerings.map((o) => ({ value: o.id, label: `${o.session} · ${o.className}` })),
    [setup.offerings],
  );
  const mutation = useMutation({
    mutationFn: (input: CandidateCreate) => {
      if (!existing)
        return apiPost(`${admissionPath(institutionId)}/candidates`, candidateDetailSchema, input);
      return apiPost(
        `${admissionPath(institutionId)}/candidates/${existing.candidate.id}/actions`,
        candidateDetailSchema,
        {
          operationKey: input.operationKey,
          version: existing.candidate.version,
          action: mode === 'edit' ? 'edit' : state === 'admitted' ? 'admit' : 'willing',
          profile: input.profile,
          ...(mode === 'edit' ? { assigneeId: input.assigneeId } : {}),
          outcome: null,
          followUpDate: null,
          note: '',
          collectWillingFee: input.collectWillingFee,
          collectAdmissionFee: input.collectAdmissionFee,
          ...(input.admissionFees ? { admissionFees: input.admissionFees } : {}),
        },
      );
    },
    onSuccess: async (result) => {
      await cache.invalidateQueries({ queryKey: admissionKey(userId, institutionId) });
      onSaved?.();
      await navigate({
        to: '/institutions/$institutionId/admissions/$candidateId',
        params: { institutionId, candidateId: result.candidate.id },
      });
    },
  });
  async function submit(input: CandidateCreate) {
    // Keep the key on uncertain network failures; a changed form gets a new key.
    const nextFingerprint = JSON.stringify({ ...input, operationKey: '' });
    const nextKey =
      requestFingerprint && requestFingerprint !== nextFingerprint
        ? crypto.randomUUID()
        : operationKey;
    setOperationKey(nextKey);
    setRequestFingerprint(nextFingerprint);
    await mutation.mutateAsync({ ...input, operationKey: nextKey }).catch(() => {});
  }
  const setupMissing = !existing && (!setup.offerings.length || !setup.settings.version);
  return (
    <div className="w-full">
      <div className="mb-7">
        <h1 className="text-2xl font-semibold">
          {existing
            ? mode === 'edit'
              ? t('Update candidate details')
              : state === 'admitted'
                ? t('Complete admission')
                : t('Mark student willing')
            : t('New admission record')}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {existing
            ? t('Review the collected information before saving this change.')
            : t('Start with a follow-up, willingness to admit, or direct admission.')}
        </p>
      </div>
      {!existing && <CandidateSetup />}
      <FormProvider {...form}>
        <form aria-label={t('Admission record')} noValidate onSubmit={form.handleSubmit(submit)}>
          <fieldset disabled={mutation.isPending}>
            <FormSection title={t('Admission destination')}>
              {!existing && (
                <Controller
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <Choice
                      id="entry-stage"
                      label={t('Entry stage')}
                      value={field.value}
                      onChange={(value) => {
                        const parsed = candidateCreateSchema.shape.state.safeParse(value);
                        if (!parsed.success) return;
                        field.onChange(parsed.data);
                        form.setValue('followUpDate', null);
                        form.setValue('collectWillingFee', false);
                        form.setValue('collectAdmissionFee', false);
                        form.setValue('admissionFees', undefined);
                      }}
                      options={[
                        { value: 'follow_up', label: 'Follow-up' },
                        { value: 'willing', label: 'Willing to admit' },
                        { value: 'admitted', label: 'Direct admission' },
                      ]}
                    />
                  )}
                />
              )}
              <Controller
                control={form.control}
                name="offeringId"
                render={({ field, fieldState }) => (
                  <Choice
                    id="offering"
                    label={t('Academic session and class')}
                    value={field.value}
                    onChange={field.onChange}
                    options={offerings}
                    error={fieldState.error?.message}
                    disabled={Boolean(existing)}
                  />
                )}
              />
              <Controller
                control={form.control}
                name="assigneeId"
                render={({ field, fieldState }) => (
                  <Choice
                    id="assignee"
                    label={t('Admission Officer')}
                    value={field.value}
                    onChange={field.onChange}
                    options={setup.assignees.map((a) => ({ value: a.userId, label: a.name }))}
                    error={fieldState.error?.message}
                    disabled={
                      Boolean(existing) &&
                      (mode !== 'edit' || !access.permissions.includes('admissions.manage'))
                    }
                  />
                )}
              />
              {state === 'follow_up' && mode !== 'edit' && (
                <div className="space-y-2">
                  <Label htmlFor="next-date">{t('Next follow-up date *')}</Label>
                  <Controller
                    control={form.control}
                    name="followUpDate"
                    render={({ field, fieldState }) => (
                      <DatePicker
                        id="next-date"
                        ref={field.ref}
                        value={field.value}
                        onValueChange={(value) => field.onChange(value || null)}
                        onBlur={field.onBlur}
                        aria-required
                        aria-invalid={Boolean(fieldState.error)}
                        aria-describedby={fieldState.error ? 'next-date-error' : undefined}
                      />
                    )}
                  />
                  {form.formState.errors.followUpDate && (
                    <p id="next-date-error" role="alert" className="text-xs text-destructive">
                      {t(form.formState.errors.followUpDate.message)}
                    </p>
                  )}
                </div>
              )}
            </FormSection>
            <ProfileFields
              full={state !== 'follow_up'}
              canApproveException={access.permissions.includes('admissions.settings')}
            />
            {mode !== 'edit' && state === 'willing' && (
              <section className="border-t border-border py-6">
                <h2 className="font-semibold">{t('Optional willing fee')}</h2>
                <Toggle
                  id="collect-willing"
                  label={t('Collect willing fee now')}
                  description={
                    paidWilling > 0
                      ? t('A willing fee has already been collected for this record.')
                      : canCollect
                        ? t('Cash collection · {value0}. You can save without collecting a fee.', {
                            value0: money(willingAmount),
                          })
                        : t(
                            'Fee collection needs the Fees module and a configured positive amount. You can save without a fee.',
                          )
                  }
                  checked={collectingWilling}
                  onChange={(value) => form.setValue('collectWillingFee', value)}
                  disabled={!canCollect || willingAmount <= 0 || paidWilling > 0}
                />
                {collectingWilling && (
                  <p className="text-xs text-muted-foreground">
                    {t('Confirm that you have received')} {money(willingAmount)}{' '}
                    {t('in cash. A receipt will be issued when this record is saved.')}{' '}
                  </p>
                )}
              </section>
            )}
            {mode !== 'edit' && state === 'admitted' && (
              <AdmissionFeeEditor
                initialFees={existing?.admissionFees}
                defaultAmount={setup.settings.admissionFeeMinor}
                paidWilling={paidWilling}
                creditWillingFee={existing?.creditWillingFee ?? setup.settings.creditWillingFee}
                canCollect={canCollect}
                canConfigure={access.permissions.includes('admissions.settings')}
                timezone={setup.settings.timezone}
              />
            )}
          </fieldset>
          {mutation.isError && (
            <p role="alert" className="mb-4 text-destructive">
              {t(mutation.error.message)}
            </p>
          )}
          <div className="flex justify-end gap-3 border-t border-border pt-5">
            <Button variant="outline" type="button" asChild>
              <Link
                to="/institutions/$institutionId/admissions"
                params={{ institutionId }}
                search={{ state: 'follow_up', due: 'all', search: '', offset: 0 }}
              >
                {t('Cancel')}{' '}
              </Link>
            </Button>
            <Button type="submit" disabled={mutation.isPending || setupMissing}>
              {mutation.isPending
                ? t('Saving…')
                : mode === 'edit'
                  ? t('Save details')
                  : state === 'admitted'
                    ? t('Confirm admission')
                    : t('Save record')}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
