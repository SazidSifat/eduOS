import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { PlatformRole } from '@eduos/permissions';
import { platformAccessQuery } from '../../app/_api/platform';

type PlatformAccessContextValue = {
  role: PlatformRole;
  canManageOperators: boolean;
  canCreateInstitutions: boolean;
  canManageInstitutions: boolean;
  canManageSubscriptions: boolean;
};
const PlatformAccessContext = createContext<PlatformAccessContextValue | null>(null);

export function PlatformAccessProvider({ children }: { children: ReactNode }) {
  const access = useQuery({ ...platformAccessQuery, enabled: false, staleTime: 30_000 });
  const role = access.data?.role ?? 'platform_manager';
  const value = useMemo(
    () => ({
      role,
      canManageOperators: access.data?.permissions.includes('platform.operators.manage') ?? false,
      canCreateInstitutions:
        access.data?.permissions.includes('platform.institutions.create') ?? false,
      canManageInstitutions:
        access.data?.permissions.includes('platform.institutions.manage') ?? false,
      canManageSubscriptions:
        access.data?.permissions.includes('platform.subscriptions.manage') ?? false,
    }),
    [access.data?.permissions, role],
  );
  return <PlatformAccessContext.Provider value={value}>{children}</PlatformAccessContext.Provider>;
}

export function usePlatformAccess() {
  const context = useContext(PlatformAccessContext);
  if (!context) throw new Error('PlatformAccessProvider is required.');
  return context;
}
