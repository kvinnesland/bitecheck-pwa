import SunCalc from 'suncalc';
import type { PressureTrend, TidePhase } from '../types';

// ─── Input types ────────────────────────────────────────────────────────────

export interface EnvInputs {
  pressure_trend: PressureTrend;
  water_temp: number;       // °C
  tide_phase: TidePhase;
  current_speed_ms: number; // m/s  (0.5 default when unknown)
  wind_speed_ms: number;    // m/s  (5.0 default when unknown)
  lat: number;
  lng: number;
  date: Date;
}

export interface SpeciesScore {
  name: string;
  water: 'salt' | 'fresh';
  score: number;      // 0.0–1.0 clamped
  primary: number;    // normalized primary variable
  secondary: number;  // normalized secondary variable
  solunar: number;    // multiplier applied
  label: string;      // 'Utmerket' | 'Bra' | 'Moderat' | 'Dårlig'
}

export interface SolunarInfo {
  type: 'major' | 'minor' | 'none';
  multiplier: number;
  moonPhase: number;      // 0.0–1.0 (0 = new, 0.5 = full)
  moonPhaseName: string;
  lightLux: number;
  minutesUntilNext: number;
  nextType: 'major' | 'minor';
}

// ─── Variable normalisers ────────────────────────────────────────────────────

function normPressure(trend: PressureTrend): number {
  const m: Record<PressureTrend, number> = {
    falling_rapidly: 1.0,
    falling:         0.8,
    stable:          0.6,
    rising:          0.4,
    rising_rapidly:  0.2,
  };
  return m[trend];
}

function normPressureStable(trend: PressureTrend): number {
  // Uer prefers stable pressure — peak at stable
  const m: Record<PressureTrend, number> = {
    stable:          1.0,
    falling:         0.6,
    rising:          0.6,
    falling_rapidly: 0.2,
    rising_rapidly:  0.2,
  };
  return m[trend];
}

function normTide(phase: TidePhase): number {
  const m: Record<TidePhase, number> = {
    rising: 0.9,
    high:   0.5,
    falling: 0.6,
    low:    0.3,
    slack:  0.4,
  };
  return m[phase];
}

function normTemp(
  temp: number,
  lo: number,
  hi: number,
  decayWidth = 8,
): number {
  if (temp >= lo && temp <= hi) return 1.0;
  const dist = temp < lo ? lo - temp : temp - hi;
  return Math.max(0, 1 - dist / decayWidth);
}

function normMoonPhase(phase: number): number {
  // SunCalc: 0 = new moon, 0.5 = full moon, 1 = next new moon
  const distNew  = Math.min(phase, 1 - phase);  // 0 at new moon
  const distFull = Math.abs(phase - 0.5);        // 0 at full moon
  const minDist  = Math.min(distNew, distFull);
  return Math.exp(-Math.pow(minDist / 0.15, 2));
}

function normCurrentSei(speed: number): number {
  // Peak 0.5–1.5 m/s
  if (speed >= 0.5 && speed <= 1.5) return 1.0;
  if (speed < 0.5) return speed / 0.5;
  return Math.max(0, 1 - (speed - 1.5) / 1.5);
}

function normCurrentSlow(speed: number): number {
  // Lange/Brosme/Lomre: peak < 0.2 m/s
  return Math.max(0, 1 - speed / 0.8);
}

function normLightInverted(lux: number): number {
  return Math.max(0, 1 - lux / 100_000);
}

function normLightTwilight(lux: number): number {
  // Peak at ~15 000 lux (sunrise / sunset)
  return Math.exp(-Math.pow((lux - 15_000) / 25_000, 2));
}

// ─── Derived environmental state ─────────────────────────────────────────────

interface Derived {
  moonPhase:        number;
  lightLux:         number;
  solunarMultiplier: number;
  solunarType:      'major' | 'minor' | 'none';
  minutesUntilNext: number;
  nextSolunarType:  'major' | 'minor';
}

function sunAltToLux(altRad: number): number {
  const deg = altRad * (180 / Math.PI);
  if (deg < -18) return 0;
  if (deg < -12) return 5;
  if (deg < -6)  return 100;
  if (deg < 0)   return 600;
  if (deg < 6)   return 15_000;
  if (deg < 30)  return 50_000;
  return 100_000;
}

