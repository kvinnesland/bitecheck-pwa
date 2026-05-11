import { useState, useRef, useEffect } from 'react';
import type { SpeciesScore } from '../../lib/biteScore';
import type { CatchRecord } from '../../types';
import { SPECIES_INFO } from '../../lib/speciesInfo';
import { SpeciesCardHeader } from './SpeciesCardHeader';
import styles from './SpeciesSheet.module.css';

interface Props {
  score: SpeciesScore;
  userCatches: CatchRecord[];
  onClose: () => void;
  onNavigateToLog: () => void;
}

function scoreColor(score: number): string {
  if (score >= 0.75) return '#0066CC';
  if (score >= 0.5)  return '#22c55e';
  if (score >= 0.25) return '#f59e0b';
  return '#ef4444';
}

function ThermoIcon() {
  return (
    <svg className={styles.bestIcon} viewBox="0 0 14 14">
      <path d="M7 1v7.5M7 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
      <path d="M5 4h1M5 6h1" />
    </svg>
  );
}

function PressureIcon() {
  return (
    <svg className={styles.bestIcon} viewBox="0 0 14 14">
      <path d="M7 13V5M4 8l3-3 3 3" />
      <path d="M2 3h10" />
    </svg>
  );
}

function LightIcon() {
  return (
    <svg className={styles.bestIcon} viewBox="0 0 14 14">
      <circle cx="7" cy="7" r="2.5" />
      <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M3 3l1 1M10 10l1 1M10 3l-1 1M3 10l1-1" />
    </svg>
  );
}

