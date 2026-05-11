import { useState, useRef, useEffect, useCallback } from 'react';
import { type User } from 'firebase/auth';
import { useGeolocation } from '../hooks/useGeolocation';
import { createCatch } from '../lib/catches';
import { consumePendingSpecies } from '../lib/navigationStore';
import { FishSvg } from '../components/species/FishSvg';
import { SpeciesCardHeader } from '../components/species/SpeciesCardHeader';
import styles from './LoggFangst.module.css';

const SPECIES_GROUPS = [
  {
    label: 'Saltvann',
    names: ['Torsk', 'Kveite', 'Sei', 'Hyse', 'Lange', 'Brosme',
            'Uer', 'Steinbit', 'Makrell', 'Rødspette', 'Lomre',
            'Sandflyndre', 'Sild', 'Laks', 'Sjøørret', 'Sjørøye'],
  },
  {
    label: 'Ferskvann',
    names: ['Ørret', 'Røye', 'Abbor', 'Gjedde', 'Harr'],
  },
];
const ALL_SPECIES = SPECIES_GROUPS.flatMap((g) => g.names);

type Step = 'species' | 'details' | 'success';

interface Props { user: User; }

export function LoggFangst({ user }: Props) {
  const [step, setStep] = useState<Step>('species');
  const [species, setSpecies] = useState('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const { status: geoStatus, position } = useGeolocation();
  const weightRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  }, []);

  function removePhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

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
    ? ALL_SPECIES.filter((s) => s.toLowerCase().includes(searchQuery))
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
        photoFile,
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
    removePhoto();
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
        <h2>Fangst lagret!</h2>
        <p className={styles.successSpecies}>{species}</p>
        {weight && <p className={styles.successMeta}>{weight} kg{length ? ` · ${length} cm` : ''}</p>}
        <p className={styles.successSync}>
          {geoStatus === 'ok' ? 'GPS registrert' : 'Ingen GPS-posisjon'}
        </p>
        <button className={styles.btnPrimary} onClick={reset}>
          Logg ny fangst
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
          Tilbake
        </button>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <SpeciesCardHeader
              name={species}
              action={
                <button className={styles.changeBtn} onClick={() => setStep('species')}>Endre</button>
              }
            />
          </div>

          <div className={styles.cardBody}>
            <div className={styles.fields}>
              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Vekt (kg)</span>
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
                <span className={styles.fieldLabel}>Lengde (cm)</span>
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

            <div className={styles.photoSection}>
              <span className={styles.photoSectionLabel}>Bilde</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoChange}
              />
              {photoPreview ? (
                <div className={styles.photoPreviewWrap}>
                  <img src={photoPreview} alt="Fangstbilde" className={styles.photoPreview} />
                  <button className={styles.photoRemove} onClick={removePhoto} aria-label="Fjern bilde">
                    <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
              ) : (
                <button className={styles.photoAdd} onClick={() => fileInputRef.current?.click()}>
                  <svg className={styles.photoAddIcon} viewBox="0 0 24 24">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  Ta bilde eller velg fra galleri
                </button>
              )}
            </div>

            <div className={`${styles.gpsRow} ${styles[`gps_${geoStatus}`]}`}>
              <GpsIcon status={geoStatus} />
              <span>{gpsLabel(geoStatus, position?.accuracy_m)}</span>
            </div>

            <button
              className={styles.btnPrimary}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Lagrer…' : 'Lagre fangst'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Hvilken art?</h2>

      <div className={styles.searchWrap}>
        <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          className={styles.search}
          type="text"
          placeholder="Søk etter art…"
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
                <span>{name}</span>
              </button>
            ))}
            {(filtered ?? []).length === 0 && (
              <button
                className={`${styles.speciesBtn} ${styles.customSpecies}`}
                onClick={() => selectSpecies(query.trim())}
              >
                + Legg til «{query.trim()}»
              </button>
            )}
          </>
        ) : (
          SPECIES_GROUPS.map((group) => (
            <>
              <span key={group.label} className={styles.groupLabel}>{group.label}</span>
              {group.names.map((name) => (
                <button key={name} className={styles.speciesBtn} onClick={() => selectSpecies(name)}>
                  <FishSvg name={name} className={styles.speciesFish} />
                  <span>{name}</span>
                </button>
              ))}
            </>
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

function gpsLabel(status: string, accuracy?: number): string {
  switch (status) {
    case 'acquiring': return 'Henter posisjon…';
    case 'ok': return accuracy ? `GPS ±${Math.round(accuracy)} m` : 'GPS klar';
    case 'denied': return 'Posisjon ikke tillatt';
    default: return 'GPS ikke tilgjengelig';
  }
}
