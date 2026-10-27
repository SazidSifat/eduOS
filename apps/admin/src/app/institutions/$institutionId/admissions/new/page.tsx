import { createFileRoute } from '@tanstack/react-router';
import { CandidateForm } from '../_component/candidate-form';
function Page() {
  return <CandidateForm />;
}
export const Route = createFileRoute('/institutions/$institutionId/admissions/new/')({
  component: Page,
});
