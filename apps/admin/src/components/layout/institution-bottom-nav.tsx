import { useLanguage } from '@eduos/ui';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { GraduationCap, Home, Settings2 } from 'lucide-react';
import type { accessSchema } from '@eduos/contracts';
import type { z } from 'zod';
import { MobileBottomNav, type BottomNavItem } from './mobile-bottom-nav';
import { ThemeToggle } from './theme-toggle';

type Access = z.infer<typeof accessSchema>;

const HOME_ITEM: BottomNavItem = {
  key: 'home',
  label: 'Home',
  icon: Home,
  to: '/app',
  matchPrefix: '/app',
};

function buildNavItems(institutionId: string, access: Access): BottomNavItem[] {
  const items: BottomNavItem[] = [HOME_ITEM];

  const admissionsAvailable =
    access.modules.includes('admissions') && access.permissions.includes('admissions.read');

  if (admissionsAvailable) {
    items.push({
      key: 'admissions',
      label: 'Admissions',
      icon: GraduationCap,
      to: `/institutions/${institutionId}/admissions`,
      matchPrefix: `/institutions/${institutionId}/admissions`,
    });
  }

  items.push({
    key: 'settings',
    label: 'Settings',
    icon: Settings2,
    to: `/institutions/${institutionId}/settings`,
    matchPrefix: `/institutions/${institutionId}/settings`,
  });

  return items;
}

function InstitutionMoreSheetContent({
  overflowItems,
  onClose,
}: {
  overflowItems: BottomNavItem[];
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="mobile-sheet-nav">
      {overflowItems.length > 0 && (
        <>
          <p className="mobile-sheet-section-label">{t('More')}</p>
          <nav aria-label={t('More navigation')}>
            {overflowItems.map((item) => {
              const isActive =
                path === item.matchPrefix ||
                (item.matchPrefix !== '/' && path.startsWith(`${item.matchPrefix}/`));
              const Icon = item.icon;
              return (
                <a
                  key={item.key}
                  href={item.to}
                  onClick={(e) => {
                    e.preventDefault();
                    void navigate({ to: item.to });
                    onClose();
                  }}
                  className={`mobile-sheet-nav-item${isActive ? ' mobile-sheet-nav-item-active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>{t(item.label)}</span>
                </a>
              );
            })}
          </nav>
          <div className="mobile-sheet-divider" />
        </>
      )}
      <div className="mobile-sheet-account">
        <div className="mobile-sheet-controls">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

export function InstitutionBottomNav({
  institutionId,
  access,
}: {
  institutionId: string;
  access: Access;
}) {
  const navItems = buildNavItems(institutionId, access);
  const overflow = navItems.slice(4);

  return (
    <MobileBottomNav
      items={navItems}
      pinnedCount={4}
      renderMoreContent={(onClose) => (
        <InstitutionMoreSheetContent overflowItems={overflow} onClose={onClose} />
      )}
    />
  );
}
