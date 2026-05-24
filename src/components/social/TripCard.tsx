import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';
import { getBiome } from '../../lib/biomes';
import { AppText } from '../ui/AppText';
import { cn } from '@/lib/utils';
import type { Trip } from '../../types';

interface Props {
  trip: Trip;
  displayName: string;
  photoUrl: string | null;
  isOwn: boolean;
  locale: string;
  onClick: () => void;
  onAvatarClick?: () => void;
  onEndTrip?: () => void;
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

function Avatar({ displayName, photoUrl, size = 'md' }: { displayName: string; photoUrl: string | null; size?: 'sm' | 'md' }) {
  const initials = displayName
    ? displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  const cls = size === 'sm' ? 'w-7 h-7 text-[0.7rem]' : 'w-8 h-8 text-sm';
  if (photoUrl) {
    return <img src={photoUrl} alt={displayName} referrerPolicy="no-referrer" className={cn(cls, 'rounded-full object-cover shrink-0')} />;
  }
  return (
    <div className={cn(cls, 'rounded-full bg-accent/15 flex items-center justify-center text-accent font-semibold shrink-0')}>
      {initials}
    </div>
  );
}

export function TripCard({ trip, displayName, photoUrl, isOwn, locale, onClick, onAvatarClick, onEndTrip }: Props) {
  const { t } = useTranslation();
  const def = getBiome(trip.biome);
  const isLive = trip.status === 'open';
  const totalReactions = Object.values(trip.reactionCounts ?? {}).reduce((a, b) => a + b, 0);

  const activityTime = trip.lastUpdated ?? trip.startedAt;
  const wasUpdated = trip.lastUpdated && trip.lastUpdated !== trip.startedAt;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      className="w-full bg-elevated rounded-[var(--radius-lg)] overflow-hidden text-left cursor-pointer transition-opacity duration-150 active:opacity-75"
    >
      {/* ── Large atmospheric image panel ── */}
      <div className="relative h-44 overflow-hidden">
        <div className="absolute inset-0" style={{ background: def.gradient }} />
        <img
          src={def.image}
          className="absolute inset-0 w-full h-full object-cover"
          alt=""
          onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.55) 80%)' }}
        />

        {/* Live badge */}
        {isLive && (
          <div className="absolute top-3.5 left-4 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white">{t('feed.live')}</span>
          </div>
        )}

        {/* End trip button — own live trips only */}
        {isOwn && isLive && onEndTrip && (
          <button
            onClick={e => { e.stopPropagation(); onEndTrip(); }}
            className="absolute top-3.5 right-4 text-[10px] font-semibold uppercase tracking-wider text-white/80 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1 hover:bg-black/50 transition-colors"
          >
            {t('feed.endTrip')}
          </button>
        )}

        {/* Author row — bottom of image */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 flex items-end justify-between">
          <div className="flex items-center gap-2.5">
            {onAvatarClick ? (
              <button onClick={e => { e.stopPropagation(); onAvatarClick(); }} className="shrink-0 rounded-full" aria-label={displayName}>
                <Avatar displayName={displayName} photoUrl={photoUrl} />
              </button>
            ) : (
              <Avatar displayName={displayName} photoUrl={photoUrl} />
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-[0.82rem] font-semibold text-white leading-tight truncate drop-shadow-sm">
                {isOwn ? t('feed.you') : displayName}
              </span>
              {trip.approximateLocationName && (
                <span className="flex items-center gap-1 text-[0.68rem] text-white/70 leading-tight mt-0.5">
                  <MapPin size={9} strokeWidth={2} />
                  {trip.approximateLocationName}
                </span>
              )}
            </div>
          </div>
          <span className="text-[0.68rem] text-white/60 shrink-0 pb-0.5">
            {wasUpdated ? t('feed.updatedAgo', { time: timeAgo(activityTime, locale) }) : timeAgo(activityTime, locale)}
          </span>
        </div>
      </div>

      {/* ── Content body ── */}
      <div className="px-4 pt-4 pb-4 space-y-3">
        {/* Title */}
        <div>
          <AppText variant="titleM" color="primary" as="p" className="leading-snug">
            {trip.title || t('log.tripTitlePlaceholder')}
          </AppText>
          {trip.latestComment ? (
            <AppText variant="bodyM" color="secondary" as="p" className="mt-1.5 line-clamp-2">
              {trip.latestComment}
            </AppText>
          ) : trip.note ? (
            <AppText variant="bodyM" color="secondary" as="p" className="mt-1.5 line-clamp-2">
              {trip.note}
            </AppText>
          ) : null}
        </div>

        {/* Species chips */}
        {trip.species.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {trip.species.slice(0, 4).map(s => (
              <span
                key={s}
                className="text-[0.72rem] font-medium bg-accent-subtle text-accent px-2.5 py-[3px] rounded-full"
              >
                {t(`speciesNames.${s}`, { defaultValue: s })}
              </span>
            ))}
            {trip.species.length > 4 && (
              <span className="text-[0.72rem] text-text-subtle px-1 py-[3px]">+{trip.species.length - 4}</span>
            )}
          </div>
        )}

        {/* Quiet footer row */}
        <div className="flex items-center gap-3 pt-0.5">
          <AppText variant="labelM" color="tertiary" as="span" className="normal-case tracking-normal text-[0.7rem]">
            {trip.catchCount > 0
              ? t('feed.catchCount', { count: trip.catchCount })
              : t('feed.noCatchYet')}
          </AppText>
          <span className="w-px h-3 bg-divider" />
          <AppText variant="labelM" color="tertiary" as="span" className="normal-case tracking-normal text-[0.7rem]">
            {t(trip.waterType === 'salt' ? 'predictions.saltwater' : 'predictions.freshwater')}
          </AppText>
          {totalReactions > 0 && (
            <>
              <span className="w-px h-3 bg-divider" />
              <span className="text-[0.7rem] text-text-subtle">{totalReactions} {totalReactions === 1 ? 'reaction' : 'reactions'}</span>
            </>
          )}
          {(trip.commentCount ?? 0) > 0 && (
            <>
              <span className="w-px h-3 bg-divider" />
              <span className="text-[0.7rem] text-text-subtle">{trip.commentCount} {(trip.commentCount ?? 0) === 1 ? 'comment' : 'comments'}</span>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
