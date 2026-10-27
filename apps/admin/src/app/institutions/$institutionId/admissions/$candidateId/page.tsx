import { createFileRoute } from '@tanstack/react-router';
import { CandidateDetails } from '../_component/candidate-details';
function Page() {
  return <CandidateDetails candidateId={Route.useParams().candidateId} />;
}
export const Route = createFileRoute('/institutions/$institutionId/admissions/$candidateId/')({
  component: Page,
});
