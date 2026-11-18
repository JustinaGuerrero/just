import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { OCCASION_LABEL } from '../../lib/catalog';
import { OutfitPreview } from '../outfits/OutfitPreview';
import { useOutfits } from '../outfits/outfits';
import { useSetPlanned } from './planner';

type PlanPickerProps = {
  date: string; // YYYY-MM-DD
  dateLabel: string;
  currentOutfitId?: string;
  onClose: () => void;
};

// Ventana para elegir cuál de tus looks usar ese día.
export function PlanPicker({ date, dateLabel, currentOutfitId, onClose }: PlanPickerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const outfitsQuery = useOutfits({});
  const setPlanned = useSetPlanned();
  const outfits = outfitsQuery.data ?? [];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const close = () => dialogRef.current?.close();

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      aria-labelledby="plan-picker-title"
      className="m-0 mt-auto w-full max-w-none rounded-t-panel bg-paper p-0 text-ink backdrop:bg-ink/40 sm:m-auto sm:max-w-2xl sm:rounded-panel"
    >
      <div className="max-h-[90vh] overflow-y-auto px-6 pb-8 pt-6 sm:px-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="plan-picker-title" className="font-serif text-3xl font-normal leading-tight">
              Elegí un look
            </h2>
            <p className="mt-1 text-sm text-ash">{dateLabel}</p>
          </div>
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

        {setPlanned.error && (
          <p role="alert" className="mt-4 rounded-field bg-blush-soft px-4 py-3 text-sm">
            {setPlanned.error.message}
          </p>
        )}

        <div className="mt-6">
          {outfitsQuery.isPending ? (
            <p className="animate-pulse text-sm text-ash">Cargando tus looks…</p>
          ) : outfitsQuery.isError ? (
            <p role="alert" className="rounded-field bg-blush-soft px-4 py-3 text-sm">
              No pudimos cargar tus looks.
            </p>
          ) : outfits.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-panel bg-linen px-6 py-12 text-center">
              <p className="font-serif text-2xl italic">Todavía no creaste ningún look</p>
              <Link to="/outfits/new" className="flex h-12 items-center rounded-full bg-ink px-6 text-sm font-medium text-paper transition hover:bg-ink/90">
                Crear mi primer look
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3">
              {outfits.map((outfit) => {
                const current = outfit.id === currentOutfitId;
                return (
                  <button
                    key={outfit.id}
                    type="button"
                    disabled={setPlanned.isPending}
                    aria-pressed={current}
                    onClick={() => setPlanned.mutate({ date, outfitId: outfit.id }, { onSuccess: close })}
                    className="flex flex-col gap-2 rounded-card text-left transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink disabled:opacity-60"
                  >
                    <span className={`block rounded-card ${current ? 'ring-2 ring-ink ring-offset-2 ring-offset-paper' : ''}`}>
                      <OutfitPreview items={outfit.items} />
                    </span>
                    <span className="px-0.5">
                      <span className="block font-serif text-lg font-medium leading-tight">{outfit.name}</span>
                      <span className="block text-xs text-ash">{OCCASION_LABEL[outfit.occasion]}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
