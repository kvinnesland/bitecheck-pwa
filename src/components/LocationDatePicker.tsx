import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Clock, Search, ChevronDown, Crosshair } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { cn } from '@/lib/utils';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

export interface SelectedLocation {
  lat: number;
  lng: number;
  name: string;
}

interface Props {
  location: SelectedLocation | null;
  datetime: Date;
  gpsLat: number;
  gpsLng: number;
  weatherLoading: boolean;
  onLocationChange: (loc: SelectedLocation | null) => void;
  onDatetimeChange: (dt: Date) => void;
}

interface GeoResult {
  display_name: string;
  lat: string;
  lon: string;
}

function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDatetime(d: Date, locale: string, todayLabel: string): string {
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const timeStr = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `${todayLabel} · ${timeStr}`;

  return d.toLocaleDateString(locale, {
    weekday: 'short', day: 'numeric', month: 'short',
  }) + ' · ' + timeStr;
}

export function LocationDatePicker({
  location, datetime, gpsLat, gpsLng, weatherLoading,
  onLocationChange, onDatetimeChange,
}: Props) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language.startsWith('nb') ? 'nb-NO' : 'en-US';
  const todayLabel = i18n.language.startsWith('nb') ? 'I dag' : 'Today';

  const [locOpen, setLocOpen]   = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [query, setQuery]       = useState('');
  const [geoResults, setGeoResults] = useState<GeoResult[]>([]);
  const [searching, setSearching]   = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<maplibregl.Map | null>(null);
  const markerRef       = useRef<maplibregl.Marker | null>(null);
  const debounceRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!locOpen || !mapContainerRef.current) return;

    if (!mapRef.current) {
      const centerLat = location?.lat ?? gpsLat;
      const centerLng = location?.lng ?? gpsLng;

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: MAP_STYLE,
        center: [centerLng, centerLat],
        zoom: 10,
        attributionControl: false,
      });
      map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

      const marker = new maplibregl.Marker({ color: 'var(--color-accent)' })
        .setLngLat([centerLng, centerLat])
        .addTo(map);
      markerRef.current = marker;

      map.on('click', (e) => {
        const { lat, lng } = e.lngLat;
        marker.setLngLat([lng, lat]);
        reverseGeocode(lat, lng).then((name) => {
          onLocationChange({ lat, lng, name });
        });
      });

      mapRef.current = map;
    } else {
      mapRef.current.resize();
      const center = location ?? { lat: gpsLat, lng: gpsLng };
      mapRef.current.flyTo({ center: [center.lng, center.lat], zoom: 10, duration: 500 });
      markerRef.current?.setLngLat([center.lng, center.lat]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locOpen]);

  useEffect(() => {
    if (!markerRef.current) return;
    const target = location ?? { lat: gpsLat, lng: gpsLng };
    markerRef.current.setLngLat([target.lng, target.lat]);
  }, [location, gpsLat, gpsLng]);

  const search = useCallback((q: string) => {
    if (q.length < 2) { setGeoResults([]); return; }
    setSearching(true);
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=4&accept-language=no`,
      { headers: { 'Accept-Language': 'no' } },
    )
      .then((r) => r.json())
      .then((data: GeoResult[]) => setGeoResults(data))
      .catch(() => setGeoResults([]))
      .finally(() => setSearching(false));
  }, []);

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 400);
  }

  function selectResult(r: GeoResult) {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    const name = r.display_name.split(',').slice(0, 2).join(', ');
    onLocationChange({ lat, lng, name });
    markerRef.current?.setLngLat([lng, lat]);
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 11, duration: 600 });
    setGeoResults([]);
    setQuery('');
  }

  function resetLocation() {
    onLocationChange(null);
    markerRef.current?.setLngLat([gpsLng, gpsLat]);
    mapRef.current?.flyTo({ center: [gpsLng, gpsLat], zoom: 10, duration: 500 });
  }

  const displayName = location?.name ?? t('location.myPosition');
  const isCustomLocation = location !== null;

  const rowCls = 'flex items-center gap-2.5 px-4 py-[11px] cursor-pointer transition-colors duration-[120ms] border-b border-divider active:bg-surface';

  return (
    <div className="border-b border-divider shrink-0">
      {/* ── Location row ── */}
      <div className={rowCls} onClick={() => { setLocOpen((o) => !o); setTimeOpen(false); }}>
        <MapPin size={16} strokeWidth={2} className="text-accent shrink-0" />
        <span className={cn('flex-1 text-sm font-medium text-ellipsis overflow-hidden whitespace-nowrap', !isCustomLocation && 'text-text-muted')}>
          {displayName}
        </span>
        {weatherLoading && (
          <span className="inline-flex items-center text-[0.6rem] font-bold uppercase tracking-[0.06em] text-accent border border-accent rounded-[3px] px-[5px] py-[1px] ml-1.5 opacity-80 shrink-0">
            {t('conditions.fetching')}
          </span>
        )}
        <ChevronDown size={14} strokeWidth={2} className={cn('text-text-muted shrink-0 transition-transform duration-200', locOpen && 'rotate-180')} />
      </div>

      <div className={cn(
        'overflow-hidden bg-surface border-b border-divider transition-[max-height] duration-[250ms] ease-in-out',
        locOpen ? 'max-h-[400px]' : 'max-h-0',
      )}>
        <div className="relative px-3 pt-2.5 pb-1.5">
          <Search size={14} strokeWidth={2} className="absolute left-[22px] top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            className="w-full bg-bg border border-divider rounded-[var(--radius-sm)] text-text text-sm pl-8 pr-2.5 py-2 outline-none transition-colors duration-150 focus:border-accent placeholder:text-text-muted"
            placeholder={t('location.searchPlaceholder')}
            value={query}
            onChange={handleQueryChange}
          />
        </div>

        {searching && (
          <div className="px-3 py-1 text-xs text-text-muted">{t('location.searching')}</div>
        )}

        {geoResults.length > 0 && (
          <div className="mx-3 mb-1.5 bg-bg border border-divider rounded-[var(--radius-sm)] overflow-hidden">
            {geoResults.map((r, i) => (
              <button
                key={i}
                onClick={() => selectResult(r)}
                className="block w-full text-left px-3 py-[9px] text-[0.82rem] text-text border-b border-divider last:border-b-0 transition-colors duration-100 hover:bg-surface"
              >
                {r.display_name.split(',').slice(0, 3).join(', ')}
              </button>
            ))}
          </div>
        )}

        <div className="h-[180px] mx-3 mb-1.5 rounded-[var(--radius-sm)] overflow-hidden border border-divider" ref={mapContainerRef} />

        {isCustomLocation && (
          <button
            onClick={resetLocation}
            className="flex items-center gap-1.5 px-3 py-2 pb-2.5 text-text-muted text-[0.78rem] font-medium hover:text-accent transition-colors duration-150"
          >
            <Crosshair size={12} strokeWidth={2} />
            {t('location.useGps')}
          </button>
        )}
      </div>

      {/* ── Datetime row ── */}
      <div className={rowCls} onClick={() => { setTimeOpen((o) => !o); setLocOpen(false); }}>
        <Clock size={16} strokeWidth={2} className="text-accent shrink-0" />
        <span className="flex-1 text-sm font-medium text-ellipsis overflow-hidden whitespace-nowrap">
          {formatDatetime(datetime, dateLocale, todayLabel)}
        </span>
        <ChevronDown size={14} strokeWidth={2} className={cn('text-text-muted shrink-0 transition-transform duration-200', timeOpen && 'rotate-180')} />
      </div>

      <div className={cn(
        'overflow-hidden bg-surface transition-[max-height] duration-[250ms] ease-in-out',
        timeOpen ? 'max-h-[400px]' : 'max-h-0',
      )}>
        <div className="px-3 pt-2.5 pb-3 flex flex-col gap-2">
          <input
            className="w-full bg-bg border border-divider rounded-[var(--radius-sm)] text-text text-sm px-2.5 py-2 outline-none transition-colors duration-150 focus:border-accent color-scheme-dark"
            type="datetime-local"
            value={toDatetimeLocal(datetime)}
            max={toDatetimeLocal(new Date(Date.now() + 15 * 86_400_000))}
            style={{ colorScheme: 'dark' }}
            onChange={(e) => {
              const d = new Date(e.target.value);
              if (!isNaN(d.getTime())) onDatetimeChange(d);
            }}
          />
          <button
            onClick={() => onDatetimeChange(new Date())}
            className="flex items-center gap-1.5 text-text-muted text-[0.78rem] font-medium hover:text-accent transition-colors duration-150"
          >
            <Crosshair size={12} strokeWidth={2} />
            {t('location.useCurrentTime')}
          </button>
        </div>
      </div>
    </div>
  );
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=no`,
    );
    const data = await r.json();
    const parts = [data.address?.city || data.address?.town || data.address?.village || data.address?.county];
    return parts.filter(Boolean).join(', ') || `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
  } catch {
    return `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
  }
}
