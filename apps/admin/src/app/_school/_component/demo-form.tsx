import { useId, type ReactNode } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
  Switch,
  Textarea,
} from '@eduos/ui';

export interface DemoField {
  name: string;
  label: string;
  value?: string;
  required?: boolean;
  kind?: 'text' | 'date' | 'money' | 'textarea' | 'time' | 'switch';
  options?: string[];
  optionLabels?: Record<string, string>;
  helper?: string;
  wide?: boolean;
  readOnly?: boolean;
}
export interface FormSection {
  title: string;
  description?: string;
  fields: DemoField[];
}
export const valueOf = (values: Record<string, string>, key: string) => values[key] ?? '';
export const amountOf = (value: string) => Math.round(Number(value) * 100);
function formSchema(sections: FormSection[]) {
  return z.record(z.string(), z.string()).superRefine((values, context) => {
    for (const field of sections.flatMap((section) => section.fields)) {
      const value = valueOf(values, field.name).trim();
      let message = '';
      if (field.required && !value) message = `${field.label.replace(' *', '')} is required.`;
      else if (value && field.kind === 'date' && !z.iso.date().safeParse(value).success)
        message = 'Choose a valid calendar date.';
      else if (
        value &&
        field.kind === 'money' &&
        (!Number.isFinite(Number(value)) || Number(value) < 0 || !/^\d+(\.\d{1,2})?$/.test(value))
      )
        message = 'Enter a non-negative BDT amount with up to two decimal places.';
      else if (value && field.kind === 'time' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value))
        message = 'Enter a valid time.';
      else if (field.options && value && !field.options.includes(value))
        message = 'Choose an available option.';
      else if (value.length > 1000) message = 'Use 1,000 characters or fewer.';
      if (message) context.addIssue({ code: 'custom', path: [field.name], message });
    }
  });
}
export function DemoForm({
  sections,
  onSubmit,
  submitLabel = 'Save changes',
  children,
  footer,
  busy = false,
}: {
  sections: FormSection[];
  onSubmit: (values: Record<string, string>) => void | Promise<void>;
  submitLabel?: string;
  children?: ReactNode;
  footer?: ReactNode;
  busy?: boolean;
}) {
  const id = useId();
  const form = useForm<Record<string, string>>({
    resolver: zodResolver(formSchema(sections)),
    defaultValues: Object.fromEntries(
      sections.flatMap((section) =>
        section.fields.map((field) => [
          field.name,
          field.value ?? (field.kind === 'switch' ? 'no' : ''),
        ]),
      ),
    ),
  });
  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="demo-stack">
        {sections.map((section) => (
          <section key={section.title} className="demo-panel">
            <header>
              <h2>{section.title}</h2>
              {section.description && <p>{section.description}</p>}
            </header>
            <div className="demo-fields">
              {section.fields.map((field) => {
                const inputId = `${id}-${field.name}`;
                const error = form.formState.errors[field.name]?.message;
                const message = typeof error === 'string' ? error : '';
                return (
                  <div
                    key={field.name}
                    className={field.wide ? 'demo-field demo-field-wide' : 'demo-field'}
                  >
                    <Label htmlFor={inputId}>
                      {field.label}
                      {field.required ? ' *' : ''}
                    </Label>
                    {field.options ? (
                      <Controller
                        name={field.name}
                        control={form.control}
                        render={({ field: control }) => (
                          <Select
                            value={control.value}
                            onValueChange={control.onChange}
                            disabled={field.readOnly ?? false}
                          >
                            <SelectTrigger
                              id={inputId}
                              ref={control.ref}
                              onBlur={control.onBlur}
                              aria-invalid={!!message}
                              aria-describedby={message ? `${inputId}-error` : undefined}
                            >
                              <SelectValue placeholder="Choose an option" />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options?.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {field.optionLabels?.[option] ?? option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    ) : field.kind === 'date' ? (
                      <Controller
                        name={field.name}
                        control={form.control}
                        render={({ field: control }) => (
                          <DatePicker
                            id={inputId}
                            ref={control.ref}
                            value={control.value || null}
                            onValueChange={control.onChange}
                            onBlur={control.onBlur}
                            aria-invalid={!!message}
                            aria-describedby={message ? `${inputId}-error` : undefined}
                            disabled={field.readOnly ?? false}
                          />
                        )}
                      />
                    ) : field.kind === 'switch' ? (
                      <Controller
                        name={field.name}
                        control={form.control}
                        render={({ field: control }) => (
                          <div className="flex h-10 items-center gap-3">
                            <Switch
                              id={inputId}
                              checked={control.value === 'yes'}
                              onCheckedChange={(checked) =>
                                control.onChange(checked ? 'yes' : 'no')
                              }
                            />
                            <span className="text-muted-foreground">
                              {control.value === 'yes' ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        )}
                      />
                    ) : field.kind === 'textarea' ? (
                      <Textarea
                        id={inputId}
                        {...form.register(field.name)}
                        rows={3}
                        aria-invalid={!!message}
                        aria-describedby={message ? `${inputId}-error` : undefined}
                      />
                    ) : (
                      <Input
                        id={inputId}
                        {...form.register(field.name)}
                        type={field.kind === 'time' ? 'time' : 'text'}
                        inputMode={field.kind === 'money' ? 'decimal' : undefined}
                        readOnly={field.readOnly ?? false}
                        aria-invalid={!!message}
                        aria-describedby={message ? `${inputId}-error` : undefined}
                      />
                    )}
                    {field.helper && <p className="demo-help">{field.helper}</p>}
                    {message && (
                      <p className="demo-error" id={`${inputId}-error`} role="alert">
                        {message}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
        {children}
        <div className="demo-actions">
          {footer}
          <Button type="submit" disabled={busy || form.formState.isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
