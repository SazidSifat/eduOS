import { useState } from 'react';
import { Controller, useFormContext, type FieldPath } from 'react-hook-form';
import { DatePicker, Input, Label, Textarea } from '@eduos/ui';
import type { CandidateCreate } from '@eduos/contracts';
import { FormSection } from './form-controls';

function ProfileField({
  name,
  label,
  type = 'text',
  required = false,
}: {
  name: FieldPath<CandidateCreate>;
  label: string;
  type?: string;
  required?: boolean;
}) {
  const { register, getFieldState, formState } = useFormContext<CandidateCreate>();
  const error = getFieldState(name, formState).error;
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required ? ' *' : ''}
      </Label>
      <Input
        id={name}
        type={type}
        {...register(name)}
        aria-required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <p id={`${name}-error`} role="alert" className="text-xs text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
}
export function ProfileFields({
  full,
  canApproveException,
}: {
  full: boolean;
  canApproveException: boolean;
}) {
  const { register, control } = useFormContext<CandidateCreate>();
  const [today] = useState(() => new Date());
  return (
    <>
      <FormSection
        title="Student information"
        description={
          full
            ? 'Complete the information needed for admission.'
            : 'Collect enough information for the next conversation.'
        }
      >
        <ProfileField name="profile.studentName" label="Student full name" required />
        <Controller
          control={control}
          name="profile.dateOfBirth"
          render={({ field, fieldState }) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Date of birth{full ? ' *' : ''}</Label>
              <DatePicker
                id={field.name}
                ref={field.ref}
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                maxDate={today}
                aria-required={full}
                aria-invalid={Boolean(fieldState.error)}
                aria-describedby={fieldState.error ? `${field.name}-error` : undefined}
              />
              {fieldState.error && (
                <p id={`${field.name}-error`} role="alert" className="text-xs text-destructive">
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />
        {full && (
          <>
            <ProfileField name="profile.nationality" label="Student nationality" required />
            <ProfileField
              name="profile.birthCertificate"
              label="Birth certificate number"
              required
            />
            <ProfileField name="profile.previousSchool" label="Previous school" />
          </>
        )}
        <ProfileField name="profile.source" label="Lead source" />
      </FormSection>
      <FormSection
        title="Parent and guardian information"
        description="Use the primary contact for admission conversations."
      >
        <ProfileField name="profile.guardianName" label="Primary guardian name" required />
        <ProfileField name="profile.relationship" label="Relationship to student" required />
        <ProfileField name="profile.phone" label="Contact phone" type="tel" required />
        <ProfileField name="profile.fatherName" label="Father’s name" />
        <ProfileField name="profile.motherName" label="Mother’s name" />
        {full && (
          <>
            <ProfileField name="profile.guardianNid" label="Parent / guardian NID" required />
            <ProfileField
              name="profile.guardianNationality"
              label="Parent / guardian nationality"
              required
            />
          </>
        )}
        <ProfileField name="profile.address" label="Address / locality" required />
      </FormSection>
      <FormSection title="Additional information">
        <div className="space-y-2 sm:col-span-2 lg:col-span-3">
          <Label htmlFor="profile.notes">Notes</Label>
          <Textarea id="profile.notes" {...register('profile.notes')} />
        </div>
        {full && canApproveException && (
          <div className="space-y-2 sm:col-span-2 lg:col-span-3">
            <Label htmlFor="profile.identityException">Identity document exception reason</Label>
            <Textarea id="profile.identityException" {...register('profile.identityException')} />
            <p className="text-xs text-muted-foreground">
              Admin or Principal approval is recorded when saving with missing certificate or NID
              details.
            </p>
          </div>
        )}
      </FormSection>
    </>
  );
}
