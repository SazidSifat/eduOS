import { createContext, useContext, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { accessSchema, admissionSetupSchema } from '@eduos/contracts';
import type { z } from 'zod';
import {
  InstitutionShell,
  useInstitution,
} from '../../../../../components/layout/institution-shell';
import { ErrorState, LoadingState } from '../../../../../components/feedback';
import { admissionSetupQuery } from '../_api/queries';

interface AdmissionContext {
  userId: string;
  institutionId: string;
  access: z.infer<typeof accessSchema>;
  setup: z.infer<typeof admissionSetupSchema>;
}
const AdmissionContext = createContext<AdmissionContext | null>(null);
export function useAdmissions() {
  const value = useContext(AdmissionContext);
  if (!value) throw new Error('Admission context is unavailable');
  return value;
}
export function AdmissionsShell({
  institutionId,
  children,
}: {
  institutionId: string;
  children: ReactNode;
}) {
  return (
    <InstitutionShell institutionId={institutionId}>
      <AdmissionsProvider>{children}</AdmissionsProvider>
    </InstitutionShell>
  );
}
export function AdmissionsProvider({ children }: { children: ReactNode }) {
  const { userId, institutionId, access } = useInstitution();
  const enabled =
    access.permissions.includes('admissions.read') && access.modules.includes('admissions');
  const setup = useQuery({ ...admissionSetupQuery(userId, institutionId), enabled });
  if (!enabled)
    return (
      <p role="alert">Admissions access unavailable. Contact your institution administrator.</p>
    );
  if (setup.isError)
    return (
      <ErrorState
        retry={() => {
          void setup.refetch();
        }}
      />
    );
  if (!setup.data) return <LoadingState />;
  return (
    <AdmissionContext value={{ userId, institutionId, access, setup: setup.data }}>
      {children}
    </AdmissionContext>
  );
}
