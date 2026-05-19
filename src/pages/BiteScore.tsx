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
import { AppText } from '../components/ui/AppText';
import { AppCard } from '../components/ui/AppCard';
import { QuietDivider } from '../components/ui/QuietDivider';
import { cn } from '@/lib/utils';
import type { PressureTrend, TidePhase, CurrentStrength } from '../types';
import type { AppView } from '../components/layout/BottomNav';

const PRESSURE_VALUES: PressureTrend[] = ['falling_rapidly', 'falling', 'stable', 'rising', 'rising_rapidly'];
const TIDE_VALUES: TidePhase[] = ['rising', 'high', 'falling', 'low', 'slack'];
const CURRENT_VALUES: CurrentStrength[] = ['stille', 'moderat', 'sterk', 'sterkest'];

const fieldCls = [
  'bg-elevated border border-divider rounded-[var(--radius-sm)]',
  'text-text text-[0.9rem] font-medium px-3 py-2.5 outline-none w-full',
  'transition-colors duration-150 focus:border-accent/50 appearance-none',
].join(' ');

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

  const [pressure,        setPressure]        = useState<PressureTrend>('stable');
  const [waterTempC,      setWaterTempC]      = useState(8);
  const [waterTempStr,    setWaterTempStr]    = useState(() => String(celsiusToDisplay(8, prefs.temp)));
  const [tide,            setTide]            = useState<TidePhase>('rising');
  const [currentStrength, setCurrentStrength] = useState<CurrentStrength>('moderat');
  const [waterFilter,     setWaterFilter]     = useState<'salt' | 'fresh'>('salt');

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

  const filteredScores = scores.filter(s => s.water === waterFilter);
  const topScore = filteredScores[0];

  function handleSpeciesClick(s: SpeciesScore) { setSelectedSpecies(s); }

  function handleNavigateToLog() {
    if (selectedSpecies) setPendingSpecies(selectedSpecies.name);
    setSelectedSpecies(null);
    navigate('logg');
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-bg">
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

      {/* ── Hero recommendation ───────────────────────────────────────────── */}
      <SolunarHero solunar={solunar} topScore={topScore} waterFilter={waterFilter} />

      {/* ── Daily score chart ─────────────────────────────────────────────── */}
      <div className="px-5 pb-1">
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
      </div>

      {/* ── Conditions panel ─────────────────────────────────────────────── */}
      <div className="px-5 pb-5">
        <AppCard surface="surface" bordered padding="none">
          <div className="px-5 pt-4 pb-1">
            <AppText variant="labelM" color="tertiary">{t('conditions.title')}</AppText>
          </div>

          <div className="grid grid-cols-2 gap-0">
            <ConditionField label={t('conditions.pressure')}>
              <select className={fieldCls} value={pressure} onChange={e => setPressure(e.target.value as PressureTrend)}>
                {PRESSURE_VALUES.map(v => (
                  <option key={v} value={v}>{t(`pressure.${v}`)}</option>
                ))}
              </select>
            </ConditionField>

            <ConditionField label={`${waterFilter === 'fresh' ? t('conditions.freshTemp') : t('conditions.seaTemp')} (${tempUnitLabel(prefs.temp)})`}>
              <input
                className={fieldCls}
                type="number"
                inputMode="decimal"
                value={waterTempStr}
                min={prefs.temp === 'f' ? '28' : '-2'}
                max={prefs.temp === 'f' ? '86' : '30'}
                step="0.5"
                onChange={e => {
                  setWaterTempStr(e.target.value);
                  const n = parseFloat(e.target.value);
                  if (!isNaN(n)) setWaterTempC(displayToCelsius(n, prefs.temp));
                }}
              />
            </ConditionField>

            {waterFilter === 'salt' && (
              <ConditionField label={t('conditions.tide')} autoTag={tideLoading ? t('conditions.fetching') : autoTide ? t('conditions.auto') : undefined} autoReady={!!autoTide}>
                <select className={fieldCls} value={tide} onChange={e => setTide(e.target.value as TidePhase)}>
                  {TIDE_VALUES.map(v => <option key={v} value={v}>{t(`tide.${v}`)}</option>)}
                </select>
              </ConditionField>
            )}

            {waterFilter === 'salt' && (
              <ConditionField label={t('conditions.current')} autoTag={tideLoading ? t('conditions.fetching') : autoCurrentStrength ? t('conditions.auto') : undefined} autoReady={!!autoCurrentStrength}>
                <select className={fieldCls} value={currentStrength} onChange={e => setCurrentStrength(e.target.value as CurrentStrength)}>
                  {CURRENT_VALUES.map(v => <option key={v} value={v}>{t(`current.${v}`)}</option>)}
                </select>
              </ConditionField>
            )}
          </div>
          <div className="h-4" />
        </AppCard>
      </div>

      {/* ── Species predictions ───────────────────────────────────────────── */}
      <div className="px-5 pb-8">
        <div className="flex items-center justify-between mb-3">
          <AppText variant="labelM" color="tertiary">{t('predictions.title')}</AppText>
          {/* Saltwater / freshwater toggle */}
          <div className="flex bg-surface rounded-[var(--radius-sm)] p-0.5 gap-0.5">
            {(['salt', 'fresh'] as const).map(wt => (
              <button
                key={wt}
                className={cn(
                  'text-[0.72rem] font-semibold px-3 py-1.5 rounded-[10px] transition-colors duration-150',
                  waterFilter === wt
                    ? 'bg-elevated text-text shadow-sm'
                    : 'text-text-subtle hover:text-text-muted',
                )}
                onClick={() => setWaterFilter(wt)}
              >
                {t(wt === 'salt' ? 'predictions.saltwater' : 'predictions.freshwater')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-px rounded-[var(--radius-md)] overflow-hidden bg-divider">
          {filteredScores.map((s, i) => (
            <SpeciesRow key={`${s.name}-${s.method ?? ''}`} score={s} rank={i + 1} onClick={() => handleSpeciesClick(s)} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Solunar hero + top recommendation ────────────────────────────────────────

function SolunarHero({ solunar, topScore }: { solunar: SolunarInfo; topScore?: SpeciesScore; waterFilter: string }) {
  const { t } = useTranslation();

  const moonPct = Math.round(
    solunar.moonPhase <= 0.5
      ? solunar.moonPhase * 200
      : (1 - solunar.moonPhase) * 200,
  );

  const isActiveWindow = solunar.type === 'major' || solunar.type === 'minor';
  const windowLabel = isActiveWindow
    ? solunar.type === 'major' ? t('solunar.majorActive') : t('solunar.minorActive')
    : solunar.nextType === 'major'
      ? t('solunar.nextMajor', { minutes: solunar.minutesUntilNext })
      : t('solunar.nextMinor', { minutes: solunar.minutesUntilNext });

  const topPct = topScore ? Math.round(topScore.score * 100) : null;
  const topName = topScore
    ? t(`speciesNames.${topScore.name}`, { defaultValue: topScore.name })
    : null;

  return (
    <div className="px-5 py-5">
      {/* Main hero block */}
      <div className="bg-surface rounded-[var(--radius-lg)] overflow-hidden">
        <div className="px-6 pt-6 pb-5">
          {topScore && topPct !== null && (
            <>
              <AppText variant="labelM" color="tertiary" as="p" className="mb-3">
                {t('predictions.bestNow', { defaultValue: 'Best window today' })}
              </AppText>
              <div className="flex items-end gap-4 mb-3">
                <span className="font-sans font-[575] text-[4.5rem] leading-[1] tracking-[-0.03em] text-text">
                  {topPct}
                  <span className="text-[2rem] font-[450] text-text-muted">%</span>
                </span>
                <div className="pb-2">
                  <AppText variant="titleL" color="primary" as="p">
                    {topName}
                  </AppText>
                  {topScore.method && (
                    <AppText variant="bodyM" color="secondary" as="p" className="mt-0.5">
                      {topScore.method === 'land' ? t('predictions.fromShore') : t('predictions.fromBoat')}
                    </AppText>
                  )}
                </div>
              </div>
              <AppText variant="bodyM" color="secondary" as="p">
                {topScore.outOfSeason
                  ? t('predictions.outOfSeason')
                  : topScore.label}
              </AppText>
              <QuietDivider className="my-4" />
            </>
          )}

          {/* Solunar row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MoonIcon phase={solunar.moonPhase} />
              <div>
                <AppText variant="bodyM" color="primary" as="p">
                  {solunar.moonPhaseName}
                </AppText>
                <AppText variant="labelM" color="tertiary" as="p" className="mt-0.5 normal-case tracking-normal text-[0.7rem]">
                  {t('solunar.illuminated', { pct: moonPct })}
                </AppText>
              </div>
            </div>
            <div className="text-right">
              <AppText variant="bodyM" color={isActiveWindow ? 'accent' : 'secondary'} as="p">
                {windowLabel}
              </AppText>
              <AppText variant="labelM" color="tertiary" as="p" className="mt-0.5 normal-case tracking-normal text-[0.7rem]">
                {t('solunar.multiplier', { value: solunar.multiplier.toFixed(2) })}×
              </AppText>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Condition field wrapper ───────────────────────────────────────────────────

function ConditionField({
  label, children, autoTag, autoReady,
}: {
  label: string;
  children: React.ReactNode;
  autoTag?: string;
  autoReady?: boolean;
}) {
  return (
    <div className="flex flex-col gap-[5px] px-5 py-3 border-b border-r border-divider last-of-type:border-r-0 [&:nth-last-child(-n+2)]:border-b-0">
      <span className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.06em] text-text-subtle">
        {label}
        {autoTag && (
          <span className={cn(
            'text-[0.6rem] font-semibold uppercase tracking-[0.04em] px-[5px] py-[1px] rounded-[3px]',
            autoReady ? 'bg-accent-subtle text-accent' : 'bg-surface text-text-subtle',
          )}>
            {autoTag}
          </span>
        )}
      </span>
      {children}
    </div>
  );
}

// ─── Species score row ────────────────────────────────────────────────────────

function SpeciesRow({ score, rank, onClick }: { score: SpeciesScore; rank: number; onClick: () => void }) {
  const { t } = useTranslation();
  const pct = Math.round(score.score * 100);
  const accentColor = score.outOfSeason ? 'var(--color-text-subtle)' : quietScoreColor(score.score);
  const displayName = t(`speciesNames.${score.name}`, { defaultValue: score.name });

  return (
    <button
      className="flex items-center gap-3 bg-elevated px-5 py-3.5 w-full text-left transition-opacity duration-150 active:opacity-70"
      onClick={onClick}
    >
      <span className="text-[0.7rem] font-medium text-text-subtle w-5 text-right shrink-0 tabular-nums">{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 mb-1.5">
          <AppText variant="bodyM" color="primary" as="span" className="flex-1 truncate font-[500]">
            {displayName}
          </AppText>
          {score.method && (
            <AppText variant="labelM" color="tertiary" as="span" className="normal-case tracking-normal text-[0.65rem]">
              {score.method === 'land' ? t('predictions.fromShore') : t('predictions.fromBoat')}
            </AppText>
          )}
          <span className="text-[0.82rem] font-[575] tabular-nums shrink-0" style={{ color: accentColor }}>
            {pct}%
          </span>
        </div>
        {/* Quiet score line */}
        <div className="h-[2px] rounded-full" style={{ background: 'var(--color-divider)' }}>
          <div
            className="h-full rounded-full transition-[width] duration-[400ms]"
            style={{ width: `${pct}%`, background: accentColor, opacity: score.outOfSeason ? 0.4 : 0.7 }}
          />
        </div>
      </div>
    </button>
  );
}

function quietScoreColor(score: number): string {
  if (score >= 0.7) return 'var(--color-accent)';
  if (score >= 0.45) return 'var(--color-text-muted)';
  return 'var(--color-text-subtle)';
}

// ─── Moon icon ────────────────────────────────────────────────────────────────

function MoonIcon({ phase }: { phase: number }) {
  const isWaxing = phase < 0.5;
  const pct      = isWaxing ? phase * 2 : (1 - phase) * 2;
  const r = 12;
  const cx = 14;
  const cy = 14;
  const offset = r * (1 - pct * 2);

  return (
    <svg width="28" height="28" viewBox="0 0 28 28" className="shrink-0">
      <defs>
        <clipPath id="moon-clip-2">
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="var(--color-divider)" />
      <ellipse
        cx={cx + (isWaxing ? offset : -offset)}
        cy={cy}
        rx={Math.abs(offset) < r ? Math.sqrt(r * r - offset * offset) : r}
        ry={r}
        fill="var(--color-text-muted)"
        clipPath="url(#moon-clip-2)"
      />
    </svg>
  );
}
