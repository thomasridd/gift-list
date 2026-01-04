import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getUserIdFromEvent, parseBody } from '../middleware/auth';
import { validate, giftSchema, updateGiftSchema, reorderGiftSchema } from '../services/validation';
import {
  createGift,
  getGiftsByList,
  updateGift,
  deleteGift,
  unclaimGift,
} from '../services/dynamodb';
import { successResponse, errorResponse } from '../utils/response';
import type { CreateGiftRequest, UpdateGiftRequest, ReorderGiftRequest } from '../types';

export const getGifts = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const listId = event.pathParameters?.listId;

    if (!listId) {
      return errorResponse(new Error('List ID is required'), event.requestContext.requestId);
    }

    const gifts = await getGiftsByList(listId);

    return successResponse({ gifts });
  } catch (error) {
    return errorResponse(error as Error, event.requestContext.requestId);
  }
};

export const createGiftHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    const listId = event.pathParameters?.listId;

    if (!listId) {
      return errorResponse(new Error('List ID is required'), event.requestContext.requestId);
    }

    const body = parseBody<CreateGiftRequest>(event);
    const validatedData = validate(giftSchema, body);

    const gift = await createGift(listId, userId, validatedData);

    return successResponse(gift, 201);
  } catch (error) {
    return errorResponse(error as Error, event.requestContext.requestId);
  }
};

export const updateGiftHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    const giftId = event.pathParameters?.giftId;

    if (!giftId) {
      return errorResponse(new Error('Gift ID is required'), event.requestContext.requestId);
    }

    const body = parseBody<UpdateGiftRequest>(event);
    const validatedData = validate(updateGiftSchema, body);

    const gift = await updateGift(giftId, userId, validatedData);

    return successResponse(gift);
  } catch (error) {
    return errorResponse(error as Error, event.requestContext.requestId);
  }
};

export const deleteGiftHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    const giftId = event.pathParameters?.giftId;

    if (!giftId) {
      return errorResponse(new Error('Gift ID is required'), event.requestContext.requestId);
    }

    await deleteGift(giftId, userId);

    return successResponse({}, 204);
  } catch (error) {
    return errorResponse(error as Error, event.requestContext.requestId);
  }
};

export const reorderGiftHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    const giftId = event.pathParameters?.giftId;

    if (!giftId) {
      return errorResponse(new Error('Gift ID is required'), event.requestContext.requestId);
    }

    const body = parseBody<ReorderGiftRequest>(event);
    const validatedData = validate(reorderGiftSchema, body);

    const gift = await updateGift(giftId, userId, validatedData);

    return successResponse(gift);
  } catch (error) {
    return errorResponse(error as Error, event.requestContext.requestId);
  }
};

export const unclaimGiftHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    const giftId = event.pathParameters?.giftId;

    if (!giftId) {
      return errorResponse(new Error('Gift ID is required'), event.requestContext.requestId);
    }

    const gift = await unclaimGift(giftId, userId);

    return successResponse(gift);
  } catch (error) {
    return errorResponse(error as Error, event.requestContext.requestId);
  }
};