function scanMoonExtremes(
  lat: number,
  lng: number,
  date: Date,
): { transit: Date; nadir: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  let maxAlt = -Infinity;
  let minAlt =  Infinity;
  let transitTime = start;
  let nadirTime   = start;

  for (let m = 0; m < 1440; m += 3) {
    const t = new Date(start.getTime() + m * 60_000);
    const { altitude } = SunCalc.getMoonPosition(t, lat, lng);
    if (altitude > maxAlt) { maxAlt = altitude; transitTime = t; }
    if (altitude < minAlt) { minAlt = altitude; nadirTime   = t; }
  }

  return { transit: transitTime, nadir: nadirTime };
}

function derive(inputs: EnvInputs): Derived {
  const { date, lat, lng } = inputs;
  const nowMs = date.getTime();

  const moonIllum = SunCalc.getMoonIllumination(date);
  const moonPhase = moonIllum.phase;

  const sunPos  = SunCalc.getPosition(date, lat, lng);
  const lightLux = sunAltToLux(sunPos.altitude);

  const moonTimes = SunCalc.getMoonTimes(date, lat, lng);
  const { transit, nadir } = scanMoonExtremes(lat, lng, date);

  const MAJOR_WINDOW = 60 * 60_000; // ±60 min
  const MINOR_WINDOW = 30 * 60_000; // ±30 min

  const majorTimes = [transit, nadir];
  const minorTimes = [moonTimes.rise, moonTimes.set].filter(
    (t): t is Date => t instanceof Date,
  );

  let solunarType: 'major' | 'minor' | 'none' = 'none';

  for (const t of majorTimes) {
    if (Math.abs(nowMs - t.getTime()) <= MAJOR_WINDOW) {
      solunarType = 'major';
      break;
    }
  }
  if (solunarType === 'none') {
    for (const t of minorTimes) {
      if (Math.abs(nowMs - t.getTime()) <= MINOR_WINDOW) {
        solunarType = 'minor';
        break;
      }
    }
  }

  const solunarMultiplier =
    solunarType === 'major' ? 1.15 :
    solunarType === 'minor' ? 1.07 : 1.00;

  // Next solunar period
  const allPeriods: Array<{ t: Date; type: 'major' | 'minor' }> = [
    ...majorTimes.map((t) => ({ t, type: 'major' as const })),
    ...minorTimes.map((t) => ({ t, type: 'minor' as const })),
  ];

  const future = allPeriods
    .filter(({ t }) => t.getTime() > nowMs)
    .sort((a, b) => a.t.getTime() - b.t.getTime());

  const next = future[0] ?? { t: new Date(nowMs + 6 * 3600_000), type: 'major' as const };
  const minutesUntilNext = Math.round((next.t.getTime() - nowMs) / 60_000);

  return {
    moonPhase,
    lightLux,
    solunarMultiplier,
    solunarType,
    minutesUntilNext,
    nextSolunarType: next.type,
  };
}

// ─── Species weight table ────────────────────────────────────────────────────

interface SpeciesDef {
  name: string;
  water: 'salt' | 'fresh';
  primary:   (e: EnvInputs, d: Derived) => number;
  secondary: (e: EnvInputs, d: Derived) => number;
}

