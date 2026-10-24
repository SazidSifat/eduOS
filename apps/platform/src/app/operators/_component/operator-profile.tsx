import { Card } from '@eduos/ui';
import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '../../../components/page-header';
import { StatusBadge } from '../../../components/status-badge';
import { AccessScope } from '../../../components/access-scope';
import { CopyId } from '../../../components/copy-id';
import { OwnerAccessRequired } from '../../../components/owner-access-required';
import { usePreview } from '../../../components/providers/preview-provider';
import type { PreviewOperator } from '../../../lib/preview-data';
import { roleName } from '../../../lib/display';

export function OperatorProfile({ operator }: { operator: PreviewOperator }) {
  const { canManageOperators } = usePreview();
  if (!canManageOperators) return <OwnerAccessRequired />;
  return (
    <div className="space-y-7">
      <Link to="/operators" className="text-link inline-flex items-center gap-2 text-sm">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Platform team
      </Link>
      <PageHeader
        title={operator.name}
        description="Account details and platform role permissions."
        action={<StatusBadge active={operator.active} />}
      />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <Card as="section" className="overflow-hidden">
          <h2 className="border-b border-border px-5 py-4 text-sm font-semibold">
            Operator profile
          </h2>
          <dl className="divide-y divide-border px-5 text-sm">
            <div className="grid gap-2 py-5 sm:grid-cols-[150px_1fr]">
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium">{operator.name}</dd>
            </div>
            <div className="grid gap-2 py-5 sm:grid-cols-[150px_1fr]">
              <dt className="text-muted-foreground">Email address</dt>
              <dd className="break-all">{operator.email}</dd>
            </div>
            <div className="grid gap-2 py-5 sm:grid-cols-[150px_1fr]">
              <dt className="text-muted-foreground">Platform role</dt>
              <dd>{roleName(operator.role)}</dd>
            </div>
            <div className="grid gap-2 py-5 sm:grid-cols-[150px_1fr]">
              <dt className="text-muted-foreground">Account ID</dt>
              <dd>
                <CopyId value={operator.userId} />
              </dd>
            </div>
          </dl>
          {!operator.active && (
            <p className="border-t border-border bg-muted px-5 py-4 text-sm text-muted-foreground">
              This operator is inactive and has no current platform access.
            </p>
          )}
        </Card>
        <AccessScope role={operator.role} />
      </div>
    </div>
  );
}
