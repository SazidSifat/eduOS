import { createFileRoute, notFound } from '@tanstack/react-router';
import { institutionIdSchema } from '@eduos/contracts';
import { InstitutionProfile } from '../_component/institution-profile';

function Page() {
  const { institutionId } = Route.useParams();
  return <InstitutionProfile institutionId={institutionId} />;
}
export const Route = createFileRoute('/institutions/$institutionId/')({
  beforeLoad: ({ params }) => {
    if (!institutionIdSchema.safeParse(params.institutionId).success) throw notFound();
  },
  component: Page,
});
