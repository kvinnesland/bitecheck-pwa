import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { type User } from 'firebase/auth';
import { useGeolocation } from '../hooks/useGeolocation';
import { createCatch } from '../lib/catches';
import { consumePendingSpecies } from '../lib/navigationStore';
import { useUnits } from '../contexts/UnitsContext';
import { weightUnitLabel, lengthUnitLabel, parseWeightToKg, parseLengthToCm } from '../lib/units';
import { FishSvg } from '../components/species/FishSvg';
import { SpeciesCardHeader } from '../components/species/SpeciesCardHeader';
import { cn } from '@/lib/utils';

const SPECIES_GROUPS = [
  {
    labelKey: 'predictions.saltwater',
    names: ['Torsk', 'Kveite', 'Sei', 'Hyse', 'Lange', 'Brosme',
            'Uer', 'Steinbit', 'Makrell', 'Rødspette', 'Lomre',
            'Sandflyndre', 'Sild', 'Laks', 'Sjøørret', 'Sjørøye'],
  },
  {
    labelKey: 'predictions.freshwater',
    names: ['Ørret', 'Røye', 'Abbor', 'Gjedde', 'Harr'],
  },
];
const ALL_SPECIES = SPECIES_GROUPS.flatMap((g) => g.names);

type Step = 'species' | 'details' | 'success';

interface Props { user: User; }

export function LoggFangst({ user }: Props) {
  const { t } = useTranslation();
  const { prefs } = useUnits();
  const [step, setStep] = useState<Step>('species');
  const [species, setSpecies] = useState('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const { status: geoStatus, position } = useGeolocation();
  const weightRef = useRef<HTMLInputElement>(null);

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
  const filtered = isSearching
    ? ALL_SPECIES.filter((s) =>
        s.toLowerCase().includes(searchQuery) ||
        t(`speciesNames.${s}`, { defaultValue: s }).toLowerCase().includes(searchQuery),
      )
    : null;

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
    setStep('species');
    setSpecies('');
    setWeight('');
    setLength('');
    setQuery('');
  }

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

  if (step === 'details') {
    const gpsColors: Record<string, string> = {
      ok:         'text-success border-success',
      acquiring:  'text-warning border-warning',
    };
    const gpsRowCls = cn(
      'flex items-center gap-2 text-[0.8rem] px-3.5 py-2.5 rounded-[var(--radius-sm)] bg-surface border shrink-0',
      gpsColors[geoStatus] ?? 'text-text-muted border-divider',
    );

    return (
      <div className="flex flex-col h-full overflow-y-auto px-4 py-5 pb-6 gap-4">
        <button
          className="flex items-center gap-1 bg-transparent text-text-muted text-sm p-0 shrink-0 hover:text-text transition-colors duration-150"
          onClick={() => setStep('species')}
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
                  onClick={() => setStep('species')}
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

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-5 pb-6 gap-4">
      <h2 className="text-[1.25rem] font-bold tracking-tight shrink-0">{t('log.whichSpecies')}</h2>

      <div className="relative shrink-0">
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
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-2 flex-1">
        {isSearching ? (
          <>
            {(filtered ?? []).map((name) => (
              <button
                key={name}
                className="bg-surface border border-divider rounded-[var(--radius-md)] text-text text-[0.85rem] font-semibold pt-2.5 pb-3 px-2 text-center flex flex-col items-center gap-1.5 transition-[border-color,background,transform] duration-150 leading-tight hover:border-accent hover:bg-bg active:scale-[0.96]"
                onClick={() => selectSpecies(name)}
              >
                <FishSvg name={name} className="w-full h-14 text-text-muted" />
                <span>{t(`speciesNames.${name}`, { defaultValue: name })}</span>
              </button>
            ))}
            {(filtered ?? []).length === 0 && (
              <button
                className="col-span-2 bg-surface border border-dashed border-accent rounded-[var(--radius-md)] text-accent text-[0.85rem] font-semibold pt-2.5 pb-3 px-2 text-center flex flex-col items-center gap-1.5 transition-colors duration-150 leading-tight"
                onClick={() => selectSpecies(query.trim())}
              >
                {t('log.addCustom', { name: query.trim() })}
              </button>
            )}
          </>
        ) : (
          SPECIES_GROUPS.map((group) => (
            <React.Fragment key={group.labelKey}>
              <span className="col-span-2 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-text-muted pt-1 pb-0.5 mt-1">
                {t(group.labelKey)}
              </span>
              {group.names.map((name) => (
                <button
                  key={name}
                  className="bg-surface border border-divider rounded-[var(--radius-md)] text-text text-[0.85rem] font-semibold pt-2.5 pb-3 px-2 text-center flex flex-col items-center gap-1.5 transition-[border-color,background,transform] duration-150 leading-tight hover:border-accent hover:bg-bg active:scale-[0.96]"
                  onClick={() => selectSpecies(name)}
                >
                  <FishSvg name={name} className="w-full h-14 text-text-muted" />
                  <span>{t(`speciesNames.${name}`, { defaultValue: name })}</span>
                </button>
              ))}
            </React.Fragment>
          ))
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
