import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import type { User } from 'firebase/auth';
import { useUserProfile } from '../hooks/useUserProfile';
import { useUserCatches } from '../hooks/useUserCatches';
import { useUserPublicTrips } from '../hooks/useUserPublicTrips';
import { useFollowCounts } from '../hooks/social/useFollowCounts';
import { useUnits } from '../contexts/UnitsContext';
import { formatWeight, formatLength } from '../lib/units';
import { getBiome } from '../lib/biomes';
import { TripCard } from '../components/social/TripCard';
import { FollowButton } from '../components/social/FollowButton';
import { FollowListSheet } from '../components/social/FollowListSheet';
import type { CatchRecord, Trip } from '../types';

interface Props {
  targetUid: string;
  currentUser: User;
  onBack: () => void;
  onTripClick: (trip: Trip) => void;
  onUserClick?: (uid: string) => void;
}


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

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xl font-bold text-text leading-none">{value}</span>
      <span className="text-[11px] text-text-muted">{label}</span>
    </div>
  );
}

export function UserProfile({ targetUid, currentUser, onBack, onTripClick, onUserClick }: Props) {
  const { t, i18n } = useTranslation();
  const { prefs } = useUnits();
  const isOwn = targetUid === currentUser.uid;
  const [followSheet, setFollowSheet] = useState<'followers' | 'following' | null>(null);

  const { profile } = useUserProfile(targetUid);
  // useUserCatches reads from local IndexedDB — returns real data for own profile,
  // empty array for other users (they have no local catches on this device)
  const catches = useUserCatches(targetUid);
  const { trips, loading: tripsLoading } = useUserPublicTrips(targetUid, isOwn);
  const { followersCount, followingCount } = useFollowCounts(targetUid);

  const stats = useMemo(() => computeStats(catches), [catches]);

  const displayName = profile?.displayName ?? (isOwn ? (currentUser.displayName ?? '') : '…');
  const photoUrl = profile?.photoURL ?? (isOwn ? currentUser.photoURL : null);

  const initials = (displayName || currentUser.email || '?')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // For own profile use local computed stats; for others use profile doc counters
  const catchCount = isOwn ? stats.total : (profile?.catchCount ?? 0);
  const speciesCount = isOwn ? stats.species : (profile?.speciesCount ?? 0);

  const bestDisplay = isOwn
    ? (stats.bestWeight != null
        ? formatWeight(stats.bestWeight, prefs.weight)
        : stats.bestLength != null
          ? formatLength(stats.bestLength, prefs.length)
          : null)
    : null;

  const maxMonth = Math.max(...stats.months.map(m => m.count), 1);
  const topMax = stats.topSpecies[0]?.[1] ?? 1;

  return (
    <div className="h-full overflow-y-auto bg-bg">

      {/* Hero banner */}
      <div className="relative" style={{ height: 220 }}>
        {(() => {
          const def = getBiome(profile?.biome);
          return (
            <>
              <div className="absolute inset-0" style={{ background: def.gradient }} />
              <img
                src={def.image}
                className="absolute inset-0 w-full h-full object-cover"
                alt=""
                onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
              />
            </>
          );
        })()}

        {/* Back button — fixed so it stays visible when scrolling */}
        <button
          onClick={onBack}
          aria-label={t('log.back')}
          className="fixed left-4 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm"
          style={{ top: 'calc(env(safe-area-inset-top) + 10px)' }}
        >
          <ArrowLeft size={17} strokeWidth={1.75} />
        </button>

        {/* Wave cutout */}
        <svg
          aria-hidden="true"
          className="absolute bottom-0 left-0 w-full"
          style={{ height: 44 }}
          viewBox="0 0 390 44"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,22 C110,42 280,2 390,26 L390,44 L0,44 Z"
            style={{ fill: 'var(--color-bg)' }}
          />
        </svg>

        {/* Avatar at wave boundary */}
        <div className="absolute left-5" style={{ bottom: -30 }}>
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={displayName}
              referrerPolicy="no-referrer"
              className="w-[68px] h-[68px] rounded-full object-cover"
              style={{ border: '3px solid var(--color-bg)' }}
            />
          ) : (
            <div
              className="w-[68px] h-[68px] rounded-full bg-accent flex items-center justify-center text-white text-xl font-bold"
              style={{ border: '3px solid var(--color-bg)' }}
            >
              {initials}
            </div>
          )}
        </div>
      </div>

      {/* Profile body */}
      <div className="px-5 pb-10 space-y-4" style={{ paddingTop: 40 }}>

        {/* Name + username + follow button */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[1.35rem] font-bold text-text leading-tight tracking-tight">
              {displayName || t('profile.title')}
            </h1>
            {profile?.username && (
              <p className="text-sm text-text-muted mt-0.5">@{profile.username}</p>
            )}
            {profile?.mainLocation && (
              <p className="text-sm text-text-muted mt-0.5">{profile.mainLocation}</p>
            )}
          </div>
          {!isOwn && (
            <div className="mt-1 shrink-0">
              <FollowButton
                myUid={currentUser.uid}
                targetUid={targetUid}
                targetIsPrivate={profile?.isPrivate ?? false}
              />
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-start gap-3">
          <StatItem value={String(catchCount)} label={t('profile.catches')} />
          <div className="w-px self-stretch bg-divider" />
          <StatItem value={String(speciesCount)} label={t('profile.species')} />
          <div className="w-px self-stretch bg-divider" />
          <button
            className="flex flex-col gap-0.5 text-left"
            onClick={() => setFollowSheet('followers')}
          >
            <span className="text-xl font-bold text-text leading-none">{followersCount}</span>
            <span className="text-[11px] text-text-muted">{t('follow.followers')}</span>
          </button>
          <div className="w-px self-stretch bg-divider" />
          <button
            className="flex flex-col gap-0.5 text-left"
            onClick={() => setFollowSheet('following')}
          >
            <span className="text-xl font-bold text-text leading-none">{followingCount}</span>
            <span className="text-[11px] text-text-muted">{t('follow.following')}</span>
          </button>
          {bestDisplay && (
            <>
              <div className="w-px self-stretch bg-divider" />
              <StatItem value={bestDisplay} label={t('profile.personalBest')} />
            </>
          )}
        </div>

        {/* Charts — own profile only (other users' catches aren't local) */}
        {isOwn && stats.total === 0 && (
          <div className="rounded-[var(--radius-md)] border border-divider bg-surface p-6 text-center">
            <p className="text-sm text-text-muted">{t('profile.emptyHint')}</p>
          </div>
        )}

        {isOwn && stats.total > 0 && (
          <>
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

            {stats.topSpecies.length > 0 && (
              <div className="rounded-[var(--radius-md)] border border-divider bg-surface p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-text-muted">
                  {t('profile.topSpecies')}
                </p>
                <div className="space-y-3">
                  {stats.topSpecies.map(([name, count]) => (
                    <div key={name} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 truncate text-sm text-text">
                        {t(`speciesNames.${name}`, { defaultValue: name })}
                      </span>
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

        {/* Trips */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted mb-2">
            {t('feed.recentUpdates')}
          </p>
          {tripsLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-28 bg-surface rounded-[var(--radius-md)] border border-divider animate-pulse" />
              ))}
            </div>
          ) : trips.length === 0 ? (
            <div className="rounded-[var(--radius-md)] border border-divider bg-surface p-6 text-center">
              <p className="text-sm text-text-muted">{t('profile.noTrips')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {trips.map(trip => (
                <TripCard
                  key={trip.tripId}
                  trip={trip}
                  displayName={isOwn ? t('feed.you') : displayName}
                  photoUrl={photoUrl}
                  isOwn={isOwn}
                  locale={i18n.language}
                  onClick={() => onTripClick(trip)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {followSheet && (
        <FollowListSheet
          uid={targetUid}
          type={followSheet}
          isOwn={isOwn}
          myUid={currentUser.uid}
          onClose={() => setFollowSheet(null)}
          onUserClick={(uid) => onUserClick?.(uid)}
        />
      )}
    </div>
  );
}
