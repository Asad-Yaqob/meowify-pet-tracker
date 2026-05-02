import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createPet, deletePet, getPetById, listPets, updatePet } from '../services/api/petService';
import { PetPayload } from '../types/petTypes';

export const petKeys = {
  all: ['pets'] as const,
  lists: () => [...petKeys.all, 'list'] as const,
  details: () => [...petKeys.all, 'detail'] as const,
  detail: (id: string) => [...petKeys.details(), id] as const,
};

export const usePets = () =>
  useQuery({
    queryKey: petKeys.lists(),
    queryFn: listPets,
  });

export const usePet = (id: string) =>
  useQuery({
    queryKey: petKeys.detail(id),
    queryFn: () => getPetById(id),
    enabled: !!id,
  });

export const useCreatePet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, createdBy }: { payload: PetPayload; createdBy: string }) =>
      createPet(payload, createdBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: petKeys.lists() });
    },
  });
};

export const useUpdatePet = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PetPayload) => updatePet(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: petKeys.lists() });
      queryClient.invalidateQueries({ queryKey: petKeys.detail(id) });
    },
  });
};

export const useDeletePet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: petKeys.lists() });
    },
  });
};
