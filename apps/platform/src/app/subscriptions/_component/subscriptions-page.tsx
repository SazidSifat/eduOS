import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowUpRight, Search } from 'lucide-react';
import { z } from 'zod';
import {
  Button,
  Card,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@eduos/ui';
import { PageHeader } from '../../../components/page-header';
import { EmptyState } from '../../../components/empty-state';
import { OwnerAccessRequired } from '../../../components/owner-access-required';
import { SubscriptionBadge } from '../../../components/school-badges';
import { usePreview } from '../../../components/providers/preview-provider';
import { useSchoolPreview } from '../../../components/providers/school-preview-provider';
import { directorySearchSchema } from '../../../lib/preview-data';
import { dateLabel, money, planNames } from '../../../lib/school-preview-model';

const filterSchema = z.enum(['all', 'not_configured', 'trial', 'active', 'overdue', 'cancelled']);
export function SubscriptionsPage() {
  const { role } = usePreview();
  const { schools } = useSchoolPreview();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<z.infer<typeof filterSchema>>('all');
  if (role !== 'platform_owner') return <OwnerAccessRequired />;
  const visible = schools.filter(
    (school) =>
      school.name.toLowerCase().includes(search.toLowerCase().trim()) &&
      (status === 'all' || school.subscription.status === status),
  );
  const summaries = [
    {
      label: 'Active subscriptions',
      value: schools.filter((school) => school.subscription.status === 'active').length,
    },
    {
      label: 'Needs attention',
      value: schools.filter((school) => school.subscription.status === 'overdue').length,
    },
    {
      label: 'Not configured',
      value: schools.filter((school) => school.subscription.status === 'not_configured').length,
    },
  ];
  return (
    <div className="space-y-7">
      <PageHeader
        title="School subscriptions"
        description="Review plans, billing cycles and renewal dates. All amounts and plans are sample settings."
      />
      <Card as="dl" className="grid grid-cols-3 divide-x divide-border">
        {summaries.map((summary) => (
          <div key={summary.label} className="space-y-2 px-3 py-5 sm:px-5">
            <dt className="text-xs text-muted-foreground">{summary.label}</dt>
            <dd className="text-2xl font-semibold tabular-nums">
              {summary.value.toString().padStart(2, '0')}
            </dd>
          </div>
        ))}
      </Card>
      <Card as="section" className="overflow-hidden" aria-label="Subscription directory">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 sm:px-5">
          <div className="relative min-w-0 grow sm:max-w-80">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground"
            />
            <Input
              aria-label="Search subscriptions"
              placeholder="Search schools"
              className="h-9 w-full pl-9"
              value={search}
              maxLength={200}
              onChange={(event) => {
                const value = directorySearchSchema.safeParse(event.target.value);
                if (value.success) setSearch(value.data);
              }}
            />
          </div>
          <Select
            value={status}
            onValueChange={(next) => {
              const value = filterSchema.safeParse(next);
              if (value.success) setStatus(value.data);
            }}
          >
            <SelectTrigger aria-label="Filter subscription status" className="w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="not_configured">Not configured</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {visible.length ? (
          <div className="overflow-x-auto">
            <Table className="min-w-[720px]">
              <TableCaption className="sr-only">Sample school subscriptions</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">School</TableHead>
                  <TableHead scope="col">Plan</TableHead>
                  <TableHead scope="col">Status</TableHead>
                  <TableHead scope="col">Amount</TableHead>
                  <TableHead scope="col">Renewal / review</TableHead>
                  <TableHead scope="col">
                    <span className="sr-only">Manage</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((school) => (
                  <TableRow key={school.id}>
                    <TableCell className="font-medium">
                      <Link
                        to="/institutions/$institutionId"
                        params={{ institutionId: school.id }}
                        className="hover:text-primary"
                      >
                        {school.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{planNames[school.subscription.plan]}</p>
                      <p className="text-xs text-muted-foreground">
                        {school.subscription.billingCycle === 'monthly' ? 'Monthly' : 'Annual'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <SubscriptionBadge status={school.subscription.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {money(school.subscription.amount)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {dateLabel(school.subscription.renewalDate)}
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="outline" size="icon">
                        <Link
                          to="/subscriptions/$institutionId"
                          params={{ institutionId: school.id }}
                          aria-label={`Manage subscription for ${school.name}`}
                        >
                          <ArrowUpRight aria-hidden="true" className="size-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState title="No matching subscriptions">
            Adjust your school search or subscription status.
          </EmptyState>
        )}
        <output className="block border-t border-border px-5 py-3 text-xs text-muted-foreground">
          {visible.length} sample subscriptions
        </output>
      </Card>
    </div>
  );
}
