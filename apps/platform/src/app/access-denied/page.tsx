import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { Button, Card } from '@eduos/ui';
import { authClient } from '../_api/auth';
import { identityQuery } from '../_api/platform';
import { queryClient } from '../../lib/query-client';

function AccessDeniedPage() {
  const identity = useQuery({ ...identityQuery, enabled: false }).data;
  return (
    <main className="grid min-h-dvh place-items-center bg-background p-6">
      <Card as="section" className="grid w-full max-w-lg justify-items-start gap-4 p-8">
        <ShieldCheck aria-hidden="true" className="size-6 text-primary" strokeWidth={1.5} />
        <h1 className="text-2xl font-semibold tracking-tight">Platform access required</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          This account has no active Super Admin or Platform Manager assignment. Institution access
          does not grant platform permissions.
        </p>
        {identity && <p className="text-xs text-muted-foreground">Signed in as {identity.email}</p>}
        <Button
          variant="outline"
          onClick={async () => {
            await authClient.signOut();
            await queryClient.cancelQueries();
            queryClient.clear();
            window.location.assign('/login');
          }}
        >
          Sign out
        </Button>
      </Card>
    </main>
  );
}

export const Route = createFileRoute('/access-denied/')({ component: AccessDeniedPage });
