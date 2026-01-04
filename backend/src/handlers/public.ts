import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { parseBody } from '../middleware/auth';
import { validate, claimGiftSchema } from '../services/validation';
import { getListByShareCode, getGiftsByList, claimGift } from '../services/dynamodb';
import { successResponse, errorResponse } from '../utils/response';
import type { ClaimGiftRequest, PublicGift } from '../types';

export const getPublicList = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const shareCode = event.pathParameters?.shareCode;

    if (!shareCode) {
      return errorResponse(new Error('Share code is required'), event.requestContext.requestId);
    }

    const list = await getListByShareCode(shareCode);

    if (!list) {
      return successResponse({ error: 'List not found' }, 404);
    }

    // Return only public fields
    const publicList = {
      id: list.id,
      title: list.title,
      hideClaimedGifts: list.hideClaimedGifts,
    };

    return successResponse(publicList);
  } catch (error) {
    return errorResponse(error as Error, event.requestContext.requestId);
  }
};

export const getPublicGifts = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const shareCode = event.pathParameters?.shareCode;

    if (!shareCode) {
      return errorResponse(new Error('Share code is required'), event.requestContext.requestId);
    }

    const list = await getListByShareCode(shareCode);

    if (!list) {
      return successResponse({ error: 'List not found' }, 404);
    }

    const gifts = await getGiftsByList(list.id);

    // Filter and sanitize gifts based on list settings
    let publicGifts: PublicGift[];

    if (list.hideClaimedGifts) {
      // Only show available gifts
      publicGifts = gifts
        .filter((g) => g.status === 'available')
        .map((g) => ({
          id: g.id,
          title: g.title,
          description: g.description,
          url: g.url,
          status: g.status,
        }));
    } else {
      // Show all gifts but hide claimer details
      publicGifts = gifts.map((g) => ({
        id: g.id,
        title: g.title,
        description: g.description,
        url: g.url,
        status: g.status,
      }));
    }

    return successResponse({ gifts: publicGifts });
  } catch (error) {
    return errorResponse(error as Error, event.requestContext.requestId);
  }
};

export const claimGiftHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const giftId = event.pathParameters?.giftId;

    if (!giftId) {
      return errorResponse(new Error('Gift ID is required'), event.requestContext.requestId);
    }

    const body = parseBody<ClaimGiftRequest>(event);
    const validatedData = validate(claimGiftSchema, body);

    const gift = await claimGift(giftId, validatedData);

    // Return only public fields
    const publicGift = {
      id: gift.id,
      status: gift.status,
      claimedAt: gift.claimedAt,
    };

    return successResponse(publicGift);
  } catch (error) {
    return errorResponse(error as Error, event.requestContext.requestId);
  }
};
