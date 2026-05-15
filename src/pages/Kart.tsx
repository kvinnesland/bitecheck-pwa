import maplibregl, { type GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type User } from 'firebase/auth';
import { useUserCatches } from '../hooks/useUserCatches';
import { usePublicCatches } from '../hooks/usePublicCatches';
import { useGeolocation } from '../hooks/useGeolocation';
import { useUnits } from '../contexts/UnitsContext';
import { formatWeight, formatLength, type UnitPrefs } from '../lib/units';
import styles from './Kart.module.css';

const BASE_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

const DEPTH_WMS =
  'https://wms.geonorge.no/skwms1/wms.dybdedata2' +
  '?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap' +
  '&BBOX={bbox-epsg-3857}&CRS=EPSG:3857&WIDTH=256&HEIGHT=256' +
  '&FORMAT=image/png&TRANSPARENT=TRUE&LAYERS=dybdedata2';

const SEDIMENT_WMS =
  'https://geo.ngu.no/mapserver/MarineGrunnkartWMS' +
  '?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap' +
  '&BBOX={bbox-epsg-3857}&CRS=EPSG:3857&WIDTH=256&HEIGHT=256' +
  '&FORMAT=image/png&TRANSPARENT=TRUE&LAYERS=Bunnsedimenter_kornstorrelse_detaljert';

const SEAMARK_TILES = 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png';

const VERN_WMS =
  'https://kart.miljodirektoratet.no/arcgis/services/vern/MapServer/WMSServer' +
  '?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap' +
  '&BBOX={bbox-epsg-3857}&CRS=EPSG:3857&WIDTH=256&HEIGHT=256' +
  '&FORMAT=image/png&TRANSPARENT=TRUE&LAYERS=naturvern_omrade&STYLES=';

const GYTE_WMS =
  'https://gis.fiskeridir.no/server/services/fiskeridirWMS/MapServer/WMSServer' +
  '?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap' +
  '&BBOX={bbox-epsg-3857}&CRS=EPSG:3857&WIDTH=256&HEIGHT=256' +
  '&FORMAT=image/png&TRANSPARENT=TRUE&LAYERS=gyteomraader&STYLES=';

interface Props { user: User; }

