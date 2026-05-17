import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { SpeciesScore } from '../../lib/biteScore';
import type { CatchRecord } from '../../types';
import { KNOWN_SPECIES } from '../../lib/speciesInfo';
import { useUnits } from '../../contexts/UnitsContext';
import { formatWeight, formatLength } from '../../lib/units';
import { SpeciesCardHeader } from './SpeciesCardHeader';
interface Props {
  score: SpeciesScore;
  datetime: Date;
  userCatches: CatchRecord[];
  onClose: () => void;
  onNavigateToLog: () => void;
}

function scoreColor(score: number): string {
  if (score >= 0.75) return 'var(--color-accent)';
  if (score >= 0.5)  return '#22c55e';
  if (score >= 0.25) return '#f59e0b';
  return '#ef4444';
}

const iconCls = 'w-3.5 h-3.5 shrink-0 text-text-muted';

function CalendarIcon() {
  return (
    <svg className={iconCls} viewBox="0 0 14 14" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="2" width="12" height="11" rx="1" />
      <path d="M1 6h12M4 1v2M10 1v2" />
    </svg>
  );
}

function ThermoIcon() {
  return (
    <svg className={iconCls} viewBox="0 0 14 14" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 1v7.5M7 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
      <path d="M5 4h1M5 6h1" />
    </svg>
  );
}

function PressureIcon() {
  return (
    <svg className={iconCls} viewBox="0 0 14 14" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 13V5M4 8l3-3 3 3" />
      <path d="M2 3h10" />
    </svg>
  );
}

function LightIcon() {
  return (
    <svg className={iconCls} viewBox="0 0 14 14" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="2.5" />
      <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M3 3l1 1M10 10l1 1M10 3l-1 1M3 10l1-1" />
    </svg>
  );
}

function TideIcon() {
  return (
    <svg className={iconCls} viewBox="0 0 14 14" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 9c2-2 3-2 5 0s3 2 5 0M1 6c2-2 3-2 5 0s3 2 5 0" />
    </svg>
  );
}

