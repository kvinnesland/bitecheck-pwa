import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { type User } from 'firebase/auth';
import { computeAllScores, type EnvInputs, type SpeciesScore, type SolunarInfo } from '../lib/biteScore';
import { useGeolocation } from '../hooks/useGeolocation';
import { useWeather } from '../hooks/useWeather';
import { useTide } from '../hooks/useTide';
import { useUserCatches } from '../hooks/useUserCatches';
import { setPendingSpecies } from '../lib/navigationStore';
import { useUnits } from '../contexts/UnitsContext';
import { celsiusToDisplay, displayToCelsius, tempUnitLabel } from '../lib/units';
import { SpeciesSheet } from '../components/species/SpeciesSheet';
import { LocationDatePicker, type SelectedLocation } from '../components/LocationDatePicker';
import { DailyScoreChart } from '../components/DailyScoreChart';
import { cn } from '@/lib/utils';
import type { PressureTrend, TidePhase, CurrentStrength } from '../types';
import type { AppView } from '../components/layout/BottomNav';

const PRESSURE_VALUES: PressureTrend[] = ['falling_rapidly', 'falling', 'stable', 'rising', 'rising_rapidly'];
const TIDE_VALUES: TidePhase[] = ['rising', 'high', 'falling', 'low', 'slack'];
const CURRENT_VALUES: CurrentStrength[] = ['stille', 'moderat', 'sterk', 'sterkest'];

const fieldInputCls = 'bg-bg border border-divider rounded-[var(--radius-sm)] text-text text-sm font-medium px-2.5 py-2 outline-none w-full transition-colors duration-150 focus:border-accent appearance-none';

interface Props {
  user: User;
  navigate: (v: AppView) => void;
}

