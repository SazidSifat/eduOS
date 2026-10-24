import type { SchoolStatus, Subscription } from '../lib/school-preview-model';
import { subscriptionStatusName } from '../lib/school-preview-model';
import { Badge } from '@eduos/ui';

export function SchoolStateBadge({ status }: { status: SchoolStatus }) {
  return (
    <Badge
      variant={status === 'frozen' ? 'warning' : status === 'active' ? 'secondary' : 'outline'}
    >
      {{ active: 'Active', frozen: 'Frozen', inactive: 'Inactive' }[status]}
    </Badge>
  );
}
export function SubscriptionBadge({ status }: { status: Subscription['status'] }) {
  return (
    <Badge
      variant={status === 'overdue' ? 'warning' : status === 'active' ? 'secondary' : 'outline'}
    >
      {subscriptionStatusName(status)}
    </Badge>
  );
}
