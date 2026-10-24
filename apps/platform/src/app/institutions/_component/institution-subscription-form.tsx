import { subscriptionStatusLabels as statusLabels } from '../../../lib/institution-display';
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  platformInstitutionSubscriptionInputSchema,
  subscriptionBillingCycleSchema,
  subscriptionStatusSchema,
  type platformInstitutionSubscriptionSchema,
} from '@eduos/contracts';
import {
  Button,
  Card,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@eduos/ui';
import { usePlatformAccess } from '../../../components/providers/platform-access-provider';
import { institutionSubscriptionQuery, updateInstitutionSubscription } from '../../_api/platform';

const subscriptionFormSchema = platformInstitutionSubscriptionInputSchema.extend({
  periodEndsAt: z.union([z.iso.date(), z.literal('')]),
});
type SubscriptionValues = z.input<typeof subscriptionFormSchema>;
type Subscription = z.infer<typeof platformInstitutionSubscriptionSchema>;

function formValues(subscription: Subscription | null | undefined): SubscriptionValues {
  return {
    planName: subscription?.planName ?? '',
    status: subscription?.status ?? 'trial',
    billingCycle: subscription?.billingCycle ?? 'monthly',
    amountTaka: subscription?.amountTaka ?? 0,
    periodEndsAt: subscription?.periodEndsAt ?? '',
  };
}

export function InstitutionSubscriptionForm({ institutionId }: { institutionId: string }) {
  const { canManageSubscriptions } = usePlatformAccess();
  const queryClient = useQueryClient();
  const subscription = useQuery({
    ...institutionSubscriptionQuery(institutionId),
    enabled: canManageSubscriptions,
  });
  const mutation = useMutation({
    mutationFn: (values: SubscriptionValues) =>
      updateInstitutionSubscription(institutionId, {
        ...values,
        periodEndsAt: values.periodEndsAt || null,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: institutionSubscriptionQuery(institutionId).queryKey,
      });
      await queryClient.invalidateQueries({ queryKey: ['platform', 'subscriptions'] });
    },
  });
  const form = useForm<SubscriptionValues>({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues: formValues(null),
  });
  const resetSubscription = form.reset;
  const selectedStatus = useWatch({ control: form.control, name: 'status' });
  const selectedCycle = useWatch({ control: form.control, name: 'billingCycle' });

  useEffect(() => {
    if (!subscription.isSuccess) return;
    resetSubscription(formValues(subscription.data));
  }, [subscription.data, subscription.isSuccess, resetSubscription]);

  if (!canManageSubscriptions) return null;
  if (subscription.isPending)
    return (
      <Card as="section" id="institution-subscription" className="p-5">
        <h2 className="text-sm font-semibold">Subscription</h2>
        <output className="mt-3 block text-sm text-muted-foreground">
          Loading subscription settings…
        </output>
      </Card>
    );
  if (subscription.isError)
    return (
      <Card
        as="section"
        id="institution-subscription"
        className="grid justify-items-start gap-4 p-5"
      >
        <h2 className="text-sm font-semibold">Subscription</h2>
        <p role="alert" className="text-sm text-destructive">
          Subscription settings could not be loaded.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            void subscription.refetch();
          }}
        >
          Try again
        </Button>
      </Card>
    );

  const submit = form.handleSubmit(async (values) => {
    form.clearErrors('root');
    try {
      await mutation.mutateAsync(values);
    } catch {
      form.setError('root', {
        message: 'Subscription settings could not be saved. Try again.',
      });
    }
  });

  return (
    <Card
      as="form"
      id="institution-subscription"
      aria-label="Institution subscription"
      onSubmit={submit}
      noValidate
      className="scroll-mt-6 overflow-hidden"
    >
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold">Subscription</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Manage the institution’s plan and billing terms.
        </p>
      </div>
      <fieldset disabled={mutation.isPending} className="grid gap-5 p-5 sm:grid-cols-2">
        <legend className="sr-only">Subscription settings</legend>
        <Label className="field sm:col-span-2">
          Plan name
          <Input
            maxLength={100}
            required
            aria-invalid={Boolean(form.formState.errors.planName)}
            {...form.register('planName')}
          />
          {form.formState.errors.planName && (
            <span className="field-error">{form.formState.errors.planName.message}</span>
          )}
        </Label>
        <Label className="field">
          Subscription status
          <Select
            value={selectedStatus}
            onValueChange={(value) => {
              const parsed = subscriptionStatusSchema.safeParse(value);
              if (parsed.success)
                form.setValue('status', parsed.data, { shouldDirty: true, shouldValidate: true });
            }}
          >
            <SelectTrigger aria-label="Subscription status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {subscriptionStatusSchema.options.map((status) => (
                <SelectItem key={status} value={status}>
                  {statusLabels[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Label>
        <Label className="field">
          Billing cycle
          <Select
            value={selectedCycle}
            onValueChange={(value) => {
              const parsed = subscriptionBillingCycleSchema.safeParse(value);
              if (parsed.success)
                form.setValue('billingCycle', parsed.data, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
            }}
          >
            <SelectTrigger aria-label="Billing cycle">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {subscriptionBillingCycleSchema.options.map((cycle) => (
                <SelectItem key={cycle} value={cycle}>
                  {cycle === 'annual' ? 'Annual' : 'Monthly'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Label>
        <Label className="field">
          Amount in taka
          <Input
            type="number"
            min={0}
            max={100000000}
            step={1}
            required
            aria-invalid={Boolean(form.formState.errors.amountTaka)}
            {...form.register('amountTaka', { valueAsNumber: true })}
          />
          {form.formState.errors.amountTaka && (
            <span className="field-error">{form.formState.errors.amountTaka.message}</span>
          )}
        </Label>
        <Label className="field">
          Period end date (optional)
          <Input
            type="date"
            aria-invalid={Boolean(form.formState.errors.periodEndsAt)}
            {...form.register('periodEndsAt')}
          />
          {form.formState.errors.periodEndsAt && (
            <span className="field-error">{form.formState.errors.periodEndsAt.message}</span>
          )}
        </Label>
      </fieldset>
      {form.formState.errors.root && (
        <p role="alert" className="px-5 pb-4 text-sm text-destructive">
          {form.formState.errors.root.message}
        </p>
      )}
      {mutation.isSuccess && (
        <output className="block px-5 pb-4 text-xs text-muted-foreground">
          Subscription settings saved.
        </output>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border px-5 py-4">
        <p className="max-w-xl text-xs text-muted-foreground">
          This records plan terms only. It does not charge, invoice or automatically change
          institution access.
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={mutation.isPending || !form.formState.isDirty}
            onClick={() => {
              resetSubscription(formValues(subscription.data));
              mutation.reset();
            }}
          >
            Discard changes
          </Button>
          <Button type="submit" disabled={mutation.isPending || !form.formState.isDirty}>
            {mutation.isPending ? 'Saving…' : 'Save subscription'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
