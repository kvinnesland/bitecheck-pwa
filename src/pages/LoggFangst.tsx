import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { type User } from 'firebase/auth';
import { useGeolocation } from '../hooks/useGeolocation';
import { useReverseGeocode } from '../hooks/useReverseGeocode';
import { createCatch } from '../lib/catches';
import { consumePendingSpecies } from '../lib/navigationStore';
import { useUnits } from '../contexts/UnitsContext';
import { weightUnitLabel, lengthUnitLabel, parseWeightToKg, parseLengthToCm } from '../lib/units';
import { FishSvg } from '../components/species/FishSvg';
import { SpeciesCardHeader } from '../components/species/SpeciesCardHeader';
import { cn } from '@/lib/utils';

const TripMapSnippet = React.lazy(() => import('../components/TripMapSnippet'));

const SALT_SPECIES = [
  'Torsk', 'Kveite', 'Sei', 'Hyse', 'Lange', 'Brosme', 'Uer', 'Steinbit',
  'Makrell', 'Rødspette', 'Lomre', 'Sandflyndre', 'Sild', 'Laks', 'Sjøørret', 'Sjørøye',
];
const FRESH_SPECIES = ['Ørret', 'Røye', 'Abbor', 'Gjedde', 'Harr'];
const ALL_SPECIES = [...SALT_SPECIES, ...FRESH_SPECIES];

type Step = 'trip' | 'details' | 'success';
type WaterType = 'salt' | 'fresh';
type LocationPref = 'exact' | 'approximate' | 'hidden';

const LOCATION_ZOOM: Record<LocationPref, number> = {
  exact: 12,
  approximate: 9,
  hidden: 5,
};

interface Props { user: User; }

