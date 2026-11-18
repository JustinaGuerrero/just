import { useMutation } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { TextField } from '../components/TextField';
import { useGarments } from '../features/garments/garments';
import { OutfitPreview } from '../features/outfits/OutfitPreview';
import { PlanPicker } from '../features/planner/PlanPicker';
import { useClearPlanned, usePlanned } from '../features/planner/planner';
import { OCCASION_LABEL, SEASON_LABEL } from '../lib/catalog';
import { addDays, formatLongDate, formatMonthYear, formatWeekdayShort, parseISODate, startOfWeek, toISODate } from '../lib/dates';
import {
  clothingTip,
  describeWeather,
  searchPlaces,
  seasonFor,
  useForecast,
  type Place,
  type WeatherKind,
} from '../lib/weather';

const DEFAULT_PLACE: Place = { name: 'Buenos Aires, Argentina', latitude: -34.6037, longitude: -58.3816 };
const PLACE_STORAGE_KEY = 'just:place';

// La ciudad elegida se recuerda en este navegador (si no hay almacenamiento, se usa la de por defecto).
function loadPlace(): Place {
  try {
    const raw = localStorage.getItem(PLACE_STORAGE_KEY);
    if (raw) {
      const place = JSON.parse(raw);
      if (typeof place?.name === 'string' && typeof place?.latitude === 'number' && typeof place?.longitude === 'number') {
        return place;
      }
    }
  } catch {
    /* sin almacenamiento disponible */
  }
  return DEFAULT_PLACE;
}

function savePlace(place: Place) {
  try {
    localStorage.setItem(PLACE_STORAGE_KEY, JSON.stringify(place));
  } catch {
    /* sin almacenamiento disponible */
  }
}

function WeatherIcon({ kind }: { kind: WeatherKind }) {
  const props = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  if (kind === 'sun') {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
      </svg>
    );
  }
  if (kind === 'rain') {
    return (
      <svg {...props}>
        <path d="M7 15h10a4 4 0 0 0 0-8 5 5 0 0 0-9.6-1.5A4 4 0 0 0 7 15zM9 18l-1 3M13 18l-1 3M17 18l-1 3" />
      </svg>
    );
  }
  if (kind === 'snow') {
    return (
      <svg {...props}>
        <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" />
      </svg>
    );
  }
  if (kind === 'fog') {
    return (
      <svg {...props}>
        <path d="M5 9h14M3 13h18M6 17h12" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <path d="M7 18h10a4 4 0 0 0 0-8 5 5 0 0 0-9.6-1.5A4 4 0 0 0 7 18z" />
    </svg>
  );
}

