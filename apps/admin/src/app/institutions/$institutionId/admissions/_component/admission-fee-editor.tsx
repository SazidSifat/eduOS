import { useEffect, useId, useMemo } from 'react';
import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button, DatePicker, Input, Label } from '@eduos/ui';
import {
  admissionFeeItemSchema,
  type AdmissionFeeItem,
  type CandidateCreate,
} from '@eduos/contracts';
import { Choice, money, Toggle } from './form-controls';

const feeTypes = [
  { value: 'admission', label: 'Admission fees' },
  { value: 'session', label: 'Session fees' },
  { value: 'monthly', label: 'Monthly fees' },
  { value: 'other', label: 'Other fees' },
];
function schoolToday(timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  return `${parts.find((p) => p.type === 'year')?.value}-${parts.find((p) => p.type === 'month')?.value}-${parts.find((p) => p.type === 'day')?.value}`;
}
export function AdmissionFeeEditor({
  initialFees,
  defaultAmount,
  paidWilling,
  creditWillingFee,
  canCollect,
  canConfigure,
  timezone,
}: {
  initialFees?: AdmissionFeeItem[] | undefined;
  defaultAmount: number;
  paidWilling: number;
  creditWillingFee: boolean;
  canCollect: boolean;
  canConfigure: boolean;
  timezone: string;
}) {
  const {
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useFormContext<CandidateCreate>();
  const { fields, append, remove, replace } = useFieldArray({ control, name: 'admissionFees' });
  const fees = useWatch({ control, name: 'admissionFees' });
  const collecting = useWatch({ control, name: 'collectAdmissionFee' });
  const defaults = useMemo<AdmissionFeeItem[]>(
    () =>
      initialFees ?? [
        {
          type: 'admission',
          label: 'Admission fees',
          amountMinor: defaultAmount,
          billingStartDate: null,
          billingEndDate: null,
        },
      ],
    [initialFees, defaultAmount],
  );
  useEffect(() => {
    if (!getValues('admissionFees')?.length) replace(defaults);
  }, [getValues, replace, defaults]);
  const total = (fees ?? []).reduce(
    (sum, item) => sum + (Number.isFinite(item.amountMinor) ? item.amountMinor : 0),
    0,
  );
  const credit = creditWillingFee ? Math.min(total, paidWilling) : 0;
  const payable = total - credit;
  useEffect(() => {
    setValue('collectAdmissionFee', false);
  }, [payable, setValue]);
  return (
    <section aria-label="Admission fee configuration" className="border-t border-border py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Fees and payment</h2>
        {canConfigure && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={fields.length >= 20}
            onClick={() =>
              append({
                type: 'session',
                label: 'Session fees',
                amountMinor: 0,
                billingStartDate: null,
                billingEndDate: null,
              })
            }
          >
            <Plus size={16} aria-hidden="true" />
            Add fee
          </Button>
        )}
      </div>
      <p className="mb-5 text-muted-foreground">
        Configure the fees collected with this admission. Monthly fees include the first installment
        now and create a recurring billing schedule.
      </p>
      {!canConfigure && (
        <p className="mb-4 text-muted-foreground">
          An Admin or Principal can change fee items and amounts.
        </p>
      )}
      <div className="space-y-5">
        {fields.map((field, index) => (
          <FeeRow
            key={field.id}
            index={index}
            canConfigure={canConfigure}
            canRemove={fields.length > 1}
            remove={() => remove(index)}
            timezone={timezone}
          />
        ))}
      </div>
      {errors.admissionFees?.root?.message && (
        <p role="alert" className="mt-3 text-destructive">
          {errors.admissionFees.root.message}
        </p>
      )}
      <dl className="my-5 grid grid-cols-2 gap-3 border-t border-border pt-5">
        <dt>Total fees</dt>
        <dd className="text-right tabular-nums">{money(total)}</dd>
        <dt>Willing fee credit</dt>
        <dd className="text-right tabular-nums">{money(credit)}</dd>
        <dt className="font-semibold">Collect now</dt>
        <dd className="text-right font-semibold tabular-nums">{money(payable)}</dd>
      </dl>
      {payable > 0 && (
        <Toggle
          id="collect-admission"
          label="Confirm cash received"
          description={`I have collected ${money(payable)} for this admission.`}
          checked={collecting}
          onChange={(value) => setValue('collectAdmissionFee', value)}
          disabled={!canCollect}
        />
      )}
      {total > 0 && !canCollect && (
        <p role="alert" className="text-destructive">
          Enable the Fees module before confirming this admission.
        </p>
      )}
    </section>
  );
}
function FeeRow({
  index,
  canConfigure,
  canRemove,
  remove,
  timezone,
}: {
  index: number;
  canConfigure: boolean;
  canRemove: boolean;
  remove: () => void;
  timezone: string;
}) {
  const id = useId();
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<CandidateCreate>();
  const type = useWatch({ control, name: `admissionFees.${index}.type` });
  const rowErrors = errors.admissionFees?.[index];
  return (
    <fieldset disabled={!canConfigure} className="space-y-4 border-b border-border pb-5">
      <legend className="sr-only">Fee {index + 1}</legend>
      <div className="grid gap-5 md:grid-cols-3">
        <Controller
          control={control}
          name={`admissionFees.${index}.type`}
          render={({ field }) => (
            <Choice
              id={`${id}-type`}
              label={`Fee type ${index + 1}`}
              value={field.value ?? 'admission'}
              disabled={!canConfigure}
              options={feeTypes}
              onChange={(value) => {
                const parsed = admissionFeeItemSchema.shape.type.safeParse(value);
                if (!parsed.success) return;
                field.onChange(parsed.data);
                setValue(
                  `admissionFees.${index}.label`,
                  feeTypes.find((item) => item.value === parsed.data)?.label ?? 'Other fees',
                );
                setValue(
                  `admissionFees.${index}.billingStartDate`,
                  parsed.data === 'monthly' ? schoolToday(timezone) : null,
                );
                setValue(`admissionFees.${index}.billingEndDate`, null);
              }}
            />
          )}
        />
        <div className="space-y-2">
          <Label htmlFor={`${id}-name`}>Fee name {index + 1}</Label>
          <Input
            id={`${id}-name`}
            {...register(`admissionFees.${index}.label`)}
            aria-invalid={Boolean(rowErrors?.label)}
            aria-describedby={rowErrors?.label ? `${id}-name-error` : undefined}
          />
          {rowErrors?.label?.message && (
            <p id={`${id}-name-error`} role="alert" className="text-xs text-destructive">
              {rowErrors.label.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${id}-amount`}>Amount {index + 1} (BDT)</Label>
          <div className="flex gap-2">
            <Controller
              control={control}
              name={`admissionFees.${index}.amountMinor`}
              render={({ field }) => (
                <Input
                  id={`${id}-amount`}
                  ref={field.ref}
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    typeof field.value === 'number' && Number.isFinite(field.value)
                      ? field.value / 100
                      : ''
                  }
                  onBlur={field.onBlur}
                  onChange={(event) =>
                    field.onChange(
                      event.target.value === ''
                        ? NaN
                        : Math.round(Number(event.target.value) * 100),
                    )
                  }
                  aria-invalid={Boolean(rowErrors?.amountMinor)}
                  aria-describedby={rowErrors?.amountMinor ? `${id}-amount-error` : undefined}
                />
              )}
            />
            {canConfigure && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove fee ${index + 1}`}
                disabled={!canRemove}
                onClick={remove}
              >
                <Trash2 size={16} aria-hidden="true" />
              </Button>
            )}
          </div>
          {rowErrors?.amountMinor?.message && (
            <p id={`${id}-amount-error`} role="alert" className="text-xs text-destructive">
              {rowErrors.amountMinor.message}
            </p>
          )}
        </div>
      </div>
      {type === 'monthly' && (
        <>
          <div className="grid gap-5 md:grid-cols-3">
            <BillingDate
              index={index}
              name="billingStartDate"
              label={`First billing date ${index + 1}`}
              id={`${id}-start`}
            />
            <BillingDate
              index={index}
              name="billingEndDate"
              label={`Last billing date ${index + 1} (optional)`}
              id={`${id}-end`}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            The first installment is collected now. Future charges fall on the same day each month,
            using the last day for shorter months. Leave the last date empty to bill until an Admin
            or Principal stops the schedule.
          </p>
        </>
      )}
    </fieldset>
  );
}
function BillingDate({
  index,
  name,
  label,
  id,
}: {
  index: number;
  name: 'billingStartDate' | 'billingEndDate';
  label: string;
  id: string;
}) {
  const { control } = useFormContext<CandidateCreate>();
  return (
    <Controller
      control={control}
      name={`admissionFees.${index}.${name}`}
      render={({ field, fieldState }) => (
        <div className="space-y-2">
          <Label htmlFor={id}>{label}</Label>
          <DatePicker
            id={id}
            ref={field.ref}
            value={field.value ?? null}
            onValueChange={(value) => field.onChange(value || null)}
            onBlur={field.onBlur}
            aria-invalid={Boolean(fieldState.error)}
            aria-describedby={fieldState.error ? `${id}-error` : undefined}
          />
          {fieldState.error && (
            <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
              {fieldState.error.message}
            </p>
          )}
        </div>
      )}
    />
  );
}
