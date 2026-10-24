import { createFileRoute, notFound } from '@tanstack/react-router';
import { operators, institutionIdSchema } from '../../../lib/preview-data';
import { OperatorProfile } from '../_component/operator-profile';

function Page() {
  const { operatorId } = Route.useParams();
  const operator = operators.find((entry) => entry.userId === operatorId);
  if (!operator) throw notFound();
  return <OperatorProfile operator={operator} />;
}
export const Route = createFileRoute('/operators/$operatorId/')({
  beforeLoad: ({ params }) => {
    if (
      !institutionIdSchema.safeParse(params.operatorId).success ||
      !operators.some((entry) => entry.userId === params.operatorId)
    )
      throw notFound();
  },
  component: Page,
});
