import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Constants
const CONSTANTS = {
  PASSWORD: {
    MIN_LENGTH: 4,
    MAX_LENGTH: 4,
  },
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
  },
  JWT: {
    MIN_SECRET_LENGTH: 32,
  },
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },
  BCRYPT: {
    MIN_SALT_ROUNDS: 10,
    MAX_SALT_ROUNDS: 15,
    DEFAULT_SALT_ROUNDS: 12,
  },
  PORT: {
    MIN: 1,
    MAX: 65535,
    DEFAULT: 3002,
  },
} as const;

interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  CORS_ORIGIN: string;
  REDIS_URL: string | undefined;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  BCRYPT_SALT_ROUNDS: number;
}

const getEnvVar = (name: string, defaultValue?: string): string => {
  const value = process.env[name] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value;
};

const getEnvVarAsNumber = (name: string, defaultValue?: number): number => {
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

// Validate required environment variables
export const env: EnvironmentConfig = {
  NODE_ENV: (process.env.NODE_ENV as EnvironmentConfig['NODE_ENV']) || 'development',
  PORT: getEnvVarAsNumber('PORT', CONSTANTS.PORT.DEFAULT),
  DATABASE_URL: getEnvVar('DATABASE_URL', 'file:./dev.db'),
  JWT_SECRET: process.env.NODE_ENV === 'production' 
    ? getEnvVar('JWT_SECRET') // No default in production
    : getEnvVar('JWT_SECRET', 'dev-only-secret-change-in-production'),
  JWT_EXPIRES_IN: getEnvVar('JWT_EXPIRES_IN', '7d'),
  CORS_ORIGIN: getEnvVar('CORS_ORIGIN', 'http://localhost:3000'),
  REDIS_URL: process.env.REDIS_URL,
  RATE_LIMIT_WINDOW_MS: getEnvVarAsNumber('RATE_LIMIT_WINDOW_MS', CONSTANTS.RATE_LIMIT.WINDOW_MS),
  RATE_LIMIT_MAX_REQUESTS: getEnvVarAsNumber('RATE_LIMIT_MAX_REQUESTS', CONSTANTS.RATE_LIMIT.MAX_REQUESTS),
  BCRYPT_SALT_ROUNDS: getEnvVarAsNumber('BCRYPT_SALT_ROUNDS', CONSTANTS.BCRYPT.DEFAULT_SALT_ROUNDS),
};

// Validate environment on startup
export const validateEnvironment = (): void => {
  console.log('🔧 Validating environment configuration...');
  
  // Validate NODE_ENV
  if (!['development', 'production', 'test'].includes(env.NODE_ENV)) {
    throw new Error('NODE_ENV must be one of: development, production, test');
  }

  // Validate PORT
  if (env.PORT < CONSTANTS.PORT.MIN || env.PORT > CONSTANTS.PORT.MAX) {
    throw new Error(`PORT must be between ${CONSTANTS.PORT.MIN} and ${CONSTANTS.PORT.MAX}`);
  }

  // Validate DATABASE_URL format (support both PostgreSQL and SQLite)
  const isPostgreSQL = env.DATABASE_URL.startsWith('postgresql://');
  const isSQLite = env.DATABASE_URL.startsWith('file:');
  
  if (!isPostgreSQL && !isSQLite) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string (postgresql://) or SQLite file path (file:)');
  }

  // Validate JWT_SECRET length in production
  if (env.NODE_ENV === 'production' && env.JWT_SECRET.length < CONSTANTS.JWT.MIN_SECRET_LENGTH) {
    throw new Error('JWT_SECRET must be at least 32 characters long in production');
  }

  // Validate BCRYPT_SALT_ROUNDS
  if (env.BCRYPT_SALT_ROUNDS < CONSTANTS.BCRYPT.MIN_SALT_ROUNDS || env.BCRYPT_SALT_ROUNDS > CONSTANTS.BCRYPT.MAX_SALT_ROUNDS) {
    throw new Error('BCRYPT_SALT_ROUNDS must be between 10 and 15');
  }

  console.log('✅ Environment configuration is valid');
  console.log(`📍 Running in ${env.NODE_ENV} mode on port ${env.PORT}`);
};

export { CONSTANTS };
export default env; 