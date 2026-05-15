import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { type User } from 'firebase/auth';
import { useGeolocation } from '../hooks/useGeolocation';
import { createCatch } from '../lib/catches';
import { consumePendingSpecies } from '../lib/navigationStore';
import { FishSvg } from '../components/species/FishSvg';
import { SpeciesCardHeader } from '../components/species/SpeciesCardHeader';
import styles from './LoggFangst.module.css';

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
        weight_kg: weight ? parseFloat(weight) : null,
        length_cm: length ? parseFloat(length) : null,
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
      <div className={styles.success}>
        <div className={styles.successIcon}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
        </div>
        <h2>{t('log.saved')}</h2>
        <p className={styles.successSpecies}>{t(`speciesNames.${species}`, { defaultValue: species })}</p>
        {weight && <p className={styles.successMeta}>{weight} kg{length ? ` · ${length} cm` : ''}</p>}
        <p className={styles.successSync}>
          {geoStatus === 'ok' ? t('log.gpsRecorded') : t('log.noGps')}
        </p>
        <button className={styles.btnPrimary} onClick={reset}>
          {t('log.logNew')}
        </button>
      </div>
    );
  }

  if (step === 'details') {
    return (
      <div className={styles.page}>
        <button className={styles.back} onClick={() => setStep('species')}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {t('log.back')}
        </button>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <SpeciesCardHeader
              name={species}
              action={
                <button className={styles.changeBtn} onClick={() => setStep('species')}>{t('log.change')}</button>
              }
            />
          </div>

          <div className={styles.cardBody}>
            <div className={styles.fields}>
              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>{t('log.weight')}</span>
                <input
                  ref={weightRef}
                  className={styles.input}
                  type="number"
                  inputMode="decimal"
                  placeholder="0.0"
                  min="0"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </label>

              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>{t('log.length')}</span>
                <input
                  className={styles.input}
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

            <div className={`${styles.gpsRow} ${styles[`gps_${geoStatus}`]}`}>
              <GpsIcon status={geoStatus} />
              <GpsLabel status={geoStatus} accuracy={position?.accuracy_m} />
            </div>

            <button
              className={styles.btnPrimary}
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
    <div className={styles.page}>
      <h2 className={styles.title}>{t('log.whichSpecies')}</h2>

      <div className={styles.searchWrap}>
        <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          className={styles.search}
          type="text"
          placeholder={t('log.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      <div className={styles.grid}>
        {isSearching ? (
          <>
            {(filtered ?? []).map((name) => (
              <button key={name} className={styles.speciesBtn} onClick={() => selectSpecies(name)}>
                <FishSvg name={name} className={styles.speciesFish} />
                <span>{t(`speciesNames.${name}`, { defaultValue: name })}</span>
              </button>
            ))}
            {(filtered ?? []).length === 0 && (
              <button
                className={`${styles.speciesBtn} ${styles.customSpecies}`}
                onClick={() => selectSpecies(query.trim())}
              >
                {t('log.addCustom', { name: query.trim() })}
              </button>
            )}
          </>
        ) : (
          SPECIES_GROUPS.map((group) => (
            <React.Fragment key={group.labelKey}>
              <span className={styles.groupLabel}>{t(group.labelKey)}</span>
              {group.names.map((name) => (
                <button key={name} className={styles.speciesBtn} onClick={() => selectSpecies(name)}>
                  <FishSvg name={name} className={styles.speciesFish} />
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
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
