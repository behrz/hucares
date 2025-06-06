import { PrismaClient } from '@prisma/client';
declare let testDb: PrismaClient;
export { testDb };
export declare const testUtils: {
    createTestUser: (userData?: Partial<{
        username: string;
        email: string;
        password: string;
    }>) => Promise<{
        id: string;
        username: string;
        passwordHash: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        lastLoginAt: Date | null;
        isActive: boolean;
    }>;
    createTestGroup: (groupData?: Partial<{
        name: string;
        accessCode: string;
        createdBy: string;
    }>) => Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        name: string;
        description: string | null;
        accessCode: string;
        createdBy: string;
        maxMembers: number;
    }>;
    generateTestToken: (payload: {
        userId: string;
        username: string;
    }) => any;
    wait: (ms: number) => Promise<unknown>;
    mockRequest: (overrides?: any) => any;
    mockResponse: () => any;
    mockNext: () => jest.Mock<any, any, any>;
};
//# sourceMappingURL=setup.d.ts.map