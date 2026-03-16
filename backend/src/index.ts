import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { successResponse, errorResponse } from './utils/response';

// Import handlers
import {
  getLists,
  getList,
  createListHandler,
  updateListHandler,
  deleteListHandler,
} from './handlers/lists';

import {
  getGifts,
  createGiftHandler,
  updateGiftHandler,
  deleteGiftHandler,
  reorderGiftHandler,
  unclaimGiftHandler,
} from './handlers/gifts';

import {
  getPublicList,
  getPublicGifts,
  claimGiftHandler,
} from './handlers/public';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  // Support both v1 and v2 payload formats from API Gateway
  const eventAny = event as any;
  const httpMethod = event.httpMethod || eventAny.requestContext?.http?.method;
  const resource = event.resource || eventAny.routeKey?.replace(/^[A-Z]+ /, '');
  const path = event.path || eventAny.rawPath;

  // Handle CORS preflight
  if (httpMethod === 'OPTIONS') {
    return successResponse({});
  }

  try {
    // Lister endpoints (authenticated)
    if (resource === '/lists' && httpMethod === 'GET') {
      return await getLists(event);
    }

    if (resource === '/lists' && httpMethod === 'POST') {
      return await createListHandler(event);
    }

    if (resource === '/lists/{listId}' && httpMethod === 'GET') {
      return await getList(event);
    }

    if (resource === '/lists/{listId}' && httpMethod === 'PUT') {
      return await updateListHandler(event);
    }

    if (resource === '/lists/{listId}' && httpMethod === 'DELETE') {
      return await deleteListHandler(event);
    }

    if (resource === '/lists/{listId}/gifts' && httpMethod === 'GET') {
      return await getGifts(event);
    }

    if (resource === '/lists/{listId}/gifts' && httpMethod === 'POST') {
      return await createGiftHandler(event);
    }

    if (resource === '/gifts/{giftId}' && httpMethod === 'PUT') {
      return await updateGiftHandler(event);
    }

    if (resource === '/gifts/{giftId}' && httpMethod === 'DELETE') {
      return await deleteGiftHandler(event);
    }

    if (resource === '/gifts/{giftId}/reorder' && httpMethod === 'PUT') {
      return await reorderGiftHandler(event);
    }

    if (resource === '/gifts/{giftId}/unclaim' && httpMethod === 'POST') {
      return await unclaimGiftHandler(event);
    }

    // Public endpoints (no authentication)
    if (resource === '/public/lists/{shareCode}' && httpMethod === 'GET') {
      return await getPublicList(event);
    }

    if (resource === '/public/lists/{shareCode}/gifts' && httpMethod === 'GET') {
      return await getPublicGifts(event);
    }

    if (resource === '/public/gifts/{giftId}/claim' && httpMethod === 'POST') {
      return await claimGiftHandler(event);
    }

    // Health check
    if (path === '/health' && httpMethod === 'GET') {
      return successResponse({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      });
    }

    // Route not found
    return successResponse(
      {
        error: 'Not Found',
        message: `Route ${httpMethod} ${resource} not found`,
      },
      404
    );
  } catch (error) {
    console.error('Unhandled error:', error);
    return errorResponse(error as Error, event.requestContext.requestId);
  }
};
