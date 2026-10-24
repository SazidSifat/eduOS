import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { ArrowLeft, Building2, ShieldCheck } from 'lucide-react';
import { Card, Button } from '@eduos/ui';
import { PageHeader } from '../../../components/page-header';
import { CopyId } from '../../../components/copy-id';
import { usePreview } from '../../../components/providers/preview-provider';
import { SubscriptionBadge } from '../../../components/school-badges';
import { planNames, money, dateLabel, type SchoolPreview } from '../../../lib/school-preview-model';
import { MessageForm } from '../../messages/_component/message-form';
import { SchoolControls } from './school-controls';
import { SchoolActivity } from './school-activity';

export function InstitutionProfile({ institution }: { institution: SchoolPreview }) {
  const { role } = usePreview();
  const [messageKind, setMessageKind] = useState<'notice' | 'warning' | null>(null);
  const [messageSaved, setMessageSaved] = useState(false);
  return (
    <div className="space-y-7">
      <Link to="/institutions" className="text-link inline-flex items-center gap-2 text-sm">
        <ArrowLeft aria-hidden="true" className="size-4" />
        All institutions
      </Link>
      <PageHeader
        title={institution.name}
        description="Institution profile and platform reference details."
        action={
          role === 'platform_owner' && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setMessageKind('notice');
                  setMessageSaved(false);
                }}
              >
                Notify school
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setMessageKind('warning');
                  setMessageSaved(false);
                }}
              >
                Send warning
              </Button>
              <Button asChild>
                <Link to="/subscriptions/$institutionId" params={{ institutionId: institution.id }}>
                  Manage subscription
                </Link>
              </Button>
            </div>
          )
        }
      />
      {messageKind && role === 'platform_owner' && (
        <MessageForm
          key={messageKind}
          schoolId={institution.id}
          kind={messageKind}
          onDone={() => {
            setMessageKind(null);
            setMessageSaved(true);
          }}
          onCancel={() => setMessageKind(null)}
        />
      )}
      {messageSaved && (
        <output className="block text-sm text-primary">
          Preview message saved. Nothing was delivered.
        </output>
      )}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-6">
          <Card as="section" className="overflow-hidden">
            <h2 className="flex items-center gap-2 border-b border-border px-5 py-4 text-sm font-semibold">
              <Building2 aria-hidden="true" className="size-4 text-muted-foreground" />
              Institution details
            </h2>
            <dl className="divide-y divide-border px-5 text-sm">
              <div className="grid gap-2 py-5 sm:grid-cols-[150px_1fr]">
                <dt className="text-muted-foreground">Institution name</dt>
                <dd className="font-medium">{institution.name}</dd>
              </div>
              <div className="grid gap-2 py-5 sm:grid-cols-[150px_1fr]">
                <dt className="text-muted-foreground">Slug</dt>
                <dd className="break-all font-mono text-xs">{institution.slug}</dd>
              </div>
              <div className="grid gap-2 py-5 sm:grid-cols-[150px_1fr]">
                <dt className="text-muted-foreground">Time zone</dt>
                <dd>{institution.timezone}</dd>
              </div>
              <div className="grid gap-2 py-5 sm:grid-cols-[150px_1fr]">
                <dt className="text-muted-foreground">Institution ID</dt>
                <dd>
                  <CopyId value={institution.id} />
                </dd>
              </div>
              <div className="grid gap-2 py-5 sm:grid-cols-[150px_1fr]">
                <dt className="text-muted-foreground">School contact</dt>
                <dd>
                  <p>{institution.contactName}</p>
                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    {institution.contactEmail}
                  </p>
                </dd>
              </div>
            </dl>
          </Card>
          {role === 'platform_owner' && <SchoolActivity schoolId={institution.id} />}
        </div>
        <div className="space-y-5">
          <SchoolControls school={institution} />
          <Card as="section" className="space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">Subscription</h2>
              <SubscriptionBadge status={institution.subscription.status} />
            </div>
            <p className="text-sm font-medium">{planNames[institution.subscription.plan]}</p>
            <p className="text-xs text-muted-foreground">
              {money(institution.subscription.amount)} /{' '}
              {institution.subscription.billingCycle === 'monthly' ? 'month' : 'year'}
            </p>
            <p className="text-xs text-muted-foreground">
              Renewal / review: {dateLabel(institution.subscription.renewalDate)}
            </p>
            {role === 'platform_owner' && (
              <Link
                to="/subscriptions/$institutionId"
                params={{ institutionId: institution.id }}
                className="text-link block text-sm"
              >
                Manage subscription
              </Link>
            )}
          </Card>
          <Card as="section" className="space-y-4 p-5">
            <ShieldCheck aria-hidden="true" className="size-5 text-primary" strokeWidth={1.5} />
            <h2 className="text-sm font-semibold">School workspace access</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Student records, staff access and school operations are managed within the
              institution’s workspace.
            </p>
            <p className="border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
              Platform roles can review this profile. School membership is assigned separately.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
