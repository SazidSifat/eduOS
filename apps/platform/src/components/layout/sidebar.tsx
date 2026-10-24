import { Link } from '@tanstack/react-router';
import {
  Building2,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  Users,
  X,
  CreditCard,
} from 'lucide-react';
import { usePlatformAccess } from '../providers/platform-access-provider';
import { Button } from '@eduos/ui';
import { useQuery } from '@tanstack/react-query';
import { identityQuery } from '../../app/_api/platform';

export function Sidebar({
  onNavigate,
  onClose,
}: {
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const { canManageOperators, canManageSubscriptions } = usePlatformAccess();
  const identity = useQuery(identityQuery).data;
  const name = identity?.name ?? 'Platform operator';
  return (
    <div className="flex h-full min-h-dvh flex-col px-4 py-6">
      <div className="flex items-center justify-between px-3 pb-8">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-2.5 rounded">
          <GraduationCap aria-hidden="true" className="size-7 text-primary" strokeWidth={1.5} />
          <span className="text-2xl font-semibold tracking-tight">EduOS</span>
        </Link>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close navigation">
            <X aria-hidden="true" className="size-5" />
          </Button>
        )}
      </div>
      <p className="px-3 pb-3 text-xs font-medium text-muted-foreground">Platform workspace</p>
      <nav aria-label="Platform navigation" className="grid gap-1">
        <Link
          to="/"
          activeOptions={{ exact: true }}
          activeProps={{ 'data-active': true }}
          onClick={onNavigate}
          className="nav-item"
        >
          <LayoutDashboard aria-hidden="true" className="size-4" strokeWidth={1.5} />
          Overview
        </Link>
        <Link
          to="/institutions"
          activeProps={{ 'data-active': true }}
          onClick={onNavigate}
          className="nav-item"
        >
          <Building2 aria-hidden="true" className="size-4" strokeWidth={1.5} />
          Institutions
        </Link>
        {canManageOperators && (
          <>
            {canManageSubscriptions && (
              <Link
                to="/subscriptions"
                activeProps={{ 'data-active': true }}
                onClick={onNavigate}
                className="nav-item"
              >
                <CreditCard aria-hidden="true" className="size-4" strokeWidth={1.5} />
                Subscriptions
              </Link>
            )}
            <Link
              to="/operators"
              activeProps={{ 'data-active': true }}
              onClick={onNavigate}
              className="nav-item"
            >
              <Users aria-hidden="true" className="size-4" strokeWidth={1.5} />
              Platform team
            </Link>
          </>
        )}
      </nav>
      <div className="mt-auto space-y-6 px-3 pt-12">
        <div className="border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
          <ShieldCheck aria-hidden="true" className="mb-2 size-4" strokeWidth={1.5} />
          Platform access is separate from each institution’s workspace.
        </div>
        <div className="flex items-center gap-3 border-t border-border pt-5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-xs font-semibold">
            {name
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part.charAt(0))
              .join('')
              .toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="text-xs text-muted-foreground">
              {canManageOperators ? 'Super Admin' : 'Platform Manager'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
