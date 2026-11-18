import { useState } from 'react';
import { Chip } from '../components/Chip';
import { GarmentCard } from '../features/garments/GarmentCard';
import { GarmentDialog } from '../features/garments/GarmentDialog';
import { useGarmentCounts, useGarments, type Garment } from '../features/garments/garments';
import { CATEGORIES, COLORS, SEASONS, STYLES, capitalize, type Category, type Season, type Style } from '../lib/catalog';
import { useDebouncedValue } from '../lib/useDebouncedValue';

type DialogState = { garment: Garment | null } | null;

export default function WardrobePage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category | undefined>();
  const [season, setSeason] = useState<Season | undefined>();
  const [style, setStyle] = useState<Style | undefined>();
  const [color, setColor] = useState<string | undefined>();
  const [sort, setSort] = useState<'recent' | 'name'>('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);

  const q = useDebouncedValue(search.trim(), 300);
  const garmentsQuery = useGarments({ category, season, style, color, q: q || undefined, sort });
  const countsQuery = useGarmentCounts();

  const garments = garmentsQuery.data ?? [];
  const counts = countsQuery.data?.counts ?? {};
  const total = countsQuery.data?.total ?? 0;

  const extraFilters = [season, style, color].filter(Boolean).length;
  const anyFilter = Boolean(category || q || extraFilters);

  function clearFilters() {
    setSearch('');
    setCategory(undefined);
    setSeason(undefined);
    setStyle(undefined);
    setColor(undefined);
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-label text-ash">Tu armario</p>
          <h1 className="mt-1 font-serif text-5xl font-normal leading-none">Mi armario</h1>
          <p className="mt-3 text-sm text-ash">{total === 1 ? '1 prenda' : `${total} prendas`}</p>
        </div>
        <button
          type="button"
          onClick={() => setDialog({ garment: null })}
          className="flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-medium text-paper transition hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Agregar prenda
        </button>
      </header>

      <div className="mt-8 flex gap-3">
        <label className="flex h-12 flex-1 items-center gap-3 rounded-field bg-linen px-4 focus-within:ring-2 focus-within:ring-blush">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-ash" aria-hidden="true">
            <circle cx="11" cy="11" r="6" />
            <path d="M20 20l-4.5-4.5" />
          </svg>
          <span className="sr-only">Buscar prendas</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, marca o color…"
            className="min-w-0 flex-1 bg-transparent text-base font-normal outline-none placeholder:text-ash"
          />
        </label>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          className="flex h-12 items-center gap-2 rounded-field border border-sand px-4 text-sm transition hover:border-ash focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Filtros
          {extraFilters > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-ink text-[11px] text-paper">{extraFilters}</span>
          )}
        </button>
      </div>

      <div className="-mx-6 mt-4 flex gap-2 overflow-x-auto px-6 pb-1">
        <Chip active={!category} onClick={() => setCategory(undefined)}>
          Todo · {total}
        </Chip>
        {CATEGORIES.map((c) => (
          <Chip key={c.value} active={category === c.value} onClick={() => setCategory(category === c.value ? undefined : c.value)}>
            {c.label} · {counts[c.value] ?? 0}
          </Chip>
        ))}
      </div>

      {showFilters && (
        <section aria-label="Filtros" className="mt-4 flex flex-col gap-5 rounded-panel bg-linen p-6">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-xs uppercase tracking-label text-ash">Temporada</legend>
            <div className="flex flex-wrap gap-2">
              {SEASONS.map((s) => (
                <Chip key={s.value} active={season === s.value} onClick={() => setSeason(season === s.value ? undefined : s.value)}>
                  {s.label}
                </Chip>
              ))}
            </div>
          </fieldset>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-xs uppercase tracking-label text-ash">Estilo</legend>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <Chip key={s.value} active={style === s.value} onClick={() => setStyle(style === s.value ? undefined : s.value)}>
                  {s.label}
                </Chip>
              ))}
            </div>
          </fieldset>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-xs uppercase tracking-label text-ash">Color</legend>
            <div className="flex flex-wrap gap-2.5">
              {COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  aria-label={capitalize(c.name)}
                  aria-pressed={color === c.name}
                  onClick={() => setColor(color === c.name ? undefined : c.name)}
                  style={{ backgroundColor: c.hex }}
                  className={`size-9 rounded-full border border-sand transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                    color === c.name ? 'ring-2 ring-ink ring-offset-2 ring-offset-linen' : ''
                  }`}
                />
              ))}
            </div>
          </fieldset>
        </section>
      )}

      <div className="mt-6 flex items-center justify-between gap-4 text-sm text-ash">
        <p aria-live="polite">{garmentsQuery.isPending ? 'Cargando…' : garments.length === 1 ? '1 resultado' : `${garments.length} resultados`}</p>
        <div className="flex items-center gap-3">
          {anyFilter && (
            <button type="button" onClick={clearFilters} className="min-h-10 underline underline-offset-4 hover:text-ink">
              Limpiar filtros
            </button>
          )}
          <label className="flex items-center gap-2">
            Ordenar
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as 'recent' | 'name')}
              className="h-10 rounded-field border border-sand bg-paper px-3 text-sm text-ink outline-none focus:border-ink"
            >
              <option value="recent">Recientes</option>
              <option value="name">Nombre (A–Z)</option>
            </select>
          </label>
        </div>
      </div>

      <section className="mt-4" aria-label="Prendas">
        {garmentsQuery.isError ? (
          <p role="alert" className="rounded-field bg-blush-soft px-4 py-3 text-sm">
            No pudimos cargar tus prendas. Revisá que el servidor esté corriendo e intentá de nuevo.
          </p>
        ) : garmentsQuery.isPending ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-card bg-linen" />
            ))}
          </div>
        ) : garments.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-panel bg-linen px-6 py-16 text-center">
            {anyFilter ? (
              <>
                <p className="font-serif text-3xl italic">No encontramos prendas con esos filtros</p>
                <button type="button" onClick={clearFilters} className="h-11 rounded-full border border-ink px-6 text-sm font-medium transition hover:bg-paper">
                  Limpiar filtros
                </button>
              </>
            ) : (
              <>
                <p className="font-serif text-3xl italic">Tu armario está vacío</p>
                <p className="max-w-sm text-sm text-ash">Subí la foto de tu primera prenda y empezá a armar tu espacio.</p>
                <button
                  type="button"
                  onClick={() => setDialog({ garment: null })}
                  className="h-12 rounded-full bg-ink px-6 text-sm font-medium text-paper transition hover:bg-ink/90"
                >
                  Agregar mi primera prenda
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4">
            {garments.map((garment) => (
              <GarmentCard key={garment.id} garment={garment} onOpen={() => setDialog({ garment })} />
            ))}
          </div>
        )}
      </section>

      {dialog && (
        // La key fuerza un formulario nuevo para cada prenda abierta.
        <GarmentDialog key={dialog.garment?.id ?? 'new'} garment={dialog.garment} onClose={() => setDialog(null)} />
      )}
    </main>
  );
}
