import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Occasion } from '../../lib/catalog';
import type { Garment } from '../garments/garments';

// Con scale = 1, una prenda ocupa este porcentaje del ancho del lienzo.
export const ITEM_BASE_WIDTH = 40;

export type OutfitItem = {
  id: string;
  garmentId: string;
  x: number; // centro, en % del lienzo
  y: number;
  scale: number;
  zIndex: number;
  garment: Garment;
};

export type Outfit = {
  id: string;
  name: string;
  occasion: Occasion;
  isFavorite: boolean;
  createdAt: string;
  items: OutfitItem[];
};

export type OutfitInput = {
  name: string;
  occasion: Occasion;
  isFavorite: boolean;
  items: { garmentId: string; x: number; y: number; scale: number; zIndex: number }[];
};

export type OutfitFilters = { favorite?: boolean; occasion?: Occasion };

const OUTFITS_KEY = ['outfits'];

export function useOutfits(filters: OutfitFilters) {
  const params = new URLSearchParams();
  if (filters.favorite) params.set('favorite', 'true');
  if (filters.occasion) params.set('occasion', filters.occasion);
  const query = params.toString();

  return useQuery({
    queryKey: [...OUTFITS_KEY, 'list', filters],
    queryFn: async () => (await api<{ outfits: Outfit[] }>(`/api/outfits${query ? `?${query}` : ''}`)).outfits,
  });
}

export function useOutfit(id: string | undefined) {
  return useQuery({
    queryKey: [...OUTFITS_KEY, 'detail', id],
    queryFn: async () => (await api<{ outfit: Outfit }>(`/api/outfits/${id}`)).outfit,
    enabled: Boolean(id),
    retry: false,
  });
}

// Crea un look nuevo o, si se pasa `id`, reemplaza el existente.
export function useSaveOutfit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: OutfitInput }) =>
      id
        ? api<{ outfit: Outfit }>(`/api/outfits/${id}`, { method: 'PUT', body: input })
        : api<{ outfit: Outfit }>('/api/outfits', { method: 'POST', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: OUTFITS_KEY }),
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      api<{ outfit: Outfit }>(`/api/outfits/${id}`, { method: 'PATCH', body: { isFavorite } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: OUTFITS_KEY }),
  });
}

export function useDeleteOutfit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/api/outfits/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: OUTFITS_KEY }),
  });
}
