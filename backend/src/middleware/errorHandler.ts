import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { sendError } from '../utils/apiResponse';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  logger.error(`Error on ${req.method} ${req.originalUrl}:`, err.message || err);

  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }));
    sendError(res, 'Validation failed for request data', 422, 'VALIDATION_ERROR', formattedErrors);
    return;
  }

  // AWS SDK specific errors
  if (err.name === 'AccessDenied' || err.name === 'AccessDeniedException') {
    sendError(
      res,
      'AWS access denied. Ensure your IAM role has the required read-only monitoring permissions.',
      403,
      'AWS_ACCESS_DENIED'
    );
    return;
  }

  if (err.name === 'InvalidParameterException' || err.name === 'ValidationError') {
    sendError(res, err.message || 'Invalid parameters supplied.', 400, 'INVALID_PARAMETER');
    return;
  }

  if (err.name === 'ThrottlingException' || err.name === 'RequestLimitExceeded') {
    sendError(res, 'AWS API rate limit exceeded. Please wait a moment and try again.', 429, 'AWS_THROTTLED');
    return;
  }

  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    sendError(res, 'Invalid or expired authentication token.', 401, 'UNAUTHORIZED');
    return;
  }

  // Generic internal server error
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'An unexpected internal error occurred';
  sendError(res, message, statusCode, 'INTERNAL_SERVER_ERROR');
}
