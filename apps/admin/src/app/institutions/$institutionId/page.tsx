import { createFileRoute } from '@tanstack/react-router';
import { AppShell } from '../../../components/layout/app-shell';
import { SignOutButton } from '../../../components/layout/sign-out-button';
import { requireSchoolApplication } from './_api/entry';
function Page() {
  const { workspace } = Route.useRouteContext();
  return (
    <AppShell>
      <section className="max-w-2xl space-y-5">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold">{workspace.name}</h1>
          <SignOutButton />
        </div>
        <p className="text-xs text-muted-foreground">Institution {workspace.code}</p>
        <h2 className="font-semibold">No application modules available</h2>
        <p className="text-muted-foreground">
          Contact your school administrator to check your role and enabled modules. Your account
          does not currently have an available school module to open.
        </p>
      </section>
    </AppShell>
  );
}
export const Route = createFileRoute('/institutions/$institutionId/')({
  beforeLoad: requireSchoolApplication,
  component: Page,
});
