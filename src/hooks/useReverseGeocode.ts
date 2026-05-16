import { useState, useEffect } from 'react';
import type { GeoPosition } from './useGeolocation';

export function useReverseGeocode(
  position: GeoPosition | null,
  precision: 'exact' | 'approximate' | 'hidden',
  language: string,
): string | null {
  const [placeName, setPlaceName] = useState<string | null>(null);

  useEffect(() => {
    if (!position || precision === 'hidden') {
      setPlaceName(null);
      return;
    }

    const zoom = precision === 'exact' ? 14 : 10;
    const controller = new AbortController();

    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${position.lat}&lon=${position.lng}&format=json&zoom=${zoom}&accept-language=${language}`,
      { signal: controller.signal },
    )
      .then((r) => r.json())
      .then((data: { address?: Record<string, string> }) => {
        const addr = data.address ?? {};
        setPlaceName(
          addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? addr.county ?? null,
        );
      })
      .catch(() => {});

    return () => controller.abort();
  }, [position?.lat, position?.lng, precision, language]);

  return placeName;
}
