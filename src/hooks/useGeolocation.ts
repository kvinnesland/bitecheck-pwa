import { useState, useEffect } from 'react';

export type GeoStatus = 'idle' | 'acquiring' | 'ok' | 'denied' | 'error';

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy_m: number;
}

export function useGeolocation() {
  const [status, setStatus] = useState<GeoStatus>('idle');
  const [position, setPosition] = useState<GeoPosition | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus('error');
      return;
    }

    setStatus('acquiring');

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy_m: pos.coords.accuracy,
        });
        setStatus('ok');
      },
      (err) => {
        setStatus(err.code === GeolocationPositionError.PERMISSION_DENIED ? 'denied' : 'error');
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
    );

    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return { status, position };
}
