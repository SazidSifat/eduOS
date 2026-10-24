import { Button } from '@eduos/ui';
export function LoadingState() {
  return <output className="py-8 text-muted-foreground">Loading workspace…</output>;
}
export function ErrorState({ retry }: { retry: () => void }) {
  return (
    <div role="alert" className="space-y-4 py-8">
      <p>Something went wrong. Please try again.</p>
      <Button onClick={retry}>Try again</Button>
    </div>
  );
}
