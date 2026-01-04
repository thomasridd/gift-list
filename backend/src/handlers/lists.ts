import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getUserIdFromEvent, parseBody } from '../middleware/auth';
import { validate, listSchema, updateListSchema } from '../services/validation';
import {
  createList,
  getListById,
  getListsByOwner,
  updateList,
  deleteList,
} from '../services/dynamodb';
import { successResponse, errorResponse } from '../utils/response';
import type { CreateListRequest, UpdateListRequest } from '../types';

export const getLists = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    const lists = await getListsByOwner(userId);

    return successResponse({ lists });
  } catch (error) {
    return errorResponse(error as Error, event.requestContext.requestId);
  }
};

export const getList = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    const listId = event.pathParameters?.listId;

    if (!listId) {
      return errorResponse(new Error('List ID is required'), event.requestContext.requestId);
    }

    const list = await getListById(listId);

    if (!list) {
      return successResponse({ error: 'List not found' }, 404);
    }

    if (list.ownerId !== userId) {
      return successResponse({ error: 'Forbidden' }, 403);
    }

    return successResponse(list);
  } catch (error) {
    return errorResponse(error as Error, event.requestContext.requestId);
  }
};

export const createListHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    const body = parseBody<CreateListRequest>(event);
    const validatedData = validate(listSchema, body);

    const list = await createList(userId, validatedData);

    return successResponse(list, 201);
  } catch (error) {
    return errorResponse(error as Error, event.requestContext.requestId);
  }
};

export const updateListHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    const listId = event.pathParameters?.listId;

    if (!listId) {
      return errorResponse(new Error('List ID is required'), event.requestContext.requestId);
    }

    const body = parseBody<UpdateListRequest>(event);
    const validatedData = validate(updateListSchema, body);

    const list = await updateList(listId, userId, validatedData);

    return successResponse(list);
  } catch (error) {
    return errorResponse(error as Error, event.requestContext.requestId);
  }
};

export const deleteListHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    const listId = event.pathParameters?.listId;

    if (!listId) {
      return errorResponse(new Error('List ID is required'), event.requestContext.requestId);
    }

    await deleteList(listId, userId);

    return successResponse({}, 204);
  } catch (error) {
    return errorResponse(error as Error, event.requestContext.requestId);
  }
};
