import { Card } from '@eduos/ui';
import { Check, Minus } from 'lucide-react';
import { permissionsForPlatformRole, type PlatformRole } from '@eduos/permissions';

export function AccessScope({ role }: { role: PlatformRole }) {
  const permissions = permissionsForPlatformRole(role);
  const canManage = permissions.includes('platform.operators.manage');
  return (
    <Card as="section" className="overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold">Role permissions</h2>
      </div>
      <dl className="divide-y divide-border px-5 text-sm">
        <div className="flex items-center justify-between gap-4 py-4">
          <dt>Institution profiles</dt>
          <dd>
            <Check aria-label="Allowed" className="size-4 text-primary" />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 py-4">
          <dt>Institution access and modules</dt>
          <dd>
            {permissions.includes('platform.institutions.manage') ? (
              <Check aria-label="Allowed" className="size-4 text-primary" />
            ) : (
              <Minus aria-label="Not included" className="size-4 text-muted-foreground" />
            )}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 py-4">
          <dt>Institution subscriptions</dt>
          <dd>
            {permissions.includes('platform.subscriptions.manage') ? (
              <Check aria-label="Allowed" className="size-4 text-primary" />
            ) : (
              <Minus aria-label="Not included" className="size-4 text-muted-foreground" />
            )}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 py-4">
          <dt>Platform team access</dt>
          <dd>
            {canManage ? (
              <Check aria-label="Allowed" className="size-4 text-primary" />
            ) : (
              <Minus aria-label="Not included" className="size-4 text-muted-foreground" />
            )}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 py-4">
          <dt>School records</dt>
          <dd>
            <Minus
              aria-label="Separate institution access required"
              className="size-4 text-muted-foreground"
            />
          </dd>
        </div>
      </dl>
      <p className="border-t border-border px-5 py-4 text-xs leading-5 text-muted-foreground">
        Each institution manages access to its own students, staff and school operations.
      </p>
    </Card>
  );
}
