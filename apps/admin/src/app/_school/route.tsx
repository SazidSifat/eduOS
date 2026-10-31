import { createFileRoute, retainSearchParams } from '@tanstack/react-router';
import { z } from 'zod';
import { DemoLayout } from './_component/demo-shell';
import { requireSchoolEntry } from './_api/entry';
export const Route = createFileRoute('/_school')({
  validateSearch: z.object({ institutionId: z.uuid().optional() }),
  search: { middlewares: [retainSearchParams(['institutionId'])] },
  beforeLoad: ({ search }) => requireSchoolEntry(search.institutionId),
  component: DemoLayout,
});
