import { useTranslation } from 'react-i18next';
import { MapPin, Images } from 'lucide-react';
import { getBiome } from '../../lib/biomes';
import type { Trip } from '../../types';

interface Props {
  trip: Trip;
  displayName: string;
  photoUrl: string | null;
  isOwn: boolean;
  locale: string;
  onClick: () => void;
  onAvatarClick?: () => void;
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

function Avatar({ displayName, photoUrl }: { displayName: string; photoUrl: string | null }) {
  const initials = displayName
    ? displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={displayName}
        referrerPolicy="no-referrer"
        className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-white/40"
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-accent/80 flex items-center justify-center text-white text-xs font-semibold shrink-0 ring-2 ring-white/40">
      {initials}
    </div>
  );
}

export function TripCard({ trip, displayName, photoUrl, isOwn, locale, onClick, onAvatarClick }: Props) {
  const { t } = useTranslation();
  const isLive = trip.status === 'open';
  const def = getBiome(trip.biome);
  const photoCount = trip.photoCount ?? 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      className="w-full bg-surface rounded-[var(--radius-md)] border border-divider overflow-hidden text-left transition-colors duration-150 active:bg-surface/70 cursor-pointer"
    >
      {/* Photo area */}
      <div className="relative h-44 overflow-hidden">
        {/* Biome image / gradient */}
        <div className="absolute inset-0" style={{ background: def.gradient }} />
        <img
          src={def.image}
          className="absolute inset-0 w-full h-full object-cover"
          alt=""
          onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
        />

        {/* Bottom scrim for avatar legibility */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.10) 50%, rgba(0,0,0,0.15) 100%)' }}
        />

        {/* Top row: multi-photo indicator + time */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          {photoCount > 1 ? (
            <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-[11px] font-semibold px-2 py-1 rounded-full">
              <Images size={12} strokeWidth={2} />
              {photoCount}
            </span>
          ) : <span />}
          <span className="bg-black/40 backdrop-blur-sm text-white/90 text-[11px] px-2 py-1 rounded-full">
            {timeAgo(trip.startedAt, locale)}
          </span>
        </div>

        {/* Bottom row: avatar + name + location */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end gap-2">
          {onAvatarClick ? (
            <button
              onClick={e => { e.stopPropagation(); onAvatarClick(); }}
              className="shrink-0 rounded-full"
              aria-label={displayName}
            >
              <Avatar displayName={displayName} photoUrl={photoUrl} />
            </button>
          ) : (
            <Avatar displayName={displayName} photoUrl={photoUrl} />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-tight drop-shadow-sm truncate">
              {isOwn ? t('feed.you') : displayName}
            </p>
            {trip.approximateLocationName && (
              <p className="flex items-center gap-1 text-[11px] text-white/75 leading-tight mt-0.5">
                <MapPin size={10} strokeWidth={2} />
                {trip.approximateLocationName}
              </p>
            )}
          </div>
          {isLive && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white bg-success/80 backdrop-blur-sm px-2 py-0.5 rounded-full shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              {t('feed.live')}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pt-3 pb-4 space-y-3">
        <p className="text-[0.95rem] font-semibold text-text leading-snug">
          {trip.title || t('log.tripTitlePlaceholder')}
        </p>

        {trip.note && (
          <p className="text-[0.82rem] text-text-muted leading-snug line-clamp-2">{trip.note}</p>
        )}

        {/* Species chips */}
        {trip.species.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {trip.species.slice(0, 5).map(s => (
              <span
                key={s}
                className="text-[0.72rem] font-medium bg-accent/10 text-accent px-2 py-0.5 rounded-full"
              >
                {t(`speciesNames.${s}`, { defaultValue: s })}
              </span>
            ))}
            {trip.species.length > 5 && (
              <span className="text-[0.72rem] text-text-muted px-1">+{trip.species.length - 5}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[0.75rem] text-text-muted">
            {t('feed.catchCount', { count: trip.catchCount })}
            {' · '}
            {t(trip.waterType === 'salt' ? 'predictions.saltwater' : 'predictions.freshwater')}
          </span>
          {Object.values(trip.reactionCounts ?? {}).reduce((a, b) => a + b, 0) > 0 && (
            <span className="text-[0.75rem] text-text-muted">
              👍 {Object.values(trip.reactionCounts!).reduce((a, b) => a + b, 0)}
            </span>
          )}
          {(trip.commentCount ?? 0) > 0 && (
            <span className="text-[0.75rem] text-text-muted">💬 {trip.commentCount}</span>
          )}
        </div>
      </div>
    </div>
  );
}
