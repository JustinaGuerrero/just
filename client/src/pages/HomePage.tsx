import { Link } from 'react-router-dom';
import { useCurrentUser } from '../features/auth/auth';
import { useGarmentCounts } from '../features/garments/garments';

export default function HomePage() {
  const { data: user } = useCurrentUser();
  const { data: counts } = useGarmentCounts();
  const total = counts?.total;

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
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
      <Link
        to="/wardrobe"
        className="mt-8 inline-flex h-12 items-center rounded-full bg-ink px-6 text-sm font-medium text-paper transition hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        Ir a Mi armario
      </Link>
    </main>
  );
}
