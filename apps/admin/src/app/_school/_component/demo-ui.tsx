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
  return (
    <header className="demo-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
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
  return (
    <section className={`demo-panel ${className}`}>
      <header>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
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
  return (
    <div className={`demo-notice demo-${tone}`} role={tone === 'danger' ? 'alert' : undefined}>
      <p className="font-semibold">{title}</p>
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
  return <span className={`demo-badge demo-${tone}`}>{children}</span>;
}
export function Metrics({
  items,
}: {
  items: { label: string; value: string | number; detail: string }[];
}) {
  return (
    <dl className="demo-metrics">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
          <p>{item.detail}</p>
        </div>
      ))}
    </dl>
  );
}
export function Details({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="demo-details">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
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
  return (
    <div className="demo-table-wrap">
      <table className="demo-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col">
                {header}
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
  return (
    <div className="demo-empty">
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function Tabs({ items }: { items: { label: string; to: DemoPath; active: boolean }[] }) {
  return (
    <nav className="demo-tabs" aria-label="Module views">
      {items.map((item) => (
        <Link key={item.to} to={item.to} aria-current={item.active ? 'page' : undefined}>
          {item.label}
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
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
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
  function download() {
    const escape = (value: string | number) =>
      `"${String(value)
        .replace(/^[=+@-]/, "'$&")
        .replaceAll('"', '""')}"`;
    const blob = new Blob(
      [[headers, ...rows].map((row) => row.map(escape).join(',')).join('\r\n')],
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
      Export CSV
    </Button>
  );
}
