import { CATEGORY_LABEL, capitalize, parseColor } from '../../lib/catalog';
import type { Garment } from './garments';

type GarmentCardProps = {
  garment: Garment;
  onOpen: () => void;
};

export function GarmentCard({ garment, onOpen }: GarmentCardProps) {
  const color = garment.colors[0];
  const meta = color
    ? `${CATEGORY_LABEL[garment.category]} · ${capitalize(parseColor(color).name)}`
    : CATEGORY_LABEL[garment.category];

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Editar ${garment.name}`}
      className="group flex flex-col gap-2 rounded-card text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
    >
      <span className="block aspect-[4/5] overflow-hidden rounded-card bg-linen">
        <img
          src={garment.imageUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
      </span>
      <span className="px-0.5">
        <span className="block text-[15px] font-medium leading-snug">{garment.name}</span>
        <span className="block text-xs text-ash">{meta}</span>
      </span>
    </button>
  );
}
