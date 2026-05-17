import { useState, useEffect } from 'react';

export interface FeedWeather {
  temp: number | null;
  windspeed: number | null;
  weathercode: number | null;
  loading: boolean;
}

export function useFeedWeather(lat: number | null, lng: number | null): FeedWeather {
  const [weather, setWeather] = useState<FeedWeather>({
    temp: null, windspeed: null, weathercode: null, loading: false,
  });

  useEffect(() => {
    if (lat == null || lng == null) return;
    setWeather(w => ({ ...w, loading: w.temp == null }));

    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&current=temperature_2m,weathercode,windspeed_10m&wind_speed_unit=ms&timezone=auto`,
    )
      .then(r => r.json())
      .then(data => {
        setWeather({
          temp: data.current?.temperature_2m ?? null,
          windspeed: data.current?.windspeed_10m ?? null,
          weathercode: data.current?.weathercode ?? null,
          loading: false,
        });
      })
      .catch(() => setWeather(w => ({ ...w, loading: false })));
  }, [lat, lng]);

  return weather;
}
