import { config } from 'dotenv';

export default async (): Promise<void> => {
  // Load test environment variables
  config({ path: '.env.test' });
  
  // Set global test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.BCRYPT_SALT_ROUNDS = '4'; // Faster for tests
  
  console.log('🧪 Global test setup completed');
}; 