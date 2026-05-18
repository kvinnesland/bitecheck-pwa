import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Pencil, X } from 'lucide-react';
import type { User } from 'firebase/auth';
import { useUserCatches } from '../hooks/useUserCatches';
import { useUserProfile } from '../hooks/useUserProfile';
import { updateUserProfile } from '../lib/userProfile';
import { useUnits } from '../contexts/UnitsContext';
import { formatWeight, formatLength } from '../lib/units';
import { BIOMES, getBiome, DEFAULT_BIOME } from '../lib/biomes';
import { FollowListSheet } from '../components/social/FollowListSheet';
import { useFollowCounts } from '../hooks/social/useFollowCounts';
import { UserProfile } from './UserProfile';
import { TripDetail } from './TripDetail';
import { cn } from '@/lib/utils';
import type { CatchRecord, LocationPref, Biome, Trip } from '../types';

type NavEntry = { type: 'own' } | { type: 'profile'; uid: string } | { type: 'trip'; trip: Trip };

interface Props {
  user: User;
  onSettingsOpen: () => void;
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
  const speciesDisplay: Record<string, string> = {};
  for (const c of active) {
    const key = c.species.name.trim().toLowerCase();
    speciesCounts[key] = (speciesCounts[key] ?? 0) + 1;
    speciesDisplay[key] ??= c.species.name.trim();
  }
  const topSpecies = Object.entries(speciesCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([key, count]) => [speciesDisplay[key], count] as [string, number]);

  return { total, species: speciesSet.size, bestWeight, bestLength, months, topSpecies };
}

