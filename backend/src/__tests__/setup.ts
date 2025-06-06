import { beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

// Test database instance
let testDb: PrismaClient;

// Mock console methods to keep test output clean
const originalConsole = { ...console };

beforeAll(async () => {
  // Quiet console logs during tests (optional)
  if (process.env.TEST_SILENT !== 'false') {
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = originalConsole.error; // Keep errors visible
  }

  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/hucares_test';
  process.env.BCRYPT_SALT_ROUNDS = '4'; // Faster hashing for tests

  // Initialize test database
  testDb = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
});

beforeEach(async () => {
  // Clean database before each test
  if (testDb) {
    try {
      // Delete in reverse order of dependencies
      await testDb.checkIn.deleteMany();
      await testDb.weeklyGroupSummary.deleteMany();
      await testDb.groupMembership.deleteMany();
      await testDb.group.deleteMany();
      await testDb.user.deleteMany();
    } catch (error) {
      // Database might not be available in CI/CD - that's ok
      console.warn('Test database cleanup failed:', error);
    }
  }
});

afterEach(async () => {
  // Additional cleanup if needed
  jest.clearAllMocks();
});

afterAll(async () => {
  // Restore console
  if (process.env.TEST_SILENT !== 'false') {
    Object.assign(console, originalConsole);
  }

  // Disconnect from test database
  if (testDb) {
    await testDb.$disconnect();
  }
});

// Export test database for use in tests
export { testDb };

// Test utilities
export const testUtils = {
  // Create test user
  createTestUser: async (userData?: Partial<{
    username: string;
    email: string;
    password: string;
  }>) => {
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(userData?.password || 'Test123!', 4);

    return testDb?.user.create({
      data: {
        username: userData?.username || 'testuser',
        passwordHash: hashedPassword,
        email: userData?.email || 'test@example.com',
      },
    });
  },

  // Create test group
  createTestGroup: async (groupData?: Partial<{
    name: string;
    accessCode: string;
    createdBy: string;
  }>) => {
    return testDb?.group.create({
      data: {
        name: groupData?.name || 'Test Group',
        accessCode: groupData?.accessCode || 'TEST123',
        createdBy: groupData?.createdBy || 'test-user-id',
      },
    });
  },

  // Generate JWT token for testing
  generateTestToken: (payload: { userId: string; username: string }) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1h',
      issuer: 'hucares-api',
      audience: 'hucares-app',
    });
  },

  // Wait for a specified time (useful for rate limiting tests)
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Mock request object
  mockRequest: (overrides: any = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    user: undefined,
    ...overrides,
  }),

  // Mock response object
  mockResponse: () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  },

  // Mock next function
  mockNext: () => jest.fn(),
}; 