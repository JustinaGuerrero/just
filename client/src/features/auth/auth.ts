import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../../lib/api';

export type User = { id: string; name: string; email: string };

type AuthResponse = { user: User };

const ME_KEY = ['me'];

// Usuario de la sesión actual: User si hay sesión, null si no, undefined mientras carga.
export function useCurrentUser() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        const data = await api<AuthResponse>('/api/auth/me');
        return data.user;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { email: string; password: string }) =>
      api<AuthResponse>('/api/auth/login', { method: 'POST', body: values }),
    onSuccess: (data) => queryClient.setQueryData(ME_KEY, data.user),
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { name: string; email: string; password: string }) =>
      api<AuthResponse>('/api/auth/register', { method: 'POST', body: values }),
    onSuccess: (data) => queryClient.setQueryData(ME_KEY, data.user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>('/api/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      // Marca "sin sesión": las rutas protegidas redirigen a /login.
      queryClient.setQueryData(ME_KEY, null);
      // Borra lo cacheado del usuario anterior, menos la consulta de la sesión.
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== ME_KEY[0] });
    },
  });
}
