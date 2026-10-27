import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { admissionStateSchema } from '@eduos/contracts';
import { CandidateList } from './_component/candidate-list';
function Page() {
  return <CandidateList filters={Route.useSearch()} />;
}
export const Route = createFileRoute('/institutions/$institutionId/admissions/')({
  validateSearch: z.object({
    offeringId: z.uuid().optional(),
    assigneeId: z.uuid().optional(),
    state: admissionStateSchema.default('follow_up'),
    due: z.enum(['all', 'today', 'upcoming', 'overdue']).default('all'),
    search: z.string().max(100).default(''),
    offset: z.coerce.number().int().min(0).max(100000).default(0),
  }),
  component: Page,
});
