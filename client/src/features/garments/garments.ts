import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Category, Season, Style } from '../../lib/catalog';

export type Garment = {
  id: string;
  name: string;
  category: Category;
  colors: string[];
  styles: Style[];
  seasons: Season[];
  brand: string | null;
  imageUrl: string;
  createdAt: string;
};

export type GarmentFilters = {
  category?: Category;
  season?: Season;
  style?: Style;
  color?: string;
  q?: string;
  sort?: 'recent' | 'name';
};

export type GarmentValues = {
  name: string;
  category: Category;
  colors: string[];
  styles: Style[];
  seasons: Season[];
  brand: string;
};

function toQuery(filters: GarmentFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

// Todas las consultas de prendas cuelgan de la clave 'garments',
// así una sola invalidación refresca la lista y los contadores.
const GARMENTS_KEY = ['garments'];

export function useGarments(filters: GarmentFilters, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    enabled,
    queryKey: [...GARMENTS_KEY, 'list', filters],
    queryFn: async () => (await api<{ garments: Garment[] }>(`/api/garments${toQuery(filters)}`)).garments,
    placeholderData: keepPreviousData, // mantiene la grilla mientras llegan los resultados nuevos
  });
}

export function useGarmentCounts() {
  return useQuery({
    queryKey: [...GARMENTS_KEY, 'counts'],
    queryFn: () => api<{ counts: Partial<Record<Category, number>>; total: number }>('/api/garments/counts'),
  });
}

export function useCreateGarment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GarmentValues & { image: File }) => {
      const form = new FormData();
      form.append('name', input.name);
      form.append('category', input.category);
      form.append('colors', input.colors.join(','));
      form.append('styles', input.styles.join(','));
      form.append('seasons', input.seasons.join(','));
      form.append('brand', input.brand);
      form.append('image', input.image);
      return api<{ garment: Garment }>('/api/garments', { method: 'POST', body: form });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GARMENTS_KEY }),
  });
}

export function useUpdateGarment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, image, ...values }: GarmentValues & { id: string; image?: File | null }) => {
      // Con foto nueva se envía como formulario; si no, solo los datos en JSON.
      if (image) {
        const form = new FormData();
        form.append('name', values.name);
        form.append('category', values.category);
        form.append('colors', values.colors.join(','));
        form.append('styles', values.styles.join(','));
        form.append('seasons', values.seasons.join(','));
        form.append('brand', values.brand);
        form.append('image', image);
        return api<{ garment: Garment }>(`/api/garments/${id}`, { method: 'PATCH', body: form });
      }
      return api<{ garment: Garment }>(`/api/garments/${id}`, { method: 'PATCH', body: values });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GARMENTS_KEY }),
  });
}

export function useDeleteGarment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/api/garments/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GARMENTS_KEY });
      // Borrar una prenda también la saca de los looks que la usaban.
      queryClient.invalidateQueries({ queryKey: ['outfits'] });
    },
  });
}
