import { useState, useEffect } from 'react';
import type { TidePhase, CurrentStrength } from '../types';

interface CacheEntry {
  phase: TidePhase;
  currentStrength: CurrentStrength;
  fetchedAt: number;
}

const CACHE = new Map<string, CacheEntry>();
const CACHE_TTL = 30 * 60 * 1000;

function pad(s: string | number, n = 2) {
  return String(s).padStart(n, '0');
}

function toLocalISO(d: Date): string {
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

interface WaterEvent { time: Date; flag: 'H' | 'L'; value: number; }

function parseEvents(xml: string): WaterEvent[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  const nodes = doc.querySelectorAll('waterlevel');
  const events: WaterEvent[] = [];
  nodes.forEach((n) => {
    const flag  = n.getAttribute('flag');
    const timeStr = n.getAttribute('time');
    const valStr  = n.getAttribute('value');
    if ((flag === 'H' || flag === 'L') && timeStr && valStr) {
      events.push({ time: new Date(timeStr), flag: flag as 'H' | 'L', value: parseFloat(valStr) });
    }
  });
  return events;
}

function classifyPhase(events: WaterEvent[], target: Date): TidePhase {
  if (events.length === 0) return 'rising';
  const t = target.getTime();
  let before: WaterEvent | null = null;
  let after:  WaterEvent | null = null;
  for (const ev of events) {
    if (ev.time.getTime() <= t) before = ev;
    else if (!after) after = ev;
  }

  const SLACK_MS = 25 * 60 * 1000;
  if (before && Math.abs(before.time.getTime() - t) < SLACK_MS)
    return before.flag === 'H' ? 'high' : 'low';
  if (after && Math.abs(after.time.getTime() - t) < SLACK_MS)
    return after.flag === 'H' ? 'high' : 'low';
  if (after) return after.flag === 'H' ? 'rising' : 'falling';
  if (before) return before.flag === 'H' ? 'falling' : 'rising';
  return 'rising';
}

// Estimate instantaneous tidal rate (cm/h) using sinusoidal approximation,
// then classify as a qualitative current strength.
function classifyCurrentStrength(events: WaterEvent[], target: Date): CurrentStrength {
  if (events.length < 2) return 'moderat';
  const t = target.getTime();
  let before: WaterEvent | null = null;
  let after:  WaterEvent | null = null;
  for (const ev of events) {
    if (ev.time.getTime() <= t) before = ev;
    else if (!after) after = ev;
  }
  if (!before || !after) return 'moderat';

  const range_cm     = Math.abs(after.value - before.value);
  const half_period_h = (after.time.getTime() - before.time.getTime()) / 3_600_000;
  const phase        = (t - before.time.getTime()) / (after.time.getTime() - before.time.getTime());

  // Peak rate of a sinusoidal tide = range × π / (2 × half_period)
  // Instantaneous rate at phase position:
  const rate_cm_h = (range_cm * Math.PI) / (2 * half_period_h) * Math.sin(Math.PI * phase);

  if (rate_cm_h < 8)  return 'stille';
  if (rate_cm_h < 22) return 'moderat';
  if (rate_cm_h < 45) return 'sterk';
  return 'sterkest';
}

export function useTide(
  lat: number,
  lng: number,
  datetime: Date,
  waterType: 'salt' | 'fresh',
): { tidePhase: TidePhase | null; currentStrength: CurrentStrength | null; tideLoading: boolean } {
  const [tidePhase,       setTidePhase]       = useState<TidePhase | null>(null);
  const [currentStrength, setCurrentStrength] = useState<CurrentStrength | null>(null);
  const [tideLoading,     setTideLoading]     = useState(false);

  const latK    = lat.toFixed(2);
  const lngK    = lng.toFixed(2);
  const hourKey = Math.floor(datetime.getTime() / 3_600_000);

  useEffect(() => {
    if (waterType === 'fresh') {
      setTidePhase(null);
      setCurrentStrength(null);
      return;
    }

    const cacheKey = `${latK},${lngK},${hourKey}`;
    const cached = CACHE.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
      setTidePhase(cached.phase);
      setCurrentStrength(cached.currentStrength);
      return;
    }

    const from = new Date(datetime.getTime() - 6 * 3_600_000);
    const to   = new Date(datetime.getTime() + 6 * 3_600_000);

    const url =
      `https://vannstand.kartverket.no/tideapi.php` +
      `?lat=${lat.toFixed(4)}&lon=${lng.toFixed(4)}` +
      `&fromtime=${toLocalISO(from)}&totime=${toLocalISO(to)}` +
      `&tide_request=tidetable&lang=en&refcode=cd`;

    setTideLoading(true);
    fetch(url)
      .then((r) => r.text())
      .then((xml) => {
        const events         = parseEvents(xml);
        const phase          = classifyPhase(events, datetime);
        const currentStrength = classifyCurrentStrength(events, datetime);
        CACHE.set(cacheKey, { phase, currentStrength, fetchedAt: Date.now() });
        setTidePhase(phase);
        setCurrentStrength(currentStrength);
      })
      .catch(() => {/* non-fatal */})
      .finally(() => setTideLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latK, lngK, hourKey, waterType]);

  return { tidePhase, currentStrength, tideLoading };
}
