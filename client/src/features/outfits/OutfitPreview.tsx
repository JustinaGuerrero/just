import { ITEM_BASE_WIDTH, type OutfitItem } from './outfits';

// Miniatura de solo lectura: reproduce la composición del lienzo con las mismas posiciones en %.
export function OutfitPreview({ items }: { items: OutfitItem[] }) {
  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-linen">
      {items.map((item) => (
        <img
          key={item.id}
          src={item.garment.imageUrl}
          alt=""
          loading="lazy"
          className="absolute rounded-lg shadow-md"
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            width: `${item.scale * ITEM_BASE_WIDTH}%`,
            zIndex: item.zIndex,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  );
}
