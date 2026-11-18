import type { ReactNode } from 'react';

type ChipProps = {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
};

// Botón en forma de píldora que se puede activar o desactivar (filtros, categorías, etiquetas).
export function Chip({ active, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-10 shrink-0 rounded-full border px-4 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
        active ? 'border-ink bg-ink text-paper' : 'border-sand bg-paper text-ink hover:border-ash'
      }`}
    >
      {children}
    </button>
  );
}
