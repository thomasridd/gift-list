import axios, { AxiosError } from 'axios';
import type {
  List,
  Gift,
  CreateListRequest,
  UpdateListRequest,
  CreateGiftRequest,
  UpdateGiftRequest,
  ClaimGiftRequest,
  ReorderGiftRequest,
  ListsResponse,
  GiftsResponse,
  PublicList,
  PublicGift,
  ErrorResponse
} from '../types';
import { getCurrentUser } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(async (config) => {
  try {
    const user = await getCurrentUser();
    if (user) {
      const session = await new Promise<any>((resolve, reject) => {
        user.getSession((err: Error | null, session: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(session);
          }
        });
      });
      const token = session.getIdToken().getJwtToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    // No user logged in, continue without token
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorResponse>) => {
    if (error.response?.data?.error) {
      throw error.response.data.error;
    }
    throw error;
  }
);

// Lister API calls (authenticated)
export const listsApi = {
  getAll: async (): Promise<List[]> => {
    const { data } = await api.get<ListsResponse>('/lists');
    return data.lists;
  },

  getById: async (listId: string): Promise<List> => {
    const { data } = await api.get<List>(`/lists/${listId}`);
    return data;
  },

  create: async (request: CreateListRequest): Promise<List> => {
    const { data } = await api.post<List>('/lists', request);
    return data;
  },

  update: async (listId: string, request: UpdateListRequest): Promise<List> => {
    const { data } = await api.put<List>(`/lists/${listId}`, request);
    return data;
  },

  delete: async (listId: string): Promise<void> => {
    await api.delete(`/lists/${listId}`);
  },
};

export const giftsApi = {
  getForList: async (listId: string): Promise<Gift[]> => {
    const { data } = await api.get<GiftsResponse>(`/lists/${listId}/gifts`);
    return data.gifts;
  },

  create: async (listId: string, request: CreateGiftRequest): Promise<Gift> => {
    const { data } = await api.post<Gift>(`/lists/${listId}/gifts`, request);
    return data;
  },

  update: async (giftId: string, request: UpdateGiftRequest): Promise<Gift> => {
    const { data } = await api.put<Gift>(`/gifts/${giftId}`, request);
    return data;
  },

  delete: async (giftId: string): Promise<void> => {
    await api.delete(`/gifts/${giftId}`);
  },

  reorder: async (giftId: string, request: ReorderGiftRequest): Promise<Gift> => {
    const { data } = await api.put<Gift>(`/gifts/${giftId}/reorder`, request);
    return data;
  },

  unclaim: async (giftId: string): Promise<Gift> => {
    const { data } = await api.post<Gift>(`/gifts/${giftId}/unclaim`);
    return data;
  },
};

// Public API calls (no authentication)
export const publicApi = {
  getList: async (shareCode: string): Promise<PublicList> => {
    const { data } = await api.get<PublicList>(`/public/lists/${shareCode}`);
    return data;
  },

  getGifts: async (shareCode: string): Promise<PublicGift[]> => {
    const { data } = await api.get<GiftsResponse>(`/public/lists/${shareCode}/gifts`);
    return data.gifts;
  },

  claimGift: async (giftId: string, request: ClaimGiftRequest): Promise<Gift> => {
    const { data } = await api.post<Gift>(`/public/gifts/${giftId}/claim`, request);
    return data;
  },
};
