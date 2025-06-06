import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { validateEnvironment, env } from '@/config/env';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/middleware/errorHandler';
import authRoutes from '@/routes/auth';
import groupRoutes from '@/routes/groups';
import checkinRoutes from '@/routes/checkins';

// Validate environment before starting
validateEnvironment();

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: env.NODE_ENV === 'production' 
    ? env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : [env.CORS_ORIGIN, 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200, // For legacy browser support
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'HuCares Backend is running smoothly! 🚀',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    version: '1.0.0',
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/checkins', checkinRoutes);

app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'Welcome to HuCares API! 🌟',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/health',
    endpoints: {
      authentication: '/api/auth',
      groups: '/api/groups',
      checkins: '/api/checkins',
      health: '/health',
    },
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use(errorHandler);

// Server instance variable
let server: any = null;

// Graceful shutdown handling
const gracefulShutdown = (signal: string): void => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  } else {
    logger.info('No server to close');
    process.exit(0);
  }

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = (): void => {
  try {
    server = app.listen(env.PORT, () => {
      logger.info(`🚀 HuCares Backend started successfully!`);
      logger.info(`📍 Server running on port ${env.PORT}`);
      logger.info(`🌍 Environment: ${env.NODE_ENV}`);
      logger.info(`🔗 Health check: http://localhost:${env.PORT}/health`);
      logger.info(`📡 API endpoint: http://localhost:${env.PORT}/api`);
    });

    server.on('error', (error: Error) => {
      logger.error('Server startup error:', error);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app; 