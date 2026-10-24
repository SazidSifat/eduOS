import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import {
  platformOperatorSchema,
  platformOperatorStateSchema,
  platformRoleSchema,
} from '@eduos/contracts';
import type { PlatformRole } from '@eduos/permissions';
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
import { StatusBadge } from '../../../components/status-badge';
import { operatorsQuery } from '../../_api/platform';
import { usePreview } from '../../../components/providers/preview-provider';
import { OwnerAccessRequired } from '../../../components/owner-access-required';
import { apiPut } from '../../../lib/api-client';

type RoleFilter = 'all' | 'platform_owner' | 'platform_manager';
type StatusFilter = 'all' | 'active' | 'inactive';

export function OperatorsPage() {
  const { canManageOperators } = usePreview();
  const queryClient = useQueryClient();
  const operators = useQuery({ ...operatorsQuery, enabled: canManageOperators });
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<RoleFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [drafts, setDrafts] = useState<Record<string, { role: PlatformRole; active: boolean }>>({});
  const updateOperator = useMutation({
    mutationFn: ({
      userId,
      role: nextRole,
      active,
    }: {
      userId: string;
      role: PlatformRole;
      active: boolean;
    }) =>
      apiPut(
        `/api/v1/platform/operators/${encodeURIComponent(userId)}`,
        platformOperatorSchema,
        platformOperatorStateSchema.parse({ role: nextRole, active }),
      ),
    onSuccess: async () => {
      setDrafts({});
      await queryClient.invalidateQueries({ queryKey: operatorsQuery.queryKey });
    },
  });
  const records = useMemo(() => {
    const items = operators.data?.items ?? [];
    const query = search.trim().toLowerCase();
    return items.filter(
      (operator) =>
        operator.userId.toLowerCase().includes(query) &&
        (role === 'all' || operator.role === role) &&
        (status === 'all' || operator.active === (status === 'active')),
    );
  }, [operators.data, role, search, status]);

  if (!canManageOperators) return <OwnerAccessRequired />;

  return (
    <div className="space-y-7">
      <PageHeader
        title="Platform team"
        description="Review platform operator assignments. Identity details are intentionally not included in this API response."
      />
      <Card as="section" className="overflow-hidden" aria-label="Platform operator directory">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4 sm:px-5">
          <div className="relative min-w-0 grow sm:max-w-80">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground"
              strokeWidth={1.5}
            />
            <Input
              aria-label="Search operators by user ID"
              value={search}
              maxLength={100}
              onChange={(event) => setSearch(event.target.value)}
              className="h-9 w-full pl-9"
              placeholder="Search user ID"
            />
          </div>
          <Select
            value={role}
            onValueChange={(value) => {
              if (value === 'all' || value === 'platform_owner' || value === 'platform_manager')
                setRole(value);
            }}
          >
            <SelectTrigger aria-label="Filter platform role" className="w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="platform_owner">Super Admins</SelectItem>
              <SelectItem value="platform_manager">Managers</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(value) => {
              if (value === 'all' || value === 'active' || value === 'inactive') setStatus(value);
            }}
          >
            <SelectTrigger aria-label="Filter operator status" className="w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          {operators.data && (
            <span className="text-xs text-muted-foreground">
              {operators.data.items.length} operators returned
            </span>
          )}
        </div>
        {operators.isPending ? (
          <output className="block px-5 py-8 text-sm text-muted-foreground">
            Loading operator assignments…
          </output>
        ) : operators.isError ? (
          <div className="grid justify-items-start gap-3 p-6">
            <p role="alert" className="text-sm text-destructive">
              Operator assignments could not be loaded.
            </p>
            <Button variant="outline" onClick={() => void operators.refetch()}>
              Try again
            </Button>
          </div>
        ) : records.length ? (
          <div className="overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableCaption className="sr-only">Live platform operator assignments</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">User ID</TableHead>
                  <TableHead scope="col">Platform role</TableHead>
                  <TableHead scope="col">Status</TableHead>
                  <TableHead scope="col">Update access</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((operator) => (
                  <TableRow key={operator.userId}>
                    <TableCell className="font-mono text-xs">{operator.userId}</TableCell>
                    <TableCell className="w-52">
                      <Select
                        value={drafts[operator.userId]?.role ?? operator.role}
                        onValueChange={(value) => {
                          const parsed = platformRoleSchema.safeParse(value);
                          if (parsed.success) {
                            setDrafts((current) => ({
                              ...current,
                              [operator.userId]: {
                                role: parsed.data,
                                active: drafts[operator.userId]?.active ?? operator.active,
                              },
                            }));
                          }
                        }}
                      >
                        <SelectTrigger
                          aria-label={`Role for ${operator.userId}`}
                          className="w-full"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="platform_owner">Super Admin</SelectItem>
                          <SelectItem value="platform_manager">Platform Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="w-40">
                      <div className="grid gap-2">
                        <StatusBadge active={drafts[operator.userId]?.active ?? operator.active} />
                        <Select
                          value={
                            (drafts[operator.userId]?.active ?? operator.active)
                              ? 'active'
                              : 'inactive'
                          }
                          onValueChange={(value) => {
                            if (value !== 'active' && value !== 'inactive') return;
                            setDrafts((current) => ({
                              ...current,
                              [operator.userId]: {
                                role: current[operator.userId]?.role ?? operator.role,
                                active: value === 'active',
                              },
                            }));
                          }}
                        >
                          <SelectTrigger aria-label={`Status for ${operator.userId}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const draft = drafts[operator.userId] ?? {
                          role: operator.role,
                          active: operator.active,
                        };
                        const changed =
                          draft.role !== operator.role || draft.active !== operator.active;
                        return (
                          <Button
                            variant="outline"
                            disabled={!changed || updateOperator.isPending}
                            onClick={() =>
                              updateOperator.mutate({ userId: operator.userId, ...draft })
                            }
                          >
                            Save
                          </Button>
                        );
                      })()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState title="No matching operators">
            Try another user ID, role or status.
          </EmptyState>
        )}
        {updateOperator.isError && (
          <p role="alert" className="border-t border-border px-5 py-3 text-xs text-destructive">
            The operator update was rejected. Review the role and status, then try again.
          </p>
        )}
        {updateOperator.isSuccess && (
          <output className="block border-t border-border px-5 py-3 text-xs text-primary">
            Operator access updated.
          </output>
        )}
        <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
          “Super Admin” is saved through the API as `platform_owner`. The server protects the last
          active Super Admin and records each change.
        </div>
      </Card>
    </div>
  );
}
