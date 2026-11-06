import { useLanguage } from '@eduos/ui';
import type { ReactNode } from 'react';
import {
  Switch,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@eduos/ui';
export function Choice({
  id,
  label,
  value,
  onChange,
  options,
  error,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  error?: string | undefined;
  disabled?: boolean;
}) {
  const { t } = useLanguage();

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{t(label)}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        >
          <SelectValue placeholder={t('Select an option')} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {t(option.label)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {t(error)}
        </p>
      )}
    </div>
  );
}
export function Toggle({
  id,
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const { t } = useLanguage();

  return (
    <div className="flex items-start justify-between gap-6 py-3">
      <div>
        <Label htmlFor={id}>{t(label)}</Label>
        {description && (
          <p id={`${id}-description`} className="mt-1 text-xs text-muted-foreground">
            {t(description)}
          </p>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        aria-describedby={description ? `${id}-description` : undefined}
        onCheckedChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const { t } = useLanguage();

  return (
    <section className="border-t border-border py-6">
      <h2 className="font-semibold">{t(title)}</h2>
      {description && <p className="mt-1 text-xs text-muted-foreground">{t(description)}</p>}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}
