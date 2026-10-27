import { createFileRoute } from '@tanstack/react-router';
import { CandidateDirectory } from '../_component/candidate-directory';

function Page() {
  return <CandidateDirectory state="closed" />;
}

export const Route = createFileRoute('/_school/admissions/closed/')({
  component: Page,
});
