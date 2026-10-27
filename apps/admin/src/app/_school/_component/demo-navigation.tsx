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
import type { DemoPath } from './demo-ui';

const groups = [
  {
    label: 'Admissions',
    root: '/admissions',
    icon: GraduationCap,
    children: [
      ['Follow-ups', '/admissions'],
      ['Willing students', '/admissions/willing'],
      ['Admitted students', '/admissions/admitted'],
      ['Closed records', '/admissions/closed'],
    ],
  },
  {
    label: 'Attendance',
    root: '/attendance',
    icon: ClipboardCheck,
    children: [
      ['Daily register', '/attendance'],
      ['Monthly report', '/attendance/monthly'],
      ['Corrections', '/attendance/corrections'],
      ['Mobile classes', '/attendance/classes'],
    ],
  },
  {
    label: 'Fee collection',
    root: '/fees',
    icon: Wallet,
    children: [
      ['Collect payment', '/fees'],
      ['Outstanding dues', '/fees/dues'],
      ['Collection report', '/fees/report'],
    ],
  },
  {
    label: 'Expenses',
    root: '/expenses',
    icon: Receipt,
    children: [
      ['Expense register', '/expenses'],
      ['New expense', '/expenses/new'],
      ['Expense report', '/expenses/report'],
    ],
  },
  {
    label: 'Routine',
    root: '/routine',
    icon: CalendarDays,
    children: [
      ['Class routine', '/routine'],
      ['Create routine', '/routine/new'],
      ['Teacher routine', '/routine/teacher'],
    ],
  },
  {
    label: 'Settings',
    root: '/settings',
    icon: Settings2,
    children: [
      ['Overview', '/settings'],
      ['School profile', '/settings/school'],
      ['Academics', '/settings/academics'],
      ['People & access', '/settings/people'],
      ['Admissions', '/settings/admissions'],
      ['Attendance', '/settings/attendance'],
      ['Fees & schedules', '/settings/fees'],
      ['Expense policy', '/settings/expenses'],
    ],
  },
] satisfies {
  label: string;
  root: DemoPath;
  icon: typeof GraduationCap;
  children: [string, DemoPath][];
}[];

export function DemoNavigation({ close }: { close: () => void }) {
  const location = useLocation();
  const path = location.pathname.replace(/\/$/, '');
  return (
    <nav aria-label="Demo school navigation" className="demo-navigation">
      {groups.map((group) => {
        const active = path.startsWith(group.root);
        const Icon = group.icon;
        return (
          <details key={`${group.label}-${active}`} open={active}>
            <summary className={active ? 'demo-nav-active' : ''}>
              <Icon size={16} aria-hidden="true" />
              <span>{group.label}</span>
              <ChevronDown size={14} aria-hidden="true" />
            </summary>
            <div className="demo-nav-children">
              {group.children.map(([label, to]) => (
                <Link
                  key={to}
                  to={to}
                  onClick={close}
                  aria-current={path === to ? 'page' : undefined}
                >
                  {label}
                </Link>
              ))}
            </div>
          </details>
        );
      })}
    </nav>
  );
}
