import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Label,
  Card,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@eduos/ui';
import { useSchoolPreview } from '../../../components/providers/school-preview-provider';
import {
  subscriptionSchema,
  planNames,
  type Subscription,
  type SchoolPreview,
} from '../../../lib/school-preview-model';

export function SubscriptionForm({ school }: { school: SchoolPreview }) {
  const { updateSubscription } = useSchoolPreview();
  const [saved, setSaved] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Subscription>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: school.subscription,
  });
  const submit = handleSubmit((values) => {
    try {
      updateSubscription(school.id, values);
      reset(values);
      setSaved(true);
    } catch (error) {
      setError('root', {
        message: error instanceof Error ? error.message : 'Could not update the subscription.',
      });
    }
  });
  return (
    <Card
      as="form"
      onSubmit={submit}
      onChange={() => setSaved(false)}
      noValidate
      className="overflow-hidden"
    >
      <h2 className="border-b border-border px-5 py-4 text-sm font-semibold">
        Subscription settings
      </h2>
      <fieldset disabled={isSubmitting} className="grid gap-5 p-5 sm:grid-cols-2">
        <legend className="sr-only">Plan, billing cycle and renewal</legend>
        <Label className="field">
          Plan
          <Controller
            control={control}
            name="plan"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  setSaved(false);
                }}
              >
                <SelectTrigger
                  ref={field.ref}
                  onBlur={field.onBlur}
                  aria-invalid={Boolean(errors.plan)}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">{planNames.unassigned}</SelectItem>
                  <SelectItem value="essentials">{planNames.essentials}</SelectItem>
                  <SelectItem value="plus">{planNames.plus}</SelectItem>
                  <SelectItem value="custom">{planNames.custom}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.plan && <span className="field-error">{errors.plan.message}</span>}
        </Label>
        <Label className="field">
          Subscription status
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  setSaved(false);
                }}
              >
                <SelectTrigger ref={field.ref} onBlur={field.onBlur}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_configured">Not configured</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Label>
        <Label className="field">
          Billing cycle
          <Controller
            control={control}
            name="billingCycle"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  setSaved(false);
                }}
              >
                <SelectTrigger ref={field.ref} onBlur={field.onBlur}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Label>
        <Label className="field">
          Amount (BDT)
          <Input
            type="number"
            min={0}
            step={1}
            aria-invalid={Boolean(errors.amount)}
            {...register('amount', { valueAsNumber: true })}
          />
          {errors.amount && <span className="field-error">{errors.amount.message}</span>}
        </Label>
        <Label className="field">
          Renewal / review date
          <Input
            type="date"
            aria-invalid={Boolean(errors.renewalDate)}
            {...register('renewalDate')}
          />
          {errors.renewalDate && <span className="field-error">{errors.renewalDate.message}</span>}
        </Label>
        <div className="space-y-2 text-xs leading-5 text-muted-foreground">
          <p className="font-medium text-foreground">Sample plan settings</p>
          <p>
            Prices and billing rules are illustrative. Changing a subscription does not change the
            school state or create a payment.
          </p>
        </div>
      </fieldset>
      {errors.root && (
        <p role="alert" className="px-5 pb-4 text-sm text-destructive">
          {errors.root.message}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border px-5 py-4">
        <div>
          {saved ? (
            <output className="text-xs text-primary">Subscription updated in preview.</output>
          ) : (
            <p className="text-xs text-muted-foreground">No invoices or charges are created.</p>
          )}
        </div>
        <Button type="submit" disabled={isSubmitting}>
          Save subscription
        </Button>
      </div>
    </Card>
  );
}
