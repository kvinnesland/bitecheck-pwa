import { useTranslation } from 'react-i18next';
import { Home, Map, Plus, Activity, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AppView = 'feed' | 'kart' | 'logg' | 'score' | 'varsler' | 'profil';

interface Props {
  active: AppView;
  onChange: (view: AppView) => void;
  unreadCount?: number;
}

const NAV_ITEMS = [
  { view: 'feed'   as const, labelKey: 'nav.feed',    Icon: Home     },
  { view: 'kart'   as const, labelKey: 'nav.map',     Icon: Map      },
  { view: 'logg'   as const, labelKey: 'nav.log',     Icon: Plus     },
  { view: 'score'  as const, labelKey: 'nav.score',   Icon: Activity },
  { view: 'profil' as const, labelKey: 'nav.profile', Icon: User     },
] as const;

export function BottomNav({ active, onChange, unreadCount = 0 }: Props) {
  const { t } = useTranslation();

  return (
    <nav
      className="flex shrink-0 bg-surface/90 backdrop-blur-sm border-t border-divider z-[100]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label={t('nav.ariaLabel')}
    >
      {NAV_ITEMS.map(({ view, labelKey, Icon }) => {
        const isActive = active === view;
        const showBadge = view === 'feed' && unreadCount > 0;
        return (
          <button
            key={view}
            onClick={() => onChange(view)}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-[5px] py-2.5 px-1',
              'transition-colors duration-150',
              isActive ? 'text-accent' : 'text-text-subtle hover:text-text-muted',
            )}
          >
            <span className="relative flex items-center justify-center w-6 h-6">
              <Icon size={20} strokeWidth={isActive ? 1.75 : 1.5} />
              {showBadge && (
                <span className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 px-0.5 bg-accent text-bg text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </span>
            <span className={cn(
              'text-[10px] leading-none tracking-[0.04em]',
              isActive ? 'font-medium' : 'font-normal',
            )}>
              {t(labelKey)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