function formatDate(isoString: string, locale: string): string {
  return new Date(isoString).toLocaleDateString(locale, {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

const DISMISS_THRESHOLD = 80;

export function SpeciesSheet({ score, datetime, userCatches, onClose, onNavigateToLog }: Props) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language.startsWith('nb') ? 'nb-NO' : 'en-US';
  const { prefs } = useUnits();
  const hasInfo = KNOWN_SPECIES.has(score.name);
  const k = `speciesInfo.${score.name}` as const;

  function scoreTimeLabel(dt: Date): string {
    const now = new Date();
    const isToday =
      dt.getFullYear() === now.getFullYear() &&
      dt.getMonth() === now.getMonth() &&
      dt.getDate() === now.getDate();
    if (isToday) return t('species.scoreNow');
    return dt.toLocaleDateString(dateLocale, { weekday: 'short', day: 'numeric', month: 'short' });
  }

  const pct = Math.round(score.score * 100);
  const color = scoreColor(score.score);

  const agn = hasInfo ? t(`${k}.agn`, { returnObjects: true }) as string[] : [];
  const sluk = hasInfo ? t(`${k}.sluk`, { returnObjects: true }) as string[] : [];
  const fargetips = hasInfo ? t(`${k}.fargetips`) : '';
  const bestTide = hasInfo ? t(`${k}.bestTide`) : '';

  const [visible, setVisible] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const dragging = useRef(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  function onHandleTouchStart(e: React.TouchEvent) {
    startY.current = e.touches[0].clientY;
    dragging.current = true;
    setIsDragging(true);
  }

  function onHandleTouchMove(e: React.TouchEvent) {
    if (!dragging.current) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) setDragY(delta);
  }

  function onHandleTouchEnd() {
    dragging.current = false;
    setIsDragging(false);
    if (dragY > DISMISS_THRESHOLD) {
      setDragY(window.innerHeight);
      setTimeout(onClose, 220);
    } else {
      setDragY(0);
    }
  }

  const relevant = userCatches.filter(
    (c) => c.species.name.toLowerCase() === score.name.toLowerCase(),
  );

  return (
    <div className="fixed inset-0 bg-black/60 z-[1100] flex items-end" onClick={onClose}>
      <div
        className="bg-surface rounded-t-2xl w-full max-h-[88dvh] flex flex-col overflow-hidden will-change-transform"
        style={{
          transform: visible ? `translateY(${dragY}px)` : 'translateY(100%)',
          transition: isDragging ? 'none' : 'transform 0.25s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-9 h-1 bg-divider rounded-full mx-auto mt-3 mb-1 shrink-0 cursor-grab touch-none" />

        <div
          className="px-5 pb-3 border-b border-divider shrink-0 cursor-grab touch-pan-x"
          onTouchStart={onHandleTouchStart}
          onTouchMove={onHandleTouchMove}
          onTouchEnd={onHandleTouchEnd}
        >
          <SpeciesCardHeader name={score.name} />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 pb-8 flex flex-col gap-5">
          <section>
            <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-text-muted mb-2">
              {scoreTimeLabel(datetime)}
            </h3>

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[0.85rem] font-semibold text-text">{t('species.total')}</span>
                <span className="text-base font-bold" style={{ color }}>{pct}%</span>
              </div>
              <div className="h-1.5 bg-divider rounded-[3px] overflow-hidden mb-1">
                <div className="h-full rounded-[3px] transition-[width] duration-[400ms] ease-in-out" style={{ width: `${pct}%`, background: color }} />
              </div>

              <div className="flex items-center justify-between text-[0.8rem] text-text-muted mb-0.5">
                <span>{hasInfo ? t(`${k}.primaryDriver`) : t('species.primaryDriver')}</span>
                <span>{Math.round(score.primary * 100)}%</span>
              </div>
              <div className="h-1.5 bg-divider rounded-[3px] overflow-hidden mb-1">
                <div className="h-full rounded-[3px] transition-[width] duration-[400ms] ease-in-out" style={{ width: `${Math.round(score.primary * 100)}%`, background: 'var(--color-text-muted)' }} />
              </div>

              <div className="flex items-center justify-between text-[0.8rem] text-text-muted mb-0.5">
                <span>{hasInfo ? t(`${k}.secondaryDriver`) : t('species.secondaryDriver')}</span>
                <span>{Math.round(score.secondary * 100)}%</span>
              </div>
              <div className="h-1.5 bg-divider rounded-[3px] overflow-hidden mb-1">
                <div className="h-full rounded-[3px] transition-[width] duration-[400ms] ease-in-out" style={{ width: `${Math.round(score.secondary * 100)}%`, background: 'var(--color-text-muted)' }} />
              </div>

              <div className="text-[0.8rem] text-text-muted pt-1 border-t border-divider">
                {t('species.solunarMultiplier', { value: score.solunar.toFixed(2) })}
              </div>
            </div>
          </section>

          {hasInfo && (
            <section>
              <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-text-muted mb-2">
                {t('species.bestConditions')}
              </h3>
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5 text-sm text-text">
                  <ThermoIcon />
                  <span className="text-text-muted text-[0.8rem] min-w-[80px]">{t('species.temperature')}</span>
                  <span>{t(`${k}.tempLabel`)}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-text">
                  <PressureIcon />
                  <span className="text-text-muted text-[0.8rem] min-w-[80px]">{t('species.pressure')}</span>
                  <span>{t(`${k}.bestPressure`)}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-text">
                  <LightIcon />
                  <span className="text-text-muted text-[0.8rem] min-w-[80px]">{t('species.light')}</span>
                  <span>{t(`${k}.bestLight`)}</span>
                </div>
                {bestTide !== '—' && (
                  <div className="flex items-center gap-2.5 text-sm text-text">
                    <TideIcon />
                    <span className="text-text-muted text-[0.8rem] min-w-[80px]">{t('species.tide')}</span>
                    <span>{bestTide}</span>
                  </div>
                )}
                <div className="flex items-start gap-2.5 text-[0.82rem] text-text-muted leading-relaxed mt-1">
                  <CalendarIcon />
                  <span>{t(`${k}.season`)}</span>
                </div>
              </div>
            </section>
          )}

          {hasInfo && (agn.length > 0 || sluk.length > 0) && (
            <section>
              <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-text-muted mb-2">
                {t('species.baitAndLures')}
              </h3>
              {agn.length > 0 && (
                <div className="flex flex-col gap-1.5 mb-3">
                  <span className="text-[0.68rem] font-semibold uppercase tracking-[0.06em] text-text-muted">
                    {t('species.naturalBait')}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {agn.map((a) => (
                      <span key={a} className="text-[0.78rem] font-medium px-2.5 py-1 rounded-full border border-divider text-text bg-bg whitespace-nowrap">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {sluk.length > 0 && (
                <div className="flex flex-col gap-1.5 mb-3">
                  <span className="text-[0.68rem] font-semibold uppercase tracking-[0.06em] text-text-muted">
                    {t('species.lures')}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {sluk.map((s) => (
                      <span key={s} className="text-[0.78rem] font-medium px-2.5 py-1 rounded-full border border-accent text-accent bg-accent/[0.06] whitespace-nowrap">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2 text-[0.82rem] text-text leading-relaxed mt-1 mb-2">
                <svg className="w-3.5 h-3.5 shrink-0 mt-0.5 text-text-muted" viewBox="0 0 14 14" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="7" cy="7" r="6" />
                  <path d="M7 5v4M7 3.5v.5" />
                </svg>
                <span>{t(`${k}.teknikktips`)}</span>
              </div>
              {fargetips && (
                <div className="flex items-start gap-2 text-[0.82rem] text-text leading-relaxed mt-1 mb-2">
                  <svg className="w-3.5 h-3.5 shrink-0 mt-0.5 text-text-muted" viewBox="0 0 14 14" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="7" cy="7" r="5" />
                    <path d="M7 2a5 5 0 0 1 0 10" fill="currentColor" fillOpacity="0.2" stroke="none" />
                    <circle cx="4.5" cy="5" r="1" fill="currentColor" stroke="none" />
                    <circle cx="9.5" cy="5" r="1" fill="currentColor" stroke="none" />
                    <circle cx="7" cy="10" r="1" fill="currentColor" stroke="none" />
                  </svg>
                  <span className="text-text-muted italic">{fargetips}</span>
                </div>
              )}
            </section>
          )}

          {hasInfo && (
            <section>
              <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-text-muted mb-2">
                {t('species.catchTips')}
              </h3>
              <div className="flex items-start gap-2.5 mt-2 px-3 py-2.5 bg-bg rounded-[var(--radius-sm)] border-l-[3px] border-l-accent">
                <svg className="w-[18px] h-[18px] shrink-0 mt-px text-accent" viewBox="0 0 14 14" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 11 C3 9 5 8 7 9 C9 10 11 9 12 7" />
                  <path d="M12 7 L12 5 L10 7" />
                  <circle cx="2" cy="11" r="1" fill="currentColor" stroke="none" />
                </svg>
                <div>
                  <span className="block text-[0.68rem] font-bold uppercase tracking-[0.07em] text-text-muted mb-0.5">
                    {t('species.fromShore')}
                  </span>
                  <p className="text-[0.82rem] text-text leading-[1.55]">{t(`${k}.fraLandTips`)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 mt-2 px-3 py-2.5 bg-bg rounded-[var(--radius-sm)] border-l-[3px] border-l-divider">
                <svg className="w-[18px] h-[18px] shrink-0 mt-px text-text-muted" viewBox="0 0 14 14" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 9 h10 l-1.5 3 H3.5 Z" />
                  <path d="M4 9 V6 Q7 4 10 6 V9" />
                  <path d="M7 4 V2" />
                </svg>
                <div>
                  <span className="block text-[0.68rem] font-bold uppercase tracking-[0.07em] text-text-muted mb-0.5">
                    {t('species.fromBoat')}
                  </span>
                  <p className="text-[0.82rem] text-text leading-[1.55]">{t(`${k}.fraBåtTips`)}</p>
                </div>
              </div>
            </section>
          )}

          {hasInfo && (
            <section>
              <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-text-muted mb-2">
                {t('species.about')}
              </h3>
              <p className="text-[0.9rem] leading-relaxed text-text">{t(`${k}.description`)}</p>
            </section>
          )}

          {relevant.length > 0 && (
            <section>
              <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-text-muted mb-2">
                {t('species.myCatches', { count: relevant.length })}
              </h3>
              <div className="flex flex-col">
                {relevant.slice(0, 10).map((c) => (
                  <div key={c.catch_id} className="flex justify-between py-2 border-b border-divider text-[0.85rem]">
                    <div>
                      <div className="font-semibold text-text">{c.species.name}</div>
                      <div className="text-text-muted text-[0.8rem]">
                        {c.species.weight_kg != null ? formatWeight(c.species.weight_kg, prefs.weight) : ''}
                        {c.species.weight_kg != null && c.species.length_cm != null ? ' · ' : ''}
                        {c.species.length_cm != null ? formatLength(c.species.length_cm, prefs.length) : ''}
                      </div>
                    </div>
                    <div className="text-text-muted text-[0.8rem]">{formatDate(c.created_at, dateLocale)}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <button
            onClick={onNavigateToLog}
            className="w-full py-3.5 bg-accent text-white rounded-[var(--radius-md)] text-[0.95rem] font-bold mt-auto shrink-0 active:opacity-85"
          >
            {t('log.logSpecies', { name: t(`speciesNames.${score.name}`, { defaultValue: score.name }) })}
          </button>
        </div>
      </div>
    </div>
  );
}
