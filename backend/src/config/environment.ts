import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/opsradar',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-super-secret-jwt-signing-key-opsradar-2026',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-super-secret-refresh-key-opsradar-2026',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    backendAccountId: process.env.AWS_BACKEND_ACCOUNT_ID || '111122223333',
    backendRoleArn: process.env.AWS_BACKEND_ROLE_ARN || 'arn:aws:iam::111122223333:role/OpsRadarBackendExecutionRole',
    stsSessionDurationSeconds: parseInt(process.env.AWS_STS_SESSION_DURATION || '900', 10) // 15 mins
  },
  security: {
    // 32-byte key for AES-256-GCM encryption of sensitive metadata at rest
    encryptionKey: process.env.METADATA_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    bcryptRounds: 12,
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '200', 10),
    rateLimitWindowMs: 15 * 60 * 1000 // 15 minutes
  }
};
