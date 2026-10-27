import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { CandidateDetail } from '../_component/candidate-detail';

function Page() {
  const { candidateId } = Route.useParams();
  return <CandidateDetail candidateId={candidateId} />;
}

export const Route = createFileRoute('/_school/admissions/$candidateId/')({
  params: {
    parse: (params) => z.object({ candidateId: z.string().min(1).max(100) }).parse(params),
  },
  component: Page,
});
