import { Request, Response, NextFunction } from 'express';
import { AWSConnectionService } from '../services/awsConnection.service';
import { initiateConnectionSchema, completeConnectionSchema } from '../validators/aws.validator';
import { sendSuccess } from '../utils/apiResponse';

export class AWSConnectionController {
  static async initiate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = initiateConnectionSchema.parse(req.body);
      const result = await AWSConnectionService.initiateConnection(
        req.user!.userId,
        validated.accountName,
        validated.defaultRegion
      );
      sendSuccess(res, result, 'AWS connection initiation instructions generated', 201);
    } catch (error) {
      next(error);
    }
  }

  static async complete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = completeConnectionSchema.parse(req.body);
      const connection = await AWSConnectionService.completeConnection(
        req.user!.userId,
        validated.connectionId,
        validated.accountId,
        validated.roleArn,
        validated.defaultRegion
      );
      sendSuccess(res, connection, 'AWS account connected successfully');
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const connections = await AWSConnectionService.listConnections(req.user!.userId);
      sendSuccess(res, connections, 'AWS connections retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const connection = await AWSConnectionService.getConnection(req.user!.userId, req.params.id);
      sendSuccess(res, connection, 'AWS connection retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AWSConnectionService.deleteConnection(req.user!.userId, req.params.id);
      sendSuccess(res, null, 'AWS connection disconnected and removed');
    } catch (error) {
      next(error);
    }
  }

  static async getRegions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const regions = await AWSConnectionService.getRegions(req.awsConnection!);
      sendSuccess(res, { regions }, 'AWS regions retrieved');
    } catch (error) {
      next(error);
    }
  }
}
