import { useLanguage } from '@eduos/ui';
import { useLocation, useNavigate } from '@tanstack/react-router';
import {
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  Home,
  Receipt,
  Settings2,
  Wallet,
} from 'lucide-react';
import { MobileBottomNav, type BottomNavItem } from '../../../components/layout/mobile-bottom-nav';
import { canOpenSchoolPath } from './school-access';
import { useDemo } from './demo-provider';
import { SignOutButton } from '../../../components/layout/sign-out-button';
import { ThemeToggle } from '../../../components/layout/theme-toggle';

interface AccessibleItem extends BottomNavItem {
  testPath: string;
}

const ALL_ITEMS: AccessibleItem[] = [
  {
    key: 'admissions',
    label: 'Admissions',
    icon: GraduationCap,
    to: '/admissions',
    matchPrefix: '/admissions',
    testPath: '/admissions',
  },
  {
    key: 'attendance',
    label: 'Attendance',
    icon: ClipboardCheck,
    to: '/attendance',
    matchPrefix: '/attendance',
    testPath: '/attendance',
  },
  {
    key: 'fees',
    label: 'Fees',
    icon: Wallet,
    to: '/fees',
    matchPrefix: '/fees',
    testPath: '/fees',
  },
  {
    key: 'routine',
    label: 'Routine',
    icon: CalendarDays,
    to: '/routine',
    matchPrefix: '/routine',
    testPath: '/routine',
  },
  {
    key: 'expenses',
    label: 'Expenses',
    icon: Receipt,
    to: '/expenses',
    matchPrefix: '/expenses',
    testPath: '/expenses',
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: Settings2,
    to: '/settings',
    matchPrefix: '/settings',
    testPath: '/settings',
  },
];

const HOME_ITEM: BottomNavItem = {
  key: 'home',
  label: 'Home',
  icon: Home,
  to: '/app',
  matchPrefix: '/app',
};

function MoreSheetContent({
  overflowItems,
  onClose,
}: {
  overflowItems: BottomNavItem[];
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const { snapshot } = useDemo();
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
      <p className="mobile-sheet-section-label">{t('Account')}</p>
      <div className="mobile-sheet-account">
        <p className="font-semibold">{snapshot.identity.name}</p>
        <p className="mobile-sheet-role">{t(snapshot.identity.role)}</p>
        <div className="mobile-sheet-controls">
          <ThemeToggle />
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}

export function SchoolBottomNav() {
  const { snapshot } = useDemo();

  const accessibleItems = ALL_ITEMS.filter((item) =>
    canOpenSchoolPath(snapshot, item.testPath),
  ).map(({ testPath: _testPath, ...item }) => item);

  const navItems: BottomNavItem[] = [HOME_ITEM, ...accessibleItems];
  const overflow = navItems.slice(4);

  return (
    <MobileBottomNav
      items={navItems}
      pinnedCount={4}
      renderMoreContent={(onClose) => (
        <MoreSheetContent overflowItems={overflow} onClose={onClose} />
      )}
    />
  );
}
