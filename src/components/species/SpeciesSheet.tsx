import type { SpeciesScore } from '../../lib/biteScore';
import type { CatchRecord } from '../../types';
import { SPECIES_INFO } from '../../lib/speciesInfo';
import { FishSvg } from './FishSvg';
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
  const d = new Date(isoString);
  return d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function SpeciesSheet({ score, userCatches, onClose, onNavigateToLog }: Props) {
  const info = SPECIES_INFO[score.name];
  const pct = Math.round(score.score * 100);
  const color = scoreColor(score.score);

  const relevant = userCatches.filter(
    (c) => c.species.name.toLowerCase() === score.name.toLowerCase(),
  );

  function stopPropagation(e: React.MouseEvent) {
    e.stopPropagation();
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={stopPropagation}>
        <div className={styles.handle} />

        <div className={styles.header}>
          <FishSvg name={score.name} className={styles.fishIllustration} />
          <div className={styles.nameRow}>
            <h2 className={styles.speciesName}>{score.name}</h2>
            <span className={styles.waterBadge}>
              {score.water === 'salt' ? 'Saltvann' : 'Ferskvann'}
            </span>
          </div>
        </div>

        <div className={styles.content}>
          <section>
            <h3 className={styles.sectionTitle}>Score nå</h3>
            <div className={styles.scoreBlock}>
              <div className={styles.scoreTotalRow}>
                <span className={styles.scoreTotalLabel}>Total</span>
                <span className={styles.scoreTotalPct} style={{ color }}>{pct}%</span>
              </div>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>

              <div className={styles.subScoreRow}>
                <span>Primær</span>
                <span>{Math.round(score.primary * 100)}%</span>
              </div>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{ width: `${Math.round(score.primary * 100)}%`, background: 'var(--color-text-muted)' }}
                />
              </div>

              <div className={styles.subScoreRow}>
                <span>Sekundær</span>
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
