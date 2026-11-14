import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { config } from './config/environment';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';
import awsConnectionRoutes from './routes/awsConnection.routes';
import monitoringRoutes from './routes/monitoring.routes';
import dashboardRoutes from './routes/dashboard.routes';
import notificationRoutes from './routes/notification.routes';

const app: Express = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-aws-connection-id']
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this client, please try again later.',
    error: { code: 'RATE_LIMIT_EXCEEDED' }
  }
});
app.use('/api/', limiter);

// Logging & Body parsing
if (config.env !== 'test') {
  app.use(morgan('combined'));
}
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static CloudFormation templates for easy 1-click customer download
app.use('/cloudformation', express.static(path.resolve(__dirname, '../../cloudformation')));

// Base Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'OpsRadar API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Primary REST Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/aws/connections', awsConnectionRoutes);
app.use('/api/aws', monitoringRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);

// Global Error Handler
app.use(errorHandler);

export { app };
