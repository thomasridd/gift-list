import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { generateShareCode } from '../utils/crypto';
import type {
  List,
  Gift,
  ListItem,
  GiftItem,
  CreateListRequest,
  UpdateListRequest,
  CreateGiftRequest,
  UpdateGiftRequest,
  ClaimGiftRequest,
} from '../types';
import { ApiError, ErrorCode } from '../types';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'gift-lists';

// Helper functions to convert between DynamoDB items and domain models
const listItemToList = (item: ListItem): List => ({
  id: item.id,
  ownerId: item.ownerId,
  title: item.title,
  hideClaimedGifts: item.hideClaimedGifts,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
  shareUrl: item.shareUrl,
});

const giftItemToGift = (item: GiftItem): Gift => ({
  id: item.id,
  listId: item.listId,
  title: item.title,
  description: item.description,
  url: item.url,
  status: item.status,
  claimedBy: item.claimedBy,
  claimerMessage: item.claimerMessage,
  claimedAt: item.claimedAt,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
  sortOrder: item.sortOrder,
});

// Lists operations
export const createList = async (
  ownerId: string,
  request: CreateListRequest
): Promise<List> => {
  const id = uuidv4();
  const shareCode = generateShareCode();
  const now = new Date().toISOString();

  const item: ListItem = {
    PK: `LIST#${id}`,
    SK: 'METADATA',
    GSI1PK: `OWNER#${ownerId}`,
    GSI1SK: `CREATED#${now}`,
    GSI2PK: `SHARE#${shareCode}`,
    GSI2SK: `CREATED#${now}`,
    id,
    ownerId,
    title: request.title,
    hideClaimedGifts: request.hideClaimedGifts,
    shareUrl: `/gift-list/${shareCode}`,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );

  return listItemToList(item);
};

export const getListById = async (listId: string): Promise<List | null> => {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `LIST#${listId}`,
        SK: 'METADATA',
      },
    })
  );

  return result.Item ? listItemToList(result.Item as ListItem) : null;
};

export const getListsByOwner = async (ownerId: string): Promise<List[]> => {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :ownerPK',
      ExpressionAttributeValues: {
        ':ownerPK': `OWNER#${ownerId}`,
      },
    })
  );

  const lists = (result.Items as ListItem[] || []).map(listItemToList);

  // Get gift counts for each list
  const listsWithCounts = await Promise.all(
    lists.map(async (list) => {
      const gifts = await getGiftsByList(list.id);
      return {
        ...list,
        giftCount: gifts.length,
        claimedCount: gifts.filter((g) => g.status === 'claimed').length,
      };
    })
  );

  return listsWithCounts;
};

export const getListByShareCode = async (shareCode: string): Promise<List | null> => {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :sharePK',
      ExpressionAttributeValues: {
        ':sharePK': `SHARE#${shareCode}`,
      },
    })
  );

  return result.Items && result.Items.length > 0
    ? listItemToList(result.Items[0] as ListItem)
    : null;
};

export const updateList = async (
  listId: string,
  ownerId: string,
  request: UpdateListRequest
): Promise<List> => {
  const existing = await getListById(listId);
  if (!existing) {
    throw new ApiError(ErrorCode.NOT_FOUND, 'List not found', 404);
  }

  if (existing.ownerId !== ownerId) {
    throw new ApiError(ErrorCode.FORBIDDEN, 'You do not have permission to update this list', 403);
  }

  const now = new Date().toISOString();
  const updateExpression: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  if (request.title !== undefined) {
    updateExpression.push('#title = :title');
    expressionAttributeNames['#title'] = 'title';
    expressionAttributeValues[':title'] = request.title;
  }

  if (request.hideClaimedGifts !== undefined) {
    updateExpression.push('#hideClaimedGifts = :hideClaimedGifts');
    expressionAttributeNames['#hideClaimedGifts'] = 'hideClaimedGifts';
    expressionAttributeValues[':hideClaimedGifts'] = request.hideClaimedGifts;
  }

  updateExpression.push('#updatedAt = :updatedAt');
  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  expressionAttributeValues[':updatedAt'] = now;

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `LIST#${listId}`,
        SK: 'METADATA',
      },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    })
  );

  return (await getListById(listId))!;
};

export const deleteList = async (listId: string, ownerId: string): Promise<void> => {
  const existing = await getListById(listId);
  if (!existing) {
    throw new ApiError(ErrorCode.NOT_FOUND, 'List not found', 404);
  }

  if (existing.ownerId !== ownerId) {
    throw new ApiError(ErrorCode.FORBIDDEN, 'You do not have permission to delete this list', 403);
  }

  // Get all gifts for this list
  const gifts = await getGiftsByList(listId);

  // Delete all items (list + gifts) in batch
  const deleteRequests = [
    {
      DeleteRequest: {
        Key: {
          PK: `LIST#${listId}`,
          SK: 'METADATA',
        },
      },
    },
    ...gifts.map((gift) => ({
      DeleteRequest: {
        Key: {
          PK: `LIST#${listId}`,
          SK: `GIFT#${gift.id}`,
        },
      },
    })),
  ];

  // DynamoDB batch write can handle max 25 items at a time
  for (let i = 0; i < deleteRequests.length; i += 25) {
    const batch = deleteRequests.slice(i, i + 25);
    await docClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: batch,
        },
      })
    );
  }
};

