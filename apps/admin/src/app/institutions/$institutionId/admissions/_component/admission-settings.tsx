import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  admissionSettingsInputSchema,
  admissionSettingsSchema,
  offeringInputSchema,
  offeringSchema,
  type AdmissionSettings,
} from '@eduos/contracts';
import { Button, Input, Label } from '@eduos/ui';
import type { z } from 'zod';
import { useAdmissions } from './admissions-shell';
import { FormSection, Toggle } from './form-controls';
import { apiPost, apiPut } from '../../../../../lib/api-client';
import { admissionKey, admissionPath } from '../_api/queries';

export function AdmissionSettingsPage() {
  const { setup, access } = useAdmissions();
  if (!access.permissions.includes('admissions.settings'))
    return <p role="alert">Only an Admin or Principal can configure admissions.</p>;
  return (
    <div className="w-full">
      <header className="mb-7">
        <h1 className="text-2xl font-semibold">Admissions settings</h1>
        <p className="mt-2 text-muted-foreground">
          Configure fees, call reminders and the classes accepting students.
        </p>
      </header>
      <AdmissionOfferingForm />
      <AdmissionSettingsForm key={setup.settings.version} />
    </div>
  );
}
export function AdmissionSettingsForm() {
  const { setup, userId, institutionId } = useAdmissions();
  const cache = useQueryClient();
  const { timezone, ...defaults } = setup.settings;
  const form = useForm<AdmissionSettings>({
    resolver: zodResolver(admissionSettingsInputSchema),
    defaultValues: defaults,
  });
  const creditWilling = useWatch({ control: form.control, name: 'creditWillingFee' });
  const mutation = useMutation({
    mutationFn: (input: AdmissionSettings) =>
      apiPut(`${admissionPath(institutionId)}/settings`, admissionSettingsSchema, input),
    onSuccess: async () => {
      await cache.invalidateQueries({ queryKey: admissionKey(userId, institutionId) });
    },
  });
  return (
    <form
      noValidate
      aria-label="Admission settings"
      onSubmit={form.handleSubmit((input) => mutation.mutate(input))}
    >
      <fieldset disabled={mutation.isPending}>
        <FormSection
          title="Follow-up reminders"
          description={`In-app reminders are delivered to the assigned Admission Officer. Time zone: ${timezone}.`}
        >
          <div className="space-y-2">
            <Label htmlFor="reminder-days">Days before the call date</Label>
            <Input
              id="reminder-days"
              type="number"
              min="1"
              max="30"
              {...form.register('reminderDaysBefore', { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="before-time">Advance reminder time</Label>
            <Input id="before-time" type="time" {...form.register('beforeTime')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="on-date-time">Reminder time on the call date</Label>
            <Input id="on-date-time" type="time" {...form.register('onDateTime')} />
          </div>
        </FormSection>
        <FormSection
          title="Admission and willing fees"
          description="BDT cash collection. Willing fees are always optional at creation; skipped fees create no balance."
        >
          <Controller
            name="willingFeeMinor"
            control={form.control}
            render={({ field }) => (
              <div className="space-y-2">
                <Label htmlFor="willing-fee">Optional willing fee (BDT)</Label>
                <Input
                  id="willing-fee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={Number.isFinite(field.value) ? field.value / 100 : ''}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === '' ? NaN : Math.round(Number(e.target.value) * 100),
                    )
                  }
                />
              </div>
            )}
          />
          <Controller
            name="admissionFeeMinor"
            control={form.control}
            render={({ field }) => (
              <div className="space-y-2">
                <Label htmlFor="admission-fee">Admission fee (BDT)</Label>
                <Input
                  id="admission-fee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={Number.isFinite(field.value) ? field.value / 100 : ''}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === '' ? NaN : Math.round(Number(e.target.value) * 100),
                    )
                  }
                />
              </div>
            )}
          />
          <div className="sm:col-span-2 lg:col-span-1">
            <Toggle
              id="credit-willing"
              label="Credit the willing fee toward admission"
              description="Turn off to keep it as a separate fee. Changes apply to new candidates; existing records retain their agreed fee policy."
              checked={creditWilling}
              onChange={(value) => form.setValue('creditWillingFee', value)}
            />
          </div>
        </FormSection>
      </fieldset>
      {Object.values(form.formState.errors).map((error, index) => (
        <p key={index} role="alert" className="mb-2 text-destructive">
          {error.message}
        </p>
      ))}
      {mutation.isError && (
        <p role="alert" className="mb-4 text-destructive">
          {mutation.error.message}
        </p>
      )}
      <div className="flex justify-end border-t border-border py-5">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Save admissions settings'}
        </Button>
      </div>
    </form>
  );
}
export function AdmissionOfferingForm() {
  const { setup, institutionId, userId } = useAdmissions();
  const cache = useQueryClient();
  const form = useForm<z.infer<typeof offeringInputSchema>>({
    resolver: zodResolver(offeringInputSchema),
    defaultValues: { session: '', className: '' },
  });
  const mutation = useMutation({
    mutationFn: (input: z.infer<typeof offeringInputSchema>) =>
      apiPost(`${admissionPath(institutionId)}/offerings`, offeringSchema, input),
    onSuccess: async () => {
      form.reset();
      await cache.invalidateQueries({ queryKey: admissionKey(userId, institutionId) });
    },
  });
  return (
    <section className="mt-6 border-t border-border pt-6">
      <h2 className="font-semibold">Classes accepting admissions</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Add actual session and class offerings. Existing offerings are preserved for admission
        history.
      </p>
      {setup.offerings.length ? (
        <ul className="mt-4 divide-y divide-border">
          {setup.offerings.map((offering) => (
            <li key={offering.id} className="flex justify-between gap-4 py-3">
              <span>{offering.className}</span>
              <span className="text-muted-foreground">{offering.session}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="my-5 text-muted-foreground">No class/session offerings configured.</p>
      )}
      <form
        noValidate
        aria-label="Add class offering"
        onSubmit={form.handleSubmit((input) => mutation.mutate(input))}
        className="mt-5"
      >
        <fieldset
          disabled={mutation.isPending}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div className="space-y-2">
            <Label htmlFor="session-name">Academic session</Label>
            <Input id="session-name" placeholder="2027" {...form.register('session')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="class-name">Class name</Label>
            <Input id="class-name" placeholder="Class 6" {...form.register('className')} />
          </div>
        </fieldset>
        {Object.values(form.formState.errors).map((error, index) => (
          <p key={index} role="alert" className="mt-2 text-destructive">
            {error.message}
          </p>
        ))}
        {mutation.isError && (
          <p role="alert" className="mt-3 text-destructive">
            {mutation.error.message}
          </p>
        )}
        <Button className="mt-4" variant="outline" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Adding…' : 'Add class offering'}
        </Button>
      </form>
    </section>
  );
}
