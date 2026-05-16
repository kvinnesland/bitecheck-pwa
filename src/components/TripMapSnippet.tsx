import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef } from 'react';
import type { GeoPosition } from '../hooks/useGeolocation';

const BASE_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

interface Props {
  position: GeoPosition;
  zoom: number;
}

export default function TripMapSnippet({ position, zoom }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  // Initialize map once on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASE_STYLE,
      center: [position.lng, position.lat],
      zoom,
      interactive: false,
      attributionControl: false,
    });

    markerRef.current = new maplibregl.Marker({ color: '#4f7ef2' })
      .setLngLat([position.lng, position.lat])
      .addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update center and marker when position changes — no map rebuild
  useEffect(() => {
    mapRef.current?.setCenter([position.lng, position.lat]);
    markerRef.current?.setLngLat([position.lng, position.lat]);
  }, [position.lat, position.lng]);

  // Update zoom when privacy pref changes — smooth transition, no rebuild
  useEffect(() => {
    mapRef.current?.setZoom(zoom);
  }, [zoom]);

  return <div ref={containerRef} className="w-full h-full" />;
}
