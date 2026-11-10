import { useCurrentUser, useLogout } from '../features/auth/auth';

export default function HomePage() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-8">
      <header className="flex items-center justify-between">
        <p className="text-xl font-light tracking-brand">JUST</p>
        <button
          type="button"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="h-11 rounded-full border border-ink px-5 text-sm font-medium transition hover:bg-linen focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60"
        >
          Cerrar sesión
        </button>
      </header>

      <section className="my-auto py-16">
        <p className="text-xs uppercase tracking-label text-ash">Inicio</p>
        <h1 className="mt-2 font-serif text-5xl font-normal leading-tight">
          Hola, <span className="italic">{user?.name}</span>
        </h1>
        <p className="mt-4 max-w-md text-base text-ash">
          Tu espacio está listo. Pronto vas a poder subir tus prendas y armar tus looks.
        </p>
      </section>
    </main>
  );
}
