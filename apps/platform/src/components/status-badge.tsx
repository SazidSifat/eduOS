import { Badge } from '@eduos/ui';

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? 'secondary' : 'outline'} className="gap-1.5">
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${active ? 'bg-primary' : 'bg-muted-foreground'}`}
      />
      {active ? 'Active' : 'Inactive'}
    </Badge>
  );
}