export function LoggFangst({ user }: Props) {
  const { t, i18n } = useTranslation();
  const { prefs } = useUnits();
  const { status: geoStatus, position } = useGeolocation();
  const weightRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('trip');

  const [locationPref, setLocationPref] = useState<LocationPref>(
    () => (localStorage.getItem('bc_location_pref') as LocationPref) ?? 'approximate',
  );
  const [waterType, setWaterType] = useState<WaterType>(
    () => (localStorage.getItem('bc_water_type') as WaterType) ?? 'salt',
  );
  const [tripTitle, setTripTitle] = useState('');
  const [titleEdited, setTitleEdited] = useState(false);
  const [notes, setNotes] = useState('');
  const [query, setQuery] = useState('');

  const [species, setSpecies] = useState('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [saving, setSaving] = useState(false);

  const placeName = useReverseGeocode(position, locationPref, i18n.language);

  useEffect(() => {
    if (placeName && !titleEdited) {
      setTripTitle(t('log.tripNear', { place: placeName }));
    }
  }, [placeName, titleEdited, t]);

  useEffect(() => { localStorage.setItem('bc_location_pref', locationPref); }, [locationPref]);
  useEffect(() => { localStorage.setItem('bc_water_type', waterType); }, [waterType]);

  useEffect(() => {
    const pending = consumePendingSpecies();
    if (pending) {
      setSpecies(pending);
      setStep('details');
      setTimeout(() => weightRef.current?.focus(), 100);
    }
  }, []);

  const searchQuery = query.trim().toLowerCase();
  const isSearching = searchQuery.length > 0;
  const displayedSpecies = isSearching
    ? ALL_SPECIES.filter((s) =>
        s.toLowerCase().includes(searchQuery) ||
        t(`speciesNames.${s}`, { defaultValue: s }).toLowerCase().includes(searchQuery),
      )
    : (waterType === 'salt' ? SALT_SPECIES : FRESH_SPECIES);

  function selectSpecies(name: string) {
    setSpecies(name);
    setStep('details');
    setTimeout(() => weightRef.current?.focus(), 100);
  }

  async function handleSave() {
    if (!species) return;
    setSaving(true);
    try {
      await createCatch({
        userId: user.uid,
        species,
        weight_kg: weight ? parseWeightToKg(weight, prefs.weight) : null,
        length_cm: length ? parseLengthToCm(length, prefs.length) : null,
        location: position,
      });
      setStep('success');
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setStep('trip');
    setSpecies('');
    setWeight('');
    setLength('');
    setQuery('');
    setTitleEdited(false);
  }

  // ─── Success ─────────────────────────────────────────────────────────────────

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 py-8 gap-2.5 text-center">
        <div className="w-16 h-16 bg-success/10 border-2 border-success rounded-full flex items-center justify-center mb-2">
          <svg className="w-8 h-8 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
        </div>
        <h2 className="text-[1.4rem] font-bold">{t('log.saved')}</h2>
        <p className="text-[1.1rem] font-semibold text-accent">{t(`speciesNames.${species}`, { defaultValue: species })}</p>
        {weight && (
          <p className="text-[0.9rem] text-text-muted">
            {weight} {weightUnitLabel(prefs.weight)}{length ? ` · ${length} ${lengthUnitLabel(prefs.length)}` : ''}
          </p>
        )}
        <p className="text-xs text-text-muted mb-4">
          {geoStatus === 'ok' ? t('log.gpsRecorded') : t('log.noGps')}
        </p>
        <button
          onClick={reset}
          className="bg-accent text-white text-base font-semibold py-[15px] rounded-[var(--radius-md)] w-full transition-colors duration-150 hover:bg-accent/80"
        >
          {t('log.logNew')}
        </button>
      </div>
    );
  }

  // ─── Details ─────────────────────────────────────────────────────────────────

  if (step === 'details') {
    const gpsColors: Record<string, string> = {
      ok:        'text-success border-success',
      acquiring: 'text-warning border-warning',
    };
    const gpsRowCls = cn(
      'flex items-center gap-2 text-[0.8rem] px-3.5 py-2.5 rounded-[var(--radius-sm)] bg-surface border shrink-0',
      gpsColors[geoStatus] ?? 'text-text-muted border-divider',
    );

    return (
      <div className="flex flex-col h-full overflow-y-auto px-4 py-5 pb-6 gap-4">
        <button
          className="flex items-center gap-1 bg-transparent text-text-muted text-sm p-0 shrink-0 hover:text-text transition-colors duration-150"
          onClick={() => setStep('trip')}
        >
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {t('log.back')}
        </button>

        <div className="bg-surface border border-divider rounded-[var(--radius-lg)] overflow-hidden flex flex-col flex-1">
          <div className="px-5 py-4 border-b border-divider">
            <SpeciesCardHeader
              name={species}
              action={
                <button
                  className="bg-transparent text-accent text-[0.8rem] p-0"
                  onClick={() => setStep('trip')}
                >
                  {t('log.change')}
                </button>
              }
            />
          </div>

          <div className="px-5 py-5 flex flex-col gap-4 flex-1">
            <div className="flex flex-col gap-3 shrink-0">
              <label className="flex flex-col gap-1.5">
                <span className="text-[0.75rem] font-semibold uppercase tracking-[0.06em] text-text-muted">
                  {t('log.weight')} <span className="font-normal normal-case tracking-normal">({weightUnitLabel(prefs.weight)})</span>
                </span>
                <input
                  ref={weightRef}
                  className="bg-surface border border-divider rounded-[var(--radius-md)] text-text text-[1.2rem] font-semibold px-4 py-3.5 outline-none transition-colors duration-150 w-full focus:border-accent placeholder:text-divider placeholder:font-normal"
                  type="number"
                  inputMode="decimal"
                  placeholder="0.0"
                  min="0"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[0.75rem] font-semibold uppercase tracking-[0.06em] text-text-muted">
                  {t('log.length')} <span className="font-normal normal-case tracking-normal">({lengthUnitLabel(prefs.length)})</span>
                </span>
                <input
                  className="bg-surface border border-divider rounded-[var(--radius-md)] text-text text-[1.2rem] font-semibold px-4 py-3.5 outline-none transition-colors duration-150 w-full focus:border-accent placeholder:text-divider placeholder:font-normal"
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  min="0"
                  step="1"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                />
              </label>
            </div>

            <div className={gpsRowCls}>
              <GpsIcon status={geoStatus} />
              <GpsLabel status={geoStatus} accuracy={position?.accuracy_m} />
            </div>

            <button
              className="bg-accent text-white text-base font-semibold py-[15px] rounded-[var(--radius-md)] w-full transition-[background,opacity] duration-150 shrink-0 mt-auto disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:bg-accent/80"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? t('log.saving') : t('log.save')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Trip (step 1) ────────────────────────────────────────────────────────────

  const zoom = LOCATION_ZOOM[locationPref];

  return (
    <div className="flex flex-col h-full overflow-y-auto">

      {/* Map snippet */}
      <div className="relative h-44 shrink-0 bg-surface border-b border-divider overflow-hidden">
        {position ? (
          <Suspense fallback={<div className="w-full h-full bg-surface animate-pulse" />}>
            <TripMapSnippet position={position} zoom={zoom} showMarker={locationPref === 'exact'} />
          </Suspense>
        ) : (
          <div className="flex items-center justify-center h-full gap-2 text-text-muted text-sm">
            <svg className="w-4 h-4 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
            {t('log.mapLoading')}
          </div>
        )}

        {/* Privacy pills */}
        <div className="absolute bottom-2 left-2 flex gap-1">
          {(['exact', 'approximate', 'hidden'] as const).map((pref) => (
            <button
              key={pref}
              className={cn(
                'text-[0.65rem] font-semibold px-2 py-0.5 rounded-full transition-colors duration-150 backdrop-blur-sm',
                locationPref === pref
                  ? 'bg-accent text-white'
                  : 'bg-black/40 text-white hover:bg-black/60',
              )}
              onClick={() => setLocationPref(pref)}
            >
              {t(`log.location${pref === 'hidden' ? 'Region' : pref.charAt(0).toUpperCase() + pref.slice(1)}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Trip context fields */}
      <div className="px-4 pt-4 pb-2 flex flex-col gap-3 shrink-0">
        <input
          className="bg-surface border border-divider rounded-[var(--radius-md)] text-text text-[1rem] font-semibold px-4 py-3 outline-none transition-colors duration-150 w-full focus:border-accent placeholder:text-text-muted placeholder:font-normal"
          type="text"
          placeholder={t('log.tripTitlePlaceholder')}
          value={tripTitle}
          onChange={(e) => {
            setTripTitle(e.target.value);
            setTitleEdited(true);
          }}
        />

        <textarea
          className="bg-surface border border-divider rounded-[var(--radius-md)] text-text text-[0.9rem] px-4 py-3 outline-none transition-colors duration-150 w-full focus:border-accent placeholder:text-text-muted resize-none"
          placeholder={t('log.tripNotesPlaceholder')}
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* Water type toggle */}
        <div className="flex gap-1 bg-surface border border-divider rounded-[var(--radius-md)] p-1">
          {(['salt', 'fresh'] as const).map((wt) => (
            <button
              key={wt}
              className={cn(
                'flex-1 py-2 text-sm font-semibold rounded-[calc(var(--radius-md)-4px)] transition-colors duration-150',
                waterType === wt ? 'bg-accent text-white' : 'text-text-muted hover:text-text',
              )}
              onClick={() => setWaterType(wt)}
            >
              {t(wt === 'salt' ? 'predictions.saltwater' : 'predictions.freshwater')}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="w-full bg-surface border border-divider rounded-[var(--radius-md)] text-text text-[0.95rem] py-2.5 pl-[38px] pr-3 outline-none transition-colors duration-150 focus:border-accent placeholder:text-text-muted"
            type="text"
            placeholder={t('log.searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Species list */}
      <div className="px-4 pb-6 flex flex-col">
        {displayedSpecies.length > 0 ? (
          displayedSpecies.map((name) => (
            <button
              key={name}
              className="flex items-center gap-3 w-full py-3 px-1 text-left border-b border-divider last:border-0 transition-colors duration-150 hover:bg-surface active:bg-surface/60"
              onClick={() => selectSpecies(name)}
            >
              <FishSvg name={name} className="w-10 h-7 shrink-0 text-text-muted" />
              <span className="text-[0.95rem] font-medium text-text flex-1">
                {t(`speciesNames.${name}`, { defaultValue: name })}
              </span>
              <svg className="w-4 h-4 text-text-muted shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))
        ) : (
          <button
            className="flex items-center gap-3 w-full py-3 px-3 text-accent font-semibold text-[0.95rem] border border-dashed border-accent rounded-[var(--radius-md)]"
            onClick={() => selectSpecies(query.trim())}
          >
            {t('log.addCustom', { name: query.trim() })}
          </button>
        )}
      </div>
    </div>
  );
}

function GpsIcon({ status }: { status: string }) {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {status === 'ok' ? (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </>
      ) : status === 'acquiring' ? (
        <>
          <circle cx="12" cy="12" r="3" strokeDasharray="4 2" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeDasharray="4 2" />
        </>
      ) : (
        <>
          <line x1="2" y1="2" x2="22" y2="22" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

function GpsLabel({ status, accuracy }: { status: string; accuracy?: number }) {
  const { t } = useTranslation();
  switch (status) {
    case 'acquiring': return <>{t('gps.acquiring')}</>;
    case 'ok': return <>{accuracy ? t('gps.ok', { accuracy: Math.round(accuracy) }) : t('gps.okReady')}</>;
    case 'denied': return <>{t('gps.denied')}</>;
    default: return <>{t('gps.unavailable')}</>;
  }
}
