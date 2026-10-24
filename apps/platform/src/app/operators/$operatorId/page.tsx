import { createFileRoute, notFound } from '@tanstack/react-router';
import { institutionIdSchema } from '@eduos/contracts';
import { OperatorProfile } from '../_component/operator-profile';

function Page() {
  const { operatorId } = Route.useParams();
  return <OperatorProfile operatorId={operatorId} />;
}
export const Route = createFileRoute('/operators/$operatorId/')({
  beforeLoad: ({ params }) => {
    if (!institutionIdSchema.safeParse(params.operatorId).success) throw notFound();
  },
  component: Page,
});
