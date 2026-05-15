import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Settings, MapPin, Fish,
  Sun, Cloud, CloudSun, CloudRain, CloudSnow, CloudLightning,
  Wind,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import { useGeolocation } from '../hooks/useGeolocation';
import { useFeedWeather } from '../hooks/useFeedWeather';
import { useFeedPosts, type FeedPost } from '../hooks/useFeedPosts';
import { useUnits } from '../contexts/UnitsContext';
import { celsiusToDisplay, tempUnitLabel, formatWeight, formatLength } from '../lib/units';
import { cn } from '@/lib/utils';

interface Props {
  user: User;
  onSettingsOpen: () => void;
}

function weatherIcon(code: number | null, size = 22) {
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

function timeAgo(isoString: string, locale: string): string {
  const diffMs = new Date(isoString).getTime() - Date.now();
  const diffMins = Math.round(diffMs / 60_000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (Math.abs(diffMins) < 60) return rtf.format(diffMins, 'minute');
  const diffHours = Math.round(diffMins / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
  return rtf.format(Math.round(diffHours / 24), 'day');
}

function UserAvatar({
  displayName,
  photoUrl,
  size = 36,
}: {
  displayName: string;
  photoUrl: string | null;
  size?: number;
}) {
  const initials = displayName
    ? displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={displayName}
        referrerPolicy="no-referrer"
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}

function PostCard({ post, locale, weightUnit, lengthUnit, anglerLabel }: {
  post: FeedPost;
  locale: string;
  weightUnit: 'kg' | 'lb';
  lengthUnit: 'cm' | 'in';
  anglerLabel: string;
}) {
  const hasGps = post.location.accuracy_m !== -1 && !(post.location.lat === 0 && post.location.lng === 0);
  const displayName = post.display_name || anglerLabel;

  const measurements: string[] = [];
  if (post.weight_kg != null) measurements.push(formatWeight(post.weight_kg, weightUnit));
  if (post.length_cm != null) measurements.push(formatLength(post.length_cm, lengthUnit));

  return (
    <div className="bg-surface rounded-[var(--radius-md)] border border-divider overflow-hidden">
      {/* Post header */}
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-2.5">
        <UserAvatar displayName={displayName} photoUrl={post.photo_url} size={36} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text leading-tight truncate">{displayName}</p>
          {hasGps && (
            <p className="flex items-center gap-1 text-[11px] text-text-muted leading-tight mt-0.5">
              <MapPin size={10} strokeWidth={2} />
              {post.location.lat.toFixed(2)}° N, {post.location.lng.toFixed(2)}° E
            </p>
          )}
        </div>
        <span className="text-[11px] text-text-muted shrink-0">
          {timeAgo(post.created_at, locale)}
        </span>
      </div>

      {/* Photo placeholder with species overlay */}
      <div className="relative bg-divider/30" style={{ aspectRatio: '4/3' }}>
        {/* Gradient background */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(160deg, #0c2330 0%, #1a4a5e 50%, #2d7a8a 100%)' }}
        />

        {/* Fish icon centered */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <Fish size={72} strokeWidth={1} className="text-white" />
        </div>

        {/* Species + measurements overlay at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 px-3 pt-6 pb-3"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)' }}
        >
          <p className="text-white font-semibold text-[0.95rem] leading-tight">{post.species_name}</p>
          {measurements.length > 0 && (
            <p className="text-white/80 text-[0.8rem] mt-0.5">{measurements.join(' · ')}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function Feed({ user, onSettingsOpen }: Props) {
  const { t, i18n } = useTranslation();
  const { prefs } = useUnits();
  const { position } = useGeolocation();
  const weather = useFeedWeather(position?.lat ?? null, position?.lng ?? null);
  const posts = useFeedPosts(user);

  const hour = new Date().getHours();
  const greetingKey =
    hour < 12 ? 'feed.morning' : hour < 18 ? 'feed.afternoon' : 'feed.evening';
  const firstName =
    user.displayName?.split(' ')[0] ??
    user.email?.split('@')[0] ??
    t('feed.angler');

  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  const recentUsers = useMemo(() => {
    const seen = new Set<string>();
    const result: Pick<FeedPost, 'user_id' | 'display_name' | 'photo_url'>[] = [];
    for (const p of posts) {
      if (new Date(p.created_at).getTime() > cutoff && !seen.has(p.user_id)) {
        seen.add(p.user_id);
        result.push({ user_id: p.user_id, display_name: p.display_name, photo_url: p.photo_url });
      }
    }
    return result;
  }, [posts, cutoff]);

  const tempDisplay =
    weather.temp != null
      ? `${celsiusToDisplay(weather.temp, prefs.temp).toFixed(0)}${tempUnitLabel(prefs.temp)}`
      : null;

  return (
    <div className="h-full overflow-y-auto bg-bg">

      {/* ── Greeting header ─────────────────────────────────────────── */}
      <div
        className="px-5 pb-4 bg-surface border-b border-divider"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-text-muted">{t(greetingKey)},</p>
            <h1 className="text-[1.3rem] font-bold text-text leading-tight tracking-tight">
              {firstName}
            </h1>
          </div>
          <button
            onClick={onSettingsOpen}
            aria-label={t('settings.title')}
            className={cn(
              'mt-1 w-9 h-9 flex items-center justify-center rounded-[var(--radius-sm)]',
              'text-text-muted border border-divider',
              'transition-colors duration-150 hover:text-text hover:border-accent',
            )}
          >
            <Settings size={18} strokeWidth={1.75} />
          </button>
        </div>

        {/* Weather strip */}
        <div className="mt-3 flex items-center gap-3 rounded-[var(--radius-sm)] bg-bg px-3.5 py-2.5 border border-divider">
          <span className="text-accent">{weatherIcon(weather.weathercode, 20)}</span>
          <span className="flex-1 text-sm text-text">
            {weather.loading ? '…' : t(weatherDescKey(weather.weathercode))}
          </span>
          {weather.windspeed != null && (
            <span className="flex items-center gap-1 text-sm text-text-muted">
              <Wind size={14} strokeWidth={1.75} />
              {weather.windspeed.toFixed(0)} m/s
            </span>
          )}
          {tempDisplay && (
            <span className="text-sm font-semibold text-text">{tempDisplay}</span>
          )}
        </div>
      </div>

      <div className="px-4 pt-4 pb-24 space-y-4">

        {/* ── Recent updates ──────────────────────────────────────── */}
        {recentUsers.length > 0 && (
          <div>
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-text-muted">
              {t('feed.recentUpdates')}
            </p>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
              {recentUsers.map(u => (
                <div key={u.user_id} className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className="ring-2 ring-accent/40 rounded-full p-0.5">
                    <UserAvatar
                      displayName={u.display_name}
                      photoUrl={u.photo_url}
                      size={44}
                    />
                  </div>
                  <span className="text-[10px] text-text-muted max-w-[48px] truncate text-center">
                    {u.display_name || t('feed.angler')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Posts ───────────────────────────────────────────────── */}
        {posts.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-divider bg-surface p-6 text-center">
            <p className="text-sm text-text-muted">{t('feed.empty')}</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard
              key={post.catch_id}
              post={post}
              locale={i18n.language}
              weightUnit={prefs.weight}
              lengthUnit={prefs.length}
              anglerLabel={t('feed.angler')}
            />
          ))
        )}
      </div>
    </div>
  );
}
