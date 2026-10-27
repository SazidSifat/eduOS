import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { ReceiptPage } from '../../_component/receipt';

function Page() {
  const { receiptId } = Route.useParams();
  return <ReceiptPage id={receiptId} />;
}

export const Route = createFileRoute('/_school/fees/receipts/$receiptId/')({
  params: { parse: (params) => z.object({ receiptId: z.string().min(1).max(100) }).parse(params) },
  component: Page,
});
