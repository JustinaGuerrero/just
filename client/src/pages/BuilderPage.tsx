import { Link, useParams } from 'react-router-dom';
import { OutfitEditor } from '../features/outfits/OutfitEditor';
import { useOutfit } from '../features/outfits/outfits';

// /outfits/new crea un look; /outfits/:id edita uno existente.
export default function BuilderPage() {
  const { id } = useParams();
  const outfitQuery = useOutfit(id);

  if (!id) {
    return <OutfitEditor key="new" outfit={null} />;
  }

  if (outfitQuery.isPending) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16" role="status">
        <p className="animate-pulse text-sm text-ash">Cargando look…</p>
      </main>
    );
  }

  if (outfitQuery.isError || !outfitQuery.data) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16">
        <p className="font-serif text-3xl italic">No encontramos ese look</p>
        <Link to="/favorites" className="mt-4 inline-block text-sm underline underline-offset-4">
          Volver a mis looks
        </Link>
      </main>
    );
  }

  // La key evita mezclar el estado de un look con el de otro.
  return <OutfitEditor key={id} outfit={outfitQuery.data} />;
}
