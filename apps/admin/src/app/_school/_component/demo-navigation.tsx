import { useLanguage } from '@eduos/ui';
import { Link, useLocation } from '@tanstack/react-router';
import {
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  GraduationCap,
  Receipt,
  Settings2,
  Wallet,
} from 'lucide-react';
import { useDemo } from './demo-provider';
import { canOpenSchoolPath } from './school-access';
import type { DemoPath } from './demo-ui';

const groups = [
  {
    label: 'Admissions',
    root: '/admissions',
    icon: GraduationCap,
    children: [
      { label: 'Follow-ups', to: '/admissions' },
      { label: 'Willing students', to: '/admissions/willing' },
      { label: 'Admitted students', to: '/admissions/admitted' },
      { label: 'Closed records', to: '/admissions/closed' },
    ],
  },
  {
    label: 'Attendance',
    root: '/attendance',
    icon: ClipboardCheck,
    children: [
      { label: 'Daily register', to: '/attendance' },
      { label: 'Monthly report', to: '/attendance/monthly' },
      { label: 'Corrections', to: '/attendance/corrections' },
      { label: 'Mobile classes', to: '/attendance/classes' },
    ],
  },
  {
    label: 'Fee collection',
    root: '/fees',
    icon: Wallet,
    children: [
      { label: 'Collect payment', to: '/fees' },
      { label: 'Outstanding dues', to: '/fees/dues' },
      { label: 'Collection report', to: '/fees/report' },
    ],
  },
  {
    label: 'Expenses',
    root: '/expenses',
    icon: Receipt,
    children: [
      { label: 'Expense register', to: '/expenses' },
      { label: 'New expense', to: '/expenses/new' },
      { label: 'Expense report', to: '/expenses/report' },
    ],
  },
  {
    label: 'Routine',
    root: '/routine',
    icon: CalendarDays,
    children: [
      { label: 'Class routine', to: '/routine' },
      { label: 'Create routine', to: '/routine/new' },
      { label: 'Teacher routine', to: '/routine/teacher' },
    ],
  },
  {
    label: 'Settings',
    root: '/settings',
    icon: Settings2,
    children: [
      { label: 'Overview', to: '/settings' },
      { label: 'School profile', to: '/settings/school' },
      { label: 'Academics', to: '/settings/academics' },
      { label: 'People & access', to: '/settings/people' },
      { label: 'Admissions', to: '/settings/admissions' },
      { label: 'Attendance', to: '/settings/attendance' },
      { label: 'Fees & schedules', to: '/settings/fees' },
      { label: 'Expense policy', to: '/settings/expenses' },
    ],
  },
] satisfies {
  label: string;
  root: DemoPath;
  icon: typeof GraduationCap;
  children: { label: string; to: DemoPath }[];
}[];

export function DemoNavigation({ close }: { close: () => void }) {
  const { t } = useLanguage();

  const { snapshot } = useDemo();
  const location = useLocation();
  const path = location.pathname.replace(/\/$/, '') || '/';

  return (
    <nav aria-label={t('School navigation')} className="demo-navigation">
      {groups
        .filter((group) => group.children.some((child) => canOpenSchoolPath(snapshot, child.to)))
        .map((group) => {
          const isGroupActive = path === group.root || path.startsWith(`${group.root}/`);
          const Icon = group.icon;
          return (
            <details key={group.label} open={isGroupActive} className="demo-nav-group">
              <summary className={`demo-nav-summary ${isGroupActive ? 'demo-nav-active' : ''}`}>
                <Icon size={16} aria-hidden="true" />
                <span>{t(group.label)}</span>
                <ChevronDown size={14} aria-hidden="true" className="demo-nav-chevron" />
              </summary>
              <div className="demo-nav-children">
                {group.children
                  .filter((child) => canOpenSchoolPath(snapshot, child.to))
                  .map((child) => {
                    const isChildActive = path === child.to;
                    return (
                      <Link
                        key={child.to}
                        to={child.to}
                        onClick={close}
                        activeOptions={{ exact: true }}
                        className={`demo-nav-sublink ${isChildActive ? 'demo-nav-sublink-active' : ''}`}
                        aria-current={isChildActive ? 'page' : undefined}
                      >
                        {t(child.label)}
                      </Link>
                    );
                  })}
              </div>
            </details>
          );
        })}
    </nav>
  );
}
