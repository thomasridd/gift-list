import { z } from 'zod';
import { ApiError, ErrorCode } from '../types';

export const listSchema = z.object({
  title: z.string().min(1).max(100),
  hideClaimedGifts: z.boolean(),
});

export const updateListSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  hideClaimedGifts: z.boolean().optional(),
});

export const giftSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000),
  url: z.string().url().max(2000).optional(),
  sortOrder: z.number().int().nonnegative(),
});

export const updateGiftSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  url: z.string().url().max(2000).optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});

export const claimGiftSchema = z.object({
  claimedBy: z.string().min(1).max(100).regex(/^[a-zA-Z\s'-]+$/),
  claimerMessage: z.string().max(500).optional(),
});

export const reorderGiftSchema = z.object({
  sortOrder: z.number().int().nonnegative(),
});

export const validate = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.errors.reduce((acc, err) => {
        const path = err.path.join('.');
        acc[path] = err.message;
        return acc;
      }, {} as Record<string, string>);

      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        'Validation failed',
        400,
        details
      );
    }
    throw error;
  }
};
