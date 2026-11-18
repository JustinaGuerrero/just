import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Chip } from '../components/Chip';
import { OutfitPreview } from '../features/outfits/OutfitPreview';
import { useOutfits, useToggleFavorite } from '../features/outfits/outfits';
import { OCCASIONS, OCCASION_LABEL, type Occasion } from '../lib/catalog';

export default function FavoritesPage() {
  const [onlyFavorites, setOnlyFavorites] = useState(true);
  const [occasion, setOccasion] = useState<Occasion | undefined>();

  const outfitsQuery = useOutfits({ favorite: onlyFavorites || undefined, occasion });
  const toggleFavorite = useToggleFavorite();
  const outfits = outfitsQuery.data ?? [];

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-label text-ash">Looks guardados</p>
          <h1 className="mt-1 font-serif text-5xl font-normal leading-none">Favoritos</h1>
          <p className="mt-3 text-sm text-ash" aria-live="polite">
            {outfitsQuery.isPending ? 'Cargando…' : outfits.length === 1 ? '1 look' : `${outfits.length} looks`}
          </p>
        </div>
        <Link
          to="/outfits/new"
          className="flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-medium text-paper transition hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Crear outfit
        </Link>
      </header>

      <div className="-mx-6 mt-8 flex gap-2 overflow-x-auto px-6 pb-1">
        <Chip active={onlyFavorites} onClick={() => setOnlyFavorites(true)}>
          Favoritos
        </Chip>
        <Chip active={!onlyFavorites} onClick={() => setOnlyFavorites(false)}>
          Todos mis looks
        </Chip>
        <span className="mx-1 w-px shrink-0 bg-sand" aria-hidden="true" />
        <Chip active={!occasion} onClick={() => setOccasion(undefined)}>
          Todas las ocasiones
        </Chip>
        {OCCASIONS.map((o) => (
          <Chip key={o.value} active={occasion === o.value} onClick={() => setOccasion(occasion === o.value ? undefined : o.value)}>
            {o.label}
          </Chip>
        ))}
      </div>

      <section className="mt-6" aria-label="Looks">
        {outfitsQuery.isError ? (
          <p role="alert" className="rounded-field bg-blush-soft px-4 py-3 text-sm">
            No pudimos cargar tus looks. Revisá que el servidor esté corriendo e intentá de nuevo.
          </p>
        ) : outfitsQuery.isPending ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" aria-hidden="true">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-card bg-linen" />
            ))}
          </div>
        ) : outfits.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-panel bg-linen px-6 py-16 text-center">
            <p className="font-serif text-3xl italic">
              {onlyFavorites && !occasion ? 'Todavía no tenés favoritos' : 'No hay looks para mostrar'}
            </p>
            <p className="max-w-sm text-sm text-ash">
              {onlyFavorites && !occasion
                ? 'Creá un look y tocá el corazón para guardarlo acá.'
                : 'Probá con otro filtro, o creá un look nuevo.'}
            </p>
            <Link to="/outfits/new" className="flex h-12 items-center rounded-full bg-ink px-6 text-sm font-medium text-paper transition hover:bg-ink/90">
              Crear mi primer look
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4">
            {outfits.map((outfit) => (
              <article key={outfit.id} className="relative">
                <Link
                  to={`/outfits/${outfit.id}`}
                  aria-label={`Editar ${outfit.name}`}
                  className="group flex flex-col gap-2 rounded-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
                >
                  <OutfitPreview items={outfit.items} />
                  <span className="px-0.5">
                    <span className="block font-serif text-xl font-medium leading-tight">{outfit.name}</span>
                    <span className="block text-xs text-ash">
                      {OCCASION_LABEL[outfit.occasion]} · {outfit.items.length === 1 ? '1 prenda' : `${outfit.items.length} prendas`}
                    </span>
                  </span>
                </Link>
                <button
                  type="button"
                  aria-pressed={outfit.isFavorite}
                  aria-label={outfit.isFavorite ? `Quitar ${outfit.name} de favoritos` : `Agregar ${outfit.name} a favoritos`}
                  onClick={() => toggleFavorite.mutate({ id: outfit.id, isFavorite: !outfit.isFavorite })}
                  className="absolute right-2 top-2 flex size-11 items-center justify-center rounded-full bg-paper/90 transition hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill={outfit.isFavorite ? '#8C5A4B' : 'none'}
                    stroke={outfit.isFavorite ? '#8C5A4B' : 'currentColor'}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
                  </svg>
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
