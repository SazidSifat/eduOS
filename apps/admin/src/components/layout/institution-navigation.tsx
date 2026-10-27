import { Link, useLocation } from '@tanstack/react-router';
import {
  Archive,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  GraduationCap,
  Settings2,
} from 'lucide-react';
import type { accessSchema } from '@eduos/contracts';
import type { z } from 'zod';
import type { ReactNode } from 'react';

const admissionViews = [
  { state: 'follow_up', label: 'Follow-ups', icon: CalendarDays },
  { state: 'willing', label: 'Willing students', icon: ClipboardList },
  { state: 'admitted', label: 'Admitted students', icon: GraduationCap },
  { state: 'closed', label: 'Closed records', icon: Archive },
] as const;
const linkClass = 'admission-nav flex items-center gap-3 rounded-md px-3 py-2.5';

export function InstitutionNavigation({
  institutionId,
  access,
}: {
  institutionId: string;
  access: z.infer<typeof accessSchema>;
}) {
  const location = useLocation();
  const path = location.pathname.replace(/\/$/, '');
  const settingsActive = path.includes('/settings');
  const admissionsAvailable =
    access.modules.includes('admissions') && access.permissions.includes('admissions.read');
  return (
    <nav aria-label="School navigation" className="space-y-2 p-3">
      {admissionsAvailable && (
        <NavigationModule
          key={`admissions-${settingsActive}`}
          label="Admissions"
          icon={<GraduationCap size={16} aria-hidden="true" />}
          active={!settingsActive}
        >
          {admissionViews.map(({ state, label, icon: Icon }) => {
            const current = path.endsWith('/admissions') && location.search.state === state;
            return (
              <Link
                key={state}
                to="/institutions/$institutionId/admissions"
                params={{ institutionId }}
                search={{ state, due: 'all', search: '', offset: 0 }}
                data-current={current}
                aria-current={current ? 'page' : undefined}
                className={linkClass}
                activeOptions={{ exact: true, includeSearch: true }}
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </NavigationModule>
      )}
      {admissionsAvailable && access.permissions.includes('admissions.settings') && (
        <NavigationModule
          key={`settings-${settingsActive}`}
          label="Settings"
          icon={<Settings2 size={16} aria-hidden="true" />}
          active={settingsActive}
        >
          <Link
            to="/institutions/$institutionId/settings/admissions"
            params={{ institutionId }}
            data-current={settingsActive}
            aria-current={settingsActive ? 'page' : undefined}
            className={linkClass}
          >
            Admissions settings
          </Link>
        </NavigationModule>
      )}
    </nav>
  );
}

function NavigationModule({
  label,
  icon,
  active,
  children,
}: {
  label: string;
  icon: ReactNode;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <details open={active || label === 'Admissions'} className="group">
      <summary
        className={`${linkClass} cursor-pointer list-none font-medium [&::-webkit-details-marker]:hidden`}
        data-current={active}
      >
        {icon}
        <span className="flex-1">{label}</span>
        <ChevronDown size={14} aria-hidden="true" className="-rotate-90 group-open:rotate-0" />
      </summary>
      <div className="mt-1 ml-5 space-y-1 border-l border-border pl-2">{children}</div>
    </details>
  );
}
