import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listsApi, giftsApi, publicApi } from '../services/api';
import type {
  CreateListRequest,
  UpdateListRequest,
  CreateGiftRequest,
  UpdateGiftRequest,
  ClaimGiftRequest,
  ReorderGiftRequest
} from '../types';

// Query keys
export const queryKeys = {
  lists: ['lists'] as const,
  list: (id: string) => ['lists', id] as const,
  gifts: (listId: string) => ['gifts', listId] as const,
  publicList: (shareCode: string) => ['public', 'list', shareCode] as const,
  publicGifts: (shareCode: string) => ['public', 'gifts', shareCode] as const,
};

// Lists hooks
export const useLists = () => {
  return useQuery({
    queryKey: queryKeys.lists,
    queryFn: listsApi.getAll,
  });
};

export const useList = (listId: string) => {
  return useQuery({
    queryKey: queryKeys.list(listId),
    queryFn: () => listsApi.getById(listId),
    enabled: !!listId,
  });
};

export const useCreateList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateListRequest) => listsApi.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists });
    },
  });
};

export const useUpdateList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, request }: { listId: string; request: UpdateListRequest }) =>
      listsApi.update(listId, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists });
      queryClient.invalidateQueries({ queryKey: queryKeys.list(variables.listId) });
    },
  });
};

export const useDeleteList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (listId: string) => listsApi.delete(listId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists });
    },
  });
};

// Gifts hooks
export const useGifts = (listId: string) => {
  return useQuery({
    queryKey: queryKeys.gifts(listId),
    queryFn: () => giftsApi.getForList(listId),
    enabled: !!listId,
  });
};

export const useCreateGift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, request }: { listId: string; request: CreateGiftRequest }) =>
      giftsApi.create(listId, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gifts(variables.listId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.list(variables.listId) });
    },
  });
};

export const useUpdateGift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ giftId, request }: { giftId: string; listId: string; request: UpdateGiftRequest }) =>
      giftsApi.update(giftId, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gifts(variables.listId) });
    },
  });
};

export const useDeleteGift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ giftId }: { giftId: string; listId: string }) =>
      giftsApi.delete(giftId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gifts(variables.listId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.list(variables.listId) });
    },
  });
};

export const useReorderGift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ giftId, request }: { giftId: string; listId: string; request: ReorderGiftRequest }) =>
      giftsApi.reorder(giftId, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gifts(variables.listId) });
    },
  });
};

export const useUnclaimGift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ giftId }: { giftId: string; listId: string }) =>
      giftsApi.unclaim(giftId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gifts(variables.listId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.list(variables.listId) });
    },
  });
};

// Public hooks
export const usePublicList = (shareCode: string) => {
  return useQuery({
    queryKey: queryKeys.publicList(shareCode),
    queryFn: () => publicApi.getList(shareCode),
    enabled: !!shareCode,
  });
};

export const usePublicGifts = (shareCode: string) => {
  return useQuery({
    queryKey: queryKeys.publicGifts(shareCode),
    queryFn: () => publicApi.getGifts(shareCode),
    enabled: !!shareCode,
  });
};

export const useClaimGift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ giftId, request }: { giftId: string; shareCode: string; request: ClaimGiftRequest }) =>
      publicApi.claimGift(giftId, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.publicGifts(variables.shareCode) });
    },
  });
};
