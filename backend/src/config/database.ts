import mongoose from 'mongoose';
import { config } from './environment';
import { logger } from '../utils/logger';

export async function connectDatabase(): Promise<void> {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongoUri);
    logger.info('Connected to MongoDB database successfully.');
  } catch (error) {
    logger.error('Failed to connect to MongoDB', error);
    // Don't crash immediately in dev/test mode; retry or continue
    if (config.env === 'production') {
      process.exit(1);
    }
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