// Gifts operations
export const createGift = async (
  listId: string,
  ownerId: string,
  request: CreateGiftRequest
): Promise<Gift> => {
  const list = await getListById(listId);
  if (!list) {
    throw new ApiError(ErrorCode.NOT_FOUND, 'List not found', 404);
  }

  if (list.ownerId !== ownerId) {
    throw new ApiError(ErrorCode.FORBIDDEN, 'You do not have permission to add gifts to this list', 403);
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  const item: GiftItem = {
    PK: `LIST#${listId}`,
    SK: `GIFT#${id}`,
    GSI1PK: `GIFT#${id}`,
    GSI1SK: `LIST#${listId}`,
    id,
    listId,
    title: request.title,
    description: request.description,
    url: request.url,
    status: 'available',
    sortOrder: request.sortOrder,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );

  return giftItemToGift(item);
};

export const getGiftsByList = async (listId: string): Promise<Gift[]> => {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :listPK AND begins_with(SK, :giftPrefix)',
      ExpressionAttributeValues: {
        ':listPK': `LIST#${listId}`,
        ':giftPrefix': 'GIFT#',
      },
    })
  );

  return (result.Items as GiftItem[] || []).map(giftItemToGift);
};

export const getGiftById = async (giftId: string): Promise<Gift | null> => {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :giftPK',
      ExpressionAttributeValues: {
        ':giftPK': `GIFT#${giftId}`,
      },
    })
  );

  return result.Items && result.Items.length > 0
    ? giftItemToGift(result.Items[0] as GiftItem)
    : null;
};

export const updateGift = async (
  giftId: string,
  ownerId: string,
  request: UpdateGiftRequest
): Promise<Gift> => {
  const gift = await getGiftById(giftId);
  if (!gift) {
    throw new ApiError(ErrorCode.NOT_FOUND, 'Gift not found', 404);
  }

  const list = await getListById(gift.listId);
  if (!list || list.ownerId !== ownerId) {
    throw new ApiError(ErrorCode.FORBIDDEN, 'You do not have permission to update this gift', 403);
  }

  const now = new Date().toISOString();
  const updateExpression: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  if (request.title !== undefined) {
    updateExpression.push('#title = :title');
    expressionAttributeNames['#title'] = 'title';
    expressionAttributeValues[':title'] = request.title;
  }

  if (request.description !== undefined) {
    updateExpression.push('#description = :description');
    expressionAttributeNames['#description'] = 'description';
    expressionAttributeValues[':description'] = request.description;
  }

  if (request.url !== undefined) {
    updateExpression.push('#url = :url');
    expressionAttributeNames['#url'] = 'url';
    expressionAttributeValues[':url'] = request.url;
  }

  if (request.sortOrder !== undefined) {
    updateExpression.push('#sortOrder = :sortOrder');
    expressionAttributeNames['#sortOrder'] = 'sortOrder';
    expressionAttributeValues[':sortOrder'] = request.sortOrder;
  }

  updateExpression.push('#updatedAt = :updatedAt');
  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  expressionAttributeValues[':updatedAt'] = now;

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `LIST#${gift.listId}`,
        SK: `GIFT#${giftId}`,
      },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    })
  );

  return (await getGiftById(giftId))!;
};

export const deleteGift = async (giftId: string, ownerId: string): Promise<void> => {
  const gift = await getGiftById(giftId);
  if (!gift) {
    throw new ApiError(ErrorCode.NOT_FOUND, 'Gift not found', 404);
  }

  const list = await getListById(gift.listId);
  if (!list || list.ownerId !== ownerId) {
    throw new ApiError(ErrorCode.FORBIDDEN, 'You do not have permission to delete this gift', 403);
  }

  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `LIST#${gift.listId}`,
        SK: `GIFT#${giftId}`,
      },
    })
  );
};

export const claimGift = async (
  giftId: string,
  request: ClaimGiftRequest
): Promise<Gift> => {
  const gift = await getGiftById(giftId);
  if (!gift) {
    throw new ApiError(ErrorCode.NOT_FOUND, 'Gift not found', 404);
  }

  const now = new Date().toISOString();

  try {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `LIST#${gift.listId}`,
          SK: `GIFT#${giftId}`,
        },
        UpdateExpression:
          'SET #status = :claimed, #claimedBy = :claimedBy, #claimerMessage = :claimerMessage, #claimedAt = :claimedAt, #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#claimedBy': 'claimedBy',
          '#claimerMessage': 'claimerMessage',
          '#claimedAt': 'claimedAt',
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':claimed': 'claimed',
          ':claimedBy': request.claimedBy,
          ':claimerMessage': request.claimerMessage,
          ':claimedAt': now,
          ':updatedAt': now,
          ':available': 'available',
        },
        ConditionExpression: '#status = :available',
      })
    );
  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      throw new ApiError(
        ErrorCode.ALREADY_CLAIMED,
        'This gift has already been claimed',
        409
      );
    }
    throw error;
  }

  return (await getGiftById(giftId))!;
};

export const unclaimGift = async (giftId: string, ownerId: string): Promise<Gift> => {
  const gift = await getGiftById(giftId);
  if (!gift) {
    throw new ApiError(ErrorCode.NOT_FOUND, 'Gift not found', 404);
  }

  const list = await getListById(gift.listId);
  if (!list || list.ownerId !== ownerId) {
    throw new ApiError(ErrorCode.FORBIDDEN, 'You do not have permission to unclaim this gift', 403);
  }

  const now = new Date().toISOString();

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `LIST#${gift.listId}`,
        SK: `GIFT#${giftId}`,
      },
      UpdateExpression:
        'SET #status = :available, #updatedAt = :updatedAt REMOVE #claimedBy, #claimerMessage, #claimedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#claimedBy': 'claimedBy',
        '#claimerMessage': 'claimerMessage',
        '#claimedAt': 'claimedAt',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':available': 'available',
        ':updatedAt': now,
      },
    })
  );

  return (await getGiftById(giftId))!;
};
