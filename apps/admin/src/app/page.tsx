import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { healthSchema } from '@eduos/contracts';
import { Button } from '@eduos/ui';
import { apiGet } from '../lib/api-client';
function HomePage() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: ({ signal }) => apiGet('/api/health', healthSchema, signal),
  });
  return (
    <section className="max-w-2xl space-y-7 py-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">
        Your institution, connected
      </p>
      <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
        A clear space for your school.
      </h1>
      <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
        Welcome to EduOS. Sign in to access the institutions you belong to.
      </p>
      <Button asChild>
        <Link to="/workspace">
          Open workspace
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </Button>
      <output className="flex items-center gap-2 text-sm text-muted-foreground">
        <ShieldCheck aria-hidden="true" className="size-4" />
        {health.isPending
          ? 'Connecting…'
          : health.isError
            ? 'Unable to connect. Please try again shortly.'
            : 'Connected to EduOS'}
      </output>
    </section>
  );
}

export const Route = createFileRoute('/')({ component: HomePage });
