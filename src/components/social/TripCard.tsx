import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';
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
        className="w-9 h-9 rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-semibold shrink-0">
      {initials}
    </div>
  );
}

export function TripCard({ trip, displayName, photoUrl, isOwn, locale, onClick, onAvatarClick }: Props) {
  const { t } = useTranslation();
  const isLive = trip.status === 'open';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      className="w-full bg-surface rounded-[var(--radius-md)] border border-divider overflow-hidden text-left transition-colors duration-150 active:bg-surface/70 cursor-pointer"
    >
      {/* Header row — biome image/gradient strip */}
      <div className="relative flex items-center gap-2.5 px-4 pt-3.5 pb-2.5 overflow-hidden">
        {/* Biome background */}
        {(() => {
          const def = getBiome(trip.biome);
          return (
            <>
              <div className="absolute inset-0" style={{ background: def.gradient }} />
              <img
                src={def.image}
                className="absolute inset-0 w-full h-full object-cover"
                alt=""
                onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
              />
              {/* Scrim so text reads cleanly over any photo */}
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.48) 0%, rgba(0,0,0,0.18) 100%)' }}
              />
            </>
          );
        })()}

        {/* Content sits above the background */}
        <div className="relative flex items-center gap-2.5 w-full">
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
            <p className="text-sm font-semibold text-white leading-tight truncate drop-shadow-sm">
              {isOwn ? t('feed.you') : displayName}
            </p>
            {trip.approximateLocationName && (
              <p className="flex items-center gap-1 text-[11px] text-white/75 leading-tight mt-0.5">
                <MapPin size={10} strokeWidth={2} />
                {trip.approximateLocationName}
              </p>
            )}
          </div>
          <span className="text-[11px] text-white/70 shrink-0">{timeAgo(trip.startedAt, locale)}</span>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pb-3 space-y-2">
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-success shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              {t('feed.live')}
            </span>
          )}
          <p className="text-[0.95rem] font-semibold text-text leading-snug truncate">
            {trip.title || t('log.tripTitlePlaceholder')}
          </p>
        </div>

        {trip.note && (
          <p className="text-[0.82rem] text-text-muted leading-snug line-clamp-2">{trip.note}</p>
        )}

        {/* Species chips */}
        {trip.species.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
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
        <div className="flex items-center gap-2 flex-wrap pt-0.5">
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
