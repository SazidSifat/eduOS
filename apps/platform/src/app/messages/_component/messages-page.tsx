import { Card } from '@eduos/ui';
import { PageHeader } from '../../../components/page-header';
import { OwnerAccessRequired } from '../../../components/owner-access-required';
import { usePlatformAccess } from '../../../components/providers/platform-access-provider';

export function MessagesPage() {
  const { canManageOperators } = usePlatformAccess();
  if (!canManageOperators) return <OwnerAccessRequired />;
  return (
    <div className="space-y-7">
      <PageHeader
        title="School communications"
        description="Communication history is not available from the platform API."
      />
      <Card as="section" className="space-y-2 p-5">
        <h2 className="text-sm font-semibold">No messaging data</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Delivery channels, school recipients, consent and audit history need an approved product
          policy before communications can be sent or recorded here.
        </p>
      </Card>
    </div>
  );
}
