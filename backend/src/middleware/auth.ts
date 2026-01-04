import { APIGatewayProxyEvent } from 'aws-lambda';
import { ApiError, ErrorCode } from '../types';

interface DecodedToken {
  sub: string;
  email?: string;
  'cognito:username'?: string;
}

export const getUserIdFromEvent = (event: APIGatewayProxyEvent): string => {
  // In API Gateway with Cognito authorizer, the claims are in requestContext.authorizer.claims
  const claims = event.requestContext?.authorizer?.claims as DecodedToken | undefined;

  if (!claims?.sub) {
    throw new ApiError(ErrorCode.UNAUTHORIZED, 'Unauthorized', 401);
  }

  return claims.sub;
};

export const parseBody = <T>(event: APIGatewayProxyEvent): T => {
  if (!event.body) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, 'Request body is required', 400);
  }

  try {
    return JSON.parse(event.body);
  } catch (error) {
    throw new ApiError(ErrorCode.VALIDATION_ERROR, 'Invalid JSON in request body', 400);
  }
};