const SPECIES_DEFS: SpeciesDef[] = [
  {
    name: 'Torsk', water: 'salt',
    primary:   (e)    => normPressure(e.pressure_trend),
    secondary: (e)    => normTemp(e.water_temp, 4, 8),
  },
  {
    name: 'Kveite', water: 'salt',
    primary:   (e)    => normTide(e.tide_phase),
    secondary: (_, d) => normMoonPhase(d.moonPhase),
  },
  {
    name: 'Sei', water: 'salt',
    primary:   (e)    => normCurrentSei(e.current_speed_ms),
    secondary: (_, d) => normLightTwilight(d.lightLux),
  },
  {
    name: 'Hyse', water: 'salt',
    primary:   (e)    => normPressure(e.pressure_trend),
    secondary: ()     => 0.5,
  },
  {
    name: 'Lange', water: 'salt',
    primary:   (e)    => normTide(e.tide_phase),
    secondary: ()     => 0.6,
  },
  {
    name: 'Brosme', water: 'salt',
    primary:   (e)    => normTide(e.tide_phase),
    secondary: ()     => 0.6,
  },
  {
    name: 'Uer', water: 'salt',
    primary:   (_, d) => normLightInverted(d.lightLux),
    secondary: (e)    => normPressureStable(e.pressure_trend),
  },
  {
    name: 'Steinbit', water: 'salt',
    primary:   (e)    => normTemp(e.water_temp, 4, 10, 6),
    secondary: (e)    => normTide(e.tide_phase),
  },
  {
    name: 'Makrell', water: 'salt',
    primary:   (e)    => normTemp(e.water_temp, 12, 24, 8),
    secondary: (e)    => Math.min(1, e.wind_speed_ms / 15),
  },
  {
    name: 'Rødspette', water: 'salt',
    primary:   (e)    => normTide(e.tide_phase),
    secondary: ()     => 0.5,
  },
  {
    name: 'Lomre', water: 'salt',
    primary:   ()     => 0.5,
    secondary: (e)    => normCurrentSlow(e.current_speed_ms),
  },
  {
    name: 'Sandflyndre', water: 'salt',
    primary:   ()     => 0.5,
    secondary: (e)    => normCurrentSlow(e.current_speed_ms),
  },
  {
    name: 'Sild', water: 'salt',
    primary:   (e)    => normTemp(e.water_temp, 6, 14, 6),
    secondary: (_, d) => normMoonPhase(d.moonPhase),
  },
  {
    name: 'Laks', water: 'salt',
    primary:   (_, d) => normLightTwilight(d.lightLux),
    secondary: (e)    => normPressure(e.pressure_trend),
  },
  {
    name: 'Sjøørret', water: 'salt',
    primary:   (_, d) => normLightTwilight(d.lightLux),
    secondary: (e)    => normPressure(e.pressure_trend),
  },
  {
    name: 'Sjørøye', water: 'salt',
    primary:   (e)    => normTemp(e.water_temp, 2, 14, 6),
    secondary: ()     => 0.5,
  },
  {
    name: 'Ørret', water: 'fresh',
    primary:   (e)    => normPressure(e.pressure_trend),
    secondary: (e)    => normTemp(e.water_temp, 8, 14, 6),
  },
  {
    name: 'Røye', water: 'fresh',
    primary:   (e)    => normPressure(e.pressure_trend),
    secondary: (e)    => normTemp(e.water_temp, 4, 8, 6),
  },
  {
    name: 'Abbor', water: 'fresh',
    primary:   (e)    => normTemp(e.water_temp, 15, 22, 6),
    secondary: (_, d) => normLightTwilight(d.lightLux),
  },
  {
    name: 'Gjedde', water: 'fresh',
    primary:   (e)    => normTemp(e.water_temp, 10, 20, 8),
    secondary: (_, d) => normLightInverted(d.lightLux),
  },
  {
    name: 'Harr', water: 'fresh',
    primary:   (e)    => normTemp(e.water_temp, 8, 14, 6),
    secondary: (e)    => normPressureStable(e.pressure_trend),
  },
];

function scoreLabel(score: number): string {
  if (score >= 0.75) return 'Utmerket';
  if (score >= 0.5)  return 'Bra';
  if (score >= 0.25) return 'Moderat';
  return 'Dårlig';
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function computeAllScores(inputs: EnvInputs): {
  scores: SpeciesScore[];
  solunar: SolunarInfo;
} {
  const d = derive(inputs);

  const scores: SpeciesScore[] = SPECIES_DEFS.map((def) => {
    const p = def.primary(inputs, d);
    const s = def.secondary(inputs, d);
    const raw = (p * 0.6 + s * 0.4) * d.solunarMultiplier;
    const score = Math.min(1, Math.max(0, raw));
    return {
      name: def.name,
      water: def.water,
      score,
      primary: p,
      secondary: s,
      solunar: d.solunarMultiplier,
      label: scoreLabel(score),
    };
  }).sort((a, b) => b.score - a.score);

  const moonPhaseName = moonPhaseLabel(d.moonPhase);

  return {
    scores,
    solunar: {
      type:             d.solunarType,
      multiplier:       d.solunarMultiplier,
      moonPhase:        d.moonPhase,
      moonPhaseName,
      lightLux:         d.lightLux,
      minutesUntilNext: d.minutesUntilNext,
      nextType:         d.nextSolunarType,
    },
  };
}

function moonPhaseLabel(phase: number): string {
  if (phase < 0.05 || phase > 0.95) return 'Nymåne';
  if (phase < 0.2)  return 'Tiltagende halvmåne';
  if (phase < 0.3)  return 'Tiltagende halvmåne';
  if (phase < 0.45) return 'Tiltagende gibbus';
  if (phase < 0.55) return 'Fullmåne';
  if (phase < 0.7)  return 'Avtakende gibbus';
  if (phase < 0.8)  return 'Avtakende halvmåne';
  return 'Avtakende sigd';
}
