import { useState, useEffect } from 'react';
import type { PressureTrend } from '../types';

export interface HourlyWeatherEntry {
  pressureTrend: PressureTrend;
  waterTemp: number;
  windSpeed: number;
}

export interface WeatherResult {
  waterTemp: number | null;
  pressureTrend: PressureTrend | null;
  windSpeed: number | null;
  hourlyWeather: HourlyWeatherEntry[];
  loading: boolean;
}

const CACHE = new Map<string, WeatherResult & { ts: number }>();
const CACHE_TTL = 10 * 60 * 1000;

function toPressureTrend(delta: number): PressureTrend {
  if (delta < -3) return 'falling_rapidly';
  if (delta < -1) return 'falling';
  if (delta > 3)  return 'rising_rapidly';
  if (delta > 1)  return 'rising';
  return 'stable';
}

function cacheKey(lat: number, lng: number, dt: Date) {
  return `${lat.toFixed(2)},${lng.toFixed(2)},${dt.toISOString().slice(0, 13)}`;
}

export function useWeather(lat: number, lng: number, datetime: Date): WeatherResult {
  const [result, setResult] = useState<WeatherResult>({
    waterTemp: null, pressureTrend: null, windSpeed: null, hourlyWeather: [], loading: false,
  });

  const hourKey = datetime.toISOString().slice(0, 13);

  useEffect(() => {
    const key = cacheKey(lat, lng, datetime);
    const cached = CACHE.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      const { ts: _ts, ...rest } = cached;
      setResult(rest);
      return;
    }

    setResult((r) => ({ ...r, loading: true }));

    const dateStr = datetime.toISOString().slice(0, 10);
    const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000);
    const isHistorical = datetime < twoDaysAgo;

    const base = isHistorical
      ? 'https://archive-api.open-meteo.com/v1/archive'
      : 'https://api.open-meteo.com/v1/forecast';

    const params = new URLSearchParams({
      latitude:  lat.toFixed(4),
      longitude: lng.toFixed(4),
      hourly:    'temperature_2m,surface_pressure,wind_speed_10m',
      timezone:  'auto',
    });
    if (isHistorical) {
      params.set('start_date', dateStr);
      params.set('end_date', dateStr);
    } else {
      params.set('forecast_days', '16');
    }

    const marineParams = new URLSearchParams({
      latitude:   lat.toFixed(4),
      longitude:  lng.toFixed(4),
      hourly:     'sea_surface_temperature',
      timezone:   'auto',
      start_date: dateStr,
      end_date:   dateStr,
    });

    Promise.allSettled([
      fetch(`${base}?${params}`).then((r) => r.json()),
      fetch(`https://marine-api.open-meteo.com/v1/marine?${marineParams}`).then((r) => r.json()),
    ])
      .then(([weatherSettled, marineSettled]) => {
        if (weatherSettled.status === 'rejected') throw new Error('weather failed');
        const data = weatherSettled.value;
        const marineData = marineSettled.status === 'fulfilled' ? marineSettled.value : null;

        const targetHour = datetime.toISOString().slice(0, 13) + ':00';
        let idx = data.hourly.time.findIndex((t: string) => t.startsWith(targetHour.slice(0, 13)));
        if (idx < 0) idx = 0;

        const temp: number         = data.hourly.temperature_2m[idx]              ?? 8;
        const pressure: number     = data.hourly.surface_pressure[idx]             ?? 1013;
        const prevPressure: number = data.hourly.surface_pressure[Math.max(0, idx - 3)] ?? pressure;
        const wind: number         = data.hourly.wind_speed_10m[idx]               ?? 5;

        const sstRaw: number | null | undefined = marineData?.hourly?.sea_surface_temperature?.[idx];
        const waterTemp = sstRaw != null
          ? Math.round(sstRaw * 2) / 2
          : Math.round((temp - 1) * 2) / 2;

        // Build 24-hour arrays for the selected day (hours 0–23)
        const hourlyWeather: HourlyWeatherEntry[] = Array.from({ length: 24 }, (_, h) => {
          const hi = idx - (datetime.getHours()) + h;
          const p  = data.hourly.surface_pressure[hi]              ?? pressure;
          const pp = data.hourly.surface_pressure[Math.max(0, hi - 3)] ?? p;
          const sstH: number | null | undefined = marineData?.hourly?.sea_surface_temperature?.[hi];
          const airH: number = data.hourly.temperature_2m[hi] ?? temp;
          return {
            pressureTrend: toPressureTrend(p - pp),
            waterTemp: sstH != null ? Math.round(sstH * 2) / 2 : Math.round((airH - 1) * 2) / 2,
            windSpeed: Math.round((data.hourly.wind_speed_10m[hi] ?? 5) * 10) / 10,
          };
        });

        const res: WeatherResult = {
          waterTemp,
          pressureTrend: toPressureTrend(pressure - prevPressure),
          windSpeed: Math.round(wind * 10) / 10,
          hourlyWeather,
          loading: false,
        };

        CACHE.set(key, { ...res, ts: Date.now() });
        setResult(res);
      })
      .catch(() => setResult({ waterTemp: null, pressureTrend: null, windSpeed: null, hourlyWeather: [], loading: false }));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat.toFixed(2), lng.toFixed(2), hourKey]);

  return result;
}
