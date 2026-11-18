import { useQuery } from '@tanstack/react-query';
import type { Season } from './catalog';

// Clima de Open-Meteo (gratis, sin clave): https://open-meteo.com

export type Place = { name: string; latitude: number; longitude: number };

export type DayForecast = {
  date: string; // YYYY-MM-DD
  code: number; // código WMO del estado del tiempo
  tMax: number;
  tMin: number;
  rainChance: number; // % de probabilidad de lluvia
};

export type WeatherKind = 'sun' | 'cloud' | 'rain' | 'snow' | 'fog';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

export async function fetchForecast(place: Place): Promise<Record<string, DayForecast>> {
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '16',
  });

  const res = await fetch(`${FORECAST_URL}?${params}`);
  if (!res.ok) throw new Error('No pudimos obtener el clima');
  const { daily } = await res.json();

  const byDate: Record<string, DayForecast> = {};
  (daily.time as string[]).forEach((date, i) => {
    byDate[date] = {
      date,
      code: daily.weather_code[i],
      tMax: Math.round(daily.temperature_2m_max[i]),
      tMin: Math.round(daily.temperature_2m_min[i]),
      rainChance: daily.precipitation_probability_max[i] ?? 0,
    };
  });
  return byDate;
}

export async function searchPlaces(name: string): Promise<Place[]> {
  const params = new URLSearchParams({ name, count: '5', language: 'es', format: 'json' });
  const res = await fetch(`${GEOCODING_URL}?${params}`);
  if (!res.ok) throw new Error('No pudimos buscar la ciudad');
  const data = await res.json();

  return ((data.results ?? []) as Array<{ name: string; admin1?: string; country?: string; latitude: number; longitude: number }>).map(
    (r) => ({
      name: [r.name, r.admin1 ?? r.country].filter(Boolean).join(', '),
      latitude: r.latitude,
      longitude: r.longitude,
    }),
  );
}

export function useForecast(place: Place) {
  return useQuery({
    queryKey: ['forecast', place.latitude, place.longitude],
    queryFn: () => fetchForecast(place),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}

export function describeWeather(code: number): { label: string; kind: WeatherKind } {
  if (code === 0) return { label: 'Despejado', kind: 'sun' };
  if (code === 1) return { label: 'Mayormente despejado', kind: 'sun' };
  if (code === 2) return { label: 'Parcialmente nublado', kind: 'cloud' };
  if (code === 3) return { label: 'Nublado', kind: 'cloud' };
  if (code === 45 || code === 48) return { label: 'Niebla', kind: 'fog' };
  if (code >= 51 && code <= 57) return { label: 'Llovizna', kind: 'rain' };
  if (code >= 61 && code <= 67) return { label: 'Lluvia', kind: 'rain' };
  if (code >= 71 && code <= 77) return { label: 'Nieve', kind: 'snow' };
  if (code >= 80 && code <= 82) return { label: 'Chubascos', kind: 'rain' };
  if (code === 85 || code === 86) return { label: 'Nevadas', kind: 'snow' };
  if (code >= 95) return { label: 'Tormenta', kind: 'rain' };
  return { label: 'Variable', kind: 'cloud' };
}

// Consejo de vestimenta según el pronóstico del día.
export function clothingTip(day: DayForecast): string {
  const { kind } = describeWeather(day.code);
  if (kind === 'snow') return 'Se esperan nevadas: abrigate en capas y elegí calzado impermeable.';
  if (kind === 'rain' || day.rainChance >= 60) {
    return 'Se espera lluvia: llevá una campera impermeable y calzado cerrado.';
  }
  if (day.tMax >= 28) return 'Hace calor: elegí telas frescas y colores claros.';
  if (day.tMax >= 21) return 'Templado: ideal para una capa liviana, como un blazer o un cárdigan.';
  if (day.tMax >= 14) return 'Fresco: sumá un abrigo o una campera.';
  return 'Hace frío: abrigate bien y vestite en capas.';
}

// Temporada de las prendas que mejor van con ese clima.
export function seasonFor(day: DayForecast): Season {
  if (day.tMax >= 26) return 'SUMMER';
  if (day.tMax >= 19) return 'SPRING';
  if (day.tMax >= 12) return 'AUTUMN';
  return 'WINTER';
}
