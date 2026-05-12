import { useState, useMemo, useEffect } from 'react';
import { type User } from 'firebase/auth';
import { computeAllScores, type EnvInputs, type SpeciesScore, type SolunarInfo } from '../lib/biteScore';
import { useGeolocation } from '../hooks/useGeolocation';
import { useWeather } from '../hooks/useWeather';
import { useTide } from '../hooks/useTide';
import { useUserCatches } from '../hooks/useUserCatches';
import { setPendingSpecies } from '../lib/navigationStore';
import { SpeciesSheet } from '../components/species/SpeciesSheet';
import { LocationDatePicker, type SelectedLocation } from '../components/LocationDatePicker';
import type { PressureTrend, TidePhase } from '../types';
import type { AppView } from '../components/layout/BottomNav';
import styles from './BiteScore.module.css';

const PRESSURE_OPTIONS: { value: PressureTrend; label: string }[] = [
  { value: 'falling_rapidly', label: 'Faller raskt' },
  { value: 'falling',         label: 'Faller' },
  { value: 'stable',          label: 'Stabilt' },
  { value: 'rising',          label: 'Stiger' },
  { value: 'rising_rapidly',  label: 'Stiger raskt' },
];

const TIDE_OPTIONS: { value: TidePhase; label: string }[] = [
  { value: 'rising',  label: 'Stigende' },
  { value: 'high',    label: 'Høyvann' },
  { value: 'falling', label: 'Fallende' },
  { value: 'low',     label: 'Lavvann' },
  { value: 'slack',   label: 'Strømstopp' },
];

interface Props {
  user: User;
  navigate: (v: AppView) => void;
}

