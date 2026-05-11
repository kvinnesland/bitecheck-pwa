import { useState, useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import styles from './LocationDatePicker.module.css';

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

function formatDatetime(d: Date): string {
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const timeStr = d.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `I dag · ${timeStr}`;

  return d.toLocaleDateString('nb-NO', {
    weekday: 'short', day: 'numeric', month: 'short',
  }) + ' · ' + timeStr;
}

export function LocationDatePicker({
  location, datetime, gpsLat, gpsLng, weatherLoading,
  onLocationChange, onDatetimeChange,
}: Props) {
  const [locOpen, setLocOpen]   = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [query, setQuery]       = useState('');
  const [geoResults, setGeoResults] = useState<GeoResult[]>([]);
  const [searching, setSearching]   = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<maplibregl.Map | null>(null);
  const markerRef       = useRef<maplibregl.Marker | null>(null);
  const debounceRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Init / resize mini-map when panel opens ────────────────────────────────
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

      const marker = new maplibregl.Marker({ color: 'var(--color-primary)' })
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

  // ── Update marker when location changes externally ─────────────────────────
  useEffect(() => {
    if (!markerRef.current) return;
    const target = location ?? { lat: gpsLat, lng: gpsLng };
    markerRef.current.setLngLat([target.lng, target.lat]);
  }, [location, gpsLat, gpsLng]);

  // ── Nominatim geocoding search ─────────────────────────────────────────────
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

  const displayName = location?.name ?? 'Min posisjon (GPS)';
  const isCustomLocation = location !== null;

  return (
    <div className={styles.wrap}>
      {/* ── Location row ── */}
      <div className={styles.row} onClick={() => { setLocOpen((o) => !o); setTimeOpen(false); }}>
        <PinIcon className={styles.rowIcon} />
        <span className={`${styles.rowText} ${!isCustomLocation ? styles.rowMuted : ''}`}>
          {displayName}
        </span>
        {weatherLoading && <span className={styles.autoTag}>henter…</span>}
        <ChevronIcon className={`${styles.rowChevron} ${locOpen ? styles.rowChevronOpen : ''}`} />
      </div>

      <div className={`${styles.panel} ${locOpen ? styles.panelOpen : ''}`}>
        <div className={styles.searchWrap}>
          <SearchIcon className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Søk på sted…"
            value={query}
            onChange={handleQueryChange}
          />
        </div>

        {searching && <div style={{ padding: '4px 12px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Søker…</div>}

        {geoResults.length > 0 && (
          <div className={styles.results}>
            {geoResults.map((r, i) => (
              <button key={i} className={styles.resultItem} onClick={() => selectResult(r)}>
                {r.display_name.split(',').slice(0, 3).join(', ')}
              </button>
            ))}
          </div>
        )}

        <div className={styles.mapWrap} ref={mapContainerRef} />

        {isCustomLocation && (
          <button className={styles.resetBtn} onClick={resetLocation}>
            <CrosshairIcon className={styles.resetIcon} />
            Bruk min GPS-posisjon
          </button>
        )}
      </div>

      {/* ── Datetime row ── */}
      <div className={styles.row} onClick={() => { setTimeOpen((o) => !o); setLocOpen(false); }}>
        <ClockIcon className={styles.rowIcon} />
        <span className={styles.rowText}>{formatDatetime(datetime)}</span>
        <ChevronIcon className={`${styles.rowChevron} ${timeOpen ? styles.rowChevronOpen : ''}`} />
      </div>

      <div className={`${styles.panel} ${timeOpen ? styles.panelOpen : ''}`}>
        <div className={styles.datetimeWrap}>
          <input
            className={styles.datetimeInput}
            type="datetime-local"
            value={toDatetimeLocal(datetime)}
            max={toDatetimeLocal(new Date(Date.now() + 15 * 86_400_000))}
            onChange={(e) => {
              const d = new Date(e.target.value);
              if (!isNaN(d.getTime())) onDatetimeChange(d);
            }}
          />
          <button
            className={styles.nowBtn}
            onClick={() => onDatetimeChange(new Date())}
          >
            <CrosshairIcon className={styles.resetIcon} />
            Bruk nåværende tidspunkt
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Inline reverse-geocode ────────────────────────────────────────────────────
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

// ── Icons (same stroke style as rest of app) ──────────────────────────────────
function PinIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function ClockIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function SearchIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ChevronIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CrosshairIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  );
}
