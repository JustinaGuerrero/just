// En producción el frontend le habla a la API por la misma dirección (Vercel reenvía /api al backend),
// así la cookie de sesión es de primera parte. En desarrollo va directo a localhost:3001.
const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:3001');

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
};

// Cliente único para hablar con la API. `credentials: 'include'` envía la cookie de sesión.
// Si el body es FormData (subida de fotos), el navegador arma solo el Content-Type.
export async function api<T>(path: string, { method = 'GET', body }: RequestOptions = {}): Promise<T> {
  const isForm = body instanceof FormData;
  const payload = isForm ? body : body !== undefined ? JSON.stringify(body) : undefined;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      credentials: 'include',
      headers: body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : undefined,
      body: payload,
    });
  } catch {
    throw new ApiError('No pudimos conectarnos al servidor. Revisá tu conexión.', 0);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(data?.error ?? 'Algo salió mal. Probá de nuevo.', res.status);
  }
  return data as T;
}
