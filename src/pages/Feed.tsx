import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Bell, Settings } from 'lucide-react';
import type { User } from 'firebase/auth';
import type { AppView } from '../components/layout/BottomNav';
import { useGeolocation } from '../hooks/useGeolocation';
import { useFeedWeather } from '../hooks/useFeedWeather';
import { useFeedTrips } from '../hooks/useFeedTrips';
import { useUserProfile } from '../hooks/useUserProfile';
import { TripCard } from '../components/social/TripCard';
import { UserSearchSheet } from '../components/social/UserSearchSheet';
import { TripDetail } from './TripDetail';
import { UserProfile } from './UserProfile';
import { AppText } from '../components/ui/AppText';
import { EmptyState } from '../components/ui/EmptyState';
import { useUnits } from '../contexts/UnitsContext';
import { celsiusToDisplay, tempUnitLabel } from '../lib/units';
import { getBiome } from '../lib/biomes';
import { cn } from '@/lib/utils';
import { closeTrip } from '../lib/trips';
import type { Trip } from '../types';

type NavEntry =
  | { type: 'feed' }
  | { type: 'trip'; trip: Trip }
  | { type: 'profile'; uid: string };

interface Props {
  user: User;
  onSettingsOpen: () => void;
  onNavigate: (view: AppView) => void;
  unreadCount: number;
}

function weatherConditionText(code: number | null, t: (k: string) => string): string {
  if (code == null) return '';
  if (code === 0) return t('feed.weather.clear');
  if (code <= 3) return t('feed.weather.cloudy');
  if (code <= 48) return t('feed.weather.fog');
  if (code <= 67) return t('feed.weather.rain');
  if (code <= 77) return t('feed.weather.snow');
  if (code <= 82) return t('feed.weather.showers');
  return t('feed.weather.storm');
}