export function Profil({ user, onSettingsOpen }: Props) {
  const { t } = useTranslation();
  const { prefs } = useUnits();
  const catches = useUserCatches(user.uid);
  const { profile } = useUserProfile(user.uid);
  const stats = useMemo(() => computeStats(catches), [catches]);

  const { followersCount, followingCount } = useFollowCounts(user.uid);
  const [navStack, setNavStack] = useState<NavEntry[]>([{ type: 'own' }]);
  const [editing, setEditing] = useState(false);
  const [followSheet, setFollowSheet] = useState<'followers' | 'following' | null>(null);
  const [draft, setDraft] = useState<{ displayName: string; mainLocation: string; isPrivate: boolean; locationPref: LocationPref; biome: Biome }>({
    displayName: '', mainLocation: '', isPrivate: false, locationPref: 'approximate', biome: DEFAULT_BIOME,
  });
  const [saving, setSaving] = useState(false);

  const pushProfile = (uid: string) => setNavStack(s => [...s, { type: 'profile', uid }]);
  const pushTrip = (trip: Trip) => setNavStack(s => [...s, { type: 'trip', trip }]);
  const pop = () => setNavStack(s => s.length > 1 ? s.slice(0, -1) : s);
  const currentView = navStack[navStack.length - 1];

  if (currentView.type === 'profile') {
    return (
      <UserProfile
        targetUid={currentView.uid}
        currentUser={user}
        onBack={pop}
        onTripClick={pushTrip}
        onUserClick={pushProfile}
      />
    );
  }

  if (currentView.type === 'trip') {
    return (
      <TripDetail
        trip={currentView.trip}
        isOwn={currentView.trip.uid === user.uid}
        displayName={user.displayName ?? ''}
        photoUrl={user.photoURL}
        currentUserId={user.uid}
        currentUsername={profile?.username ?? ''}
        currentPhotoURL={user.photoURL ?? null}
        onBack={pop}
        onAddCatch={pop}
      />
    );
  }

  function startEdit() {
    setDraft({
      displayName: profile?.displayName ?? user.displayName ?? '',
      mainLocation: profile?.mainLocation ?? '',
      isPrivate: profile?.isPrivate ?? false,
      locationPref: profile?.locationPref ?? 'approximate',
      biome: profile?.biome ?? DEFAULT_BIOME,
    });
    setEditing(true);
  }

  async function saveEdit() {
    setSaving(true);
    try {
      await updateUserProfile(user.uid, draft);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  const displayName = profile?.displayName ?? user.displayName ?? '';

  const initials = (displayName || user.email || '?')
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

      {/* ── Hero banner ─────────────────────────────────────────────
          Goes to the very top of the viewport (no app header on this tab).
          Safe-area padding keeps the settings button clear of status bar.
      ──────────────────────────────────────────────────────────── */}
      <div className="relative" style={{ height: 220 }}>

        {/* Biome banner */}
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

        {/* Settings button — top-right, respects status bar */}
        <button
          onClick={onSettingsOpen}
          aria-label={t('settings.title')}
          className="absolute right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm"
          style={{ top: 'calc(env(safe-area-inset-top) + 10px)' }}
        >
          <Settings size={17} strokeWidth={1.75} />
        </button>

        {/* Wave cutout — SVG paints over image with page bg color */}
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

        {/* Avatar — sits at the wave boundary, left-aligned */}
        <div className="absolute left-5" style={{ bottom: -30 }}>
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName ?? ''}
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

      {/* ── Profile body ──────────────────────────────────────────── */}
      <div className="px-5 pb-8 space-y-4" style={{ paddingTop: 40 }}>

        {/* Name + username + edit */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[1.35rem] font-bold text-text leading-tight tracking-tight">
              {displayName || t('profile.title')}
            </h1>
            {profile?.username && (
              <p className="text-sm text-text-muted mt-0.5">@{profile.username}</p>
            )}
          </div>
          {!editing && (
            <button
              onClick={startEdit}
              aria-label={t('profileEdit.edit')}
              className="mt-1 w-8 h-8 flex items-center justify-center rounded-full bg-surface border border-divider text-text-muted"
            >
              <Pencil size={14} strokeWidth={1.75} />
            </button>
          )}
        </div>

        {/* Edit card */}
        {editing && (
          <div className="rounded-[var(--radius-md)] border border-divider bg-surface p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">{t('profileEdit.title')}</span>
              <button onClick={() => setEditing(false)} className="text-text-muted">
                <X size={16} />
              </button>
            </div>

            {/* Display name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-muted">{t('profileEdit.displayName')}</label>
              <input
                className="w-full bg-bg border border-divider rounded-[var(--radius-md)] text-text text-sm px-3 py-2 outline-none focus:border-accent"
                value={draft.displayName}
                onChange={(e) => setDraft(d => ({ ...d, displayName: e.target.value }))}
              />
            </div>

            {/* Main location */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-muted">{t('profileEdit.location')}</label>
              <input
                className="w-full bg-bg border border-divider rounded-[var(--radius-md)] text-text text-sm px-3 py-2 outline-none focus:border-accent"
                placeholder={t('profileEdit.locationPlaceholder')}
                value={draft.mainLocation}
                onChange={(e) => setDraft(d => ({ ...d, mainLocation: e.target.value }))}
              />
            </div>

            {/* Private account */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-text">{t('profileEdit.privateAccount')}</span>
              <button
                role="switch"
                aria-checked={draft.isPrivate}
                onClick={() => setDraft(d => ({ ...d, isPrivate: !d.isPrivate }))}
                className={cn(
                  'relative w-11 h-6 rounded-full transition-colors duration-200',
                  draft.isPrivate ? 'bg-accent' : 'bg-divider',
                )}
              >
                <span className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200',
                  draft.isPrivate ? 'translate-x-5' : 'translate-x-0',
                )} />
              </button>
            </div>

            {/* Location precision */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-text-muted">{t('profileEdit.locationPref')}</span>
              <div className="flex gap-2">
                {(['exact', 'approximate', 'hidden'] as LocationPref[]).map((pref) => (
                  <button
                    key={pref}
                    onClick={() => setDraft(d => ({ ...d, locationPref: pref }))}
                    className={cn(
                      'flex-1 py-1.5 rounded-full text-xs font-semibold border transition-colors duration-150',
                      draft.locationPref === pref
                        ? 'bg-accent text-white border-accent'
                        : 'bg-bg text-text-muted border-divider',
                    )}
                  >
                    {t(`log.location${pref.charAt(0).toUpperCase() + pref.slice(1)}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Biome picker */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-text-muted">{t('biome.label')}</span>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {BIOMES.map(b => (
                  <button
                    key={b.id}
                    onClick={() => setDraft(d => ({ ...d, biome: b.id }))}
                    className="flex flex-col items-center gap-1 shrink-0"
                  >
                    <div
                      className={cn(
                        'w-11 h-11 rounded-lg transition-all duration-150 overflow-hidden',
                        draft.biome === b.id ? 'ring-2 ring-accent ring-offset-1' : 'opacity-70',
                      )}
                      style={{ background: b.gradient }}
                    />
                    <span className="text-[9px] text-text-muted text-center w-11 leading-tight line-clamp-2">
                      {t(`biome.${b.id}`)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={saveEdit}
              disabled={saving}
              className="w-full bg-accent text-white text-sm font-semibold py-2.5 rounded-[var(--radius-md)] disabled:opacity-40"
            >
              {saving ? t('profileEdit.saving') : t('profileEdit.save')}
            </button>
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-start gap-3">
          <StatItem value={String(stats.total)} label={t('profile.catches')} />
          <div className="w-px self-stretch bg-divider" />
          <StatItem value={String(stats.species)} label={t('profile.species')} />
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

      {followSheet && (
        <FollowListSheet
          uid={user.uid}
          type={followSheet}
          isOwn
          myUid={user.uid}
          onClose={() => setFollowSheet(null)}
          onUserClick={(uid) => { setFollowSheet(null); pushProfile(uid); }}
        />
      )}
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xl font-bold text-text leading-none">{value}</span>
      <span className="text-[11px] text-text-muted">{label}</span>
    </div>
  );
}
