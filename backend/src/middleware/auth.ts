import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { sendError } from '../utils/apiResponse';
import { AWSConnection } from '../models/AWSConnection';

interface JwtPayload {
  userId: string;
  email: string;
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Authentication token required.', 401, 'UNAUTHORIZED');
    return;
  }

  const token = authHeader.substring(7).trim();
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };
    next();
  } catch (error) {
    sendError(res, 'Invalid or expired authentication token.', 401, 'INVALID_TOKEN');
  }
}

/**
 * Validates that the requested AWS Connection belongs to the authenticated user.
 * Looks for connectionId in header 'x-aws-connection-id', query param 'connectionId', or route param 'id'
 */
export async function requireAWSConnection(req: Request, res: Response, next: NextFunction): Promise<void> {
  const connectionId =
    (req.headers['x-aws-connection-id'] as string) ||
    (req.query.connectionId as string) ||
    req.params.connectionId ||
    req.params.id;

  if (!connectionId) {
    sendError(res, 'Active AWS Connection ID is required (header x-aws-connection-id).', 400, 'CONNECTION_ID_REQUIRED');
    return;
  }

  if (!req.user) {
    sendError(res, 'Authentication required.', 401, 'UNAUTHORIZED');
    return;
  }

  try {
    const connection = await AWSConnection.findOne({
      _id: connectionId,
      userId: req.user.userId
    });

    if (!connection) {
      sendError(res, 'AWS connection not found or unauthorized for this user.', 404, 'CONNECTION_NOT_FOUND');
      return;
    }

    req.awsConnection = connection;
    next();
  } catch (err: any) {
    sendError(res, 'Invalid connection identifier.', 400, 'INVALID_CONNECTION_ID');
  }
}