export function BiteScore({ user, navigate }: Props) {
  const { t } = useTranslation();
  const { position } = useGeolocation();
  const userCatches = useUserCatches(user.uid);
  const { prefs } = useUnits();
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesScore | null>(null);

  const [customLocation, setCustomLocation] = useState<SelectedLocation | null>(null);
  const [datetime, setDatetime]             = useState<Date>(() => new Date());

  const [pressure,         setPressure]         = useState<PressureTrend>('stable');
  const [waterTempC,       setWaterTempC]       = useState(8);
  const [waterTempStr,     setWaterTempStr]     = useState(() => String(celsiusToDisplay(8, prefs.temp)));
  const [tide,             setTide]             = useState<TidePhase>('rising');
  const [currentStrength,  setCurrentStrength]  = useState<CurrentStrength>('moderat');
  const [waterFilter,      setWaterFilter]      = useState<'salt' | 'fresh'>('salt');

  const effectiveLat = customLocation?.lat ?? position?.lat ?? 60.0;
  const effectiveLng = customLocation?.lng ?? position?.lng ?? 5.0;

  const weather = useWeather(effectiveLat, effectiveLng, datetime);
  const { tidePhase: autoTide, currentStrength: autoCurrentStrength, hourlyTide, tideLoading } =
    useTide(effectiveLat, effectiveLng, datetime, waterFilter);

  useEffect(() => {
    if (weather.pressureTrend) setPressure(weather.pressureTrend);
    if (weather.waterTemp !== null) {
      setWaterTempC(weather.waterTemp);
      setWaterTempStr(String(celsiusToDisplay(weather.waterTemp, prefs.temp)));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weather.pressureTrend, weather.waterTemp]);

  useEffect(() => {
    setWaterTempStr(String(celsiusToDisplay(waterTempC, prefs.temp)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.temp]);

  useEffect(() => {
    if (autoTide) setTide(autoTide);
    if (autoCurrentStrength) setCurrentStrength(autoCurrentStrength);
  }, [autoTide, autoCurrentStrength]);

  const { scores, solunar } = useMemo(() => {
    const inputs: EnvInputs = {
      pressure_trend:   pressure,
      water_temp:       waterTempC,
      tide_phase:       tide,
      current_strength: currentStrength,
      wind_speed_ms:    weather.windSpeed ?? 5,
      lat:  effectiveLat,
      lng:  effectiveLng,
      date: datetime,
    };
    return computeAllScores(inputs);
  }, [pressure, waterTempC, tide, currentStrength, weather.windSpeed, effectiveLat, effectiveLng, datetime]);

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
    <div className="flex flex-col h-full overflow-y-auto">
      {selectedSpecies && (
        <SpeciesSheet
          score={selectedSpecies}
          datetime={datetime}
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

      <DailyScoreChart
        datetime={datetime}
        hourlyTide={hourlyTide}
        hourlyWeather={weather.hourlyWeather}
        pressure={pressure}
        waterTemp={waterTempC}
        windSpeed={weather.windSpeed ?? 5}
        lat={effectiveLat}
        lng={effectiveLng}
        waterFilter={waterFilter}
      />

      <section className="border-b border-divider shrink-0">
        <h3 className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-text-muted px-4 pt-3 pb-2">
          {t('conditions.title')}
        </h3>

        <div className="grid grid-cols-2 gap-2.5 px-4 pb-3.5">
          <label className="flex flex-col gap-[5px]">
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.05em] text-text-muted flex items-center gap-1.5">
              {t('conditions.pressure')}
            </span>
            <select
              className={fieldInputCls}
              value={pressure}
              onChange={(e) => setPressure(e.target.value as PressureTrend)}
            >
              {PRESSURE_VALUES.map((v) => (
                <option key={v} value={v}>{t(`pressure.${v}`)}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-[5px]">
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.05em] text-text-muted flex items-center gap-1.5">
              {waterFilter === 'fresh' ? t('conditions.freshTemp') : t('conditions.seaTemp')}
              {' '}({tempUnitLabel(prefs.temp)})
            </span>
            <input
              className={fieldInputCls}
              type="number"
              inputMode="decimal"
              value={waterTempStr}
              min={prefs.temp === 'f' ? '28' : '-2'}
              max={prefs.temp === 'f' ? '86' : '30'}
              step="0.5"
              onChange={(e) => {
                setWaterTempStr(e.target.value);
                const n = parseFloat(e.target.value);
                if (!isNaN(n)) setWaterTempC(displayToCelsius(n, prefs.temp));
              }}
            />
          </label>

          {waterFilter === 'salt' && (
            <label className="flex flex-col gap-[5px]">
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.05em] text-text-muted flex items-center gap-1.5">
                {t('conditions.tide')}
                {tideLoading
                  ? <AutoTag>{t('conditions.fetching')}</AutoTag>
                  : autoTide
                    ? <AutoTag ready>{t('conditions.auto')}</AutoTag>
                    : null}
              </span>
              <select
                className={fieldInputCls}
                value={tide}
                onChange={(e) => setTide(e.target.value as TidePhase)}
              >
                {TIDE_VALUES.map((v) => (
                  <option key={v} value={v}>{t(`tide.${v}`)}</option>
                ))}
              </select>
            </label>
          )}

          {waterFilter === 'salt' && (
            <label className="flex flex-col gap-[5px]">
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.05em] text-text-muted flex items-center gap-1.5">
                {t('conditions.current')}
                {tideLoading
                  ? <AutoTag>{t('conditions.fetching')}</AutoTag>
                  : autoCurrentStrength
                    ? <AutoTag ready>{t('conditions.auto')}</AutoTag>
                    : null}
              </span>
              <select
                className={fieldInputCls}
                value={currentStrength}
                onChange={(e) => setCurrentStrength(e.target.value as CurrentStrength)}
              >
                {CURRENT_VALUES.map((v) => (
                  <option key={v} value={v}>{t(`current.${v}`)}</option>
                ))}
              </select>
            </label>
          )}
        </div>
      </section>

      <section className="flex-1">
        <div className="flex items-center justify-between pr-4">
          <h3 className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-text-muted px-4 pt-3 pb-2">
            {t('predictions.title')}
          </h3>
          <div className="flex bg-bg border border-divider rounded-[var(--radius-sm)] overflow-hidden shrink-0">
            <button
              className={cn('text-[0.72rem] font-semibold px-3 py-[5px] transition-colors duration-150', waterFilter === 'salt' ? 'bg-accent text-white' : 'text-text-muted')}
              onClick={() => setWaterFilter('salt')}
            >
              {t('predictions.saltwater')}
            </button>
            <button
              className={cn('text-[0.72rem] font-semibold px-3 py-[5px] transition-colors duration-150', waterFilter === 'fresh' ? 'bg-accent text-white' : 'text-text-muted')}
              onClick={() => setWaterFilter('fresh')}
            >
              {t('predictions.freshwater')}
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-[1px] bg-divider border-t border-divider">
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

function AutoTag({ children, ready }: { children: React.ReactNode; ready?: boolean }) {
  return (
    <span className={cn(
      'text-[0.6rem] font-semibold uppercase tracking-[0.04em] px-[5px] py-[1px] rounded-[3px]',
      ready ? 'bg-accent/10 text-accent' : 'bg-divider text-text-muted',
    )}>
      {children}
    </span>
  );
}

// ─── Solunar card ─────────────────────────────────────────────────────────────

function SolunarCard({ solunar }: { solunar: SolunarInfo }) {
  const { t } = useTranslation();
  const periodLabel =
    solunar.type === 'major' ? t('solunar.majorActive') :
    solunar.type === 'minor' ? t('solunar.minorActive') :
    solunar.nextType === 'major'
      ? t('solunar.nextMajor', { minutes: solunar.minutesUntilNext })
      : t('solunar.nextMinor', { minutes: solunar.minutesUntilNext });

  const moonPct = Math.round(
    solunar.moonPhase <= 0.5
      ? solunar.moonPhase * 200
      : (1 - solunar.moonPhase) * 200,
  );

  const borderColor =
    solunar.type === 'major' ? 'var(--color-accent)' :
    solunar.type === 'minor' ? '#22c55e' :
    'var(--color-divider)';

  return (
    <div
      className="flex items-center justify-between gap-4 px-4 py-4 border-b border-divider bg-surface shrink-0"
      style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      <div className="flex items-center gap-2.5 shrink-0">
        <MoonIcon phase={solunar.moonPhase} />
        <div>
          <div className="text-[0.8rem] font-semibold text-text">{solunar.moonPhaseName}</div>
          <div className="text-[0.7rem] text-text-muted">{t('solunar.illuminated', { pct: moonPct })}</div>
        </div>
      </div>

      <div className="text-right flex flex-col gap-0.5">
        <div className="text-[0.8rem] font-semibold text-text">{periodLabel}</div>
        <div className="text-[0.7rem] text-accent font-semibold">
          {t('solunar.multiplier', { value: solunar.multiplier.toFixed(2) })}
        </div>
        <LightLabel lux={solunar.lightLux} />
      </div>
    </div>
  );
}

function LightLabel({ lux }: { lux: number }) {
  const { t } = useTranslation();
  let key = '';
  if (lux === 0)          key = 'light.night';
  else if (lux < 100)     key = 'light.astronomical';
  else if (lux < 1000)    key = 'light.nautical';
  else if (lux < 10_000)  key = 'light.civil';
  else if (lux < 30_000)  key = 'light.sunrise';
  else if (lux < 80_000)  key = 'light.daylight';
  else                     key = 'light.fullDaylight';
  return <div className="text-[0.68rem] text-text-muted">{t(key)}</div>;
}

// ─── Species score card ───────────────────────────────────────────────────────

function SpeciesCard({ score, rank, onClick }: { score: SpeciesScore; rank: number; onClick: () => void }) {
  const { t } = useTranslation();
  const pct   = Math.round(score.score * 100);
  const color = score.outOfSeason ? 'var(--color-warning)' : scoreColor(score.score);
  const displayName = t(`speciesNames.${score.name}`, { defaultValue: score.name });

  return (
    <div className="flex items-center gap-2.5 bg-bg px-4 py-2.5 cursor-pointer" onClick={onClick}>
      <div className="text-[0.72rem] font-bold text-text-muted w-[18px] text-right shrink-0">{rank}</div>
      <div className="flex-1 flex flex-col gap-[5px]">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[0.9rem] font-semibold text-text flex-1 flex items-baseline gap-[5px]">
            {displayName}
            {score.method && (
              <span className="text-[0.65rem] font-medium text-text-muted lowercase">
                {score.method === 'land' ? t('predictions.fromShore') : t('predictions.fromBoat')}
              </span>
            )}
          </span>
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.04em]" style={{ color }}>
            {score.outOfSeason ? t('predictions.outOfSeason') : score.label}
          </span>
          <span className="text-[0.85rem] font-bold min-w-[36px] text-right" style={{ color }}>
            {pct}%
          </span>
        </div>
        <div className="h-1 bg-divider rounded-[2px] overflow-hidden">
          <div
            className="h-full rounded-[2px] transition-[width] duration-[400ms] ease-in-out"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
      </div>
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 0.75) return 'var(--color-accent)';
  if (score >= 0.5)  return '#22c55e';
  if (score >= 0.25) return '#f59e0b';
  return '#ef4444';
}

// ─── Moon icon ────────────────────────────────────────────────────────────────

function MoonIcon({ phase }: { phase: number }) {
  const isWaxing = phase < 0.5;
  const pct      = isWaxing ? phase * 2 : (1 - phase) * 2;

  const r = 14;
  const cx = 16;
  const cy = 16;
  const offset = r * (1 - pct * 2);

  return (
    <svg width="32" height="32" viewBox="0 0 32 32" className="shrink-0">
      <defs>
        <clipPath id="moon-clip">
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="var(--color-divider)" />
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
