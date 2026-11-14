import mongoose from 'mongoose';
import { config } from './environment';
import { logger } from '../utils/logger';

export async function connectDatabase(): Promise<void> {
  if (!config.mongoUri || config.mongoUri.includes('localhost') && config.env === 'production') {
    logger.warn('No remote MONGODB_URI provided in production. Database operations will wait for connection.');
  }

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
    logger.info('Connected to MongoDB database successfully.');
  } catch (error: any) {
    logger.error(`MongoDB connection issue (${error.message || error}). The server will stay online and retry.`);
  }

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB connection lost. Reconnecting...');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error', err);
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('Disconnected from MongoDB.');
}