export function Feed({ user, onSettingsOpen, onNavigate, unreadCount }: Props) {
  const { t, i18n } = useTranslation();
  const { prefs } = useUnits();
  const { position } = useGeolocation();
  const { profile } = useUserProfile(user.uid);
  const [navStack, setNavStack] = useState<NavEntry[]>([{ type: 'feed' }]);
  const [searchOpen, setSearchOpen] = useState(false);

  const push = (entry: NavEntry) => setNavStack(s => [...s, entry]);
  const pop = () => setNavStack(s => s.length > 1 ? s.slice(0, -1) : s);
  const currentView = navStack[navStack.length - 1];

  const lat = position ? Math.round(position.lat * 100) / 100 : null;
  const lng = position ? Math.round(position.lng * 100) / 100 : null;
  const weather = useFeedWeather(lat, lng);
  const { trips, loading, hasMore, loadMore, patchTrip } = useFeedTrips(user.uid);

  function markSeen(tripId: string) {
    const key = `bc_seen_trips_${user.uid}`;
    const existing: string[] = JSON.parse(localStorage.getItem(key) ?? '[]');
    if (!existing.includes(tripId)) {
      localStorage.setItem(key, JSON.stringify([...existing, tripId].slice(-500)));
    }
  }

  const hour = new Date().getHours();
  const greetingKey = hour < 12 ? 'feed.morning' : hour < 18 ? 'feed.afternoon' : 'feed.evening';
  const firstName =
    profile?.displayName?.split(' ')[0] ??
    user.displayName?.split(' ')[0] ??
    user.email?.split('@')[0] ??
    t('feed.angler');

  const displayName = profile?.displayName ?? user.displayName ?? user.email?.split('@')[0] ?? '';
  const biomeDef = getBiome(profile?.biome);

  const tempDisplay = weather.temp != null
    ? `${celsiusToDisplay(weather.temp, prefs.temp).toFixed(0)}${tempUnitLabel(prefs.temp)}`
    : null;
  const conditionText = weatherConditionText(weather.weathercode, t);

  if (currentView.type === 'trip') {
    return (
      <TripDetail
        trip={currentView.trip}
        isOwn={currentView.trip.uid === user.uid}
        displayName={displayName}
        photoUrl={user.photoURL}
        currentUserId={user.uid}
        currentUsername={profile?.username ?? ''}
        currentPhotoURL={user.photoURL ?? null}
        onBack={pop}
        onAddCatch={() => { pop(); onNavigate('logg'); }}
      />
    );
  }

  if (currentView.type === 'profile') {
    return (
      <UserProfile
        targetUid={currentView.uid}
        currentUser={user}
        onBack={pop}
        onTripClick={trip => push({ type: 'trip', trip })}
        onUserClick={uid => push({ type: 'profile', uid })}
      />
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-bg">

      {/* ── Atmospheric header ──────────────────────────────────────────── */}
      <div className="relative">
        {/* Biome hero strip */}
        <div className="relative h-32 overflow-hidden">
          <div className="absolute inset-0" style={{ background: biomeDef.gradient }} />
          <img
            src={biomeDef.image}
            className="absolute inset-0 w-full h-full object-cover"
            alt=""
            onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%)' }}
          />

          {/* Header actions */}
          <div
            className="absolute top-0 right-0 flex items-center gap-1.5 px-4"
            style={{ paddingTop: 'calc(env(safe-area-inset-top) + 10px)' }}
          >
            <button
              onClick={() => setSearchOpen(true)}
              aria-label={t('search.title')}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-black/25 backdrop-blur-sm text-white/80 hover:text-white transition-colors"
            >
              <Search size={16} strokeWidth={1.75} />
            </button>
            <button
              onClick={() => onNavigate('varsler')}
              aria-label={t('notifs.title')}
              className="relative w-8 h-8 flex items-center justify-center rounded-full bg-black/25 backdrop-blur-sm text-white/80 hover:text-white transition-colors"
            >
              <Bell size={16} strokeWidth={1.75} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-0.5 bg-accent text-bg text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={onSettingsOpen}
              aria-label={t('settings.title')}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-black/25 backdrop-blur-sm text-white/80 hover:text-white transition-colors"
            >
              <Settings size={16} strokeWidth={1.75} />
            </button>
          </div>

          {/* Greeting */}
          <div className="absolute bottom-3 left-5">
            <p className="text-[0.72rem] font-medium text-white/70">{t(greetingKey)}</p>
            <AppText variant="titleL" as="h1" className="text-white leading-tight drop-shadow-sm">
              {firstName}
            </AppText>
          </div>
        </div>

        {/* Condition strip */}
        {(conditionText || tempDisplay || weather.windspeed != null) && !weather.loading && (
          <div className="flex items-center gap-2 px-5 py-3 bg-surface border-b border-divider">
            {conditionText && (
              <AppText variant="bodyM" color="secondary" as="span">{conditionText}</AppText>
            )}
            {tempDisplay && (
              <>
                <span className="w-px h-3.5 bg-divider" />
                <AppText variant="bodyM" color="primary" as="span" className="font-[500]">{tempDisplay}</AppText>
              </>
            )}
            {weather.windspeed != null && (
              <>
                <span className="w-px h-3.5 bg-divider" />
                <AppText variant="bodyM" color="secondary" as="span">{weather.windspeed.toFixed(0)} m/s</AppText>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Trip list ───────────────────────────────────────────────────── */}
      <div className="px-4 pt-5 pb-28 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-elevated rounded-[var(--radius-lg)] animate-pulse" />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <EmptyState
            headline="Nothing new from the water."
            body="The people you follow haven't shared anything yet. Try exploring new anglers."
            action={{ label: t('search.title'), onClick: () => setSearchOpen(true) }}
          />
        ) : (
          <>
            {trips.map(trip => (
              <TripCard
                key={trip.tripId}
                trip={trip}
                displayName={trip.uid === user.uid ? displayName : trip.authorDisplayName}
                photoUrl={trip.uid === user.uid ? user.photoURL : trip.authorPhotoURL}
                isOwn={trip.uid === user.uid}
                locale={i18n.language}
                onClick={() => { markSeen(trip.tripId); push({ type: 'trip', trip }); }}
                onAvatarClick={() => push({ type: 'profile', uid: trip.uid })}
                onEndTrip={trip.uid === user.uid && trip.status === 'open' ? async () => {
                  await closeTrip(trip.tripId).catch(() => {});
                  patchTrip(trip.tripId, { status: 'closed', closedAt: new Date().toISOString() });
                } : undefined}
              />
            ))}
            {hasMore && (
              <button
                onClick={loadMore}
                className={cn(
                  'w-full py-4 text-[0.82rem] font-medium text-text-muted',
                  'border border-divider rounded-[var(--radius-md)]',
                  'hover:text-text transition-colors duration-150',
                )}
              >
                {t('feed.loadMore')}
              </button>
            )}
          </>
        )}
      </div>

      {searchOpen && (
        <UserSearchSheet
          onClose={() => setSearchOpen(false)}
          onUserClick={uid => { setSearchOpen(false); push({ type: 'profile', uid }); }}
        />
      )}
    </div>
  );
}
