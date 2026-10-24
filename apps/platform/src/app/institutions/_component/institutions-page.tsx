import { institutionTypeLabels as typeName } from '../../../lib/institution-display';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, Search, Plus } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { institutionCodeSchema } from '@eduos/contracts';
import {
  Button,
  Badge,
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
import { institutionCodeQuery, institutionsQuery } from '../../_api/platform';
import { usePlatformAccess } from '../../../components/providers/platform-access-provider';

export function InstitutionsPage() {
  const { canCreateInstitutions } = usePlatformAccess();
  const [search, setSearch] = useState('');
  const code = institutionCodeSchema.safeParse(search.trim());
  const institutions = useQuery(code.success ? institutionCodeQuery(code.data) : institutionsQuery);
  const records = useMemo(() => {
    const items = institutions.data?.items ?? [];
    const query = search.trim().toLowerCase();
    return items.filter((institution) =>
      `${institution.name} ${institution.code} ${institution.slug} ${institution.id} ${institution.type ?? ''} ${institution.status}`
        .toLowerCase()
        .includes(query),
    );
  }, [institutions.data, search]);

  return (
    <div className="space-y-7">
      <PageHeader
        title="Institutions"
        description="Review institutions, access state and enabled school modules."
        action={
          canCreateInstitutions ? (
            <Button asChild>
              <Link to="/institutions/new">
                <Plus aria-hidden="true" className="size-4" />
                Create institution
              </Link>
            </Button>
          ) : undefined
        }
      />
      <Card as="section" className="overflow-hidden" aria-label="Institution directory">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4 sm:px-5">
          <div className="relative min-w-0 grow sm:max-w-96">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground"
              strokeWidth={1.5}
            />
            <Input
              aria-label="Search institutions"
              value={search}
              maxLength={200}
              onChange={(event) => setSearch(event.target.value)}
              className="h-9 w-full pl-9"
              placeholder="Search name, code or slug"
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {institutions.data
              ? `${institutions.data.items.length} institutions returned`
              : 'First 100 institutions'}
          </span>
        </div>
        {institutions.isPending ? (
          <output className="block px-5 py-8 text-sm text-muted-foreground">
            Loading institution metadata…
          </output>
        ) : institutions.isError ? (
          <div className="grid justify-items-start gap-3 p-6">
            <p role="alert" className="text-sm text-destructive">
              Institution data could not be loaded.
            </p>
            <Button variant="outline" onClick={() => void institutions.refetch()}>
              Try again
            </Button>
          </div>
        ) : records.length ? (
          <div className="overflow-x-auto">
            <Table className="min-w-[980px]">
              <TableCaption className="sr-only">Live institution metadata</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Institution</TableHead>
                  <TableHead scope="col">Type</TableHead>
                  <TableHead scope="col">Access</TableHead>
                  <TableHead scope="col">Modules</TableHead>
                  <TableHead scope="col">Slug</TableHead>
                  <TableHead scope="col">Timezone</TableHead>
                  <TableHead scope="col">Institution code</TableHead>
                  <TableHead scope="col" className="text-right">
                    Details
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((institution) => (
                  <TableRow key={institution.id}>
                    <TableCell className="font-medium">
                      <Link
                        to="/institutions/$institutionId"
                        params={{ institutionId: institution.id }}
                        className="hover:text-primary"
                      >
                        {institution.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {institution.type ? typeName[institution.type] : 'Not set'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          institution.status === 'active'
                            ? 'secondary'
                            : institution.status === 'frozen'
                              ? 'warning'
                              : 'destructive'
                        }
                      >
                        {institution.status === 'inactive'
                          ? 'Deactivated'
                          : institution.status === 'frozen'
                            ? 'Frozen'
                            : 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell>{institution.enabledModules.length} enabled</TableCell>
                    <TableCell className="font-mono text-xs">{institution.slug}</TableCell>
                    <TableCell>{institution.timezone}</TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">
                      {institution.code}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="icon">
                        <Link
                          to="/institutions/$institutionId"
                          params={{ institutionId: institution.id }}
                          aria-label={`View details for ${institution.name}`}
                          title="View institution details"
                        >
                          <Eye aria-hidden="true" className="size-4" strokeWidth={1.5} />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState title="No matching institutions">Try another name, code or slug.</EmptyState>
        )}
        <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
          Access state and module settings are managed from the institution profile.
        </div>
      </Card>
    </div>
  );
}
