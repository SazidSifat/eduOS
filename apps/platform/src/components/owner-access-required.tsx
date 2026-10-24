import { Link } from '@tanstack/react-router';
import { ShieldCheck } from 'lucide-react';
import { Card, Button } from '@eduos/ui';

export function OwnerAccessRequired() {
  return (
    <Card as="section" className="grid justify-items-start gap-4 p-8">
      <ShieldCheck aria-hidden="true" className="size-6 text-primary" strokeWidth={1.5} />
      <h1 className="text-2xl font-semibold tracking-tight">Super Admin access required</h1>
      <p className="max-w-xl text-sm leading-6 text-muted-foreground">
        This view is available to Super Admins. Platform Managers can review institution profiles.
      </p>
      <Button asChild variant="outline">
        <Link to="/institutions">Browse institutions</Link>
      </Button>
    </Card>
  );
}
