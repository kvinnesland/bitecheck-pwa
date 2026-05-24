import React, { Suspense, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Fish, Camera, MapPin } from 'lucide-react';
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

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function CatchSlide({ c, weightUnit, lengthUnit }: {
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
      <div className="flex flex-col h-full bg-surface rounded-[var(--radius-md)] p-5 gap-3">
        <div className="w-10 h-10 rounded-full bg-divider flex items-center justify-center shrink-0">
          <Camera size={18} className="text-text-muted" strokeWidth={1.5} />
        </div>
        <p className="text-sm text-text leading-relaxed flex-1">{c.caption}</p>
        <p className="text-[11px] text-text-muted">{formatTime(c.created_at)}</p>
      </div>
    );
  }

  const photoRefs = c.photoRefs ?? [];
  const thumbUrl = photoRefs.length > 0
    ? photoRefs[photoRefs.length - 1]
    : `https://picsum.photos/seed/${c.catch_id.slice(0, 8)}/400/240`;

  return (
    <div className="flex flex-col bg-surface rounded-[var(--radius-md)] overflow-hidden">
      {/* Photo */}
      <div className="relative h-40 bg-divider">
        <img
          src={thumbUrl}
          alt=""
          className="w-full h-full object-cover"
          onError={e => {
            const el = e.currentTarget;
            el.style.display = 'none';
            (el.nextElementSibling as HTMLElement | null)?.style.setProperty('display', 'flex');
          }}
        />
        <div className="w-full h-full items-center justify-center hidden">
          <Fish size={32} className="text-accent/40" strokeWidth={1.5} />
        </div>
      </div>
      {/* Content */}
      <div className="p-4 space-y-1.5">
        <p className="text-sm font-semibold text-text">
          {t(`speciesNames.${c.species.name}`, { defaultValue: c.species.name })}
        </p>
        {measurements.length > 0 && (
          <p className="text-xs text-text-muted">{measurements.join(' · ')}</p>
        )}
        {c.caption && (
          <p className="text-sm text-text leading-snug">{c.caption}</p>
        )}
        <p className="text-[11px] text-text-muted pt-0.5">{formatTime(c.created_at)}</p>
      </div>
    </div>
  );
}

function CatchCarousel({ catches, weightUnit, lengthUnit }: {
  catches: CatchRecord[];
  weightUnit: 'kg' | 'lb';
  lengthUnit: 'cm' | 'in';
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  function handleScroll() {
    if (!scrollRef.current || catches.length === 0) return;
    const el = scrollRef.current;
    const slideWidth = el.scrollWidth / catches.length;
    setActiveIdx(Math.round(el.scrollLeft / slideWidth));
  }

  return (
    <div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none' }}
      >
        {catches.map(c => (
          <div key={c.catch_id} className="snap-start shrink-0 w-[calc(100vw-56px)]">
            <CatchSlide c={c} weightUnit={weightUnit} lengthUnit={lengthUnit} />
          </div>
        ))}
      </div>
      {catches.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {catches.map((c, i) => (
            <div
              key={c.catch_id}
              className={cn(
                'rounded-full transition-all duration-200',
                i === activeIdx ? 'w-3 h-1.5 bg-accent' : 'w-1.5 h-1.5 bg-divider',
              )}
            />
          ))}
        </div>
      )}
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
            <span>
              {trip.catchCount > 0
                ? t('feed.catchCount', { count: trip.catchCount })
                : t('feed.noCatchYet')}
            </span>
          </div>

          {/* Notes */}
          {trip.note && (
            <div className="bg-surface border border-divider rounded-[var(--radius-md)] px-4 py-3">
              <p className="text-sm text-text leading-relaxed">{trip.note}</p>
            </div>
          )}

          {/* Catches carousel */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted mb-3">
              {t('feed.catches')}
            </p>
            {loading ? (
              <div className="h-40 bg-surface rounded-[var(--radius-md)] animate-pulse" />
            ) : catches.length === 0 ? (
              <div className="h-24 bg-surface border border-divider rounded-[var(--radius-md)] flex items-center justify-center">
                <p className="text-sm text-text-muted">{t('feed.noCatches')}</p>
              </div>
            ) : (
              <CatchCarousel catches={catches} weightUnit={prefs.weight} lengthUnit={prefs.length} />
            )}
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

          {/* Add catch (own + open trips only) */}
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
