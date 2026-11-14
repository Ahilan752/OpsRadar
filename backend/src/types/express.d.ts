import { IAWSConnection } from '../models/AWSConnection';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
      awsConnection?: IAWSConnection;
    }
  }
}
export {};

