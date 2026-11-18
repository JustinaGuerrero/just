import type { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useLogout } from '../features/auth/auth';

const iconProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const HomeIcon = () => (
  <svg {...iconProps}>
    <path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" />
  </svg>
);

const WardrobeIcon = () => (
  <svg {...iconProps}>
    <path d="M10 6a2 2 0 1 1 2 2v2L3 17h18l-9-7" />
  </svg>
);

const PlusIcon = () => (
  <svg {...iconProps}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const HeartIcon = () => (
  <svg {...iconProps}>
    <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
  </svg>
);

type NavItem = { to: string; label: string; icon: ReactNode };

// Calendario se suma cuando exista su pantalla.
const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Inicio', icon: <HomeIcon /> },
  { to: '/wardrobe', label: 'Armario', icon: <WardrobeIcon /> },
  { to: '/outfits/new', label: 'Crear', icon: <PlusIcon /> },
  { to: '/favorites', label: 'Favoritos', icon: <HeartIcon /> },
];

export default function AppLayout() {
  const logout = useLogout();

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <header className="border-b border-sand">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <p className="text-xl font-light tracking-brand">JUST</p>

          <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  `rounded-full px-4 py-2.5 text-sm transition ${
                    isActive ? 'bg-linen font-medium text-ink' : 'text-ash hover:text-ink'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="min-h-11 rounded-full px-4 text-sm font-medium text-ink transition hover:bg-linen focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <Outlet />

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t border-sand bg-paper px-4 pb-4 pt-2 md:hidden"
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `flex min-w-16 flex-col items-center gap-1 rounded-card py-1 text-[11px] ${
                isActive ? 'font-medium text-ink' : 'text-ash'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
