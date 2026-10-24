import { createFileRoute, notFound } from '@tanstack/react-router';
import { institutionIdSchema } from '../../../lib/preview-data';
import { useSchoolPreview } from '../../../components/providers/school-preview-provider';
import { InstitutionProfile } from '../_component/institution-profile';

function Page() {
  const { institutionId } = Route.useParams();
  const { schools } = useSchoolPreview();
  const institution = schools.find((entry) => entry.id === institutionId);
  if (!institution) throw notFound();
  return <InstitutionProfile institution={institution} />;
}
export const Route = createFileRoute('/institutions/$institutionId/')({
  beforeLoad: ({ params }) => {
    if (!institutionIdSchema.safeParse(params.institutionId).success) throw notFound();
  },
  component: Page,
});
