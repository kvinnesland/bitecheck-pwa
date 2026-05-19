import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { type User } from 'firebase/auth';
import { useGeolocation } from '../hooks/useGeolocation';
import { useReverseGeocode } from '../hooks/useReverseGeocode';
import { useUserProfile } from '../hooks/useUserProfile';
import { createCatch } from '../lib/catches';
import { startTrip, addCatchToTrip, closeTrip, fetchOpenTrip, setTripMultiDay } from '../lib/trips';
import { BIOMES, getBiome, DEFAULT_BIOME } from '../lib/biomes';
import { consumePendingSpecies } from '../lib/navigationStore';
import { getFixedSpeciesChoices, getSearchSpeciesResults, type FixedSpeciesChoice } from '../lib/speciesPicker';
import { useUnits } from '../contexts/UnitsContext';
import { weightUnitLabel, lengthUnitLabel, parseWeightToKg, parseLengthToCm } from '../lib/units';
import { FishSvg } from '../components/species/FishSvg';
import { SpeciesCardHeader } from '../components/species/SpeciesCardHeader';
import { AppText } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { AppCard } from '../components/ui/AppCard';
import { QuietDivider } from '../components/ui/QuietDivider';
import { cn } from '@/lib/utils';
import type { Trip, Biome, TripVisibility } from '../types';

const TripMapSnippet = React.lazy(() => import('../components/TripMapSnippet'));

type Step = 'trip' | 'details' | 'moment' | 'success';
type WaterType = 'salt' | 'fresh';
type LocationPref = 'exact' | 'approximate' | 'hidden';
type TripState = 'loading' | Trip | null;

const LOCATION_ZOOM: Record<LocationPref, number> = { exact: 12, approximate: 9, hidden: 5 };

const inputCls = [
  'bg-elevated border border-divider rounded-[var(--radius-md)]',
  'text-text text-[1rem] font-medium px-4 py-3.5 outline-none',
  'transition-colors duration-150 w-full',
  'focus:border-accent/60 placeholder:text-text-subtle placeholder:font-normal',
].join(' ');

const inputSmCls = [
  'bg-elevated border border-divider rounded-[var(--radius-md)]',
  'text-text text-[0.95rem] px-4 py-3 outline-none',
  'transition-colors duration-150 w-full',
  'focus:border-accent/60 placeholder:text-text-subtle',
].join(' ');

interface Props { user: User; }

