import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '../../../components/page-header';
import { OwnerAccessRequired } from '../../../components/owner-access-required';
import { usePreview } from '../../../components/providers/preview-provider';
import { useSchoolPreview } from '../../../components/providers/school-preview-provider';
import { institutionIdSchema } from '../../../lib/preview-data';
import { SubscriptionForm } from '../_component/subscription-form';

function Page() {
  const { institutionId } = Route.useParams();
  const { role } = usePreview();
  const { schools } = useSchoolPreview();
  const school = schools.find((entry) => entry.id === institutionId);
  if (!school) throw notFound();
  if (role !== 'platform_owner') return <OwnerAccessRequired />;
  return (
    <div className="space-y-7">
      <Link to="/subscriptions" className="text-link inline-flex items-center gap-2 text-sm">
        <ArrowLeft aria-hidden="true" className="size-4" />
        All subscriptions
      </Link>
      <PageHeader title="Manage subscription" description={school.name} />
      <div className="max-w-4xl">
        <SubscriptionForm school={school} />
      </div>
    </div>
  );
}
export const Route = createFileRoute('/subscriptions/$institutionId/')({
  beforeLoad: ({ params }) => {
    if (!institutionIdSchema.safeParse(params.institutionId).success) throw notFound();
  },
  component: Page,
});
