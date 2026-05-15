import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { User } from 'firebase/auth';
import { useUserCatches } from '../hooks/useUserCatches';
import { useUnits } from '../contexts/UnitsContext';
import { formatWeight, formatLength } from '../lib/units';
import type { CatchRecord } from '../types';

interface Props { user: User; }

function computeStats(catches: CatchRecord[]) {
  const active = catches.filter(c => !c.deleted);
  const total = active.length;
  const speciesSet = new Set(active.map(c => c.species.name));

  let bestWeight: number | null = null;
  let bestLength: number | null = null;
  for (const c of active) {
    if (c.species.weight_kg != null && (bestWeight == null || c.species.weight_kg > bestWeight)) {
      bestWeight = c.species.weight_kg;
    }
    if (c.species.length_cm != null && (bestLength == null || c.species.length_cm > bestLength)) {
      bestLength = c.species.length_cm;
    }
  }

  const now = new Date();
  const months: { label: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const count = active.filter(c => {
      const cd = new Date(c.created_at);
      return cd.getFullYear() === y && cd.getMonth() === m;
    }).length;
    months.push({ label: d.toLocaleString('default', { month: 'short' }), count });
  }

  const speciesCounts: Record<string, number> = {};
  for (const c of active) {
    speciesCounts[c.species.name] = (speciesCounts[c.species.name] ?? 0) + 1;
  }
  const topSpecies = Object.entries(speciesCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return { total, species: speciesSet.size, bestWeight, bestLength, months, topSpecies };
}

export function Profil({ user }: Props) {
  const { t } = useTranslation();
  const { prefs } = useUnits();
  const catches = useUserCatches(user.uid);
  const stats = useMemo(() => computeStats(catches), [catches]);

  const initials = (user.displayName ?? user.email ?? '?')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const maxMonth = Math.max(...stats.months.map(m => m.count), 1);

  const bestDisplay = stats.bestWeight != null
    ? formatWeight(stats.bestWeight, prefs.weight)
    : stats.bestLength != null
      ? formatLength(stats.bestLength, prefs.length)
      : null;

  const topMax = stats.topSpecies[0]?.[1] ?? 1;

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">

        {/* Avatar + name */}
        <div className="flex items-center gap-4">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName ?? ''}
              className="w-16 h-16 rounded-full object-cover border-2 border-divider"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-white text-xl font-bold shrink-0">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-lg font-semibold text-text leading-tight truncate">
              {user.displayName ?? t('profile.title')}
            </p>
            {user.email && (
              <p className="text-sm text-text-muted truncate">{user.email}</p>
            )}
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label={t('profile.catches')} value={String(stats.total)} />
          <StatCard label={t('profile.species')} value={String(stats.species)} />
          <StatCard
            label={t('profile.personalBest')}
            value={bestDisplay ?? '—'}
            small={bestDisplay == null}
          />
        </div>

        {stats.total === 0 ? (
          <div className="bg-surface border border-divider rounded-[var(--radius-md)] p-6 text-center">
            <p className="text-text-muted text-sm">{t('profile.emptyHint')}</p>
          </div>
        ) : (
          <>
            {/* Monthly trend */}
            <div className="bg-surface border border-divider rounded-[var(--radius-md)] p-4">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
                {t('profile.monthlyTrend')}
              </p>
              <div className="flex items-end gap-1.5 h-20">
                {stats.months.map(({ label, count }) => (
                  <div key={label} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-sm bg-accent/20 transition-all duration-300"
                      style={{ height: `${Math.round((count / maxMonth) * 64)}px`, minHeight: count > 0 ? 4 : 0 }}
                    >
                      {count > 0 && (
                        <div
                          className="w-full rounded-t-sm bg-accent"
                          style={{ height: '100%' }}
                        />
                      )}
                    </div>
                    <span className="text-[10px] text-text-muted leading-none">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top species */}
            {stats.topSpecies.length > 0 && (
              <div className="bg-surface border border-divider rounded-[var(--radius-md)] p-4">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                  {t('profile.topSpecies')}
                </p>
                <div className="space-y-3">
                  {stats.topSpecies.map(([name, count]) => (
                    <div key={name} className="flex items-center gap-3">
                      <span className="text-sm text-text w-24 shrink-0 truncate">{name}</span>
                      <div className="flex-1 bg-divider rounded-full h-2">
                        <div
                          className="bg-accent h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.round((count / topMax) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-text w-6 text-right shrink-0">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="bg-surface border border-divider rounded-[var(--radius-md)] p-3 flex flex-col items-center gap-1">
      <span className={small ? 'text-base font-bold text-text' : 'text-2xl font-bold text-text'}>
        {value}
      </span>
      <span className="text-[11px] text-text-muted text-center leading-tight">{label}</span>
    </div>
  );
}
