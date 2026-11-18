import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Chip } from '../../components/Chip';
import { TextField } from '../../components/TextField';
import {
  CATEGORIES,
  COLORS,
  SEASONS,
  MAX_CUSTOM_NAME,
  STYLES,
  capitalize,
  isCustomColor,
  makeCustomColor,
  parseColor,
  type Category,
  type Season,
  type Style,
} from '../../lib/catalog';
import { useCreateGarment, useDeleteGarment, useUpdateGarment, type Garment } from './garments';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_COLORS = 6;

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

type GarmentDialogProps = {
  garment: Garment | null; // null = prenda nueva
  onClose: () => void;
};

export function GarmentDialog({ garment, onClose }: GarmentDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isEdit = garment !== null;

  const [name, setName] = useState(garment?.name ?? '');
  const [category, setCategory] = useState<Category | ''>(garment?.category ?? '');
  const [colors, setColors] = useState<string[]>(garment?.colors ?? []);
  const [seasons, setSeasons] = useState<Season[]>(garment?.seasons ?? []);
  const [styles, setStyles] = useState<Style[]>(garment?.styles ?? []);
  const [brand, setBrand] = useState(garment?.brand ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addingColor, setAddingColor] = useState(false);
  const [customHex, setCustomHex] = useState('#c9a0a0');
  const [customName, setCustomName] = useState('');

  const create = useCreateGarment();
  const update = useUpdateGarment();
  const remove = useDeleteGarment();
  const pending = create.isPending || update.isPending || remove.isPending;

  // <dialog> nativo: ya trae el fondo oscuro, el foco atrapado y el cierre con Escape.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  // Vista previa de la foto elegida: se libera la memoria al cambiarla y al cerrar el diálogo.
  const previewUrl = useRef<string | null>(null);
  useEffect(() => {
    return () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    };
  }, []);

  const close = () => dialogRef.current?.close();

  function addCustomColor() {
    const value = makeCustomColor(customName, customHex);
    if (!colors.includes(value) && colors.length < MAX_COLORS) setColors([...colors, value]);
    setAddingColor(false);
    setCustomName('');
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (selected.size > MAX_IMAGE_BYTES) {
      setFormError('La imagen pesa más de 5 MB.');
      return;
    }
    setFormError(null);
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = URL.createObjectURL(selected);
    setPreview(previewUrl.current);
    setFile(selected);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!name.trim()) return setFormError('Ingresá un nombre para la prenda');
    if (!category) return setFormError('Elegí una categoría');
    if (!isEdit && !file) return setFormError('Subí una foto de la prenda');

    const values = { name, category, colors, styles, seasons, brand };
    if (garment) {
      update.mutate({ id: garment.id, ...values }, { onSuccess: close });
    } else if (file) {
      create.mutate({ ...values, image: file }, { onSuccess: close });
    }
  }

  const error = formError ?? create.error?.message ?? update.error?.message ?? remove.error?.message;
  const imageSrc = preview ?? garment?.imageUrl ?? null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) close(); // clic en el fondo oscuro
      }}
      aria-labelledby="garment-dialog-title"
      className="m-0 mt-auto w-full max-w-none rounded-t-panel bg-paper p-0 text-ink backdrop:bg-ink/40 sm:m-auto sm:max-w-lg sm:rounded-panel"
    >
      <div className="max-h-[90vh] overflow-y-auto px-6 pb-8 pt-6 sm:px-8">
        <div className="flex items-start justify-between gap-4">
          <h2 id="garment-dialog-title" className="font-serif text-3xl font-normal leading-tight">
            {isEdit ? 'Editar prenda' : 'Nueva prenda'}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar"
            className="-mr-2 flex size-11 items-center justify-center rounded-full text-ash transition hover:bg-linen hover:text-ink"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6" noValidate>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-label text-ash">Foto</span>
            <label className="relative flex h-56 cursor-pointer items-center justify-center overflow-hidden rounded-card border border-dashed border-sand bg-linen transition focus-within:ring-2 focus-within:ring-blush hover:border-ash">
              {imageSrc ? (
                <img src={imageSrc} alt="Vista previa de la prenda" className="h-full w-full object-cover" />
              ) : (
                <span className="px-6 text-center text-sm text-ash">Tocá para elegir una foto (JPG, PNG o WebP, hasta 5 MB)</span>
              )}
              {imageSrc && !isEdit && (
                <span className="absolute bottom-3 right-3 rounded-full bg-paper px-3 py-1 text-xs">Cambiar foto</span>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFile}
                disabled={isEdit}
                className="sr-only"
              />
            </label>
            {isEdit && <p className="text-xs text-ash">Para cambiar la foto, eliminá la prenda y subila de nuevo.</p>}
          </div>

          <TextField
            label="Nombre"
            type="text"
            placeholder="Ej: Blazer de lino"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="garment-category" className="text-xs uppercase tracking-label text-ash">
              Categoría
            </label>
            <select
              id="garment-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category | '')}
              className="h-12 rounded-field border border-sand bg-paper px-4 text-base font-normal text-ink outline-none transition focus:border-ink focus:ring-2 focus:ring-blush"
            >
              <option value="">Elegí una categoría</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-xs uppercase tracking-label text-ash">Colores</legend>
            <div className="flex flex-wrap gap-2.5">
              {COLORS.map((c) => {
                const active = colors.includes(c.name);
                return (
                  <button
                    key={c.name}
                    type="button"
                    aria-label={capitalize(c.name)}
                    aria-pressed={active}
                    onClick={() => setColors(toggle(colors, c.name))}
                    style={{ backgroundColor: c.hex }}
                    className={`size-9 rounded-full border border-sand transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                      active ? 'ring-2 ring-ink ring-offset-2 ring-offset-paper' : ''
                    }`}
                  />
                );
              })}
              {colors.filter(isCustomColor).map((value) => {
                const { name, hex } = parseColor(value);
                return (
                  <button
                    key={value}
                    type="button"
                    aria-label={`${capitalize(name)} (quitar)`}
                    aria-pressed
                    onClick={() => setColors(toggle(colors, value))}
                    style={{ backgroundColor: hex }}
                    className="size-9 rounded-full border border-sand ring-2 ring-ink ring-offset-2 ring-offset-paper transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  />
                );
              })}
              <button
                type="button"
                aria-label="Elegir otro color"
                aria-expanded={addingColor}
                disabled={colors.length >= MAX_COLORS}
                onClick={() => setAddingColor(!addingColor)}
                className="flex size-9 items-center justify-center rounded-full border border-dashed border-ash text-ash transition hover:border-ink hover:text-ink disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
            {addingColor && (
              <div className="mt-2 flex flex-col gap-3 rounded-field bg-linen p-4">
                <div className="flex items-center gap-3">
                  <label htmlFor="custom-color" className="text-xs uppercase tracking-label text-ash">
                    Elegí tu color
                  </label>
                  <input
                    id="custom-color"
                    type="color"
                    value={customHex}
                    onChange={(e) => setCustomHex(e.target.value)}
                    className="h-11 w-16 cursor-pointer rounded-field border border-sand bg-paper p-1"
                  />
                </div>
                <TextField
                  label="Nombre del color"
                  placeholder="Ej: verde agua"
                  maxLength={MAX_CUSTOM_NAME}
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault(); // no enviar el formulario de la prenda
                      addCustomColor();
                    }
                  }}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={addCustomColor}
                    className="h-11 rounded-full bg-ink px-5 text-sm font-medium text-paper transition hover:bg-ink/90"
                  >
                    Agregar color
                  </button>
                  <button type="button" onClick={() => setAddingColor(false)} className="h-11 rounded-full px-4 text-sm text-ash hover:text-ink">
                    Cancelar
                  </button>
                </div>
              </div>
            )}
            {colors.length > 0 && <p className="text-xs text-ash">{colors.map((c) => capitalize(parseColor(c).name)).join(', ')}</p>}
            {colors.length >= MAX_COLORS && <p className="text-xs text-ash">Máximo {MAX_COLORS} colores por prenda.</p>}
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-xs uppercase tracking-label text-ash">Temporada</legend>
            <div className="flex flex-wrap gap-2">
              {SEASONS.map((s) => (
                <Chip key={s.value} active={seasons.includes(s.value)} onClick={() => setSeasons(toggle(seasons, s.value))}>
                  {s.label}
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-xs uppercase tracking-label text-ash">Estilo</legend>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <Chip key={s.value} active={styles.includes(s.value)} onClick={() => setStyles(toggle(styles, s.value))}>
                  {s.label}
                </Chip>
              ))}
            </div>
          </fieldset>

          <TextField
            label="Marca (opcional)"
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            maxLength={60}
          />

          {error && (
            <p role="alert" className="rounded-field bg-blush-soft px-4 py-3 text-sm text-ink">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={pending}
              className="h-12 rounded-full bg-ink text-sm font-medium text-paper transition hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60"
            >
              {pending ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Agregar al armario'}
            </button>

            {isEdit &&
              (confirmDelete ? (
                <div className="flex items-center justify-between gap-3 rounded-field bg-linen px-4 py-3">
                  <p className="text-sm">¿Eliminar esta prenda?</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="min-h-10 rounded-full px-4 text-sm transition hover:bg-paper"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => garment && remove.mutate(garment.id, { onSuccess: close })}
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
                  Eliminar prenda
                </button>
              ))}
          </div>
        </form>
      </div>
    </dialog>
  );
}