function TideIcon() {
  return (
    <svg className={styles.bestIcon} viewBox="0 0 14 14">
      <path d="M1 9c2-2 3-2 5 0s3 2 5 0M1 6c2-2 3-2 5 0s3 2 5 0" />
    </svg>
  );
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('nb-NO', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

const DISMISS_THRESHOLD = 80;

export function SpeciesSheet({ score, userCatches, onClose, onNavigateToLog }: Props) {
  const info = SPECIES_INFO[score.name];
  const pct = Math.round(score.score * 100);
  const color = scoreColor(score.score);

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
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.sheet}
        style={{
          transform: visible ? `translateY(${dragY}px)` : 'translateY(100%)',
          transition: isDragging ? 'none' : 'transform 0.25s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={styles.handle}
        />

        <div
          className={styles.header}
          onTouchStart={onHandleTouchStart}
          onTouchMove={onHandleTouchMove}
          onTouchEnd={onHandleTouchEnd}
        >
          <SpeciesCardHeader name={score.name} />
        </div>

        <div className={styles.content}>
          <section>
            <h3 className={styles.sectionTitle}>Score nå</h3>
            <div className={styles.scoreBlock}>
              <div className={styles.scoreTotalRow}>
                <span className={styles.scoreTotalLabel}>Totalt</span>
                <span className={styles.scoreTotalPct} style={{ color }}>{pct}%</span>
              </div>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: `${pct}%`, background: color }} />
              </div>

              <div className={styles.subScoreRow}>
                <span>{info?.primaryDriver ?? 'Primærfaktor'}</span>
                <span>{Math.round(score.primary * 100)}%</span>
              </div>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{ width: `${Math.round(score.primary * 100)}%`, background: 'var(--color-text-muted)' }}
                />
              </div>

              <div className={styles.subScoreRow}>
                <span>{info?.secondaryDriver ?? 'Sekundærfaktor'}</span>
                <span>{Math.round(score.secondary * 100)}%</span>
              </div>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{ width: `${Math.round(score.secondary * 100)}%`, background: 'var(--color-text-muted)' }}
                />
              </div>

              <div className={styles.solunarRow}>
                Solunar-multiplikator: ×{score.solunar.toFixed(2)}
              </div>
            </div>
          </section>

          {info && (
            <section>
              <h3 className={styles.sectionTitle}>Beste forhold</h3>
              <div className={styles.conditionRows}>
                <div className={styles.bestRow}>
                  <ThermoIcon />
                  <span className={styles.bestLabel}>Temperatur</span>
                  <span>{info.tempLabel}</span>
                </div>
                <div className={styles.bestRow}>
                  <PressureIcon />
                  <span className={styles.bestLabel}>Trykk</span>
                  <span>{info.bestPressure}</span>
                </div>
                <div className={styles.bestRow}>
                  <LightIcon />
                  <span className={styles.bestLabel}>Lys</span>
                  <span>{info.bestLight}</span>
                </div>
                {info.bestTide !== '—' && (
                  <div className={styles.bestRow}>
                    <TideIcon />
                    <span className={styles.bestLabel}>Tidevann</span>
                    <span>{info.bestTide}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {info && (info.agn.length > 0 || info.sluk.length > 0) && (
            <section>
              <h3 className={styles.sectionTitle}>Agn &amp; sluk</h3>
              {info.agn.length > 0 && (
                <div className={styles.chipGroup}>
                  <span className={styles.chipGroupLabel}>Naturlig agn</span>
                  <div className={styles.chips}>
                    {info.agn.map((a) => <span key={a} className={styles.chip}>{a}</span>)}
                  </div>
                </div>
              )}
              {info.sluk.length > 0 && (
                <div className={styles.chipGroup}>
                  <span className={styles.chipGroupLabel}>Sluk &amp; lokkemidler</span>
                  <div className={styles.chips}>
                    {info.sluk.map((s) => <span key={s} className={`${styles.chip} ${styles.chipSluk}`}>{s}</span>)}
                  </div>
                </div>
              )}
              <div className={styles.tipsRow}>
                <svg className={styles.tipsIcon} viewBox="0 0 14 14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="7" cy="7" r="6" />
                  <path d="M7 5v4M7 3.5v.5" />
                </svg>
                <span>{info.teknikktips}</span>
              </div>
              {info.fargetips && (
                <div className={styles.tipsRow}>
                  <svg className={styles.tipsIcon} viewBox="0 0 14 14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="7" cy="7" r="5" />
                    <path d="M7 2a5 5 0 0 1 0 10" fill="currentColor" fillOpacity="0.2" stroke="none" />
                    <circle cx="4.5" cy="5" r="1" fill="currentColor" stroke="none" />
                    <circle cx="9.5" cy="5" r="1" fill="currentColor" stroke="none" />
                    <circle cx="7" cy="10" r="1" fill="currentColor" stroke="none" />
                  </svg>
                  <span className={styles.fargetips}>{info.fargetips}</span>
                </div>
              )}
            </section>
          )}

          {info && (
            <section>
              <h3 className={styles.sectionTitle}>Fangsttips</h3>
              <div className={styles.catchTipsRow}>
                <svg className={styles.catchTipsIcon} viewBox="0 0 14 14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 11 C3 9 5 8 7 9 C9 10 11 9 12 7" />
                  <path d="M12 7 L12 5 L10 7" />
                  <circle cx="2" cy="11" r="1" fill="currentColor" stroke="none" />
                </svg>
                <div>
                  <span className={styles.catchTipsLabel}>Fra land</span>
                  <p className={styles.catchTipsText}>{info.fraLandTips}</p>
                </div>
              </div>
              <div className={styles.catchTipsRow}>
                <svg className={styles.catchTipsIcon} viewBox="0 0 14 14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 9 h10 l-1.5 3 H3.5 Z" />
                  <path d="M4 9 V6 Q7 4 10 6 V9" />
                  <path d="M7 4 V2" />
                </svg>
                <div>
                  <span className={styles.catchTipsLabel}>Fra båt</span>
                  <p className={styles.catchTipsText}>{info.fraBåtTips}</p>
                </div>
              </div>
            </section>
          )}

          {info && (
            <section>
              <h3 className={styles.sectionTitle}>Om arten</h3>
              <p className={styles.description}>{info.description}</p>
            </section>
          )}

          {relevant.length > 0 && (
            <section>
              <h3 className={styles.sectionTitle}>Mine fangster ({relevant.length})</h3>
              <div className={styles.catchList}>
                {relevant.slice(0, 10).map((c) => (
                  <div key={c.catch_id} className={styles.catchRow}>
                    <div>
                      <div className={styles.catchSpecies}>{c.species.name}</div>
                      <div className={styles.catchMeta}>
                        {c.species.weight_kg != null ? `${c.species.weight_kg} kg` : ''}
                        {c.species.weight_kg != null && c.species.length_cm != null ? ' · ' : ''}
                        {c.species.length_cm != null ? `${c.species.length_cm} cm` : ''}
                      </div>
                    </div>
                    <div className={styles.catchDate}>{formatDate(c.created_at)}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <button className={styles.logBtn} onClick={onNavigateToLog}>
            Logg fangst av {score.name}
          </button>
        </div>
      </div>
    </div>
  );
}
