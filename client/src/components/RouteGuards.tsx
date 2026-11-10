import { Navigate, Outlet } from 'react-router-dom';
import { useCurrentUser } from '../features/auth/auth';

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Cargando">
      <p className="animate-pulse pl-[0.42em] text-3xl font-light tracking-brand">JUST</p>
    </div>
  );
}

// Solo deja pasar a usuarios con sesión; el resto va a /login.
export function ProtectedRoute() {
  const { data: user, isPending } = useCurrentUser();
  if (isPending) return <Splash />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// Para /login y /register: si ya hay sesión, va al inicio.
export function PublicOnlyRoute() {
  const { data: user, isPending } = useCurrentUser();
  if (isPending) return <Splash />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}
