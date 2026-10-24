import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@eduos/ui';
import { identityQuery } from '../../login/_api/session';
import { membershipsQuery, workspaceQuery } from '../_api/queries';
import { authClient } from '../../login/_api/auth';
import { queryClient } from '../../../lib/query-client';
import { ErrorState, LoadingState } from '../../../components/feedback';
import { AppShell } from '../../../components/layout/app-shell';

export function WorkspacePage() {
  return (
    <AppShell>
      <WorkspaceIdentity />
    </AppShell>
  );
}

function WorkspaceIdentity() {
  const identity = useQuery(identityQuery);
  if (identity.isPending) return <LoadingState />;
  if (identity.isError)
    return (
      <ErrorState
        retry={() => {
          void identity.refetch();
        }}
      />
    );
  return <WorkspaceContent userId={identity.data.id} name={identity.data.name} />;
}
function WorkspaceContent({ userId, name }: { userId: string; name: string }) {
  const navigate = useNavigate();
  const memberships = useQuery(membershipsQuery(userId));
  const [selected, setSelected] = useState('');
  const [signOutError, setSignOutError] = useState(false);
  const workspace = useQuery(workspaceQuery(userId, selected));
  async function logout() {
    setSignOutError(false);
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setSignOutError(true);
        return;
      }
      await queryClient.cancelQueries();
      queryClient.clear();
      await navigate({ to: '/login', replace: true });
    } catch {
      setSignOutError(true);
    }
  }
  return (
    <section className="max-w-xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Your workspace</h1>
        <Button
          variant="outline"
          onClick={() => {
            void logout();
          }}
        >
          Sign out
        </Button>
      </div>
      <p>Welcome, {name}.</p>
      {signOutError && <p role="alert">Could not sign out. Try again.</p>}
      {memberships.isPending ? (
        <LoadingState />
      ) : memberships.isError ? (
        <ErrorState
          retry={() => {
            void memberships.refetch();
          }}
        />
      ) : memberships.data.length === 0 ? (
        <p className="rounded-lg border border-border p-6 text-muted-foreground">
          You have no active institution memberships. Contact your institution administrator for
          access.
        </p>
      ) : (
        <div className="space-y-2">
          <label htmlFor="institution" className="block text-sm font-medium">
            Institution
          </label>
          <select
            id="institution"
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            className="w-full rounded-md border border-border bg-background p-3"
          >
            <option value="">Select an institution</option>
            {memberships.data.map((m) => (
              <option key={m.institutionId} value={m.institutionId}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {selected &&
        (workspace.isPending ? (
          <LoadingState />
        ) : workspace.isError ? (
          <ErrorState
            retry={() => {
              void workspace.refetch();
            }}
          />
        ) : (
          <div className="rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold">{workspace.data.name}</h2>
            <p className="mt-2 text-muted-foreground">Time zone: {workspace.data.timezone}</p>
            <p className="mt-2 text-muted-foreground">
              Enabled modules:{' '}
              {workspace.data.modules.length
                ? workspace.data.modules.map((module) => module.replaceAll('_', ' ')).join(', ')
                : 'None enabled. Contact your institution administrator.'}
            </p>
          </div>
        ))}
    </section>
  );
}
