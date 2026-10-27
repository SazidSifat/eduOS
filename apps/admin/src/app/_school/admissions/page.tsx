import { createFileRoute } from '@tanstack/react-router';
import { CandidateDirectory } from './_component/candidate-directory';

function Page() {
  return <CandidateDirectory state="follow_up" />;
}

export const Route = createFileRoute('/_school/admissions/')({
  component: Page,
});
