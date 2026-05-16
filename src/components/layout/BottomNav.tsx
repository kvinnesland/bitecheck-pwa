import { useTranslation } from 'react-i18next';
import { Home, Map, Plus, Activity, User, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AppView = 'feed' | 'kart' | 'logg' | 'score' | 'varsler' | 'profil';

interface Props {
  active: AppView;
  onChange: (view: AppView) => void;
  notificationBadge?: number;
}

const NAV_ITEMS = [
  { view: 'feed'   as const, labelKey: 'nav.feed',          Icon: Home     },
  { view: 'kart'   as const, labelKey: 'nav.map',           Icon: Map      },
  { view: 'logg'   as const, labelKey: 'nav.log',           Icon: Plus     },
  { view: 'score'  as const, labelKey: 'nav.score',         Icon: Activity },
  { view: 'varsler' as const, labelKey: 'nav.notifications', Icon: Bell    },
  { view: 'profil' as const, labelKey: 'nav.profile',       Icon: User     },
] as const;

export function BottomNav({ active, onChange, notificationBadge = 0 }: Props) {
  const { t } = useTranslation();

  return (
    <nav
      className="flex shrink-0 bg-surface border-t border-divider z-[100]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label={t('nav.ariaLabel')}
    >
      {NAV_ITEMS.map(({ view, labelKey, Icon }) => {
        const isActive = active === view;
        const showBadge = view === 'varsler' && notificationBadge > 0;
        return (
          <button
            key={view}
            onClick={() => onChange(view)}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 py-2 px-1 transition-colors duration-150',
              isActive ? 'text-accent' : 'text-text-muted hover:text-text',
            )}
          >
            <span className={cn(
              'relative flex items-center justify-center w-9 h-7 rounded-full transition-colors duration-150',
              isActive && 'bg-accent/10',
            )}>
              <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
              {showBadge && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                  {notificationBadge > 9 ? '9+' : notificationBadge}
                </span>
              )}
            </span>
            <span className="text-[10px] font-medium leading-none tracking-wide">
              {t(labelKey)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
