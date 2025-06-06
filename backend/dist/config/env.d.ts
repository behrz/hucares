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
export declare const env: EnvironmentConfig;
export declare const validateEnvironment: () => void;
export default env;
//# sourceMappingURL=env.d.ts.map