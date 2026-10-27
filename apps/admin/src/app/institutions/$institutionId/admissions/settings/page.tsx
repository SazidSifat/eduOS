import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/institutions/$institutionId/admissions/settings/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/institutions/$institutionId/settings/admissions',
      params,
      replace: true,
    });
  },
});
