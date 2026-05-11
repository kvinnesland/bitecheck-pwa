import { useState, useEffect } from 'react';
import type { TidePhase } from '../types';

const CACHE = new Map<string, { phase: TidePhase; fetchedAt: number }>();
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

interface WaterEvent { time: Date; flag: 'H' | 'L'; }

function parseEvents(xml: string): WaterEvent[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  const nodes = doc.querySelectorAll('waterlevel');
  const events: WaterEvent[] = [];
  nodes.forEach((n) => {
    const flag = n.getAttribute('flag');
    const timeStr = n.getAttribute('time');
    if ((flag === 'H' || flag === 'L') && timeStr) {
      events.push({ time: new Date(timeStr), flag });
    }
  });
  return events;
}

function classifyPhase(events: WaterEvent[], target: Date): TidePhase {
  if (events.length === 0) return 'rising';
  const t = target.getTime();

  // Find the event just before and just after target
  let before: WaterEvent | null = null;
  let after: WaterEvent | null = null;
  for (const ev of events) {
    const et = ev.time.getTime();
    if (et <= t) before = ev;
    else if (!after) after = ev;
  }

  // Determine phase
  const SLACK_MS = 25 * 60 * 1000; // within 25 min of H or L → slack/peak

  if (before && Math.abs(before.time.getTime() - t) < SLACK_MS) {
    return before.flag === 'H' ? 'high' : 'low';
  }
  if (after && Math.abs(after.time.getTime() - t) < SLACK_MS) {
    return after.flag === 'H' ? 'high' : 'low';
  }

  // Between events: direction depends on what's next
  if (after) return after.flag === 'H' ? 'rising' : 'falling';
  if (before) return before.flag === 'H' ? 'falling' : 'rising';
  return 'rising';
}

export function useTide(
  lat: number,
  lng: number,
  datetime: Date,
  waterType: 'salt' | 'fresh',
): { tidePhase: TidePhase | null; tideLoading: boolean } {
  const [tidePhase, setTidePhase] = useState<TidePhase | null>(null);
  const [tideLoading, setTideLoading] = useState(false);

  const latK = lat.toFixed(2);
  const lngK = lng.toFixed(2);
  const hourKey = Math.floor(datetime.getTime() / (60 * 60 * 1000));

  useEffect(() => {
    if (waterType === 'fresh') {
      setTidePhase(null);
      return;
    }

    const cacheKey = `${latK},${lngK},${hourKey}`;
    const cached = CACHE.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
      setTidePhase(cached.phase);
      return;
    }

    const from = new Date(datetime.getTime() - 6 * 60 * 60 * 1000);
    const to   = new Date(datetime.getTime() + 6 * 60 * 60 * 1000);

    const url =
      `https://vannstand.kartverket.no/tideapi.php` +
      `?lat=${lat.toFixed(4)}&lon=${lng.toFixed(4)}` +
      `&fromtime=${toLocalISO(from)}&totime=${toLocalISO(to)}` +
      `&tide_request=tidetable&lang=en&refcode=cd`;

    setTideLoading(true);
    fetch(url)
      .then((r) => r.text())
      .then((xml) => {
        const events = parseEvents(xml);
        const phase  = classifyPhase(events, datetime);
        CACHE.set(cacheKey, { phase, fetchedAt: Date.now() });
        setTidePhase(phase);
      })
      .catch(() => {/* non-fatal — user can still pick manually */})
      .finally(() => setTideLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latK, lngK, hourKey, waterType]);

  return { tidePhase, tideLoading };
}