export default function CalendarPage() {
  const todayIso = toISODate(new Date());
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selected, setSelected] = useState(todayIso);
  const [place, setPlace] = useState<Place>(loadPlace);
  const [changingCity, setChangingCity] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [picking, setPicking] = useState(false);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const plannedQuery = usePlanned(toISODate(days[0]), toISODate(days[6]));
  const forecastQuery = useForecast(place);
  const clearPlan = useClearPlanned();
  const citySearch = useMutation({ mutationFn: searchPlaces });

  const plannedByDate = new Map((plannedQuery.data ?? []).map((p) => [p.date, p]));
  const plan = plannedByDate.get(selected);
  const forecast = forecastQuery.data?.[selected];
  const weather = forecast ? describeWeather(forecast.code) : null;
  const suggestedSeason = forecast ? seasonFor(forecast) : undefined;
  const suggestions = useGarments({ season: suggestedSeason, sort: 'recent' }, { enabled: Boolean(suggestedSeason) });
  const suggestedGarments = suggestedSeason ? (suggestions.data ?? []).slice(0, 6) : [];

  const selectedDate = parseISODate(selected);
  const plannedCount = days.filter((d) => plannedByDate.has(toISODate(d))).length;

  // Selecciona una fecha; la semana visible (lunes a domingo) se ajusta sola si hace falta.
  function goToDate(date: Date) {
    setWeekStart(startOfWeek(date));
    setSelected(toISODate(date));
  }

  function handleCitySearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (cityQuery.trim().length >= 2) citySearch.mutate(cityQuery.trim());
  }

  function choosePlace(next: Place) {
    savePlace(next);
    setPlace(next);
    setChangingCity(false);
    setCityQuery('');
    citySearch.reset();
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-label text-ash">Planificación</p>
          <h1 className="mt-1 font-serif text-5xl font-normal leading-none">{formatMonthYear(selectedDate)}</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => goToDate(new Date())}
            className="min-h-11 rounded-full px-4 text-sm transition hover:bg-linen"
          >
            Hoy
          </button>
          <button
            type="button"
            aria-label="Día anterior"
            onClick={() => goToDate(addDays(selectedDate, -1))}
            className="flex size-11 items-center justify-center rounded-full transition hover:bg-linen"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Día siguiente"
            onClick={() => goToDate(addDays(selectedDate, 1))}
            className="flex size-11 items-center justify-center rounded-full transition hover:bg-linen"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </header>

      {/* Semana */}
      <div className="mt-8 grid grid-cols-7 gap-1.5 sm:gap-3" role="group" aria-label="Días de la semana">
        {days.map((day) => {
          const iso = toISODate(day);
          const active = iso === selected;
          const dayWeather = forecastQuery.data?.[iso];
          const isPlanned = plannedByDate.has(iso);
          return (
            <button
              key={iso}
              type="button"
              onClick={() => setSelected(iso)}
              aria-pressed={active}
              aria-label={`${formatLongDate(day)}${dayWeather ? `, máxima de ${dayWeather.tMax} grados` : ''}${isPlanned ? ', con look planificado' : ', sin look'}`}
              className={`flex min-h-24 flex-col items-center justify-center gap-1 rounded-card border py-3 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                active ? 'border-ink bg-ink text-paper' : 'border-sand bg-paper hover:border-ash'
              }`}
            >
              <span className="text-[11px] uppercase tracking-wide">{formatWeekdayShort(day)}</span>
              <span className="font-serif text-2xl leading-none">{day.getDate()}</span>
              <span className="h-4 text-[11px]">{dayWeather ? `${dayWeather.tMax}°` : ''}</span>
              <span className={`size-1.5 rounded-full ${isPlanned ? (active ? 'bg-blush' : 'bg-blush-deep') : 'bg-transparent'}`} aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-sm text-ash" aria-live="polite">
        {plannedCount} de 7 días planificados esta semana
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        {/* Detalle del día */}
        <section aria-label="Detalle del día" className="rounded-panel bg-linen p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-3xl font-normal leading-tight">{formatLongDate(selectedDate)}</h2>
              <p className="mt-2 flex items-center gap-2 text-sm text-ash">
                {weather && forecast ? (
                  <>
                    <WeatherIcon kind={weather.kind} />
                    <span>
                      {weather.label} · {forecast.tMin}° / {forecast.tMax}°
                      {forecast.rainChance > 0 ? ` · ${forecast.rainChance}% lluvia` : ''}
                    </span>
                  </>
                ) : forecastQuery.isPending ? (
                  <span>Cargando el clima…</span>
                ) : forecastQuery.isError ? (
                  <span>No pudimos obtener el clima.</span>
                ) : (
                  <span>Sin pronóstico para esta fecha.</span>
                )}
              </p>
            </div>
            {plan && (
              <span className="rounded-full bg-blush-soft px-3 py-1 text-xs text-blush-deep">{OCCASION_LABEL[plan.outfit.occasion]}</span>
            )}
          </div>

          {forecast && <p className="mt-5 rounded-field bg-paper px-4 py-3 text-sm leading-relaxed">{clothingTip(forecast)}</p>}

          <div className="mt-6">
            {plannedQuery.isError ? (
              <p role="alert" className="rounded-field bg-blush-soft px-4 py-3 text-sm">
                No pudimos cargar tu planificación.
              </p>
            ) : plan ? (
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="w-40 shrink-0">
                  <OutfitPreview items={plan.outfit.items} />
                </div>
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="font-serif text-2xl font-medium leading-tight">{plan.outfit.name}</p>
                    <p className="text-xs text-ash">
                      {plan.outfit.items.length === 1 ? '1 prenda' : `${plan.outfit.items.length} prendas`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/outfits/${plan.outfit.id}`}
                      className="flex h-11 items-center rounded-full bg-ink px-5 text-sm font-medium text-paper transition hover:bg-ink/90"
                    >
                      Ver look
                    </Link>
                    <button
                      type="button"
                      onClick={() => setPicking(true)}
                      className="h-11 rounded-full border border-ink px-5 text-sm font-medium transition hover:bg-paper"
                    >
                      Cambiar
                    </button>
                    <button
                      type="button"
                      disabled={clearPlan.isPending}
                      onClick={() => clearPlan.mutate(selected)}
                      className="h-11 rounded-full px-4 text-sm font-medium text-blush-deep transition hover:bg-blush-soft disabled:opacity-60"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 rounded-card border border-dashed border-ash/50 px-6 py-10 text-center">
                <p className="font-serif text-2xl italic">Todavía no hay look para este día</p>
                <button
                  type="button"
                  onClick={() => setPicking(true)}
                  className="flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-medium text-paper transition hover:bg-ink/90"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Planificar look
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Clima y sugerencias */}
        <aside className="flex flex-col gap-6">
          <section aria-label="Ciudad" className="rounded-panel border border-sand p-6">
            <p className="text-xs uppercase tracking-label text-ash">Ciudad</p>
            <p className="mt-1 text-base font-normal">{place.name}</p>
            {changingCity ? (
              <div className="mt-4 flex flex-col gap-3">
                <form onSubmit={handleCitySearch} className="flex flex-col gap-3">
                  <TextField
                    label="Buscar ciudad"
                    type="search"
                    placeholder="Ej: Córdoba"
                    value={cityQuery}
                    onChange={(e) => setCityQuery(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={citySearch.isPending}
                    className="h-11 rounded-full border border-ink text-sm font-medium transition hover:bg-linen disabled:opacity-60"
                  >
                    {citySearch.isPending ? 'Buscando…' : 'Buscar'}
                  </button>
                </form>
                {citySearch.isError && (
                  <p role="alert" className="text-sm text-blush-deep">
                    No pudimos buscar la ciudad. Probá de nuevo.
                  </p>
                )}
                {citySearch.data && citySearch.data.length === 0 && <p className="text-sm text-ash">No encontramos esa ciudad.</p>}
                {citySearch.data && citySearch.data.length > 0 && (
                  <ul className="flex flex-col">
                    {citySearch.data.map((result) => (
                      <li key={`${result.latitude},${result.longitude}`}>
                        <button
                          type="button"
                          onClick={() => choosePlace(result)}
                          className="min-h-11 w-full rounded-field px-3 text-left text-sm transition hover:bg-linen"
                        >
                          {result.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <button type="button" onClick={() => setChangingCity(false)} className="min-h-11 text-sm text-ash underline underline-offset-4">
                  Cancelar
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setChangingCity(true)} className="mt-2 min-h-11 text-sm text-ash underline underline-offset-4 hover:text-ink">
                Cambiar ciudad
              </button>
            )}
          </section>

          <section aria-label="Prendas sugeridas" className="rounded-panel border border-sand p-6">
            <p className="text-xs uppercase tracking-label text-ash">Para este clima</p>
            {!suggestedSeason ? (
              <p className="mt-2 text-sm text-ash">Elegí un día con pronóstico para ver prendas sugeridas.</p>
            ) : suggestedGarments.length === 0 ? (
              <p className="mt-2 text-sm text-ash">
                No tenés prendas marcadas como de {SEASON_LABEL[suggestedSeason].toLowerCase()}.{' '}
                <Link to="/wardrobe" className="font-medium text-ink underline underline-offset-4">
                  Editá tu armario
                </Link>
              </p>
            ) : (
              <>
                <p className="mt-2 text-sm text-ash">Prendas de {SEASON_LABEL[suggestedSeason].toLowerCase()} de tu armario:</p>
                <ul className="mt-4 grid grid-cols-3 gap-2">
                  {suggestedGarments.map((garment) => (
                    <li key={garment.id}>
                      <img
                        src={garment.imageUrl}
                        alt={garment.name}
                        loading="lazy"
                        className="aspect-[4/5] w-full rounded-card bg-linen object-cover"
                      />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </aside>
      </div>

      {picking && (
        <PlanPicker
          key={selected}
          date={selected}
          dateLabel={formatLongDate(selectedDate)}
          currentOutfitId={plan?.outfit.id}
          onClose={() => setPicking(false)}
        />
      )}
    </main>
  );
}
