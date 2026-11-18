import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Chip } from '../../components/Chip';
import { TextField } from '../../components/TextField';
import { CATEGORIES, OCCASIONS, type Category, type Occasion } from '../../lib/catalog';
import { useGarments, type Garment } from '../garments/garments';
import { ITEM_BASE_WIDTH, useDeleteOutfit, useSaveOutfit, type Outfit } from './outfits';

const MIN_SCALE = 0.4;
const MAX_SCALE = 2.4;
const SCALE_STEP = 0.15;

// Una prenda colocada en el lienzo. x e y son el centro, en % del lienzo.
type Placed = {
  garmentId: string;
  name: string;
  imageUrl: string;
  x: number;
  y: number;
  scale: number;
  z: number;
};

type Drag = { id: string; startX: number; startY: number; origX: number; origY: number; width: number; height: number };

// Dónde aparece cada tipo de prenda al agregarla, para que el look se arme "vestido" solo.
const PLACEMENTS: Record<Category, { x: number; y: number; scale: number }> = {
  OUTERWEAR: { x: 38, y: 30, scale: 1.1 },
  TEE: { x: 50, y: 27, scale: 0.9 },
  SHIRT: { x: 50, y: 27, scale: 0.9 },
  DRESS: { x: 50, y: 42, scale: 1.2 },
  PANTS: { x: 50, y: 60, scale: 1 },
  SKIRT: { x: 50, y: 60, scale: 0.9 },
  SHOES: { x: 50, y: 86, scale: 0.6 },
  ACCESSORY: { x: 80, y: 50, scale: 0.55 },
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number) => Math.round(value * 100) / 100;

type OutfitEditorProps = {
  outfit: Outfit | null; // null = look nuevo
};

