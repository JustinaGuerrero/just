import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Occasion } from '../../lib/catalog';
import type { Outfit } from '../outfits/outfits';

export type PlannedOutfit = {
  id: string;
  date: string; // YYYY-MM-DD
  occasion: Occasion | null;
  notes: string | null;
  outfit: Outfit;
};

const PLANNED_KEY = ['planned'];

export function usePlanned(from: string, to: string) {
  return useQuery({
    queryKey: [...PLANNED_KEY, from, to],
    queryFn: async () => (await api<{ planned: PlannedOutfit[] }>(`/api/planned?from=${from}&to=${to}`)).planned,
  });
}

// Asigna un look a un día (si ya había uno, lo reemplaza).
export function useSetPlanned() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ date, outfitId }: { date: string; outfitId: string }) =>
      api<{ planned: PlannedOutfit }>(`/api/planned/${date}`, { method: 'PUT', body: { outfitId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PLANNED_KEY }),
  });
}

export function useClearPlanned() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (date: string) => api<void>(`/api/planned/${date}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PLANNED_KEY }),
  });
}
