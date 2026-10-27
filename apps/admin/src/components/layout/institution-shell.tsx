import { createContext, useContext, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, LogOut } from 'lucide-react';
import { Button } from '@eduos/ui';
import type { accessSchema } from '@eduos/contracts';
import type { z } from 'zod';
import { identityQuery } from '../../app/login/_api/session';
import { authClient } from '../../app/login/_api/auth';
import {
  workspaceQuery,
  membershipsQuery,
  schoolAccessQuery,
} from '../../app/institutions/$institutionId/_api/queries';
import { queryClient } from '../../lib/query-client';
import { ThemeToggle } from './theme-toggle';
import { InstitutionNavigation } from './institution-navigation';
import { ErrorState, LoadingState } from '../feedback';

interface InstitutionContext {
  userId: string;
  institutionId: string;
  access: z.infer<typeof accessSchema>;
}
const InstitutionContext = createContext<InstitutionContext | null>(null);
export function useInstitution() {
  const value = useContext(InstitutionContext);
  if (!value) throw new Error('Institution context is unavailable');
  return value;
}
export function InstitutionShell({
  institutionId,
  children,
}: {
  institutionId: string;
  children: ReactNode;
}) {
  const identity = useQuery(identityQuery);
  if (identity.isPending) return <LoadingState />;
  if (identity.isError)
    return (
      <ErrorState
        retry={() => {
          void identity.refetch();
        }}
      />
    );
  return (
    <SchoolShell userId={identity.data.id} institutionId={institutionId}>
      {children}
    </SchoolShell>
  );
}
function SchoolShell({
  userId,
  institutionId,
  children,
}: {
  userId: string;
  institutionId: string;
  children: ReactNode;
}) {
  const memberships = useQuery(membershipsQuery(userId));
  const showSchoolSwitcher =
    (memberships.data?.filter((school) => school.role !== null).length ?? 0) > 1;
  const access = useQuery(schoolAccessQuery(userId, institutionId));
  const workspace = useQuery(workspaceQuery(userId, institutionId));
  const [logoutError, setLogoutError] = useState(false);
  const navigate = useNavigate();
  if (access.isError || workspace.isError)
    return (
      <div className="p-8">
        <ErrorState
          retry={() => {
            void access.refetch();
            void workspace.refetch();
          }}
        />
      </div>
    );
  if (!access.data || !workspace.data) return <LoadingState />;
  async function logout() {
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setLogoutError(true);
        return;
      }
      await queryClient.cancelQueries();
      queryClient.clear();
      await navigate({ to: '/login', replace: true });
    } catch {
      setLogoutError(true);
    }
  }
  return (
    <InstitutionContext value={{ userId, institutionId, access: access.data }}>
      <div className="admissions-app min-h-dvh lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
        <aside className="border-b border-border bg-muted/30 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-r lg:border-b-0">
          <div className="border-b border-border px-5 py-4 lg:py-6">
            <div className="flex items-center justify-between gap-3">
              <Link to="/app" className="font-semibold tracking-tight">
                eduOS
              </Link>
              <div className="flex items-center gap-2 lg:hidden">
                <SessionControls
                  showSchoolSwitcher={showSchoolSwitcher}
                  onLogout={() => {
                    void logout();
                  }}
                />
              </div>
            </div>
            <p className="mt-3 break-words font-medium lg:mt-5">{workspace.data.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">Institution {workspace.data.code}</p>
          </div>
          <InstitutionNavigation institutionId={institutionId} access={access.data} />
          <div className="mt-auto hidden items-center justify-between border-t border-border p-4 lg:flex">
            <SessionControls
              showSchoolSwitcher={showSchoolSwitcher}
              onLogout={() => {
                void logout();
              }}
            />
          </div>
          {logoutError && (
            <p role="alert" className="p-3 text-destructive">
              Could not sign out. Try again.
            </p>
          )}
        </aside>
        <main id="main-content" tabIndex={-1} className="min-w-0 px-5 py-8 sm:px-8 lg:px-10">
          {children}
        </main>
      </div>
    </InstitutionContext>
  );
}
function SessionControls({
  onLogout,
  showSchoolSwitcher,
}: {
  onLogout: () => void;
  showSchoolSwitcher: boolean;
}) {
  return (
    <>
      {showSchoolSwitcher && (
        <Link to="/app" aria-label="Switch school" className="rounded-md p-2 hover:bg-muted">
          <ArrowLeft size={16} />
        </Link>
      )}
      <ThemeToggle />
      <Button variant="ghost" size="icon" aria-label="Sign out" onClick={onLogout}>
        <LogOut size={16} />
      </Button>
    </>
  );
}