export function Kart({ user }: Props) {
  const { t } = useTranslation();
  const { prefs } = useUnits();
  const prefsRef = useRef<UnitPrefs>(prefs);
  useEffect(() => { prefsRef.current = prefs; }, [prefs]);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [depthOn, setDepthOn] = useState(false);
  const [sedimentOn, setSedimentOn] = useState(false);
  const [seaMarksOn, setSeaMarksOn] = useState(false);
  const [vernOn, setVernOn] = useState(false);
  const [gyteOn, setGyteOn] = useState(false);
  const [zoom, setZoom] = useState(4.5);
  const SEDIMENT_MIN_ZOOM = 8;

  const ownCatches = useUserCatches(user.uid);
  const publicCatches = usePublicCatches(user.uid);
  const { position } = useGeolocation();

  // ── Init map ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASE_STYLE,
      center: [14.5, 65],
      zoom: 4.5,
      attributionControl: false,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      // Depth contour overlay
      map.addSource('depth', {
        type: 'raster',
        tiles: [DEPTH_WMS],
        tileSize: 256,
        attribution: '© Geonorge',
      });
      map.addLayer({
        id: 'depth',
        type: 'raster',
        source: 'depth',
        layout: { visibility: 'none' },
        paint: { 'raster-opacity': 0.7 },
      });

      // Sediment overlay
      map.addSource('sediment', {
        type: 'raster',
        tiles: [SEDIMENT_WMS],
        tileSize: 256,
        attribution: '© NGU',
      });
      map.addLayer({
        id: 'sediment',
        type: 'raster',
        source: 'sediment',
        layout: { visibility: 'none' },
        paint: { 'raster-opacity': 0.65 },
      });

      // OpenSeaMap — nautical marks
      map.addSource('seamark', {
        type: 'raster',
        tiles: [SEAMARK_TILES],
        tileSize: 256,
        attribution: '© OpenSeaMap',
      });
      map.addLayer({
        id: 'seamark',
        type: 'raster',
        source: 'seamark',
        layout: { visibility: 'none' },
        paint: { 'raster-opacity': 0.9 },
      });

      // Verneområder (Miljødirektoratet)
      map.addSource('vern', {
        type: 'raster',
        tiles: [VERN_WMS],
        tileSize: 256,
        attribution: '© Miljødirektoratet',
      });
      map.addLayer({
        id: 'vern',
        type: 'raster',
        source: 'vern',
        layout: { visibility: 'none' },
        paint: { 'raster-opacity': 0.6 },
      });

      // Gyteområder (Fiskeridirektoratet)
      map.addSource('gyte', {
        type: 'raster',
        tiles: [GYTE_WMS],
        tileSize: 256,
        attribution: '© Fiskeridirektoratet',
      });
      map.addLayer({
        id: 'gyte',
        type: 'raster',
        source: 'gyte',
        layout: { visibility: 'none' },
        paint: { 'raster-opacity': 0.65 },
      });

      // Catches GeoJSON source
      map.addSource('catches', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Public (gray) — rendered below own
      map.addLayer({
        id: 'catches-public',
        type: 'circle',
        source: 'catches',
        filter: ['==', ['get', 'isOwn'], 'false'],
        paint: {
          'circle-radius': 7,
          'circle-color': '#888888',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.75,
        },
      });

      // Own (blue) — rendered on top
      map.addLayer({
        id: 'catches-own',
        type: 'circle',
        source: 'catches',
        filter: ['==', ['get', 'isOwn'], 'true'],
        paint: {
          'circle-radius': 9,
          'circle-color': '#0066CC',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.9,
        },
      });

      (['catches-own', 'catches-public'] as const).forEach((layerId) => {
        map.on('click', layerId, (e) => {
          if (!e.features?.[0]) return;
          const props = e.features[0].properties;
          const geom = e.features[0].geometry as GeoJSON.Point;
          const coords = geom.coordinates.slice() as [number, number];

          const time = new Date(props.created_at as string).toLocaleString('no-NO', {
            dateStyle: 'short',
            timeStyle: 'short',
          });

          const unitPrefs = prefsRef.current;
          const weight = props.weight_kg ? formatWeight(props.weight_kg as number, unitPrefs.weight) : '';
          const len = props.length_cm ? formatLength(props.length_cm as number, unitPrefs.length) : '';
          const measurements = [weight, len].filter(Boolean).join(' · ');

          const html = `
            <div class="bc-popup">
              <strong>${props.species as string}</strong>
              ${measurements ? `<span>${measurements}</span>` : ''}
              <time>${time}</time>
            </div>
          `;

          new maplibregl.Popup({ closeButton: false, maxWidth: '180px', offset: 12 })
            .setLngLat(coords)
            .setHTML(html)
            .addTo(map);
        });

        map.on('mouseenter', layerId, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', layerId, () => { map.getCanvas().style.cursor = ''; });
      });

      map.on('zoom', () => setZoom(map.getZoom()));
      setMapReady(true);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Update catches on map ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const source = mapRef.current.getSource('catches') as GeoJSONSource | undefined;
    if (!source) return;

    const toFeature = (
      c: { catch_id: string; location: { lat: number; lng: number; accuracy_m: number }; created_at: string; species: { name: string } },
      extra: Record<string, unknown>,
    ) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [c.location.lng, c.location.lat] },
      properties: { catch_id: c.catch_id, species: c.species.name, created_at: c.created_at, ...extra },
    });

    const own = ownCatches
      .filter((c) => c.location.accuracy_m !== -1)
      .map((c) =>
        toFeature(c, {
          isOwn: 'true',
          weight_kg: c.species.weight_kg,
          length_cm: c.species.length_cm,
          bite_score: c.environment.bite_score,
        }),
      );

    const pub = publicCatches
      .filter((c) => c.location.accuracy_m !== -1)
      .map((c) => toFeature(c, { isOwn: 'false' }));

    source.setData({ type: 'FeatureCollection', features: [...pub, ...own] });
  }, [mapReady, ownCatches, publicCatches]);

  // ── Layer visibility toggles — called directly from button handlers ───────
  function toggleDepth() {
    const next = !depthOn;
    setDepthOn(next);
    const map = mapRef.current;
    if (map?.getLayer('depth')) {
      map.setLayoutProperty('depth', 'visibility', next ? 'visible' : 'none');
    }
  }

  function toggleSediment() {
    const next = !sedimentOn;
    setSedimentOn(next);
    const map = mapRef.current;
    if (map?.getLayer('sediment')) {
      map.setLayoutProperty('sediment', 'visibility', next ? 'visible' : 'none');
    }
  }

  function toggleSeaMarks() {
    const next = !seaMarksOn;
    setSeaMarksOn(next);
    mapRef.current?.getLayer('seamark') &&
      mapRef.current.setLayoutProperty('seamark', 'visibility', next ? 'visible' : 'none');
  }

  function toggleVern() {
    const next = !vernOn;
    setVernOn(next);
    mapRef.current?.getLayer('vern') &&
      mapRef.current.setLayoutProperty('vern', 'visibility', next ? 'visible' : 'none');
  }

  function toggleGyte() {
    const next = !gyteOn;
    setGyteOn(next);
    mapRef.current?.getLayer('gyte') &&
      mapRef.current.setLayoutProperty('gyte', 'visibility', next ? 'visible' : 'none');
  }

  // ── Locate me ────────────────────────────────────────────────────────────
  function locateMe() {
    if (position && mapRef.current) {
      mapRef.current.flyTo({ center: [position.lng, position.lat], zoom: 12, duration: 800 });
    }
  }

  return (
    <div className={styles.container}>
      <div ref={containerRef} className={styles.map} />

      <div className={styles.layerControls}>
        <button
          className={`${styles.layerBtn} ${depthOn ? styles.layerActive : ''}`}
          onClick={toggleDepth}
          title={t('map.depthTitle')}
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 17c3-4 5-4 9 0s6 4 9 0" />
            <path d="M3 12c3-4 5-4 9 0s6 4 9 0" />
            <path d="M3 7c3-4 5-4 9 0s6 4 9 0" />
          </svg>
          {t('map.depthLabel')}
        </button>
        <button
          className={`${styles.layerBtn} ${sedimentOn ? styles.layerActive : ''}`}
          onClick={toggleSediment}
          title={t('map.bottomTitle')}
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="14" width="18" height="7" rx="1" />
            <path d="M3 14c2-3 4-5 9-5s7 2 9 5" />
          </svg>
          {t('map.bottomLabel')}
        </button>
        <button
          className={`${styles.layerBtn} ${seaMarksOn ? styles.layerActive : ''}`}
          onClick={toggleSeaMarks}
          title={t('map.seamarksTitle')}
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v14M5 20h14M8 14l4-4 4 4" />
            <circle cx="12" cy="20" r="2" />
          </svg>
          {t('map.seamarksLabel')}
        </button>
        <button
          className={`${styles.layerBtn} ${vernOn ? styles.layerActive : ''}`}
          onClick={toggleVern}
          title={t('map.protectedTitle')}
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3L4 7v6c0 5 4 8.5 8 10 4-1.5 8-5 8-10V7l-8-4z" />
          </svg>
          {t('map.protectedLabel')}
        </button>
        <button
          className={`${styles.layerBtn} ${gyteOn ? styles.layerActive : ''}`}
          onClick={toggleGyte}
          title={t('map.spawningTitle')}
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12c2-5 6-7 10-7s8 2 10 7c-2 5-6 7-10 7S4 17 2 12z" />
            <circle cx="16" cy="10" r="1.5" fill="currentColor" stroke="none" />
            <path d="M20 8c1-2 2.5-3 3.5-3" />
          </svg>
          {t('map.spawningLabel')}
        </button>
      </div>

      {sedimentOn && zoom < SEDIMENT_MIN_ZOOM && (
        <div className={styles.zoomHint}>
          {t('map.zoomForBottom')}
        </div>
      )}

      <button
        className={`${styles.locateBtn} ${position ? '' : styles.locateDisabled}`}
        onClick={locateMe}
        aria-label={t('map.goToPosition')}
      >
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
      </button>

      <div className={styles.legend}>
        <span className={styles.legendOwn} />
        <span>{t('map.mine')}</span>
        <span className={styles.legendPublic} />
        <span>{t('map.others')}</span>
      </div>
    </div>
  );
}
