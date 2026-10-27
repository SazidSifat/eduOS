import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { CandidateForm } from '../_component/candidate-form';

function Page() {
  const search = Route.useSearch();
  return (
    <CandidateForm
      key={`${search.mode}-${search.candidate}`}
      mode={search.mode ?? 'follow_up'}
      candidateId={search.candidate ?? ''}
    />
  );
}

export const Route = createFileRoute('/_school/admissions/new/')({
  validateSearch: (search: Record<string, unknown>) =>
    z
      .object({
        mode: z.enum(['follow_up', 'willing', 'admitted']).optional().catch(undefined),
        candidate: z.string().max(100).optional().catch(undefined),
      })
      .parse(search),
  component: Page,
});
