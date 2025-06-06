"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnvironment = exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const getEnvVar = (name, defaultValue) => {
    const value = process.env[name] || defaultValue;
    if (!value) {
        throw new Error(`Environment variable ${name} is required`);
    }
    return value;
};
const getEnvVarAsNumber = (name, defaultValue) => {
    const value = process.env[name];
    if (value) {
        const parsed = parseInt(value, 10);
        if (isNaN(parsed)) {
            throw new Error(`Environment variable ${name} must be a valid number`);
        }
        return parsed;
    }
    if (defaultValue !== undefined) {
        return defaultValue;
    }
    throw new Error(`Environment variable ${name} is required`);
};
exports.env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: getEnvVarAsNumber('PORT', 3001),
    DATABASE_URL: getEnvVar('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/hucares_dev'),
    JWT_SECRET: getEnvVar('JWT_SECRET', 'your-super-secret-jwt-key-change-in-production'),
    JWT_EXPIRES_IN: getEnvVar('JWT_EXPIRES_IN', '7d'),
    CORS_ORIGIN: getEnvVar('CORS_ORIGIN', 'http://localhost:3000'),
    REDIS_URL: process.env.REDIS_URL,
    RATE_LIMIT_WINDOW_MS: getEnvVarAsNumber('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    RATE_LIMIT_MAX_REQUESTS: getEnvVarAsNumber('RATE_LIMIT_MAX_REQUESTS', 100),
    BCRYPT_SALT_ROUNDS: getEnvVarAsNumber('BCRYPT_SALT_ROUNDS', 12),
};
const validateEnvironment = () => {
    console.log('🔧 Validating environment configuration...');
    if (!['development', 'production', 'test'].includes(exports.env.NODE_ENV)) {
        throw new Error('NODE_ENV must be one of: development, production, test');
    }
    if (exports.env.PORT < 1 || exports.env.PORT > 65535) {
        throw new Error('PORT must be between 1 and 65535');
    }
    if (!exports.env.DATABASE_URL.startsWith('postgresql://')) {
        throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
    }
    if (exports.env.NODE_ENV === 'production' && exports.env.JWT_SECRET.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters long in production');
    }
    if (exports.env.BCRYPT_SALT_ROUNDS < 10 || exports.env.BCRYPT_SALT_ROUNDS > 15) {
        throw new Error('BCRYPT_SALT_ROUNDS must be between 10 and 15');
    }
    console.log('✅ Environment configuration is valid');
    console.log(`📍 Running in ${exports.env.NODE_ENV} mode on port ${exports.env.PORT}`);
};
exports.validateEnvironment = validateEnvironment;
exports.default = exports.env;
//# sourceMappingURL=env.js.map