import { useMemo } from 'react';
import { computeAllScores, type EnvInputs } from '../lib/biteScore';
import type { PressureTrend, CurrentStrength } from '../types';
import type { HourlyTideEntry } from '../hooks/useTide';
import type { HourlyWeatherEntry } from '../hooks/useWeather';
import styles from './DailyScoreChart.module.css';

interface Props {
  datetime:      Date;
  hourlyTide:    HourlyTideEntry[];
  hourlyWeather: HourlyWeatherEntry[];
  pressure:      PressureTrend;
  waterTemp:     number;
  windSpeed:     number;
  lat:           number;
  lng:           number;
  waterFilter:   'salt' | 'fresh';
}

const W = 300;
const H = 64;
const PAD_LEFT  = 0;
const PAD_RIGHT = 0;
const CHART_W   = W - PAD_LEFT - PAD_RIGHT;

function xAt(hour: number) {
  return PAD_LEFT + (hour / 23) * CHART_W;
}

function yAt(score: number) {
  return H * (1 - score);
}

function buildPath(scores: number[]): { line: string; area: string } {
  const pts = scores.map((s, h) => [xAt(h), yAt(s)] as [number, number]);

  // Monotone smooth path via cardinal spline
  let line = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[Math.max(0, i - 2)];
    const p1 = pts[i - 1];
    const p2 = pts[i];
    const p3 = pts[Math.min(pts.length - 1, i + 1)];
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    line += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }

  const area =
    line +
    ` L ${pts[pts.length - 1][0].toFixed(1)} ${H}` +
    ` L ${pts[0][0].toFixed(1)} ${H} Z`;

  return { line, area };
}

const HOUR_LABELS = [0, 6, 12, 18, 23];

export function DailyScoreChart({
  datetime, hourlyTide, hourlyWeather, pressure, waterTemp, windSpeed, lat, lng, waterFilter,
}: Props) {
  const selectedHour = datetime.getHours();

  const scores = useMemo(() => {
    const dayStart = new Date(datetime);
    dayStart.setHours(0, 0, 0, 0);

    return Array.from({ length: 24 }, (_, h) => {
      const date: Date = new Date(dayStart.getTime() + h * 3_600_000);
      const tideEntry  = hourlyTide[h];

      const wx = hourlyWeather[h];
      const inputs: EnvInputs = {
        pressure_trend:   wx?.pressureTrend  ?? pressure,
        water_temp:       wx?.waterTemp      ?? waterTemp,
        tide_phase:       tideEntry?.phase   ?? 'rising',
        current_strength: (tideEntry?.current ?? 'moderat') as CurrentStrength,
        wind_speed_ms:    wx?.windSpeed      ?? windSpeed,
        lat, lng, date,
      };

      const { scores: allScores } = computeAllScores(inputs);
      const filtered = allScores.filter((s) => s.water === waterFilter);
      return filtered.length > 0 ? Math.max(...filtered.map((s) => s.score)) : 0;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hourlyTide, hourlyWeather, pressure, waterTemp, windSpeed, lat, lng, waterFilter,
      datetime.toDateString()]);

  const { line, area } = buildPath(scores);
  const cursorX = xAt(selectedHour);
  const cursorY = yAt(scores[selectedHour] ?? 0);
  const peakScore = Math.max(...scores);
  const peakHour  = scores.indexOf(peakScore);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.title}>{isToday(datetime) ? 'Score i dag' : datetime.toLocaleDateString('nb-NO', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
        <span className={styles.peak}>
          Topp {pad(peakHour)}:00 · {Math.round(peakScore * 100)}%
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className={styles.svg}
      >
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="var(--color-primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path d={area} fill="url(#chart-fill)" />

        {/* Score line */}
        <path d={line} fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" />

        {/* Peak hour marker */}
        <line
          x1={xAt(peakHour)} y1="0"
          x2={xAt(peakHour)} y2={H}
          stroke="var(--color-primary)"
          strokeWidth="1"
          strokeDasharray="3 3"
          opacity="0.5"
        />

        {/* Selected time cursor — only meaningful when viewing today */}
        {isToday(datetime) && <>
          <line
            x1={cursorX} y1="0"
            x2={cursorX} y2={H}
            stroke="var(--color-warning)"
            strokeWidth="1.5"
          />
          <circle
            cx={cursorX} cy={cursorY} r="3"
            fill="var(--color-warning)"
            stroke="var(--color-bg)"
            strokeWidth="1.5"
          />
        </>}
      </svg>

      {/* X-axis labels */}
      <div className={styles.xAxis}>
        {HOUR_LABELS.map((h) => (
          <span
            key={h}
            className={styles.xLabel}
            style={{ left: `${(h / 23) * 100}%` }}
          >
            {pad(h)}
          </span>
        ))}
      </div>
    </div>
  );
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function isToday(d: Date): boolean {
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}
