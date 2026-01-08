// Data Models
export interface List {
  id: string;
  ownerId: string;
  title: string;
  hideClaimedGifts: boolean;
  createdAt: string;
  updatedAt: string;
  shareUrl: string;
  giftCount?: number;
  claimedCount?: number;
}

export interface Gift {
  id: string;
  listId: string;
  title: string;
  description: string;
  url?: string;
  status: 'available' | 'claimed';
  claimedBy?: string;
  claimerMessage?: string;
  claimedAt?: string;
  createdAt: string;
  updatedAt: string;
  sortOrder: number;
}

// DynamoDB Item Types
export interface ListItem {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  GSI2PK: string;
  GSI2SK: string;
  id: string;
  ownerId: string;
  title: string;
  hideClaimedGifts: boolean;
  createdAt: string;
  updatedAt: string;
  shareUrl: string;
}

export interface GiftItem {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  id: string;
  listId: string;
  title: string;
  description: string;
  url?: string;
  status: 'available' | 'claimed';
  claimedBy?: string;
  claimerMessage?: string;
  claimedAt?: string;
  createdAt: string;
  updatedAt: string;
  sortOrder: number;
}

// API Request/Response Types
export interface CreateListRequest {
  title: string;
  hideClaimedGifts: boolean;
}

export interface UpdateListRequest {
  title?: string;
  hideClaimedGifts?: boolean;
}

export interface CreateGiftRequest {
  title: string;
  description: string;
  url?: string;
  sortOrder: number;
}

export interface UpdateGiftRequest {
  title?: string;
  description?: string;
  url?: string;
  sortOrder?: number;
}

export interface ClaimGiftRequest {
  claimedBy: string;
  claimerMessage?: string;
}

export interface ReorderGiftRequest {
  sortOrder: number;
}

// Public (Gifter) Types
export interface PublicList {
  id: string;
  title: string;
  hideClaimedGifts: boolean;
}

export interface PublicGift {
  id: string;
  title: string;
  description: string;
  url?: string;
  status: 'available' | 'claimed';
}

// Error Types
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_CLAIMED = 'ALREADY_CLAIMED',
  GIFT_NOT_AVAILABLE = 'GIFT_NOT_AVAILABLE',
  LIST_NOT_FOUND = 'LIST_NOT_FOUND',
  INVALID_SHARE_CODE = 'INVALID_SHARE_CODE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
