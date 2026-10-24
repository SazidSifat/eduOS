import {
  institutionModuleLabels as moduleNames,
  institutionTypeLabels,
  institutionStatusLabels,
} from '../../../lib/institution-display';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Building2 } from 'lucide-react';
import { Button, Card } from '@eduos/ui';
import { PageHeader } from '../../../components/page-header';
import { CopyId } from '../../../components/copy-id';
import { ApiError } from '../../../lib/api-client';
import { institutionQuery } from '../../_api/platform';
import { InstitutionManagement } from './institution-management';
import { InstitutionSubscriptionForm } from './institution-subscription-form';
import { usePlatformAccess } from '../../../components/providers/platform-access-provider';

export function InstitutionProfile({ institutionId }: { institutionId: string }) {
  const { canManageSubscriptions } = usePlatformAccess();
  const institution = useQuery(institutionQuery(institutionId));
  const status = institution.error instanceof ApiError ? institution.error.status : 0;
  return (
    <div className="space-y-7">
      <Link to="/institutions" className="text-link inline-flex items-center gap-2 text-sm">
        <ArrowLeft aria-hidden="true" className="size-4" />
        All institutions
      </Link>
      {institution.isPending ? (
        <output className="block text-sm text-muted-foreground">Loading institution record…</output>
      ) : institution.isError ? (
        <Card as="section" className="grid justify-items-start gap-4 p-6">
          <PageHeader
            title={status === 404 ? 'Institution not found' : 'Unable to load institution'}
            description={
              status === 404
                ? 'This institution is not available in the platform directory.'
                : 'The institution record could not be retrieved from the platform API.'
            }
          />
          {status !== 404 && (
            <Button variant="outline" onClick={() => void institution.refetch()}>
              Try again
            </Button>
          )}
        </Card>
      ) : (
        <>
          <PageHeader
            title={institution.data.name}
            description="Manage institution details, access, school modules and subscription."
          />
          <div className="grid items-start gap-6 xl:grid-cols-2">
            <Card as="section" className="overflow-hidden">
              <h2 className="flex items-center gap-2 border-b border-border px-5 py-4 text-sm font-semibold">
                <Building2 aria-hidden="true" className="size-4 text-muted-foreground" />
                Institution details
              </h2>
              <dl className="divide-y divide-border px-5 text-sm">
                <div className="grid gap-2 py-5 sm:grid-cols-[150px_1fr]">
                  <dt className="text-muted-foreground">Institution name</dt>
                  <dd className="font-medium">{institution.data.name}</dd>
                </div>
                <div className="grid gap-2 py-5 sm:grid-cols-[150px_1fr]">
                  <dt className="text-muted-foreground">Institution code</dt>
                  <dd>
                    <CopyId value={institution.data.code} label="Copy institution code" />
                  </dd>
                </div>
                <div className="grid gap-2 py-5 sm:grid-cols-[150px_1fr]">
                  <dt className="text-muted-foreground">Institution type</dt>
                  <dd>
                    {institution.data.type
                      ? institutionTypeLabels[institution.data.type]
                      : 'Not set'}
                  </dd>
                </div>
                <div className="grid gap-2 py-5 sm:grid-cols-[150px_1fr]">
                  <dt className="text-muted-foreground">Access state</dt>
                  <dd>{institutionStatusLabels[institution.data.status]}</dd>
                </div>
                {institution.data.statusReason && (
                  <div className="grid gap-2 py-5 sm:grid-cols-[150px_1fr]">
                    <dt className="text-muted-foreground">State reason</dt>
                    <dd>{institution.data.statusReason}</dd>
                  </div>
                )}
                <div className="grid gap-2 py-5 sm:grid-cols-[150px_1fr]">
                  <dt className="text-muted-foreground">Enabled modules</dt>
                  <dd>
                    {institution.data.enabledModules.length
                      ? institution.data.enabledModules
                          .map((module) => moduleNames[module])
                          .join(', ')
                      : 'None enabled'}
                  </dd>
                </div>
                <div className="grid gap-2 py-5 sm:grid-cols-[150px_1fr]">
                  <dt className="text-muted-foreground">Slug</dt>
                  <dd className="break-all font-mono text-xs">{institution.data.slug}</dd>
                </div>
                <div className="grid gap-2 py-5 sm:grid-cols-[150px_1fr]">
                  <dt className="text-muted-foreground">Time zone</dt>
                  <dd>{institution.data.timezone}</dd>
                </div>
                <div className="grid gap-2 py-5 sm:grid-cols-[150px_1fr]">
                  <dt className="text-muted-foreground">Internal ID</dt>
                  <dd>
                    <CopyId value={institution.data.id} />
                  </dd>
                </div>
              </dl>
            </Card>
            <InstitutionManagement institution={institution.data} />
          </div>
          {canManageSubscriptions && <InstitutionSubscriptionForm institutionId={institutionId} />}
        </>
      )}
    </div>
  );
}
