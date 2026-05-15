import { useTranslation } from 'react-i18next';
import { Plus, Map, Activity, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AppView = 'logg' | 'kart' | 'score' | 'historikk';

interface Props {
  active: AppView;
  onChange: (view: AppView) => void;
}

const NAV_ITEMS = [
  { view: 'logg'      as const, labelKey: 'nav.log',       Icon: Plus     },
  { view: 'kart'      as const, labelKey: 'nav.map',       Icon: Map      },
  { view: 'score'     as const, labelKey: 'nav.biteScore', Icon: Activity },
  { view: 'historikk' as const, labelKey: 'nav.history',   Icon: BookOpen },
] as const;

export function BottomNav({ active, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <nav
      className="flex shrink-0 bg-surface border-t border-divider z-[100]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label={t('nav.ariaLabel')}
    >
      {NAV_ITEMS.map(({ view, labelKey, Icon }) => {
        const isActive = active === view;
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
              'flex items-center justify-center w-11 h-7 rounded-full transition-colors duration-150',
              isActive && 'bg-accent/10',
            )}>
              <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
            </span>
            <span className="text-[11px] font-medium leading-none tracking-wide">
              {t(labelKey)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
