import { APIGatewayProxyResult } from 'aws-lambda';
import { ApiError } from '../types';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Content-Type': 'application/json',
};

export const successResponse = (
  data: any,
  statusCode: number = 200
): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(data),
  };
};

export const errorResponse = (
  error: Error | ApiError,
  requestId: string = 'unknown'
): APIGatewayProxyResult => {
  console.error('Error:', error);

  if (error instanceof ApiError) {
    return {
      statusCode: error.statusCode,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          requestId,
        },
      }),
    };
  }

  return {
    statusCode: 500,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        requestId,
      },
    }),
  };
};
