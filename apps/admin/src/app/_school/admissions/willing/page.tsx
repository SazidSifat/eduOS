import { createFileRoute } from '@tanstack/react-router';
import { CandidateDirectory } from '../_component/candidate-directory';

function Page() {
  return <CandidateDirectory state="willing" />;
}

export const Route = createFileRoute('/_school/admissions/willing/')({
  component: Page,
});
