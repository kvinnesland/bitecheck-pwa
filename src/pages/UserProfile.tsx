import { useTranslation } from 'react-i18next';
import { ArrowLeft, MapPin } from 'lucide-react';
import type { User } from 'firebase/auth';
import { useUserProfile } from '../hooks/useUserProfile';
import { useUserPublicTrips } from '../hooks/useUserPublicTrips';
import { TripCard } from '../components/social/TripCard';
import type { Trip } from '../types';

interface Props {
  targetUid: string;
  currentUser: User;
  onBack: () => void;
  onTripClick: (trip: Trip) => void;
}

function StatPill({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-0">
      <span className="text-lg font-bold text-text tabular-nums">{value}</span>
      <span className="text-[11px] text-text-muted whitespace-nowrap">{label}</span>
    </div>
  );
}

export function UserProfile({ targetUid, currentUser, onBack, onTripClick }: Props) {
  const { t, i18n } = useTranslation();
  const isOwn = targetUid === currentUser.uid;
  const { profile, loading: profileLoading } = useUserProfile(targetUid);
  const { trips, loading: tripsLoading } = useUserPublicTrips(targetUid, isOwn);

  const displayName = profile?.displayName ?? '…';
  const photoUrl = profile?.photoURL ?? null;
  const initials = displayName
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 bg-surface border-b border-divider shrink-0"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)', paddingBottom: 12 }}
      >
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full text-text-muted -ml-1"
          aria-label={t('log.back')}
        >
          <ArrowLeft size={20} strokeWidth={1.75} />
        </button>
        <p className="text-[0.95rem] font-semibold text-text truncate flex-1">{displayName}</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {profileLoading ? (
          <div className="px-4 pt-6 space-y-4">
            <div className="h-20 bg-surface rounded-[var(--radius-md)] border border-divider animate-pulse" />
            <div className="h-32 bg-surface rounded-[var(--radius-md)] border border-divider animate-pulse" />
          </div>
        ) : (
          <div className="px-4 pt-5 pb-10 space-y-5">
            {/* Avatar + name */}
            <div className="flex items-center gap-4">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xl font-bold shrink-0">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[1.1rem] font-bold text-text leading-tight">{displayName}</p>
                {profile?.username && (
                  <p className="text-sm text-text-muted">@{profile.username}</p>
                )}
                {profile?.mainLocation && (
                  <p className="flex items-center gap-1 text-[11px] text-text-muted mt-0.5">
                    <MapPin size={11} strokeWidth={1.75} />
                    {profile.mainLocation}
                  </p>
                )}
              </div>
            </div>

            {/* Stats */}
            {profile && (
              <div className="bg-surface border border-divider rounded-[var(--radius-md)] px-4 py-3 flex justify-around">
                <StatPill value={profile.catchCount} label={t('profile.catches')} />
                <StatPill value={profile.speciesCount} label={t('profile.species')} />
                <StatPill value={profile.followersCount} label={t('profile.followers')} />
                <StatPill value={profile.followingCount} label={t('profile.following')} />
              </div>
            )}

            {/* Trip list */}
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
                <div className="bg-surface border border-divider rounded-[var(--radius-md)] px-4 py-6 text-center">
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
        )}
      </div>
    </div>
  );
}
