import { z } from 'zod';
import {
  Button,
  DatePicker,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@eduos/ui';
import { Plus, Trash2 } from 'lucide-react';
import type { FeeItem } from '../../_component/demo-model';
import { money } from '../../_component/demo-data';
import { admissionTotal } from '../../_component/demo-finance';
import { Details, Panel } from '../../_component/demo-ui';

export const demoFeeSchema = z
  .object({
    id: z.string(),
    label: z.string().trim().min(1),
    type: z.enum(['admission', 'session', 'monthly', 'other']),
    amount: z.number().int().nonnegative(),
    start: z.string(),
    end: z.string(),
  })
  .superRefine((fee, ctx) => {
    if (fee.type === 'monthly' && !z.iso.date().safeParse(fee.start).success)
      ctx.addIssue({
        code: 'custom',
        message: 'Choose a first billing date for every monthly fee.',
      });
    if (fee.end && (!z.iso.date().safeParse(fee.end).success || fee.end < fee.start))
      ctx.addIssue({
        code: 'custom',
        message: 'The last billing date must be on or after the first date.',
      });
  });
export function AdmissionFees({
  fees,
  onChange,
  credit,
}: {
  fees: FeeItem[];
  onChange: (fees: FeeItem[]) => void;
  credit: number;
}) {
  function update(id: string, values: Partial<FeeItem>) {
    onChange(fees.map((f) => (f.id === id ? { ...f, ...values } : f)));
  }
  const total = admissionTotal(fees);
  return (
    <Panel
      title="Fees and payment"
      description="Configure the admission, session, monthly and custom fees collected with this admission."
    >
      <div className="demo-stack">
        {fees.map((fee, index) => (
          <fieldset key={fee.id} className="border-b border-border pb-5">
            <legend className="sr-only">Fee {index + 1}</legend>
            <div className="demo-fields">
              <div className="demo-field">
                <Label htmlFor={`${fee.id}-label`}>Fee name {index + 1}</Label>
                <Input
                  id={`${fee.id}-label`}
                  value={fee.label}
                  onChange={(e) => update(fee.id, { label: e.target.value })}
                />
              </div>
              <div className="demo-field">
                <Label htmlFor={`${fee.id}-type`}>Type</Label>
                <Select
                  value={fee.type}
                  onValueChange={(value) => {
                    const type = demoFeeSchema.shape.type.safeParse(value);
                    if (type.success)
                      update(fee.id, {
                        type: type.data,
                        start: type.data === 'monthly' ? '2026-10-26' : '',
                      });
                  }}
                >
                  <SelectTrigger id={`${fee.id}-type`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['admission', 'session', 'monthly', 'other'].map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="demo-field">
                <Label htmlFor={`${fee.id}-amount`}>Amount (BDT)</Label>
                <div className="flex gap-2">
                  <Input
                    id={`${fee.id}-amount`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={Number.isFinite(fee.amount) ? fee.amount / 100 : ''}
                    onChange={(e) =>
                      update(fee.id, {
                        amount:
                          e.target.value === '' ? NaN : Math.round(Number(e.target.value) * 100),
                      })
                    }
                  />
                  <Button
                    variant="ghost"
                    aria-label={`Remove ${fee.label}`}
                    disabled={fees.length === 1}
                    onClick={() => onChange(fees.filter((f) => f.id !== fee.id))}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </Button>
                </div>
              </div>
              {fee.type === 'monthly' && (
                <>
                  <div className="demo-field">
                    <Label htmlFor={`${fee.id}-start`}>First billing date</Label>
                    <DatePicker
                      id={`${fee.id}-start`}
                      value={fee.start || null}
                      onValueChange={(value) => update(fee.id, { start: value })}
                    />
                  </div>
                  <div className="demo-field">
                    <Label htmlFor={`${fee.id}-end`}>Last billing date (optional)</Label>
                    <DatePicker
                      id={`${fee.id}-end`}
                      value={fee.end || null}
                      onValueChange={(value) => update(fee.id, { end: value })}
                    />
                  </div>
                </>
              )}
            </div>
          </fieldset>
        ))}
        <div className="demo-actions">
          <Button
            variant="outline"
            onClick={() =>
              onChange([
                ...fees,
                {
                  id: `custom-${fees.length}-${fees.map((f) => f.id).join('').length}`,
                  label: 'Other fee',
                  type: 'other',
                  amount: 0,
                  start: '',
                  end: '',
                },
              ])
            }
          >
            <Plus size={16} />
            Add fee
          </Button>
        </div>
        <p className="demo-help">
          The first monthly installment is collected now. Future charges require a separate cash
          collection. Short months use the last available day.
        </p>
        <Details
          items={[
            ['Total fees', money(total)],
            ['Willing fee credit', `− ${money(Math.min(total, credit))}`],
            ['Collect now', money(total - Math.min(total, credit))],
          ]}
        />
      </div>
    </Panel>
  );
}
