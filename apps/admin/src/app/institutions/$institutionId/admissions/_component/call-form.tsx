import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Button, DatePicker, Label, Textarea } from '@eduos/ui';
import {
  candidateActionSchema,
  candidateDetailSchema,
  type CandidateDetail,
} from '@eduos/contracts';
import { apiPost } from '../../../../../lib/api-client';
import { admissionKey, admissionPath } from '../_api/queries';
import { useAdmissions } from './admissions-shell';
import { Choice } from './form-controls';
const callSchema = z
  .object({
    outcome: z.enum(['agreed', 'needs_time', 'no_answer', 'not_interested']),
    followUpDate: z.iso.date().or(z.literal('')),
    note: z.string().trim().max(1000),
  })
  .superRefine((value, ctx) => {
    if (value.outcome !== 'not_interested' && !value.followUpDate)
      ctx.addIssue({
        code: 'custom',
        path: ['followUpDate'],
        message: 'Choose the next call date.',
      });
  });
export function CallForm({
  detail,
  reopen = false,
  close = false,
  onDone,
}: {
  detail: CandidateDetail;
  reopen?: boolean;
  close?: boolean;
  onDone: () => void;
}) {
  const { institutionId, userId } = useAdmissions();
  const cache = useQueryClient();
  const [key, setKey] = useState(() => crypto.randomUUID());
  const [lastInput, setLastInput] = useState('');
  const form = useForm<z.infer<typeof callSchema>>({
    resolver: zodResolver(callSchema),
    defaultValues: {
      outcome: close ? 'not_interested' : 'needs_time',
      followUpDate: detail.candidate.followUpDate ?? '',
      note: '',
    },
  });
  const outcome = useWatch({ control: form.control, name: 'outcome' });
  const mutation = useMutation({
    mutationFn: (input: z.infer<typeof callSchema>) => {
      const fingerprint = JSON.stringify(input);
      const operationKey = lastInput && lastInput !== fingerprint ? crypto.randomUUID() : key;
      setKey(operationKey);
      setLastInput(fingerprint);
      return apiPost(
        `${admissionPath(institutionId)}/candidates/${detail.candidate.id}/actions`,
        candidateDetailSchema,
        candidateActionSchema.parse({
          operationKey,
          version: detail.candidate.version,
          action: close ? 'close' : reopen ? 'reopen' : 'call',
          outcome: reopen || close ? null : input.outcome,
          followUpDate: input.outcome === 'not_interested' ? null : input.followUpDate,
          note: input.note,
          collectWillingFee: false,
          collectAdmissionFee: false,
        }),
      );
    },
    onSuccess: async () => {
      await cache.invalidateQueries({ queryKey: admissionKey(userId, institutionId) });
      onDone();
    },
  });
  return (
    <form
      aria-label={close ? 'Close record' : reopen ? 'Reopen follow-up' : 'Record call'}
      noValidate
      onSubmit={form.handleSubmit((input) => mutation.mutate(input))}
      className="space-y-4 rounded-md border border-border p-5"
    >
      <h2 className="font-semibold">
        {close ? 'Close record' : reopen ? 'Return to follow-up' : 'Record call outcome'}
      </h2>
      <fieldset disabled={mutation.isPending} className="grid gap-4 sm:grid-cols-2">
        {!reopen && !close && (
          <Controller
            name="outcome"
            control={form.control}
            render={({ field }) => (
              <Choice
                id="call-outcome"
                label="Outcome"
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: 'agreed', label: 'Guardian agreed' },
                  { value: 'needs_time', label: 'Needs more time' },
                  { value: 'no_answer', label: 'No answer' },
                  { value: 'not_interested', label: 'Not interested' },
                ]}
              />
            )}
          />
        )}
        {(reopen || outcome !== 'not_interested') && (
          <div className="space-y-2">
            <Label htmlFor="call-date">Next follow-up date</Label>
            <Controller
              control={form.control}
              name="followUpDate"
              render={({ field, fieldState }) => (
                <DatePicker
                  id="call-date"
                  ref={field.ref}
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  aria-required
                  aria-invalid={Boolean(fieldState.error)}
                  aria-describedby={fieldState.error ? 'call-date-error' : undefined}
                />
              )}
            />
            {form.formState.errors.followUpDate && (
              <p id="call-date-error" role="alert" className="text-xs text-destructive">
                {form.formState.errors.followUpDate.message}
              </p>
            )}
          </div>
        )}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="call-note">Conversation notes</Label>
          <Textarea id="call-note" {...form.register('note')} />
        </div>
      </fieldset>
      {outcome === 'agreed' && !reopen && !close && (
        <p className="text-xs text-muted-foreground">
          Use Complete admission to collect the remaining information and fee. Recording agreement
          alone keeps this record in follow-up.
        </p>
      )}
      {mutation.isError && (
        <p role="alert" className="text-destructive">
          {mutation.error.message}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Save outcome'}
        </Button>
      </div>
    </form>
  );
}