export function BiteScore({ user, navigate }: Props) {
  const { position } = useGeolocation();
  const userCatches = useUserCatches(user.uid);
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesScore | null>(null);

  const [customLocation, setCustomLocation] = useState<SelectedLocation | null>(null);
  const [datetime, setDatetime]             = useState<Date>(() => new Date());

  const [pressure, setPressure]         = useState<PressureTrend>('stable');
  const [waterTemp, setWaterTemp]       = useState('8');
  const [tide, setTide]                 = useState<TidePhase>('rising');
  const [currentSpeed, setCurrentSpeed] = useState('0.5');
  const [waterFilter, setWaterFilter]   = useState<'salt' | 'fresh'>('salt');

  const effectiveLat = customLocation?.lat ?? position?.lat ?? 60.0;
  const effectiveLng = customLocation?.lng ?? position?.lng ?? 5.0;

  const weather = useWeather(effectiveLat, effectiveLng, datetime);
  const { tidePhase: autoTide, tideLoading } = useTide(effectiveLat, effectiveLng, datetime, waterFilter);

  // Auto-fill pressure and water temp from weather API
  useEffect(() => {
    if (weather.pressureTrend) setPressure(weather.pressureTrend);
    if (weather.waterTemp !== null) setWaterTemp(String(weather.waterTemp));
  }, [weather.pressureTrend, weather.waterTemp]);

  // Auto-fill tide phase from Kartverket API
  useEffect(() => {
    if (autoTide) setTide(autoTide);
  }, [autoTide]);

  const { scores, solunar } = useMemo(() => {
    const inputs: EnvInputs = {
      pressure_trend:   pressure,
      water_temp:       parseFloat(waterTemp) || 8,
      tide_phase:       tide,
      current_speed_ms: parseFloat(currentSpeed) || 0.5,
      wind_speed_ms:    weather.windSpeed ?? 5,
      lat:  effectiveLat,
      lng:  effectiveLng,
      date: datetime,
    };
    return computeAllScores(inputs);
  }, [pressure, waterTemp, tide, currentSpeed, weather.windSpeed, effectiveLat, effectiveLng, datetime]);

  function handleSpeciesClick(s: SpeciesScore) {
    setSelectedSpecies(s);
  }

  function handleNavigateToLog() {
    if (selectedSpecies) {
      setPendingSpecies(selectedSpecies.name);
    }
    setSelectedSpecies(null);
    navigate('logg');
  }

  return (
    <div className={styles.page}>
      {selectedSpecies && (
        <SpeciesSheet
          score={selectedSpecies}
          userCatches={userCatches}
          onClose={() => setSelectedSpecies(null)}
          onNavigateToLog={handleNavigateToLog}
        />
      )}
      <LocationDatePicker
        location={customLocation}
        datetime={datetime}
        gpsLat={position?.lat ?? 60.0}
        gpsLng={position?.lng ?? 5.0}
        weatherLoading={weather.loading}
        onLocationChange={setCustomLocation}
        onDatetimeChange={setDatetime}
      />

      <SolunarCard solunar={solunar} />

      <section className={styles.inputs}>
        <h3 className={styles.sectionTitle}>Miljøforhold</h3>

        <div className={styles.inputGrid}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Lufttrykk</span>
            <select
              className={styles.select}
              value={pressure}
              onChange={(e) => setPressure(e.target.value as PressureTrend)}
            >
              {PRESSURE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Sjøtemperatur (°C)</span>
            <input
              className={styles.input}
              type="number"
              inputMode="decimal"
              value={waterTemp}
              min="-2"
              max="30"
              step="0.5"
              onChange={(e) => setWaterTemp(e.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>
              Tidevann
              {waterFilter === 'salt' && (
                tideLoading
                  ? <span className={styles.autoTag}>henter…</span>
                  : autoTide
                    ? <span className={`${styles.autoTag} ${styles.autoTagReady}`}>auto</span>
                    : null
              )}
            </span>
            <select
              className={styles.select}
              value={tide}
              onChange={(e) => setTide(e.target.value as TidePhase)}
            >
              {TIDE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Strøm (m/s)</span>
            <input
              className={styles.input}
              type="number"
              inputMode="decimal"
              value={currentSpeed}
              min="0"
              max="5"
              step="0.1"
              onChange={(e) => setCurrentSpeed(e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className={styles.results}>
        <div className={styles.resultsHeader}>
          <h3 className={styles.sectionTitle}>Prediksjoner</h3>
          <div className={styles.waterToggle}>
            <button
              className={`${styles.waterBtn} ${waterFilter === 'salt' ? styles.waterActive : ''}`}
              onClick={() => setWaterFilter('salt')}
            >
              Saltvann
            </button>
            <button
              className={`${styles.waterBtn} ${waterFilter === 'fresh' ? styles.waterActive : ''}`}
              onClick={() => setWaterFilter('fresh')}
            >
              Ferskvann
            </button>
          </div>
        </div>
        <div className={styles.list}>
          {scores
            .filter((s) => s.water === waterFilter)
            .map((s, i) => (
              <SpeciesCard key={`${s.name}-${s.method ?? ''}`} score={s} rank={i + 1} onClick={() => handleSpeciesClick(s)} />
            ))}
        </div>
      </section>
    </div>
  );
}

// ─── Solunar card ────────────────────────────────────────────────────────────

function SolunarCard({ solunar }: { solunar: SolunarInfo }) {
  const periodLabel =
    solunar.type === 'major' ? 'Stor periode aktiv' :
    solunar.type === 'minor' ? 'Liten periode aktiv' :
    `Neste: ${solunar.nextType === 'major' ? 'stor' : 'liten'} om ${solunar.minutesUntilNext} min`;

  const moonPct = Math.round(
    solunar.moonPhase <= 0.5
      ? solunar.moonPhase * 200
      : (1 - solunar.moonPhase) * 200,
  );

  return (
    <div className={`${styles.solunarCard} ${styles[`solunar_${solunar.type}`]}`}>
      <div className={styles.solunarLeft}>
        <MoonIcon phase={solunar.moonPhase} />
        <div>
          <div className={styles.solunarPhaseName}>{solunar.moonPhaseName}</div>
          <div className={styles.solunarPct}>{moonPct}% belyst</div>
        </div>
      </div>

      <div className={styles.solunarRight}>
        <div className={styles.solunarPeriod}>{periodLabel}</div>
        <div className={styles.solunarMult}>
          ×{solunar.multiplier.toFixed(2)} bite-multiplikator
        </div>
        <LightLabel lux={solunar.lightLux} />
      </div>
    </div>
  );
}

function LightLabel({ lux }: { lux: number }) {
  let label = '';
  if (lux === 0)          label = 'Natt';
  else if (lux < 100)     label = 'Astronomisk tusmørke';
  else if (lux < 1000)    label = 'Nautisk tusmørke';
  else if (lux < 10_000)  label = 'Borgerlig tusmørke';
  else if (lux < 30_000)  label = 'Soloppgang / -nedgang';
  else if (lux < 80_000)  label = 'Dagslys';
  else                     label = 'Fullt dagslys';
  return <div className={styles.solunarLight}>{label}</div>;
}

// ─── Species score card ───────────────────────────────────────────────────────

function SpeciesCard({ score, rank, onClick }: { score: SpeciesScore; rank: number; onClick: () => void }) {
  const pct   = Math.round(score.score * 100);
  const color = score.outOfSeason ? 'var(--color-warning)' : scoreColor(score.score);

  return (
    <div className={styles.speciesCard} onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className={styles.speciesRank}>{rank}</div>
      <div className={styles.speciesBody}>
        <div className={styles.speciesTop}>
          <span className={styles.speciesName}>
            {score.name}
            {score.method && (
              <span className={styles.methodTag}>{score.method === 'land' ? 'fra land' : 'fra båt'}</span>
            )}
          </span>
          <span className={styles.speciesLabel} style={{ color }}>
            {score.outOfSeason ? 'Ikke i sesong' : score.label}
          </span>
          <span className={styles.speciesPct} style={{ color }}>
            {pct}%
          </span>
        </div>
        <div className={styles.barTrack}>
          <div
            className={styles.barFill}
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
      </div>
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 0.75) return '#0066CC';
  if (score >= 0.5)  return '#22c55e';
  if (score >= 0.25) return '#f59e0b';
  return '#ef4444';
}

// ─── Moon icon ───────────────────────────────────────────────────────────────

function MoonIcon({ phase }: { phase: number }) {
  // phase: 0=new, 0.5=full, 1=new
  const isWaxing = phase < 0.5;
  const pct      = isWaxing ? phase * 2 : (1 - phase) * 2; // 0–1 lit fraction

  // SVG moon: clip between two circles to draw a crescent or gibbous
  const r = 14;
  const cx = 16;
  const cy = 16;
  const offset = r * (1 - pct * 2); // offset of inner circle

  return (
    <svg width="32" height="32" viewBox="0 0 32 32" className={styles.moonSvg}>
      <defs>
        <clipPath id="moon-clip">
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      {/* Dark disk */}
      <circle cx={cx} cy={cy} r={r} fill="var(--color-border)" />
      {/* Lit area */}
      <ellipse
        cx={cx + (isWaxing ? offset : -offset)}
        cy={cy}
        rx={Math.abs(offset) < r ? Math.sqrt(r * r - offset * offset) : r}
        ry={r}
        fill="var(--color-text)"
        clipPath="url(#moon-clip)"
      />
    </svg>
  );
}
