import type { ReactNode } from 'react';

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="pl-[0.42em] text-3xl font-light tracking-brand">JUST</p>
          <p className="mt-2 font-serif text-lg italic text-ash">Your wardrobe. Your rules.</p>
        </div>

        <section className="rounded-panel bg-linen px-7 py-9 sm:px-10">
          <h1 className="font-serif text-4xl font-normal leading-tight">{title}</h1>
          <p className="mt-2 text-sm text-ash">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </section>

        <p className="mt-6 text-center text-sm text-ash">{footer}</p>
      </div>
    </main>
  );
}
