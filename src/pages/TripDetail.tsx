import React, { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Fish, Camera, MapPin, Images } from 'lucide-react';
import { useUnits } from '../contexts/UnitsContext';
import { formatWeight, formatLength } from '../lib/units';
import { useTripCatches } from '../hooks/useTripCatches';
import { ReactionBar } from '../components/ReactionBar';
import { CommentThread } from '../components/CommentThread';
import type { Trip, CatchRecord } from '../types';
import { cn } from '@/lib/utils';

const TripMapSnippet = React.lazy(() => import('../components/TripMapSnippet'));

interface Props {
  trip: Trip;
  isOwn: boolean;
  displayName: string;
  photoUrl: string | null;
  currentUserId: string;
  currentUsername: string;
  currentPhotoURL: string | null;
  onBack: () => void;
  onAddCatch: () => void;
}

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(iso: string, locale: string) {
  return new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

function CatchEntry({ c, weightUnit, lengthUnit }: {
  c: CatchRecord;
  weightUnit: 'kg' | 'lb';
  lengthUnit: 'cm' | 'in';
}) {
  const { t } = useTranslation();
  const measurements: string[] = [];
  if (c.species.weight_kg != null) measurements.push(formatWeight(c.species.weight_kg, weightUnit));
  if (c.species.length_cm != null) measurements.push(formatLength(c.species.length_cm, lengthUnit));

  if (c.isMoment) {
    return (
      <div className="flex gap-3 py-3 border-b border-divider last:border-0">
        <div className="w-10 h-10 rounded-full bg-divider flex items-center justify-center shrink-0 mt-0.5">
          <Camera size={18} className="text-text-muted" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          {c.caption && <p className="text-sm text-text leading-snug">{c.caption}</p>}
          <p className="text-[11px] text-text-muted mt-1">{formatTime(c.created_at, 'default')}</p>
        </div>
      </div>
    );
  }

  const photoRefs = c.photoRefs ?? [];
  const thumbUrl = photoRefs.length > 0
    ? photoRefs[photoRefs.length - 1]
    : `https://picsum.photos/seed/${c.catch_id.slice(0, 8)}/80/80`;

  return (
    <div className="flex gap-3 py-3 border-b border-divider last:border-0">
      {/* Photo thumbnail */}
      <div className="relative shrink-0 mt-0.5">
        <img
          src={thumbUrl}
          alt=""
          className="w-14 h-14 rounded-[var(--radius-sm)] object-cover bg-divider"
          onError={e => {
            const el = e.currentTarget;
            el.style.display = 'none';
            (el.nextElementSibling as HTMLElement | null)?.style.setProperty('display', 'flex');
          }}
        />
        {/* Fallback icon if image fails */}
        <div className="w-14 h-14 rounded-[var(--radius-sm)] bg-accent/10 items-center justify-center shrink-0 hidden">
          <Fish size={20} className="text-accent" strokeWidth={1.5} />
        </div>
        {photoRefs.length > 1 && (
          <span className="absolute bottom-1 right-1 flex items-center gap-0.5 bg-black/50 text-white text-[10px] font-semibold px-1 py-0.5 rounded">
            <Images size={9} strokeWidth={2} />
            {photoRefs.length}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text leading-tight">
          {t(`speciesNames.${c.species.name}`, { defaultValue: c.species.name })}
        </p>
        {measurements.length > 0 && (
          <p className="text-xs text-text-muted mt-0.5">{measurements.join(' · ')}</p>
        )}
        {c.caption && (
          <p className="text-sm text-text mt-1.5 leading-snug">{c.caption}</p>
        )}
        <p className="text-[11px] text-text-muted mt-1">{formatTime(c.created_at, 'default')}</p>
      </div>
    </div>
  );
}

export function TripDetail({ trip, isOwn, currentUserId, currentUsername, currentPhotoURL, onBack, onAddCatch }: Props) {
  const { t, i18n } = useTranslation();
  const { prefs } = useUnits();
  const { catches, loading } = useTripCatches(trip.tripId);
  const isLive = trip.status === 'open';

  const hasMap = trip.location && trip.locationShare !== 'hidden';

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Fixed header */}
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
        <div className="flex-1 min-w-0">
          <p className="text-[0.95rem] font-semibold text-text leading-tight truncate">
            {trip.title || t('log.tripTitlePlaceholder')}
          </p>
          <p className="text-[11px] text-text-muted">{formatDate(trip.startedAt, i18n.language)}</p>
        </div>
        {isLive && (
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-success shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            {t('feed.live')}
          </span>
        )}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">

        {/* Map */}
        {hasMap && (
          <div className="h-44 bg-surface border-b border-divider overflow-hidden">
            <Suspense fallback={<div className="w-full h-full bg-surface animate-pulse" />}>
              <TripMapSnippet
                position={trip.location!}
                zoom={trip.locationShare === 'exact' ? 12 : 9}
                showMarker={trip.locationShare === 'exact'}
              />
            </Suspense>
          </div>
        )}

        <div className="px-4 py-4 space-y-5 pb-8">

          {/* Trip meta */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-muted">
            {trip.approximateLocationName && (
              <span className="flex items-center gap-1">
                <MapPin size={13} strokeWidth={1.75} />
                {trip.approximateLocationName}
              </span>
            )}
            <span>{t(trip.waterType === 'salt' ? 'predictions.saltwater' : 'predictions.freshwater')}</span>
            <span>{t('feed.catchCount', { count: trip.catchCount })}</span>
          </div>

          {/* Notes */}
          {trip.note && (
            <div className="bg-surface border border-divider rounded-[var(--radius-md)] px-4 py-3">
              <p className="text-sm text-text leading-relaxed">{trip.note}</p>
            </div>
          )}

          {/* Catches */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted mb-1">
              {t('feed.catches')}
            </p>
            <div className="bg-surface border border-divider rounded-[var(--radius-md)] px-4 divide-y divide-divider">
              {loading ? (
                <div className="py-6 text-center text-sm text-text-muted">{t('feed.loading')}</div>
              ) : catches.length === 0 ? (
                <div className="py-6 text-center text-sm text-text-muted">{t('feed.noCatches')}</div>
              ) : (
                catches.map(c => (
                  <CatchEntry key={c.catch_id} c={c} weightUnit={prefs.weight} lengthUnit={prefs.length} />
                ))
              )}
            </div>
          </div>

          {/* Reactions */}
          <ReactionBar
            tripId={trip.tripId}
            tripOwnerId={trip.uid}
            currentUserId={currentUserId}
            currentUsername={currentUsername}
            currentPhotoURL={currentPhotoURL}
          />

          {/* Comments */}
          <CommentThread
            tripId={trip.tripId}
            tripOwnerId={trip.uid}
            currentUserId={currentUserId}
            currentUsername={currentUsername}
            currentPhotoURL={currentPhotoURL}
          />

          {/* Add catch / moment (own + open trips only) */}
          {isOwn && isLive && (
            <button
              onClick={onAddCatch}
              className={cn(
                'w-full flex items-center justify-center gap-2',
                'border-2 border-dashed border-accent/40 rounded-[var(--radius-md)] py-4',
                'text-accent text-sm font-semibold',
                'transition-colors duration-150 hover:border-accent/70 hover:bg-accent/5',
              )}
            >
              + {t('feed.addCatch')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
