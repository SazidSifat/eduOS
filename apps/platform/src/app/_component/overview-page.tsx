import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import {
  Button,
  Card,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@eduos/ui';
import { PageHeader } from '../../components/page-header';
import { AccessScope } from '../../components/access-scope';
import { usePreview } from '../../components/providers/preview-provider';
import { institutionsQuery, operatorsQuery } from '../_api/platform';

export function OverviewPage() {
  const { role, canManageOperators } = usePreview();
  const institutions = useQuery(institutionsQuery);
  const operators = useQuery({ ...operatorsQuery, enabled: canManageOperators });
  const activeOperators = operators.data?.items.filter((operator) => operator.active) ?? [];

  return (
    <div className="space-y-7">
      <PageHeader
        title="Platform overview"
        description="Authenticated institution metadata and platform access."
        action={
          <Button asChild variant="outline">
            <Link to="/institutions">
              Browse institutions
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        }
      />
      <Card as="dl" className="grid grid-cols-2 divide-x divide-border sm:grid-cols-3">
        <div className="space-y-2 px-4 py-5 sm:px-5">
          <dt className="text-xs text-muted-foreground">Institutions returned</dt>
          <dd className="text-2xl font-semibold tabular-nums">
            {institutions.data?.items.length.toString().padStart(2, '0') ?? '—'}
          </dd>
          <dd className="text-xs text-muted-foreground">First 100 metadata records</dd>
        </div>
        <div className="space-y-2 px-4 py-5 sm:px-5">
          <dt className="text-xs text-muted-foreground">Your platform role</dt>
          <dd className="text-2xl font-semibold">
            {role === 'platform_owner' ? 'Super Admin' : 'Manager'}
          </dd>
          <dd className="text-xs text-muted-foreground">Resolved from the API</dd>
        </div>
        {canManageOperators && (
          <div className="col-span-2 space-y-2 border-t border-border px-4 py-5 sm:col-span-1 sm:border-t-0 sm:px-5">
            <dt className="text-xs text-muted-foreground">Active operators returned</dt>
            <dd className="text-2xl font-semibold tabular-nums">
              {operators.data ? activeOperators.length.toString().padStart(2, '0') : '—'}
            </dd>
            <dd className="text-xs text-muted-foreground">Super Admin directory</dd>
          </div>
        )}
      </Card>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <Card as="section" className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold">Institutions</h2>
            <Link to="/institutions" className="text-link inline-flex items-center gap-1 text-xs">
              View directory
              <ArrowRight aria-hidden="true" className="size-3" />
            </Link>
          </div>
          {institutions.isPending ? (
            <output className="block p-5 text-sm text-muted-foreground">
              Loading institution metadata…
            </output>
          ) : institutions.isError ? (
            <p role="alert" className="p-5 text-sm text-destructive">
              Institution data could not be loaded.
            </p>
          ) : institutions.data.items.length ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[520px]">
                <TableCaption className="sr-only">Live institution metadata</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Institution</TableHead>
                    <TableHead scope="col">Slug</TableHead>
                    <TableHead scope="col">Timezone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {institutions.data.items.slice(0, 5).map((institution) => (
                    <TableRow key={institution.id}>
                      <TableCell className="font-medium">{institution.name}</TableCell>
                      <TableCell className="font-mono text-xs">{institution.slug}</TableCell>
                      <TableCell>{institution.timezone}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="p-5 text-sm text-muted-foreground">
              No institution metadata is available.
            </p>
          )}
          <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
            School states, subscriptions and operational metrics are not returned by this API.
          </p>
        </Card>
        <div className="space-y-6">
          <AccessScope role={role} />
          <Card as="section" className="space-y-3 p-5">
            <ShieldCheck aria-hidden="true" className="size-5 text-primary" strokeWidth={1.5} />
            <h2 className="text-sm font-semibold">Separate access scopes</h2>
            <p className="text-xs leading-5 text-muted-foreground">
              Platform operator permissions do not grant student, class or school workspace access.
            </p>
          </Card>
        </div>
      </div>
      {canManageOperators && (
        <Card as="section" className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold">Platform team</h2>
            <Link to="/operators" className="text-link inline-flex items-center gap-1 text-xs">
              View team
              <ArrowRight aria-hidden="true" className="size-3" />
            </Link>
          </div>
          {operators.isPending ? (
            <output className="block p-5 text-sm text-muted-foreground">
              Loading operator assignments…
            </output>
          ) : operators.isError ? (
            <p role="alert" className="p-5 text-sm text-destructive">
              Operator assignments could not be loaded.
            </p>
          ) : (
            <div className="grid divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
              {activeOperators.slice(0, 3).map((operator) => (
                <div key={operator.userId} className="grid gap-1 p-5">
                  <span className="font-mono text-xs text-muted-foreground">{operator.userId}</span>
                  <span className="text-sm font-medium">
                    {operator.role === 'platform_owner' ? 'Super Admin' : 'Platform Manager'}
                  </span>
                </div>
              ))}
              {!activeOperators.length && (
                <p className="p-5 text-sm text-muted-foreground">
                  No active operators are available.
                </p>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
