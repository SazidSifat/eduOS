import { useLanguage } from '@eduos/ui';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { MoreHorizontal } from 'lucide-react';
import { useState, useCallback, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { MobileNavSheet } from './mobile-nav-sheet';

export interface BottomNavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  /** Absolute path string — used with navigate() */
  to: string;
  matchPrefix: string;
}

interface MobileBottomNavProps {
  items: BottomNavItem[];
  pinnedCount?: number;
  /** Receives `onClose` so sheet links can close the sheet on tap */
  renderMoreContent: (onClose: () => void) => ReactNode;
  moreLabel?: string;
}

export function MobileBottomNav(props: MobileBottomNavProps) {
  const location = useLocation();
  return <MobileBottomNavContent key={location.pathname} {...props} />;
}

function MobileBottomNavContent({
  items,
  pinnedCount = 4,
  renderMoreContent,
  moreLabel,
}: MobileBottomNavProps) {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const pinned = items.slice(0, pinnedCount);
  const hasOverflow = items.length > pinnedCount;

  const closeMore = useCallback(() => setMoreOpen(false), []);

  const path = location.pathname;

  return (
    <>
      <nav className="mobile-bottom-nav" aria-label={t('Main navigation')}>
        {pinned.map((item) => {
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
              }}
              className={`mobile-bottom-nav-tab${isActive ? ' mobile-bottom-nav-tab-active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="mobile-bottom-nav-indicator" aria-hidden="true" />
              <Icon size={22} aria-hidden="true" />
              <span className="mobile-bottom-nav-label">{t(item.label)}</span>
            </a>
          );
        })}
        {hasOverflow && (
          <button
            type="button"
            className={`mobile-bottom-nav-tab${moreOpen ? ' mobile-bottom-nav-tab-active' : ''}`}
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
          >
            <span className="mobile-bottom-nav-indicator" aria-hidden="true" />
            <MoreHorizontal size={22} aria-hidden="true" />
            <span className="mobile-bottom-nav-label">{moreLabel ?? t('More')}</span>
          </button>
        )}
      </nav>

      {hasOverflow && (
        <MobileNavSheet
          open={moreOpen}
          onClose={closeMore}
          label={moreLabel ?? t('More navigation')}
        >
          {renderMoreContent(closeMore)}
        </MobileNavSheet>
      )}
    </>
  );
}
