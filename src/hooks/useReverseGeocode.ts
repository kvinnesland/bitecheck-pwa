import { useState, useEffect, useRef } from 'react';
import type { GeoPosition } from './useGeolocation';

export function useReverseGeocode(
  position: GeoPosition | null,
  precision: 'exact' | 'approximate' | 'hidden',
  language: string,
): string | null {
  const [placeName, setPlaceName] = useState<string | null>(null);
  const positionRef = useRef(position);
  positionRef.current = position;

  // !!position flips once (null → true) so this fires when GPS first arrives,
  // and again when precision or language changes — not on every GPS jitter.
  useEffect(() => {
    if (!positionRef.current || precision === 'hidden') {
      setPlaceName(null);
      return;
    }

    const { lat, lng } = positionRef.current;
    const zoom = precision === 'exact' ? 14 : 10;
    const controller = new AbortController();

    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=${zoom}&accept-language=${language}`,
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
  }, [!!position, precision, language]); // eslint-disable-line react-hooks/exhaustive-deps

  return placeName;
}
