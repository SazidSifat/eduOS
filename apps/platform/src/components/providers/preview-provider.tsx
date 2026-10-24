import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { PlatformRole } from '@eduos/permissions';
import { platformAccessQuery } from '../../app/_api/platform';

type PreviewContextValue = {
  role: PlatformRole;
  canManageOperators: boolean;
};
const PreviewContext = createContext<PreviewContextValue | null>(null);

export function PreviewProvider({ children }: { children: ReactNode }) {
  const access = useQuery({ ...platformAccessQuery, enabled: false, staleTime: 30_000 });
  const role = access.data?.role ?? 'platform_manager';
  const value = useMemo(
    () => ({
      role,
      canManageOperators: access.data?.permissions.includes('platform.operators.manage') ?? false,
    }),
    [access.data?.permissions, role],
  );
  return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>;
}

export function usePreview() {
  const context = useContext(PreviewContext);
  if (!context) throw new Error('PreviewProvider is required.');
  return context;
}
