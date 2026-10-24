import { createFileRoute } from '@tanstack/react-router';
import { requireIdentity } from '../login/_api/session';
import { WorkspacePage } from './_component/workspace-page';

function Page() {
  return <WorkspacePage />;
}

export const Route = createFileRoute('/workspace/')({
  beforeLoad: requireIdentity,
  component: Page,
});
