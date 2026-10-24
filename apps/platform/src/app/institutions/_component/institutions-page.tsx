import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import {
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
import { institutionsQuery } from '../../_api/platform';

export function InstitutionsPage() {
  const institutions = useQuery(institutionsQuery);
  const [search, setSearch] = useState('');
  const records = useMemo(() => {
    const items = institutions.data?.items ?? [];
    const query = search.trim().toLowerCase();
    return items.filter((institution) =>
      `${institution.name} ${institution.slug} ${institution.id}`.toLowerCase().includes(query),
    );
  }, [institutions.data, search]);

  return (
    <div className="space-y-7">
      <PageHeader
        title="Institutions"
        description="Read-only institution metadata returned by the platform API."
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
              placeholder="Search name, slug or identifier"
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
            <Table className="min-w-[680px]">
              <TableCaption className="sr-only">Live institution metadata</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Institution</TableHead>
                  <TableHead scope="col">Slug</TableHead>
                  <TableHead scope="col">Timezone</TableHead>
                  <TableHead scope="col">Institution ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((institution) => (
                  <TableRow key={institution.id}>
                    <TableCell className="font-medium">{institution.name}</TableCell>
                    <TableCell className="font-mono text-xs">{institution.slug}</TableCell>
                    <TableCell>{institution.timezone}</TableCell>
                    <TableCell className="font-mono text-xs">{institution.id}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState title="No matching institutions">
            Try another name, slug or identifier.
          </EmptyState>
        )}
        <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
          Institution profile changes and school access actions are not available in this API slice.
        </div>
      </Card>
    </div>
  );
}