export function OutfitEditor({ outfit }: OutfitEditorProps) {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);

  const [name, setName] = useState(outfit?.name ?? '');
  const [occasion, setOccasion] = useState<Occasion>(outfit?.occasion ?? 'OTHER');
  const [isFavorite, setIsFavorite] = useState(outfit?.isFavorite ?? false);
  const [items, setItems] = useState<Placed[]>(() =>
    (outfit?.items ?? []).map((item) => ({
      garmentId: item.garmentId,
      name: item.garment.name,
      imageUrl: item.garment.imageUrl,
      x: item.x,
      y: item.y,
      scale: item.scale,
      z: item.zIndex,
    })),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [trayCategory, setTrayCategory] = useState<Category | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const garmentsQuery = useGarments({ category: trayCategory });
  const save = useSaveOutfit();
  const remove = useDeleteOutfit();
  const pending = save.isPending || remove.isPending;

  const selected = items.find((item) => item.garmentId === selectedId) ?? null;
  const isEdit = outfit !== null;

  function updateItem(id: string, patch: Partial<Placed>) {
    setItems((current) => current.map((item) => (item.garmentId === id ? { ...item, ...patch } : item)));
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.garmentId !== id));
    setSelectedId((current) => (current === id ? null : current));
  }

  function toggleGarment(garment: Garment) {
    if (items.some((item) => item.garmentId === garment.id)) {
      removeItem(garment.id);
      return;
    }
    const placement = PLACEMENTS[garment.category];
    const top = items.reduce((max, item) => Math.max(max, item.z), 0);
    setItems([
      ...items,
      {
        garmentId: garment.id,
        name: garment.name,
        imageUrl: garment.imageUrl,
        ...placement,
        z: Math.min(top + 1, 100),
      },
    ]);
    setSelectedId(garment.id);
  }

  function resizeSelected(direction: 1 | -1) {
    if (!selected) return;
    updateItem(selected.garmentId, { scale: clamp(round(selected.scale + direction * SCALE_STEP), MIN_SCALE, MAX_SCALE) });
  }

  function bringToFront() {
    if (!selected) return;
    const top = items.reduce((max, item) => Math.max(max, item.z), 0);
    updateItem(selected.garmentId, { z: Math.min(top + 1, 100) });
  }

  // ---- Arrastre con mouse o dedo ----
  function handlePointerDown(event: PointerEvent<HTMLButtonElement>, item: Placed) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      id: item.garmentId,
      startX: event.clientX,
      startY: event.clientY,
      origX: item.x,
      origY: item.y,
      width: rect.width,
      height: rect.height,
    };
    setSelectedId(item.garmentId);
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    updateItem(drag.id, {
      x: clamp(drag.origX + ((event.clientX - drag.startX) / drag.width) * 100, 0, 100),
      y: clamp(drag.origY + ((event.clientY - drag.startY) / drag.height) * 100, 0, 100),
    });
  }

  function endDrag() {
    dragRef.current = null;
  }

  // ---- Teclado: flechas para mover (Shift = más rápido), Suprimir para quitar ----
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, item: Placed) {
    const step = event.shiftKey ? 5 : 2;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      updateItem(item.garmentId, { x: clamp(item.x + move[0], 0, 100), y: clamp(item.y + move[1], 0, 100) });
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      removeItem(item.garmentId);
    }
  }

  function handleSave() {
    setFormError(null);
    if (!name.trim()) return setFormError('Ponele un nombre al look');
    if (items.length === 0) return setFormError('Agregá al menos una prenda');

    save.mutate(
      {
        id: outfit?.id,
        input: {
          name,
          occasion,
          isFavorite,
          items: items.map((item) => ({
            garmentId: item.garmentId,
            x: round(item.x),
            y: round(item.y),
            scale: round(item.scale),
            zIndex: item.z,
          })),
        },
      },
      { onSuccess: () => navigate('/favorites') },
    );
  }

  const error = formError ?? save.error?.message ?? remove.error?.message;
  const garments = garmentsQuery.data ?? [];

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <Link to="/favorites" className="inline-flex min-h-11 items-center text-sm text-ash underline-offset-4 hover:text-ink hover:underline">
        ← Volver a mis looks
      </Link>
      <p className="mt-2 text-xs uppercase tracking-label text-ash">{isEdit ? 'Editar look' : 'Nuevo look'}</p>
      <h1 className="mt-1 font-serif text-5xl font-normal leading-none">Crear outfit</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        {/* Lienzo */}
        <section aria-label="Lienzo del look" className="flex flex-col gap-4">
          <div
            ref={canvasRef}
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) setSelectedId(null);
            }}
            className="relative aspect-[4/5] w-full touch-none select-none overflow-hidden rounded-panel bg-linen"
          >
            {items.length === 0 && (
              <p className="absolute inset-0 flex items-center justify-center px-10 text-center font-serif text-2xl italic text-ash">
                Elegí prendas de tu armario para armar el look
              </p>
            )}
            {items.map((item) => (
              <button
                key={item.garmentId}
                type="button"
                aria-label={`${item.name}. Arrastrala o usá las flechas para moverla.`}
                aria-pressed={item.garmentId === selectedId}
                onPointerDown={(event) => handlePointerDown(event, item)}
                onPointerMove={handlePointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onKeyDown={(event) => handleKeyDown(event, item)}
                onFocus={() => setSelectedId(item.garmentId)}
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  width: `${item.scale * ITEM_BASE_WIDTH}%`,
                  zIndex: item.z,
                  transform: 'translate(-50%, -50%)',
                  touchAction: 'none',
                }}
                className={`absolute cursor-grab rounded-lg active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                  item.garmentId === selectedId ? 'ring-2 ring-ink ring-offset-2 ring-offset-linen' : ''
                }`}
              >
                <img src={item.imageUrl} alt="" draggable={false} className="pointer-events-none block w-full rounded-lg shadow-lg" />
              </button>
            ))}
          </div>

          {selected ? (
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label={`Opciones de ${selected.name}`}>
              <p className="mr-auto max-w-full truncate text-sm font-medium">{selected.name}</p>
              <button type="button" onClick={() => resizeSelected(-1)} className="min-h-11 rounded-full border border-sand px-4 text-sm transition hover:border-ash">
                Más chica
              </button>
              <button type="button" onClick={() => resizeSelected(1)} className="min-h-11 rounded-full border border-sand px-4 text-sm transition hover:border-ash">
                Más grande
              </button>
              <button type="button" onClick={bringToFront} className="min-h-11 rounded-full border border-sand px-4 text-sm transition hover:border-ash">
                Al frente
              </button>
              <button
                type="button"
                onClick={() => removeItem(selected.garmentId)}
                className="min-h-11 rounded-full px-4 text-sm font-medium text-blush-deep transition hover:bg-blush-soft"
              >
                Quitar
              </button>
            </div>
          ) : (
            <p className="text-sm text-ash">
              {items.length > 0 ? 'Tocá una prenda para moverla, cambiarle el tamaño o quitarla.' : ' '}
            </p>
          )}
        </section>

        {/* Controles */}
        <div className="flex flex-col gap-8">
          <TextField
            label="Nombre del look"
            type="text"
            placeholder="Ej: Lunes de facultad"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
          />

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-xs uppercase tracking-label text-ash">Ocasión</legend>
            <div className="flex flex-wrap gap-2">
              {OCCASIONS.map((o) => (
                <Chip key={o.value} active={occasion === o.value} onClick={() => setOccasion(o.value)}>
                  {o.label}
                </Chip>
              ))}
            </div>
          </fieldset>

          <section aria-label="Tus prendas" className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-label text-ash">Tus prendas</p>
            <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1">
              <Chip active={!trayCategory} onClick={() => setTrayCategory(undefined)}>
                Todo
              </Chip>
              {CATEGORIES.map((c) => (
                <Chip key={c.value} active={trayCategory === c.value} onClick={() => setTrayCategory(trayCategory === c.value ? undefined : c.value)}>
                  {c.label}
                </Chip>
              ))}
            </div>

            {garmentsQuery.isError ? (
              <p role="alert" className="rounded-field bg-blush-soft px-4 py-3 text-sm">
                No pudimos cargar tus prendas.
              </p>
            ) : garments.length === 0 && !garmentsQuery.isPending ? (
              <p className="rounded-card bg-linen px-4 py-6 text-center text-sm text-ash">
                {trayCategory ? 'No tenés prendas en esta categoría.' : 'Todavía no tenés prendas. '}
                {!trayCategory && (
                  <Link to="/wardrobe" className="font-medium text-ink underline underline-offset-4">
                    Subí la primera
                  </Link>
                )}
              </p>
            ) : (
              <div className="grid max-h-80 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5">
                {garments.map((garment) => {
                  const inOutfit = items.some((item) => item.garmentId === garment.id);
                  return (
                    <button
                      key={garment.id}
                      type="button"
                      aria-pressed={inOutfit}
                      aria-label={`${garment.name}${inOutfit ? ' (en el look)' : ''}`}
                      onClick={() => toggleGarment(garment)}
                      className={`relative aspect-[4/5] overflow-hidden rounded-card bg-linen transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                        inOutfit ? 'ring-2 ring-ink ring-offset-2 ring-offset-paper' : 'hover:opacity-90'
                      }`}
                    >
                      <img src={garment.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                      {inOutfit && (
                        <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-ink">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FBF9F5" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M5 12l5 5 9-10" />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {error && (
            <p role="alert" className="rounded-field bg-blush-soft px-4 py-3 text-sm">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={pending}
                className="h-12 flex-1 rounded-full bg-ink text-sm font-medium text-paper transition hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60"
              >
                {save.isPending ? 'Guardando…' : 'Guardar look'}
              </button>
              <button
                type="button"
                aria-pressed={isFavorite}
                aria-label={isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
                onClick={() => setIsFavorite((v) => !v)}
                className="flex size-12 items-center justify-center rounded-full border border-sand transition hover:border-ash focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill={isFavorite ? '#8C5A4B' : 'none'}
                  stroke={isFavorite ? '#8C5A4B' : 'currentColor'}
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
                </svg>
              </button>
            </div>

            {isEdit &&
              (confirmDelete ? (
                <div className="flex items-center justify-between gap-3 rounded-field bg-linen px-4 py-3">
                  <p className="text-sm">¿Eliminar este look?</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setConfirmDelete(false)} className="min-h-10 rounded-full px-4 text-sm transition hover:bg-paper">
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => outfit && remove.mutate(outfit.id, { onSuccess: () => navigate('/favorites') })}
                      className="min-h-10 rounded-full bg-blush-deep px-4 text-sm font-medium text-paper transition hover:opacity-90 disabled:opacity-60"
                    >
                      Sí, eliminar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="min-h-11 rounded-full text-sm font-medium text-blush-deep transition hover:bg-blush-soft"
                >
                  Eliminar look
                </button>
              ))}
          </div>
        </div>
      </div>
    </main>
  );
}
