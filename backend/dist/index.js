"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("@/config/env");
const logger_1 = require("@/utils/logger");
const errorHandler_1 = require("@/middleware/errorHandler");
const auth_1 = __importDefault(require("@/routes/auth"));
const groups_1 = __importDefault(require("@/routes/groups"));
const checkins_1 = __importDefault(require("@/routes/checkins"));
(0, env_1.validateEnvironment)();
const app = (0, express_1.default)();
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
app.use((0, cors_1.default)({
    origin: env_1.env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.env.RATE_LIMIT_WINDOW_MS,
    max: env_1.env.RATE_LIMIT_MAX_REQUESTS,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((req, res, next) => {
    logger_1.logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
    });
    next();
});
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'HuCares Backend is running smoothly! 🚀',
        timestamp: new Date().toISOString(),
        environment: env_1.env.NODE_ENV,
        version: '1.0.0',
        uptime: process.uptime(),
    });
});
app.use('/api/auth', auth_1.default);
app.use('/api/groups', groups_1.default);
app.use('/api/checkins', checkins_1.default);
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
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString(),
    });
});
app.use(errorHandler_1.errorHandler);
const gracefulShutdown = (signal) => {
    logger_1.logger.info(`Received ${signal}. Starting graceful shutdown...`);
    const server = app.listen(env_1.env.PORT);
    server.close(() => {
        logger_1.logger.info('HTTP server closed');
        process.exit(0);
    });
    setTimeout(() => {
        logger_1.logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
const startServer = () => {
    try {
        const server = app.listen(env_1.env.PORT, () => {
            logger_1.logger.info(`🚀 HuCares Backend started successfully!`);
            logger_1.logger.info(`📍 Server running on port ${env_1.env.PORT}`);
            logger_1.logger.info(`🌍 Environment: ${env_1.env.NODE_ENV}`);
            logger_1.logger.info(`🔗 Health check: http://localhost:${env_1.env.PORT}/health`);
            logger_1.logger.info(`📡 API endpoint: http://localhost:${env_1.env.PORT}/api`);
        });
        server.on('error', (error) => {
            logger_1.logger.error('Server startup error:', error);
            process.exit(1);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
exports.default = app;
//# sourceMappingURL=index.js.map