export function LoggFangst({ user }: Props) {
  const { t, i18n } = useTranslation();
  const { prefs } = useUnits();
  const { status: geoStatus, position } = useGeolocation();
  const { profile } = useUserProfile(user.uid);
  const weightRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('trip');
  const [activeTrip, setActiveTrip] = useState<TripState>('loading');
  const [biome, setBiome] = useState<Biome>(DEFAULT_BIOME);
  const [biomeEdited, setBiomeEdited] = useState(false);

  const [locationPref, setLocationPref] = useState<LocationPref>(
    () => (localStorage.getItem('bc_location_pref') as LocationPref) ?? 'approximate',
  );
  const [waterType, setWaterType] = useState<WaterType>(
    () => (localStorage.getItem('bc_water_type') as WaterType) ?? 'salt',
  );
  const [tripTitle, setTripTitle]     = useState('');
  const [titleEdited, setTitleEdited] = useState(false);
  const [notes, setNotes]             = useState('');
  const [query, setQuery]             = useState('');

  const [species,  setSpecies]  = useState('');
  const [weight,   setWeight]   = useState('');
  const [length,   setLength]   = useState('');
  const [caption,  setCaption]  = useState('');
  const [saving,   setSaving]   = useState(false);
  const [visibility, setVisibility] = useState<TripVisibility>('everyone');
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [showPhotoMessage, setShowPhotoMessage] = useState(false);

  const placeName = useReverseGeocode(position, locationPref, i18n.language);

  useEffect(() => {
    if (placeName && !titleEdited) setTripTitle(t('log.tripNear', { place: placeName }));
  }, [placeName, titleEdited, t]);

  useEffect(() => { localStorage.setItem('bc_location_pref', locationPref); }, [locationPref]);
  useEffect(() => { localStorage.setItem('bc_water_type', waterType); }, [waterType]);

  useEffect(() => {
    fetchOpenTrip(user.uid).then(setActiveTrip).catch(() => setActiveTrip(null));
  }, [user.uid]);

  useEffect(() => {
    const pending = consumePendingSpecies();
    if (pending) {
      setSpecies(pending);
      setStep('details');
      setTimeout(() => weightRef.current?.focus(), 100);
    }
  }, []);

  const tripLoaded = activeTrip !== 'loading';
  useEffect(() => {
    if (typeof activeTrip === 'object' && activeTrip !== null && !titleEdited) {
      if (activeTrip.title) { setTripTitle(activeTrip.title); setTitleEdited(true); }
      if (activeTrip.note) setNotes(activeTrip.note);
      if (activeTrip.waterType) setWaterType(activeTrip.waterType);
      if (activeTrip.biome) { setBiome(activeTrip.biome); setBiomeEdited(true); }
      if (activeTrip.visibility) setVisibility(activeTrip.visibility);
      if (activeTrip.isMultiDay) setIsMultiDay(activeTrip.isMultiDay);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripLoaded]);

  useEffect(() => {
    if (profile?.biome && !biomeEdited) setBiome(profile.biome);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.biome]);

  const searchQuery = query.trim();
  const isSearching = searchQuery.length > 0;
  const fixedSpeciesChoices = getFixedSpeciesChoices();
  const displayedSpecies = getSearchSpeciesResults(query, waterType, (name) =>
    t(`speciesNames.${name}`, { defaultValue: name }),
  );

  function selectSpecies(name: string) {
    if (!tripLoaded) return;
    setSpecies(name);
    setStep('details');
    setTimeout(() => weightRef.current?.focus(), 100);
  }

  function selectFixedChoice(choice: FixedSpeciesChoice) {
    if (!tripLoaded) return;
    if (choice.action === 'moment') { setCaption(''); setStep('moment'); return; }
    if (choice.speciesName) selectSpecies(choice.speciesName);
  }

  async function handleSave() {
    if (!species || !tripLoaded) return;
    setSaving(true);
    try {
      let tripId: string;
      const existingTrip = activeTrip;

      if (existingTrip) {
        tripId = existingTrip.tripId;
        addCatchToTrip(tripId, species);
        setActiveTrip(prev =>
          typeof prev === 'object' && prev !== null
            ? { ...prev, catchCount: prev.catchCount + 1, species: prev.species.includes(species) ? prev.species : [...prev.species, species] }
            : prev,
        );
      } else {
        tripId = startTrip({
          uid: user.uid, title: tripTitle || null, note: notes || null,
          location: position, locationShare: locationPref,
          approximateLocationName: placeName, firstSpecies: species,
          waterType, visibility, isMultiDay, biome,
        });
        setActiveTrip({
          tripId, uid: user.uid, status: 'open', visibility, isMultiDay,
          title: tripTitle || null, note: notes || null,
          startedAt: new Date().toISOString(), closedAt: null,
          location: position, locationShare: locationPref,
          approximateLocationName: placeName, catchCount: 1,
          species: [species], waterType, biome,
        });
      }

      await createCatch({
        userId: user.uid, species,
        weight_kg: weight ? parseWeightToKg(weight, prefs.weight) : null,
        length_cm: length ? parseLengthToCm(length, prefs.length) : null,
        location: position, tripId, locationShare: locationPref,
        approximateLocationName: placeName, caption: caption || undefined,
      });
      setCaption('');
      setStep('success');
    } finally {
      setSaving(false);
    }
  }

  async function handleEndTrip() {
    const trip = activeTrip !== 'loading' ? activeTrip : null;
    if (trip) await closeTrip(trip.tripId).catch(() => {});
    setActiveTrip(null); setStep('trip'); setSpecies(''); setWeight('');
    setLength(''); setQuery(''); setTripTitle(''); setNotes(''); setCaption('');
    setTitleEdited(false); setBiomeEdited(false);
    setBiome(profile?.biome ?? DEFAULT_BIOME);
    setVisibility('everyone'); setIsMultiDay(false); setShowPhotoMessage(false);
  }

  async function handleSaveMoment() {
    if (!caption.trim() || !tripLoaded) return;
    setSaving(true);
    try {
      let tripId: string;
      const existingTrip = activeTrip;

      if (existingTrip) {
        tripId = existingTrip.tripId;
        addCatchToTrip(tripId, '');
        setActiveTrip(prev =>
          typeof prev === 'object' && prev !== null
            ? { ...prev, catchCount: prev.catchCount + 1 }
            : prev,
        );
      } else {
        tripId = startTrip({
          uid: user.uid, title: tripTitle || null, note: notes || null,
          location: position, locationShare: locationPref,
          approximateLocationName: placeName, firstSpecies: '',
          waterType, visibility, isMultiDay, biome,
        });
        setActiveTrip({
          tripId, uid: user.uid, status: 'open', visibility, isMultiDay,
          title: tripTitle || null, note: notes || null,
          startedAt: new Date().toISOString(), closedAt: null,
          location: position, locationShare: locationPref,
          approximateLocationName: placeName, catchCount: 1,
          species: [], waterType, biome,
        });
      }

      await createCatch({
        userId: user.uid, species: '', weight_kg: null, length_cm: null,
        location: position, tripId, locationShare: locationPref,
        approximateLocationName: placeName, caption: caption.trim(), isMoment: true,
      });
      setCaption('');
      setStep('success');
    } finally {
      setSaving(false);
    }
  }

  function handleContinueTrip() {
    setStep('trip'); setSpecies(''); setWeight(''); setLength(''); setQuery(''); setCaption('');
  }

  // ─── Success ──────────────────────────────────────────────────────────────────

  if (step === 'success') {
    const trip = activeTrip !== 'loading' ? activeTrip : null;
    const tripCatchCount = trip ? trip.catchCount : 1;
    const tripSpeciesCount = trip ? trip.species.length : 0;

    return (
      <div className="flex flex-col items-center justify-center h-full px-6 py-10 gap-6 text-center bg-bg">
        <div className="w-14 h-14 bg-accent-subtle rounded-full flex items-center justify-center">
          <svg className="w-7 h-7 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
        </div>

        <div className="space-y-1.5">
          <AppText variant="titleL" color="primary" as="h2">{t('log.saved')}</AppText>
          <AppText variant="bodyL" color="accent" as="p" className="font-[500]">
            {t(`speciesNames.${species}`, { defaultValue: species })}
          </AppText>
          {weight && (
            <AppText variant="bodyM" color="secondary" as="p">
              {weight} {weightUnitLabel(prefs.weight)}{length ? ` · ${length} ${lengthUnitLabel(prefs.length)}` : ''}
            </AppText>
          )}
        </div>

        {trip && (
          <>
            <div className="flex items-center gap-2 text-text-subtle text-[0.75rem]">
              <span>{t('log.tripSummary', { catches: tripCatchCount, species: tripSpeciesCount })}</span>
            </div>

            <div className="flex items-center justify-between w-full bg-surface rounded-[var(--radius-md)] px-4 py-3.5">
              <AppText variant="bodyM" color="primary">{t('log.multiDay')}</AppText>
              <button
                role="switch"
                aria-checked={isMultiDay}
                onClick={async () => {
                  const next = !isMultiDay;
                  setIsMultiDay(next);
                  await setTripMultiDay(trip.tripId, next).catch(() => {});
                }}
                className={cn(
                  'relative w-10 h-[22px] rounded-full transition-colors duration-200',
                  isMultiDay ? 'bg-accent' : 'bg-divider',
                )}
              >
                <span className={cn(
                  'absolute top-[2px] left-[2px] w-[18px] h-[18px] rounded-full bg-white transition-transform duration-200',
                  isMultiDay ? 'translate-x-[18px]' : 'translate-x-0',
                )} />
              </button>
            </div>
          </>
        )}

        <div className="flex flex-col gap-3 w-full">
          <AppButton variant="primary" fullWidth onClick={handleContinueTrip}>
            {t('log.continueTrip')}
          </AppButton>
          <AppButton variant="ghost" fullWidth onClick={handleEndTrip}>
            {t('log.endTrip')}
          </AppButton>
        </div>
      </div>
    );
  }

  // ─── Details ──────────────────────────────────────────────────────────────────

  if (step === 'details') {
    const gpsColors: Record<string, string> = {
      ok:        'text-success',
      acquiring: 'text-warning',
    };

    return (
      <div className="h-full overflow-y-auto bg-bg px-4 py-5 pb-8 space-y-4">
        <button
          className="flex items-center gap-1.5 text-text-muted text-sm hover:text-text transition-colors duration-150"
          onClick={() => setStep('trip')}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {t('log.back')}
        </button>

        <AppCard surface="surface" bordered padding="none">
          <div className="px-5 py-4 border-b border-divider">
            <SpeciesCardHeader
              name={species}
              action={
                <button className="text-accent text-[0.82rem]" onClick={() => setStep('trip')}>
                  {t('log.change')}
                </button>
              }
            />
          </div>

          <div className="px-5 py-5 space-y-5">
            {/* Measurements */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <AppText variant="labelM" color="tertiary" as="label">
                  {t('log.weight')} <span className="normal-case font-normal tracking-normal">({weightUnitLabel(prefs.weight)})</span>
                </AppText>
                <input
                  ref={weightRef}
                  className={inputCls}
                  type="number" inputMode="decimal"
                  placeholder="0.0" min="0" step="0.1"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <AppText variant="labelM" color="tertiary" as="label">
                  {t('log.length')} <span className="normal-case font-normal tracking-normal">({lengthUnitLabel(prefs.length)})</span>
                </AppText>
                <input
                  className={inputCls}
                  type="number" inputMode="decimal"
                  placeholder="0" min="0" step="1"
                  value={length}
                  onChange={e => setLength(e.target.value)}
                />
              </div>
            </div>

            <QuietDivider />

            {/* Caption */}
            <div className="flex flex-col gap-1.5">
              <AppText variant="labelM" color="tertiary" as="label">
                {t('log.caption')} <span className="normal-case font-normal tracking-normal text-[0.68rem]">({t('log.optional')})</span>
              </AppText>
              <textarea
                className={cn(inputSmCls, 'resize-none')}
                placeholder={t('log.captionPlaceholder')}
                rows={2}
                value={caption}
                onChange={e => setCaption(e.target.value)}
              />
            </div>

            {/* Photo placeholder */}
            <div className="flex flex-col gap-1.5">
              <button
                className={cn(
                  'flex items-center gap-2.5 text-text-subtle border border-dashed border-divider',
                  'rounded-[var(--radius-md)] px-4 py-3.5 transition-colors hover:border-text-subtle hover:text-text-muted',
                )}
                onClick={() => setShowPhotoMessage(v => !v)}
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <AppText variant="bodyM" color="tertiary" as="span">{t('log.addPhoto')}</AppText>
              </button>
              {showPhotoMessage && (
                <AppText variant="bodyM" color="tertiary" as="p" className="px-1">{t('log.photoBlaze')}</AppText>
              )}
            </div>

            {/* GPS status */}
            <div className={cn('flex items-center gap-2 text-[0.8rem] py-1', gpsColors[geoStatus] ?? 'text-text-subtle')}>
              <GpsIcon status={geoStatus} />
              <GpsLabel status={geoStatus} accuracy={position?.accuracy_m} />
            </div>

            <AppButton variant="primary" fullWidth onClick={handleSave} disabled={saving}>
              {saving ? t('log.saving') : t('log.save')}
            </AppButton>
          </div>
        </AppCard>
      </div>
    );
  }

  // ─── Moment ───────────────────────────────────────────────────────────────────

  if (step === 'moment') {
    return (
      <div className="h-full overflow-y-auto bg-bg px-4 py-5 pb-8 space-y-4">
        <button
          className="flex items-center gap-1.5 text-text-muted text-sm hover:text-text transition-colors duration-150"
          onClick={() => setStep('trip')}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {t('log.back')}
        </button>

        <AppCard surface="surface" bordered padding="none">
          <div className="px-5 py-4 border-b border-divider">
            <AppText variant="titleM" color="primary" as="p">{t('log.logMoment')}</AppText>
            <AppText variant="bodyM" color="secondary" as="p" className="mt-1">{t('log.momentHint')}</AppText>
          </div>
          <div className="px-5 py-5 space-y-4">
            <textarea
              className={cn(inputSmCls, 'resize-none')}
              placeholder={t('log.momentPlaceholder')}
              rows={5}
              value={caption}
              onChange={e => setCaption(e.target.value)}
              autoFocus
            />
            <AppButton variant="primary" fullWidth onClick={handleSaveMoment} disabled={saving || !caption.trim()}>
              {saving ? t('log.saving') : t('log.saveMoment')}
            </AppButton>
          </div>
        </AppCard>
      </div>
    );
  }

  // ─── Trip (step 1) ────────────────────────────────────────────────────────────

  const zoom = LOCATION_ZOOM[locationPref];

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-bg">

      {/* Map banner */}
      <div className="relative h-48 shrink-0 bg-surface overflow-hidden">
        {position ? (
          <Suspense fallback={<div className="w-full h-full bg-surface animate-pulse" />}>
            <TripMapSnippet position={position} zoom={zoom} showMarker={locationPref === 'exact'} />
          </Suspense>
        ) : (
          <div className="flex items-center justify-center h-full gap-2 text-text-subtle text-sm">
            <svg className="w-4 h-4 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
            {t('log.mapLoading')}
          </div>
        )}
        {/* Location precision chips */}
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          {(['exact', 'approximate', 'hidden'] as const).map(pref => (
            <button
              key={pref}
              className={cn(
                'text-[0.65rem] font-semibold px-2.5 py-1 rounded-full transition-colors duration-150 backdrop-blur-sm',
                locationPref === pref ? 'bg-accent text-bg' : 'bg-black/35 text-white/90 hover:bg-black/50',
              )}
              onClick={() => setLocationPref(pref)}
            >
              {t(`log.location${pref.charAt(0).toUpperCase() + pref.slice(1)}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Trip status */}
      {!tripLoaded && (
        <div className="px-5 pt-3 shrink-0">
          <span className="text-[0.72rem] text-text-subtle flex items-center gap-1.5">
            <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            {t('log.mapLoading')}
          </span>
        </div>
      )}
      {typeof activeTrip === 'object' && activeTrip !== null && (
        <div className="px-5 pt-3 shrink-0">
          <span className="text-[0.72rem] text-accent font-semibold flex items-center gap-1.5">
            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5" /></svg>
            {t('log.activeTrip', { count: activeTrip.catchCount })}
          </span>
        </div>
      )}

      {/* Trip context */}
      <div className="px-4 pt-4 pb-3 space-y-3 shrink-0">
        <input
          className={inputCls}
          type="text"
          placeholder={t('log.tripTitlePlaceholder')}
          value={tripTitle}
          onChange={e => { setTripTitle(e.target.value); setTitleEdited(true); }}
        />
        <textarea
          className={cn(inputSmCls, 'resize-none')}
          placeholder={t('log.tripNotesPlaceholder')}
          rows={2}
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />

        {/* Water type toggle */}
        <div className="flex gap-1 bg-surface rounded-[var(--radius-md)] p-1">
          {(['salt', 'fresh'] as const).map(wt => (
            <button
              key={wt}
              className={cn(
                'flex-1 py-2 text-sm font-semibold rounded-[16px] transition-colors duration-150',
                waterType === wt ? 'bg-elevated text-text shadow-sm' : 'text-text-subtle hover:text-text-muted',
              )}
              onClick={() => setWaterType(wt)}
            >
              {t(wt === 'salt' ? 'predictions.saltwater' : 'predictions.freshwater')}
            </button>
          ))}
        </div>

        {/* Visibility — only when no active trip */}
        {!(typeof activeTrip === 'object' && activeTrip !== null) && (
          <div className="flex gap-1 bg-surface rounded-[var(--radius-md)] p-1">
            {(['everyone', 'followers', 'only_me'] as TripVisibility[]).map(v => (
              <button
                key={v}
                className={cn(
                  'flex-1 py-1.5 text-[0.75rem] font-semibold rounded-[16px] transition-colors duration-150',
                  visibility === v ? 'bg-elevated text-text shadow-sm' : 'text-text-subtle hover:text-text-muted',
                )}
                onClick={() => setVisibility(v)}
              >
                {t(`visibility.${v}`)}
              </button>
            ))}
          </div>
        )}

        {/* Biome picker */}
        <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-4 px-4">
          {BIOMES.map(b => {
            const def = getBiome(b.id);
            const selected = biome === b.id;
            return (
              <button key={b.id} onClick={() => { setBiome(b.id); setBiomeEdited(true); }} className="flex flex-col items-center gap-1.5 shrink-0">
                <div
                  className={cn('w-10 h-10 rounded-[10px] overflow-hidden transition-all duration-150 relative', selected ? 'ring-2 ring-accent ring-offset-1 ring-offset-bg' : 'opacity-50')}
                  style={{ background: def.gradient }}
                />
                <AppText variant="labelM" color={selected ? 'accent' : 'tertiary'} as="span" className="normal-case tracking-normal text-[9px] text-center w-10 leading-tight">
                  {t(`biome.${b.id}`)}
                </AppText>
              </button>
            );
          })}
        </div>
      </div>

      <QuietDivider className="mx-4" />

      {/* Fixed choices */}
      <div className="px-4 pt-3 pb-3 space-y-px shrink-0">
        {fixedSpeciesChoices.map((choice) => (
          <button
            key={choice.id}
            className={cn(
              'flex items-center gap-3 w-full py-3.5 px-1 text-left',
              'border-b border-divider last:border-0',
              'transition-colors duration-150 hover:bg-surface/50 active:bg-surface/80 disabled:opacity-40',
            )}
            onClick={() => selectFixedChoice(choice)}
            disabled={!tripLoaded}
          >
            <FishSvg name={choice.speciesName ?? ''} className="w-10 h-7 shrink-0 text-text-subtle" />
            <span className="flex flex-1 flex-col gap-0.5">
              <AppText variant="bodyM" color="primary" as="span" className="font-[500]">{t(choice.labelKey)}</AppText>
              {choice.descriptionKey && (
                <AppText variant="labelM" color="tertiary" as="span" className="normal-case tracking-normal text-[0.72rem]">{t(choice.descriptionKey)}</AppText>
              )}
            </span>
            <svg className="w-4 h-4 text-text-subtle shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-4 pb-4 shrink-0">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className={cn(inputSmCls, 'pl-10')}
            type="text"
            placeholder={t('log.searchPlaceholder')}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Species search results */}
      {isSearching && (
        <div className="px-4 pb-8">
          {displayedSpecies.length > 0 ? (
            <div className="bg-surface rounded-[var(--radius-md)] overflow-hidden">
              {displayedSpecies.map((name) => (
                <button
                  key={name}
                  className={cn(
                    'flex items-center gap-3 w-full py-3.5 px-4 text-left',
                    'border-b border-divider last:border-0',
                    'transition-colors duration-150 hover:bg-elevated active:bg-elevated/60',
                  )}
                  onClick={() => selectSpecies(name)}
                >
                  <FishSvg name={name} className="w-9 h-6 shrink-0 text-text-subtle" />
                  <AppText variant="bodyM" color="primary" as="span" className="flex-1 font-[500]">
                    {t(`speciesNames.${name}`, { defaultValue: name })}
                  </AppText>
                  <svg className="w-4 h-4 text-text-subtle shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              ))}
            </div>
          ) : (
            <button
              className="flex items-center gap-3 w-full py-3.5 px-4 text-accent font-semibold text-[0.9rem] border border-dashed border-accent/40 rounded-[var(--radius-md)]"
              onClick={() => selectSpecies(query.trim())}
            >
              {t('log.addCustom', { name: query.trim() })}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function GpsIcon({ status }: { status: string }) {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {status === 'ok' ? (
        <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>
      ) : status === 'acquiring' ? (
        <><circle cx="12" cy="12" r="3" strokeDasharray="4 2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeDasharray="4 2" /></>
      ) : (
        <><line x1="2" y1="2" x2="22" y2="22" /><circle cx="12" cy="12" r="3" /></>
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
