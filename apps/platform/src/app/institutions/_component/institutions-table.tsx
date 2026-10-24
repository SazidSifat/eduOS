import { Link } from '@tanstack/react-router';
import { ArrowUpRight } from 'lucide-react';
import type { SchoolPreview } from '../../../lib/school-preview-model';
import { planNames } from '../../../lib/school-preview-model';
import { SchoolStateBadge, SubscriptionBadge } from '../../../components/school-badges';
import { shortId } from '../../../lib/display';
import {
  Button,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@eduos/ui';

export function InstitutionsTable({
  rows,
  compact = false,
}: {
  rows: readonly SchoolPreview[];
  compact?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <Table className="md:min-w-[520px]">
        <TableCaption className="sr-only">
          Sample institutions in the platform directory
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Institution</TableHead>
            <TableHead scope="col" className="hidden sm:table-cell">
              School state
            </TableHead>
            <TableHead scope="col" className="hidden md:table-cell">
              Subscription
            </TableHead>
            {!compact && (
              <TableHead scope="col" className="hidden xl:table-cell">
                Time zone
              </TableHead>
            )}
            {!compact && (
              <TableHead scope="col" className="hidden xl:table-cell">
                Institution ID
              </TableHead>
            )}
            <TableHead scope="col">
              <span className="sr-only">Details</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((institution) => (
            <TableRow key={institution.id}>
              <TableCell>
                <Link
                  to="/institutions/$institutionId"
                  params={{ institutionId: institution.id }}
                  className="block rounded text-sm font-medium hover:text-primary"
                >
                  {institution.name}
                  <span className="mt-1 block text-xs font-normal text-muted-foreground">
                    {institution.slug}
                  </span>
                  <span className="mt-2 block sm:hidden">
                    <SchoolStateBadge status={institution.status} />
                  </span>
                </Link>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <SchoolStateBadge status={institution.status} />
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <p className="mb-1 text-xs text-muted-foreground">
                  {planNames[institution.subscription.plan]}
                </p>
                <SubscriptionBadge status={institution.subscription.status} />
              </TableCell>
              {!compact && (
                <TableCell className="hidden whitespace-nowrap text-sm text-muted-foreground xl:table-cell">
                  {institution.timezone}
                </TableCell>
              )}
              {!compact && (
                <TableCell className="hidden font-mono text-xs text-muted-foreground xl:table-cell">
                  {shortId(institution.id)}
                </TableCell>
              )}
              <TableCell>
                <Button asChild variant="outline" size="icon">
                  <Link
                    to="/institutions/$institutionId"
                    params={{ institutionId: institution.id }}
                    aria-label={`View ${institution.name}`}
                  >
                    <ArrowUpRight aria-hidden="true" className="size-4" strokeWidth={1.5} />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
