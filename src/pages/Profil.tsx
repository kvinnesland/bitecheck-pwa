import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { User } from 'firebase/auth';
import { useUserCatches } from '../hooks/useUserCatches';
import { useUnits } from '../contexts/UnitsContext';
import { formatWeight, formatLength } from '../lib/units';
import { cn } from '@/lib/utils';
import type { CatchRecord } from '../types';

interface Props { user: User; }

// Replace with a real image path (e.g. '/images/banner-default.jpg') once the asset is added to public/
const BANNER_SRC: string | null = null;

function computeStats(catches: CatchRecord[]) {
  const active = catches.filter(c => !c.deleted);
  const total = active.length;
  const speciesSet = new Set(active.map(c => c.species.name));

  let bestWeight: number | null = null;
  let bestLength: number | null = null;
  for (const c of active) {
    if (c.species.weight_kg != null && (bestWeight == null || c.species.weight_kg > bestWeight))
      bestWeight = c.species.weight_kg;
    if (c.species.length_cm != null && (bestLength == null || c.species.length_cm > bestLength))
      bestLength = c.species.length_cm;
  }

  const now = new Date();
  const months: { label: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const count = active.filter(c => {
      const cd = new Date(c.created_at);
      return cd.getFullYear() === d.getFullYear() && cd.getMonth() === d.getMonth();
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

  const bestDisplay = stats.bestWeight != null
    ? formatWeight(stats.bestWeight, prefs.weight)
    : stats.bestLength != null
      ? formatLength(stats.bestLength, prefs.length)
      : null;

  const maxMonth = Math.max(...stats.months.map(m => m.count), 1);
  const topMax = stats.topSpecies[0]?.[1] ?? 1;

  return (
    <div className="h-full overflow-y-auto bg-bg">

      {/* ── Hero banner ─────────────────────────────────────────── */}
      {/*
        The wave illusion: an SVG is positioned at the banner's bottom.
        Its path fills everything BELOW the wave curve with var(--color-bg),
        making the image appear to have a wavy bottom edge.
        No clipping needed — the SVG simply paints over the image.
      */}
      <div className="relative h-52">
        {/* Background image / gradient */}
        {BANNER_SRC ? (
          <img
            src={BANNER_SRC}
            className="absolute inset-0 w-full h-full object-cover"
            alt=""
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(150deg, #0c2330 0%, #1a4a5e 45%, #2d7a8a 80%, #3a9aaa 100%)' }}
          />
        )}

        {/* Wave SVG — fills below the wave curve with the page background color */}
        <svg
          aria-hidden="true"
          className="absolute bottom-0 left-0 w-full"
          style={{ height: 52 }}
          viewBox="0 0 390 52"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,28 C130,48 260,8 390,32 L390,52 L0,52 Z"
            style={{ fill: 'var(--color-bg)' }}
          />
        </svg>

        {/* Avatar — anchored to wave boundary on the left */}
        <div className="absolute left-5 -bottom-9">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName ?? ''}
              referrerPolicy="no-referrer"
              className="w-[72px] h-[72px] rounded-full object-cover"
              style={{ border: '3px solid var(--color-bg)' }}
            />
          ) : (
            <div
              className="w-[72px] h-[72px] rounded-full bg-accent flex items-center justify-center text-white text-xl font-bold"
              style={{ border: '3px solid var(--color-bg)' }}
            >
              {initials}
            </div>
          )}
        </div>
      </div>

      {/* ── Profile body ────────────────────────────────────────── */}
      <div className="px-5 pb-8 space-y-5" style={{ paddingTop: 44 }}>

        {/* Name */}
        <div>
          <h1 className="text-[1.4rem] font-bold text-text leading-tight tracking-tight">
            {user.displayName ?? t('profile.title')}
          </h1>
          {user.email && (
            <p className="text-sm text-text-muted mt-0.5">{user.email}</p>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-start gap-5">
          <StatItem value={String(stats.total)} label={t('profile.catches')} />
          <div className="w-px self-stretch bg-divider" />
          <StatItem value={String(stats.species)} label={t('profile.species')} />
          {bestDisplay && (
            <>
              <div className="w-px self-stretch bg-divider" />
              <StatItem value={bestDisplay} label={t('profile.personalBest')} compact />
            </>
          )}
        </div>

        {/* Empty state */}
        {stats.total === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-divider bg-surface p-6 text-center">
            <p className="text-sm text-text-muted">{t('profile.emptyHint')}</p>
          </div>
        ) : (
          <>
            {/* Monthly trend */}
            <div className="rounded-[var(--radius-md)] border border-divider bg-surface p-4">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-text-muted">
                {t('profile.monthlyTrend')}
              </p>
              <div className="flex items-end gap-1.5 h-[68px]">
                {stats.months.map(({ label, count }) => (
                  <div key={label} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-[3px] transition-all duration-300"
                      style={{
                        height: count > 0 ? `${Math.round((count / maxMonth) * 52)}px` : 0,
                        background: 'var(--color-accent)',
                        opacity: count > 0 ? 1 : 0,
                      }}
                    />
                    <span className="text-[10px] leading-none text-text-muted">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top species */}
            {stats.topSpecies.length > 0 && (
              <div className="rounded-[var(--radius-md)] border border-divider bg-surface p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-text-muted">
                  {t('profile.topSpecies')}
                </p>
                <div className="space-y-3">
                  {stats.topSpecies.map(([name, count]) => (
                    <div key={name} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 truncate text-sm text-text">{name}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-divider overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.round((count / topMax) * 100)}%`,
                            background: 'var(--color-accent)',
                          }}
                        />
                      </div>
                      <span className="w-6 shrink-0 text-right text-sm font-semibold text-text">
                        {count}
                      </span>
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

function StatItem({ value, label, compact }: { value: string; label: string; compact?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className={cn('font-bold text-text leading-none', compact ? 'text-lg' : 'text-2xl')}>
        {value}
      </span>
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  );
}
