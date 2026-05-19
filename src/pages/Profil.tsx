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
import { AppText } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { AppCard } from '../components/ui/AppCard';
import { QuietDivider } from '../components/ui/QuietDivider';
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
    if (c.species.weight_kg != null && (bestWeight == null || c.species.weight_kg > bestWeight)) bestWeight = c.species.weight_kg;
    if (c.species.length_cm != null && (bestLength == null || c.species.length_cm > bestLength)) bestLength = c.species.length_cm;
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
    return <UserProfile targetUid={currentView.uid} currentUser={user} onBack={pop} onTripClick={pushTrip} onUserClick={pushProfile} />;
  }
  if (currentView.type === 'trip') {
    return (
      <TripDetail
        trip={currentView.trip} isOwn={currentView.trip.uid === user.uid}
        displayName={user.displayName ?? ''} photoUrl={user.photoURL}
        currentUserId={user.uid} currentUsername={profile?.username ?? ''}
        currentPhotoURL={user.photoURL ?? null} onBack={pop} onAddCatch={pop}
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
    try { await updateUserProfile(user.uid, draft); }
    finally { setSaving(false); setEditing(false); }
  }

  const displayName = profile?.displayName ?? user.displayName ?? '';
  const initials = (displayName || user.email || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const bestDisplay = stats.bestWeight != null
    ? formatWeight(stats.bestWeight, prefs.weight)
    : stats.bestLength != null ? formatLength(stats.bestLength, prefs.length) : null;
  const maxMonth = Math.max(...stats.months.map(m => m.count), 1);
  const topMax = stats.topSpecies[0]?.[1] ?? 1;

  return (
    <div className="h-full overflow-y-auto bg-bg">

      {/* ── Atmospheric hero banner ─────────────────────────────────────── */}
      <div className="relative" style={{ height: 240 }}>
        {(() => {
          const def = getBiome(profile?.biome);
          return (
            <>
              <div className="absolute inset-0" style={{ background: def.gradient }} />
              <img src={def.image} className="absolute inset-0 w-full h-full object-cover" alt=""
                onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }} />
              {/* Bottom-to-top fade so avatar edge is smooth */}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 100%)' }} />
            </>
          );
        })()}

        {/* Settings button */}
        <button
          onClick={onSettingsOpen}
          aria-label={t('settings.title')}
          className="absolute right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/25 backdrop-blur-sm text-white/80 hover:text-white transition-colors"
          style={{ top: 'calc(env(safe-area-inset-top) + 10px)' }}
        >
          <Settings size={17} strokeWidth={1.5} />
        </button>

        {/* Wave cutout */}
        <svg aria-hidden="true" className="absolute bottom-0 left-0 w-full" style={{ height: 48 }}
          viewBox="0 0 390 48" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,24 C110,46 280,2 390,28 L390,48 L0,48 Z" style={{ fill: 'var(--color-bg)' }} />
        </svg>

        {/* Avatar */}
        <div className="absolute left-5" style={{ bottom: -32 }}>
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName ?? ''} referrerPolicy="no-referrer"
              className="w-[72px] h-[72px] rounded-full object-cover"
              style={{ border: '3px solid var(--color-bg)' }} />
          ) : (
            <div className="w-[72px] h-[72px] rounded-full bg-accent flex items-center justify-center text-bg text-xl font-semibold"
              style={{ border: '3px solid var(--color-bg)' }}>
              {initials}
            </div>
          )}
        </div>
      </div>

      {/* ── Profile body ────────────────────────────────────────────────── */}
      <div className="px-5 pb-10 space-y-5" style={{ paddingTop: 44 }}>

        {/* Name + username + edit */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <AppText variant="titleL" color="primary" as="h1">
              {displayName || t('profile.title')}
            </AppText>
            {profile?.username && (
              <AppText variant="bodyM" color="secondary" as="p" className="mt-1">
                @{profile.username}
              </AppText>
            )}
            {profile?.mainLocation && (
              <AppText variant="labelM" color="tertiary" as="p" className="mt-1.5 normal-case tracking-normal text-[0.72rem]">
                {profile.mainLocation}
              </AppText>
            )}
          </div>
          {!editing && (
            <button
              onClick={startEdit}
              aria-label={t('profileEdit.edit')}
              className="mt-1 w-8 h-8 flex items-center justify-center rounded-full bg-surface text-text-subtle hover:text-text-muted transition-colors"
            >
              <Pencil size={14} strokeWidth={1.75} />
            </button>
          )}
        </div>

        {/* Edit card */}
        {editing && (
          <AppCard surface="surface" bordered padding="md">
            <div className="flex items-center justify-between mb-4">
              <AppText variant="labelM" color="tertiary">{t('profileEdit.title')}</AppText>
              <button onClick={() => setEditing(false)} className="text-text-subtle hover:text-text-muted">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <AppText variant="labelM" color="tertiary" as="label">{t('profileEdit.displayName')}</AppText>
                <input
                  className="w-full bg-bg border border-divider rounded-[var(--radius-md)] text-text text-[0.95rem] px-4 py-3 outline-none focus:border-accent/60"
                  value={draft.displayName}
                  onChange={e => setDraft(d => ({ ...d, displayName: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <AppText variant="labelM" color="tertiary" as="label">{t('profileEdit.location')}</AppText>
                <input
                  className="w-full bg-bg border border-divider rounded-[var(--radius-md)] text-text text-[0.95rem] px-4 py-3 outline-none focus:border-accent/60"
                  placeholder={t('profileEdit.locationPlaceholder')}
                  value={draft.mainLocation}
                  onChange={e => setDraft(d => ({ ...d, mainLocation: e.target.value }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <AppText variant="bodyM" color="primary">{t('profileEdit.privateAccount')}</AppText>
                <button
                  role="switch" aria-checked={draft.isPrivate}
                  onClick={() => setDraft(d => ({ ...d, isPrivate: !d.isPrivate }))}
                  className={cn('relative w-10 h-[22px] rounded-full transition-colors duration-200', draft.isPrivate ? 'bg-accent' : 'bg-divider')}
                >
                  <span className={cn('absolute top-[2px] left-[2px] w-[18px] h-[18px] rounded-full bg-white transition-transform duration-200', draft.isPrivate ? 'translate-x-[18px]' : 'translate-x-0')} />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <AppText variant="labelM" color="tertiary">{t('profileEdit.locationPref')}</AppText>
                <div className="flex gap-1 bg-bg rounded-[var(--radius-sm)] p-0.5">
                  {(['exact', 'approximate', 'hidden'] as LocationPref[]).map(pref => (
                    <button
                      key={pref}
                      onClick={() => setDraft(d => ({ ...d, locationPref: pref }))}
                      className={cn(
                        'flex-1 py-1.5 rounded-[10px] text-xs font-semibold transition-colors duration-150',
                        draft.locationPref === pref ? 'bg-surface text-text shadow-sm' : 'text-text-subtle hover:text-text-muted',
                      )}
                    >
                      {t(`log.location${pref.charAt(0).toUpperCase() + pref.slice(1)}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Biome */}
              <div className="flex flex-col gap-2">
                <AppText variant="labelM" color="tertiary">{t('biome.label')}</AppText>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                  {BIOMES.map(b => (
                    <button key={b.id} onClick={() => setDraft(d => ({ ...d, biome: b.id }))} className="flex flex-col items-center gap-1.5 shrink-0">
                      <div className={cn('w-10 h-10 rounded-[10px] transition-all duration-150 overflow-hidden', draft.biome === b.id ? 'ring-2 ring-accent ring-offset-1' : 'opacity-50')} style={{ background: b.gradient }} />
                      <AppText variant="labelM" color="tertiary" as="span" className="normal-case tracking-normal text-[9px] text-center w-10 leading-tight line-clamp-2">{t(`biome.${b.id}`)}</AppText>
                    </button>
                  ))}
                </div>
              </div>

              <AppButton variant="primary" fullWidth onClick={saveEdit} disabled={saving}>
                {saving ? t('profileEdit.saving') : t('profileEdit.save')}
              </AppButton>
            </div>
          </AppCard>
        )}

        {/* Stats row */}
        <div className="flex items-start gap-4">
          <StatPill value={String(stats.total)} label={t('profile.catches')} />
          <QuietDivider orientation="vertical" />
          <StatPill value={String(stats.species)} label={t('profile.species')} />
          <QuietDivider orientation="vertical" />
          <button className="flex flex-col gap-0.5 text-left" onClick={() => setFollowSheet('followers')}>
            <AppText variant="numberM" color="primary" as="span">{followersCount}</AppText>
            <AppText variant="labelM" color="tertiary" as="span" className="normal-case tracking-normal text-[0.68rem]">{t('follow.followers')}</AppText>
          </button>
          <QuietDivider orientation="vertical" />
          <button className="flex flex-col gap-0.5 text-left" onClick={() => setFollowSheet('following')}>
            <AppText variant="numberM" color="primary" as="span">{followingCount}</AppText>
            <AppText variant="labelM" color="tertiary" as="span" className="normal-case tracking-normal text-[0.68rem]">{t('follow.following')}</AppText>
          </button>
          {bestDisplay && (
            <>
              <QuietDivider orientation="vertical" />
              <StatPill value={bestDisplay} label={t('profile.personalBest')} />
            </>
          )}
        </div>

        {/* Empty state */}
        {stats.total === 0 ? (
          <div className="py-12 text-center">
            <AppText variant="titleL" color="primary" as="p" className="mb-2">
              The waters are quiet.
            </AppText>
            <AppText variant="bodyM" color="secondary" as="p">
              {t('profile.emptyHint')}
            </AppText>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Monthly trend */}
            <AppCard surface="surface" bordered padding="md">
              <AppText variant="labelM" color="tertiary" as="p" className="mb-4">{t('profile.monthlyTrend')}</AppText>
              <div className="flex items-end gap-1.5 h-[60px]">
                {stats.months.map(({ label, count }) => (
                  <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
                    <div
                      className="w-full rounded-t-sm transition-all duration-300"
                      style={{
                        height: count > 0 ? `${Math.round((count / maxMonth) * 44)}px` : 0,
                        background: 'var(--color-accent)',
                        opacity: count > 0 ? 0.75 : 0,
                      }}
                    />
                    <AppText variant="labelM" color="tertiary" as="span" className="normal-case tracking-normal text-[9px]">{label}</AppText>
                  </div>
                ))}
              </div>
            </AppCard>

            {/* Top species */}
            {stats.topSpecies.length > 0 && (
              <AppCard surface="surface" bordered padding="md">
                <AppText variant="labelM" color="tertiary" as="p" className="mb-4">{t('profile.topSpecies')}</AppText>
                <div className="space-y-3.5">
                  {stats.topSpecies.map(([name, count]) => (
                    <div key={name} className="flex items-center gap-3">
                      <AppText variant="bodyM" color="primary" as="span" className="w-24 shrink-0 truncate font-[450]">{name}</AppText>
                      <div className="flex-1 h-[2px] rounded-full" style={{ background: 'var(--color-divider)' }}>
                        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.round((count / topMax) * 100)}%`, background: 'var(--color-accent)', opacity: 0.7 }} />
                      </div>
                      <AppText variant="labelM" color="tertiary" as="span" className="w-5 shrink-0 text-right normal-case tracking-normal text-[0.8rem]">{count}</AppText>
                    </div>
                  ))}
                </div>
              </AppCard>
            )}
          </div>
        )}
      </div>

      {followSheet && (
        <FollowListSheet
          uid={user.uid} type={followSheet} isOwn myUid={user.uid}
          onClose={() => setFollowSheet(null)}
          onUserClick={uid => { setFollowSheet(null); pushProfile(uid); }}
        />
      )}
    </div>
  );
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <AppText variant="numberM" color="primary" as="span">{value}</AppText>
      <AppText variant="labelM" color="tertiary" as="span" className="normal-case tracking-normal text-[0.68rem]">{label}</AppText>
    </div>
  );
}
