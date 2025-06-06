"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.testUtils = exports.testDb = void 0;
const globals_1 = require("@jest/globals");
const client_1 = require("@prisma/client");
let testDb;
const originalConsole = { ...console };
(0, globals_1.beforeAll)(async () => {
    if (process.env.TEST_SILENT !== 'false') {
        console.log = jest.fn();
        console.info = jest.fn();
        console.warn = jest.fn();
        console.error = originalConsole.error;
    }
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/hucares_test';
    process.env.BCRYPT_SALT_ROUNDS = '4';
    exports.testDb = testDb = new client_1.PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
    });
});
(0, globals_1.beforeEach)(async () => {
    if (testDb) {
        try {
            await testDb.checkIn.deleteMany();
            await testDb.weeklyGroupSummary.deleteMany();
            await testDb.groupMembership.deleteMany();
            await testDb.group.deleteMany();
            await testDb.user.deleteMany();
        }
        catch (error) {
            console.warn('Test database cleanup failed:', error);
        }
    }
});
(0, globals_1.afterEach)(async () => {
    jest.clearAllMocks();
});
(0, globals_1.afterAll)(async () => {
    if (process.env.TEST_SILENT !== 'false') {
        Object.assign(console, originalConsole);
    }
    if (testDb) {
        await testDb.$disconnect();
    }
});
exports.testUtils = {
    createTestUser: async (userData) => {
        const bcrypt = await Promise.resolve().then(() => __importStar(require('bcryptjs')));
        const hashedPassword = await bcrypt.hash(userData?.password || 'Test123!', 4);
        return testDb?.user.create({
            data: {
                username: userData?.username || 'testuser',
                passwordHash: hashedPassword,
                email: userData?.email || 'test@example.com',
            },
        });
    },
    createTestGroup: async (groupData) => {
        return testDb?.group.create({
            data: {
                name: groupData?.name || 'Test Group',
                accessCode: groupData?.accessCode || 'TEST123',
                createdBy: groupData?.createdBy || 'test-user-id',
            },
        });
    },
    generateTestToken: (payload) => {
        const jwt = require('jsonwebtoken');
        return jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '1h',
            issuer: 'hucares-api',
            audience: 'hucares-app',
        });
    },
    wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    mockRequest: (overrides = {}) => ({
        body: {},
        params: {},
        query: {},
        headers: {},
        user: undefined,
        ...overrides,
    }),
    mockResponse: () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        res.send = jest.fn().mockReturnValue(res);
        return res;
    },
    mockNext: () => jest.fn(),
};
//# sourceMappingURL=setup.js.map