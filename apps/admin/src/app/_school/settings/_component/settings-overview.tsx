import { Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import { Notice, PageHeading, type DemoPath } from '../../_component/demo-ui';

const sections: { title: string; description: string; to: DemoPath }[] = [
  {
    title: 'School profile',
    description: 'School identity, address, contact details and regional preferences.',
    to: '/settings/school',
  },
  {
    title: 'Academics',
    description: 'Sessions, Classes 1–10, sections and class teachers.',
    to: '/settings/academics',
  },
  {
    title: 'People & access',
    description: 'Institution memberships and the five school roles.',
    to: '/settings/people',
  },
  {
    title: 'Admissions',
    description: 'Intake reminders, optional willing fees and credit policy.',
    to: '/settings/admissions',
  },
  {
    title: 'Attendance',
    description: 'Daily register, submission cutoff and correction rules.',
    to: '/settings/attendance',
  },
  {
    title: 'Fees & schedules',
    description: 'Fee definitions and future monthly billing schedules.',
    to: '/settings/fees',
  },
  {
    title: 'Expense policy',
    description: 'Expense categories, approval threshold and supporting evidence.',
    to: '/settings/expenses',
  },
  {
    title: 'Routine settings',
    description: 'Teaching days, period times, breaks and academic assignments.',
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
      <Notice title="School configuration">
        All changes use synthetic frontend data. Membership settings here do not grant live
        institution or platform access.
      </Notice>
      <div className="demo-setting-grid">
        {sections.map((section) => (
          <Link to={section.to} key={section.to}>
            <div>
              <h2>{section.title}</h2>
              <p>{section.description}</p>
            </div>
            <ArrowRight size={18} className="shrink-0 text-primary" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </>
  );
}
