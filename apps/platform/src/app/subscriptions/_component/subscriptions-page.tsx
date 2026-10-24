import {
  subscriptionStatusVariants as statusVariant,
  subscriptionStatusLabels as statusLabel,
  institutionTypeLabels as typeLabel,
} from '../../../lib/institution-display';
import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  Input,
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
import { usePlatformAccess } from '../../../components/providers/platform-access-provider';
import { subscriptionsQuery } from '../../_api/platform';

const amountLabel = new Intl.NumberFormat('en-BD', { maximumFractionDigits: 0 });

export function SubscriptionsPage() {
  const { canManageSubscriptions } = usePlatformAccess();
  const subscriptions = useQuery({ ...subscriptionsQuery, enabled: canManageSubscriptions });
  const [search, setSearch] = useState('');
  const records = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (subscriptions.data?.items ?? []).filter(({ institution, subscription }) =>
      `${institution.name} ${institution.code} ${institution.slug} ${subscription?.planName ?? ''}`
        .toLowerCase()
        .includes(query),
    );
  }, [subscriptions.data, search]);
  if (!canManageSubscriptions) return <OwnerAccessRequired />;

  return (
    <div className="space-y-7">
      <PageHeader
        title="Institution subscriptions"
        description="Manage subscription metadata for institutions. Billing collection is not automated."
      />
      <Card
        as="section"
        className="overflow-hidden"
        aria-label="Institution subscription directory"
      >
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4 sm:px-5">
          <div className="relative min-w-0 grow sm:max-w-96">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground"
            />
            <Input
              aria-label="Search subscriptions"
              value={search}
              maxLength={200}
              onChange={(event) => setSearch(event.target.value)}
              className="h-9 w-full pl-9"
              placeholder="Search institution, code or plan"
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {subscriptions.data
              ? `${subscriptions.data.items.length} institutions returned`
              : 'First 100 institutions'}
          </span>
        </div>
        {subscriptions.isPending ? (
          <output className="block px-5 py-8 text-sm text-muted-foreground">
            Loading subscriptions…
          </output>
        ) : subscriptions.isError ? (
          <div className="grid justify-items-start gap-3 p-6">
            <p role="alert" className="text-sm text-destructive">
              Subscription data could not be loaded.
            </p>
            <Button variant="outline" onClick={() => void subscriptions.refetch()}>
              Try again
            </Button>
          </div>
        ) : records.length ? (
          <div className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableCaption className="sr-only">
                Institution subscription records from the platform API
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Institution</TableHead>
                  <TableHead scope="col">Plan</TableHead>
                  <TableHead scope="col">Status</TableHead>
                  <TableHead scope="col">Price / cycle</TableHead>
                  <TableHead scope="col">Period ends</TableHead>
                  <TableHead scope="col">
                    <span className="sr-only">Manage</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map(({ institution, subscription }) => (
                  <TableRow key={institution.id}>
                    <TableCell>
                      <Link
                        to="/institutions/$institutionId"
                        params={{ institutionId: institution.id }}
                        className="font-medium hover:text-primary"
                      >
                        {institution.name}
                      </Link>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {institution.code} ·{' '}
                        {institution.type ? typeLabel[institution.type] : 'Type not set'}
                      </span>
                    </TableCell>
                    <TableCell>{subscription?.planName ?? 'Not configured'}</TableCell>
                    <TableCell>
                      {subscription ? (
                        <Badge variant={statusVariant[subscription.status]}>
                          {statusLabel[subscription.status]}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Not configured</Badge>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {subscription
                        ? `BDT ${amountLabel.format(subscription.amountTaka)} / ${subscription.billingCycle === 'annual' ? 'year' : 'month'}`
                        : '—'}
                    </TableCell>
                    <TableCell>{subscription?.periodEndsAt ?? '—'}</TableCell>
                    <TableCell>
                      <Button asChild variant="outline" size="sm">
                        <Link
                          to="/institutions/$institutionId"
                          params={{ institutionId: institution.id }}
                          hash="institution-subscription"
                        >
                          Manage
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState title="No matching institutions">
            Adjust the search or create an institution.
          </EmptyState>
        )}
      </Card>
    </div>
  );
}
