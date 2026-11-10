import { useQuery } from '@tanstack/react-query'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

type Health = { status: string; app: string }

async function fetchHealth(): Promise<Health> {
  const res = await fetch(`${API_URL}/api/health`)
  if (!res.ok) throw new Error('La API no respondió')
  return res.json()
}

export default function App() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    retry: false,
  })

  const status = isPending ? 'Conectando…' : isError ? 'API sin conexión' : 'API conectada'
  const dot = isPending ? 'bg-sand' : isError ? 'bg-blush-deep' : 'bg-emerald-600'

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-2xl rounded-panel bg-linen px-8 py-14 text-center sm:px-14">
        <h1 className="pl-[0.42em] text-6xl font-light tracking-brand sm:text-7xl">JUST</h1>
        <p className="mt-4 font-serif text-2xl italic sm:text-3xl">Your wardrobe. Your rules.</p>

        <div className="mt-12 flex items-center justify-between border-t border-sand pt-5 text-xs tracking-label text-ash">
          <span>FASHION</span>
          <span>STYLE</span>
          <span>YOUR CLOSET</span>
        </div>

        <p
          role="status"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-paper px-4 py-2 text-sm text-ash"
        >
          <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
          {status}
          {data ? ` · ${data.app}` : ''}
        </p>
      </section>
    </main>
  )
}
