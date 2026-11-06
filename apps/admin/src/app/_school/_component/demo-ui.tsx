import { useLanguage } from '@eduos/ui';
import { Link } from '@tanstack/react-router';
import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@eduos/ui';
import { ArrowRight, Download } from 'lucide-react';
import type { ReactNode } from 'react';
import type { FileRouteTypes } from '../../../routeTree.gen';

export type DemoPath = Exclude<FileRouteTypes['to'], `${string}$${string}`>;
export function DemoLink({
  to,
  children,
  primary = false,
  className = '',
}: {
  to: DemoPath;
  children: ReactNode;
  primary?: boolean;
  className?: string;
}) {
  return (
    <Button asChild variant={primary ? 'default' : 'outline'} className={className}>
      <Link to={to}>{children}</Link>
    </Button>
  );
}
export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  const { t } = useLanguage();

  return (
    <header className="demo-heading">
      <div>
        <h1>{t(title)}</h1>
        <p>{t(description)}</p>
      </div>
      {action}
    </header>
  );
}
export function Panel({
  title,
  description,
  children,
  className = '',
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  const { t } = useLanguage();

  return (
    <section className={`demo-panel ${className}`}>
      <header>
        <h2>{t(title)}</h2>
        {description && <p>{t(description)}</p>}
      </header>
      {children}
    </section>
  );
}
export function Notice({
  title,
  children,
  tone = 'info',
}: {
  title: string;
  children?: ReactNode;
  tone?: 'info' | 'warning' | 'success' | 'danger';
}) {
  const { t } = useLanguage();

  return (
    <div className={`demo-notice demo-${tone}`} role={tone === 'danger' ? 'alert' : undefined}>
      <p className="font-semibold">{t(title)}</p>
      {children && <div className="mt-1">{children}</div>}
    </div>
  );
}
export function Status({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}) {
  const { t } = useLanguage();
  return (
    <span className={`demo-badge demo-${tone}`}>
      {typeof children === 'string' ? t(children) : children}
    </span>
  );
}
export function Metrics({
  items,
}: {
  items: { label: string; value: string | number; detail: string }[];
}) {
  const { t } = useLanguage();

  return (
    <dl className="demo-metrics">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{t(item.label)}</dt>
          <dd>{item.value}</dd>
          <p>{t(item.detail)}</p>
        </div>
      ))}
    </dl>
  );
}
export function Details({ items }: { items: [string, ReactNode][] }) {
  const { t } = useLanguage();

  return (
    <dl className="demo-details">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{t(label)}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
export function DataTable({
  headers,
  children,
  caption,
}: {
  headers: string[];
  children: ReactNode;
  caption: string;
}) {
  const { t } = useLanguage();

  return (
    <div className="demo-table-wrap">
      <table className="demo-table">
        <caption className="sr-only">{t(caption)}</caption>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col">
                {t(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const { t } = useLanguage();

  return (
    <div className="demo-empty">
      <h2>{t(title)}</h2>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function Tabs({ items }: { items: { label: string; to: DemoPath; active: boolean }[] }) {
  const { t } = useLanguage();

  return (
    <nav className="demo-tabs" aria-label={t('Module views')}>
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          activeOptions={{ exact: true }}
          aria-current={item.active ? 'page' : undefined}
          data-active={item.active ? 'true' : undefined}
          className={item.active ? 'demo-tab-active' : ''}
        >
          {t(item.label)}
        </Link>
      ))}
    </nav>
  );
}
export function NextLink({ to, children }: { to: DemoPath; children: ReactNode }) {
  return (
    <Link to={to} className="demo-inline-link">
      {children}
      <ArrowRight size={16} aria-hidden="true" />
    </Link>
  );
}
export function Choice({
  id,
  label,
  value,
  options,
  optionLabels,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  optionLabels?: Record<string, string>;
  onChange: (value: string) => void;
}) {
  const { t } = useLanguage();

  return (
    <div>
      <Label htmlFor={id}>{t(label)}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {optionLabels?.[option] ?? t(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
export function ExportButton({
  filename,
  headers,
  rows,
}: {
  filename: string;
  headers: string[];
  rows: (string | number)[][];
}) {
  const { t } = useLanguage();

  function download() {
    const escape = (value: string | number) =>
      `"${String(value)
        .replace(/^[=+@-]/, "'$&")
        .replaceAll('"', '""')}"`;
    const blob = new Blob(
      [
        [headers.map((header) => t(header)), ...rows]
          .map((row) => row.map(escape).join(','))
          .join('\r\n'),
      ],
      { type: 'text/csv;charset=utf-8' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <Button variant="outline" onClick={download}>
      <Download size={16} aria-hidden="true" />
      {t('Export CSV')}{' '}
    </Button>
  );
}
