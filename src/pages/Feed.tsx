import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Settings, Search,
  Sun, Cloud, CloudSun, CloudRain, CloudSnow, CloudLightning, Wind,
} from 'lucide-react';
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
import { useUnits } from '../contexts/UnitsContext';
import { celsiusToDisplay, tempUnitLabel } from '../lib/units';
import { cn } from '@/lib/utils';
import type { Trip } from '../types';

type NavEntry =
  | { type: 'feed' }
  | { type: 'trip'; trip: Trip }
  | { type: 'profile'; uid: string };

interface Props {
  user: User;
  onSettingsOpen: () => void;
  onNavigate: (view: AppView) => void;
}

function weatherIcon(code: number | null, size = 20) {
  if (code == null) return <Cloud size={size} />;
  if (code === 0) return <Sun size={size} />;
  if (code <= 3) return <CloudSun size={size} />;
  if (code <= 48) return <Cloud size={size} />;
  if (code <= 67) return <CloudRain size={size} />;
  if (code <= 77) return <CloudSnow size={size} />;
  if (code <= 82) return <CloudRain size={size} />;
  return <CloudLightning size={size} />;
}

function weatherDescKey(code: number | null): string {
  if (code == null) return 'feed.weather.unknown';
  if (code === 0) return 'feed.weather.clear';
  if (code <= 3) return 'feed.weather.cloudy';
  if (code <= 48) return 'feed.weather.fog';
  if (code <= 67) return 'feed.weather.rain';
  if (code <= 77) return 'feed.weather.snow';
  if (code <= 82) return 'feed.weather.showers';
  return 'feed.weather.storm';
}

export function Feed({ user, onSettingsOpen, onNavigate }: Props) {
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
  const { trips, loading, hasMore, loadMore } = useFeedTrips(user.uid);

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

  const tempDisplay =
    weather.temp != null
      ? `${celsiusToDisplay(weather.temp, prefs.temp).toFixed(0)}${tempUnitLabel(prefs.temp)}`
      : null;

  const displayName = profile?.displayName ?? user.displayName ?? user.email?.split('@')[0] ?? '';

  // ── Trip detail ─────────────────────────────────────────────────────────────
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

  // ── User profile ─────────────────────────────────────────────────────────────
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

  // ── Main feed ───────────────────────────────────────────────────────────────
  return (
    <div className="h-full overflow-y-auto bg-bg">

      {/* Greeting header */}
      <div
        className="px-5 pb-4 bg-surface border-b border-divider"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-text-muted">{t(greetingKey)},</p>
            <h1 className="text-[1.3rem] font-bold text-text leading-tight tracking-tight">{firstName}</h1>
          </div>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label={t('search.title')}
              className={cn(
                'w-9 h-9 flex items-center justify-center rounded-[var(--radius-sm)]',
                'text-text-muted border border-divider',
                'transition-colors duration-150 hover:text-text hover:border-accent',
              )}
            >
              <Search size={18} strokeWidth={1.75} />
            </button>
            <button
              onClick={onSettingsOpen}
              aria-label={t('settings.title')}
              className={cn(
                'w-9 h-9 flex items-center justify-center rounded-[var(--radius-sm)]',
                'text-text-muted border border-divider',
                'transition-colors duration-150 hover:text-text hover:border-accent',
              )}
            >
              <Settings size={18} strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Weather strip */}
        <div className="mt-3 flex items-center gap-3 rounded-[var(--radius-sm)] bg-bg px-3.5 py-2.5 border border-divider">
          <span className="text-accent">{weatherIcon(weather.weathercode)}</span>
          <span className="flex-1 text-sm text-text">
            {weather.loading ? '…' : t(weatherDescKey(weather.weathercode))}
          </span>
          {weather.windspeed != null && (
            <span className="flex items-center gap-1 text-sm text-text-muted">
              <Wind size={14} strokeWidth={1.75} />
              {weather.windspeed.toFixed(0)} m/s
            </span>
          )}
          {tempDisplay && <span className="text-sm font-semibold text-text">{tempDisplay}</span>}
        </div>
      </div>

      {/* Trip list */}
      <div className="px-4 pt-4 pb-24 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-surface rounded-[var(--radius-md)] border border-divider animate-pulse" />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-divider bg-surface p-6 text-center">
            <p className="text-sm text-text-muted">{t('feed.empty')}</p>
          </div>
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
              />
            ))}
            {hasMore && (
              <button
                onClick={loadMore}
                className="w-full py-3 text-sm text-accent font-semibold border border-accent/30 rounded-[var(--radius-md)] hover:bg-accent/5 transition-colors duration-150"
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
