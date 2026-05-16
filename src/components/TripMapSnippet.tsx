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

    new maplibregl.Marker({ color: '#4f7ef2' })
      .setLngLat([position.lng, position.lat])
      .addTo(map);

    return () => map.remove();
  }, [position.lat, position.lng, zoom]);

  return <div ref={containerRef} className="w-full h-full" />;
}
