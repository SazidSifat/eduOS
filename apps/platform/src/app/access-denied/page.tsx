import { createFileRoute } from '@tanstack/react-router';
import { ShieldCheck } from 'lucide-react';
import { Button, Card } from '@eduos/ui';
import { authClient } from '../_api/auth';
import { queryClient } from '../../lib/query-client';

function AccessDeniedPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background p-6">
      <Card as="section" className="grid w-full max-w-lg justify-items-start gap-4 p-8">
        <ShieldCheck aria-hidden="true" className="size-6 text-primary" strokeWidth={1.5} />
        <h1 className="text-2xl font-semibold tracking-tight">Platform access required</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          This account has no active Super Admin or Platform Manager assignment. Institution access
          does not grant platform permissions.
        </p>
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
