import { Link } from '@tanstack/react-router';
import { Button } from '@eduos/ui';
import { Notice, PageHeading, Status, type DemoPath } from '../../_component/demo-ui';

interface SettingSection {
  title: string;
  description: string;
  tag: string;
  to: DemoPath;
}

const sections: SettingSection[] = [
  {
    title: 'School profile',
    description: 'Name, address, school type, timezone and contact details.',
    tag: 'Institution',
    to: '/settings/school',
  },
  {
    title: 'Academics',
    description: 'Academic sessions, Classes 1–10, sections and subjects.',
    tag: 'Academic setup',
    to: '/settings/academics',
  },
  {
    title: 'People & access',
    description: 'Active memberships, school roles and access history.',
    tag: 'Access',
    to: '/settings/people',
  },
  {
    title: 'Admissions',
    description: 'Class offerings, reminders and default admission fees.',
    tag: 'Module settings',
    to: '/settings/admissions',
  },
  {
    title: 'Attendance',
    description: 'Daily register, calendar and correction policy.',
    tag: 'Module settings',
    to: '/settings/attendance',
  },
  {
    title: 'Fees & collections',
    description: 'Fee items, monthly billing dates and collection settings.',
    tag: 'Module settings',
    to: '/settings/fees',
  },
  {
    title: 'Expense policy',
    description: 'Expense categories, approval limits and payment controls.',
    tag: 'Finance',
    to: '/settings/expenses',
  },
  {
    title: 'Routine settings',
    description: 'Teaching days, period durations, breaks and assignments.',
    tag: 'Academic setup',
    to: '/routine/new',
  },
];

export function SettingsOverview() {
  return (
    <>
      <PageHeading
        title="Settings"
        description="Manage school details, academic structure, access and module policies."
      />
      <Notice title="School configuration" tone="info">
        School Admins and Principals manage these settings. Platform subscriptions stay separate.
      </Notice>
      <div className="demo-setting-grid">
        {sections.map((section) => (
          <div key={section.to} className="flex flex-col justify-between p-6">
            <div>
              <h2 className="text-sm font-semibold">{section.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <Status tone="neutral">{section.tag}</Status>
              <Button asChild size="sm" variant="outline" className="min-w-[100px]">
                <Link to={section.to}>Manage</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Settings changes should show who changed them and when. Sensitive changes need an explicit
        permission check.
      </p>
    </>
  );
}
