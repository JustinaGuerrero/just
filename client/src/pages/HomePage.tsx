import { Link } from 'react-router-dom';
import { useCurrentUser } from '../features/auth/auth';
import { useGarmentCounts } from '../features/garments/garments';
import { OutfitPreview } from '../features/outfits/OutfitPreview';
import { usePlanned } from '../features/planner/planner';
import { OCCASION_LABEL } from '../lib/catalog';
import { formatLongDate, toISODate } from '../lib/dates';
import { clothingTip, describeWeather, loadPlace, useForecast } from '../lib/weather';

const linkClass =
  'inline-flex h-12 items-center rounded-full px-6 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

export default function HomePage() {
  const { data: user } = useCurrentUser();
  const { data: counts } = useGarmentCounts();
  const total = counts?.total;

  const today = new Date();
  const todayIso = toISODate(today);
  const plannedQuery = usePlanned(todayIso, todayIso);
  const forecastQuery = useForecast(loadPlace());
  const plan = plannedQuery.data?.find((p) => p.date === todayIso);
  const forecast = forecastQuery.data?.[todayIso];
  const weather = forecast ? describeWeather(forecast.code) : null;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-xs uppercase tracking-label text-ash">Inicio</p>
      <h1 className="mt-2 font-serif text-5xl font-normal leading-tight">
        Hola, <span className="italic">{user?.name}</span>
      </h1>
      <p className="mt-4 max-w-md text-base text-ash">
        {total === undefined
          ? 'Tu espacio está listo.'
          : total === 0
            ? 'Tu armario está vacío todavía. Subí tu primera prenda para empezar.'
            : `Tenés ${total} ${total === 1 ? 'prenda' : 'prendas'} en tu armario.`}
      </p>

      <section aria-label="Hoy" className="mt-10 rounded-panel bg-linen p-6 sm:p-8">
        <p className="text-xs uppercase tracking-label text-ash">Hoy</p>
        <h2 className="mt-1 font-serif text-3xl font-normal leading-tight">{formatLongDate(today)}</h2>
        <p className="mt-2 text-sm text-ash">
          {weather && forecast
            ? `${weather.label} · ${forecast.tMin}° / ${forecast.tMax}°${forecast.rainChance > 0 ? ` · ${forecast.rainChance}% lluvia` : ''}`
            : forecastQuery.isPending
              ? 'Cargando el clima…'
              : 'No pudimos obtener el clima.'}
        </p>
        {forecast && <p className="mt-4 rounded-field bg-paper px-4 py-3 text-sm leading-relaxed">{clothingTip(forecast)}</p>}

        <div className="mt-6">
          {plannedQuery.isPending ? (
            <p className="animate-pulse text-sm text-ash">Cargando tu look de hoy…</p>
          ) : plan ? (
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="w-40 shrink-0">
                <OutfitPreview items={plan.outfit.items} />
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <p className="font-serif text-2xl font-medium leading-tight">{plan.outfit.name}</p>
                  <p className="text-xs text-ash">{OCCASION_LABEL[plan.outfit.occasion]}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/outfits/${plan.outfit.id}`} className={`${linkClass} bg-ink text-paper hover:bg-ink/90`}>
                    Ver look
                  </Link>
                  <Link to="/calendar" className={`${linkClass} border border-ink hover:bg-paper`}>
                    Ir al calendario
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-4">
              <p className="font-serif text-2xl italic">Todavía no planificaste tu look de hoy</p>
              <Link to="/calendar" className={`${linkClass} bg-ink text-paper hover:bg-ink/90`}>
                Planificar look
              </Link>
            </div>
          )}
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/wardrobe" className={`${linkClass} border border-ink hover:bg-linen`}>
          Ir a Mi armario
        </Link>
        <Link to="/outfits/new" className={`${linkClass} border border-ink hover:bg-linen`}>
          Crear un look
        </Link>
      </div>
    </main>
  );
}
