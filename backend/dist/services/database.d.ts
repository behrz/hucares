import { PrismaClient } from '@prisma/client';
declare class DatabaseService extends PrismaClient {
    constructor();
    testConnection(): Promise<boolean>;
    disconnect(): Promise<void>;
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        message: string;
        timestamp: string;
    }>;
    getWeekStartDate(date?: Date): Date;
    calculateHuCaresScore(productive: number, satisfied: number, body: number, care: number): number;
    findUserByUsername(username: string): Promise<({
        groupMemberships: ({
            group: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                isActive: boolean;
                name: string;
                description: string | null;
                accessCode: string;
                createdBy: string;
                maxMembers: number;
            };
        } & {
            id: string;
            isActive: boolean;
            userId: string;
            groupId: string;
            joinedAt: Date;
            role: import(".prisma/client").$Enums.Role;
        })[];
    } & {
        id: string;
        username: string;
        passwordHash: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        lastLoginAt: Date | null;
        isActive: boolean;
    }) | null>;
    findUserById(id: string): Promise<({
        groupMemberships: ({
            group: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                isActive: boolean;
                name: string;
                description: string | null;
                accessCode: string;
                createdBy: string;
                maxMembers: number;
            };
        } & {
            id: string;
            isActive: boolean;
            userId: string;
            groupId: string;
            joinedAt: Date;
            role: import(".prisma/client").$Enums.Role;
        })[];
    } & {
        id: string;
        username: string;
        passwordHash: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        lastLoginAt: Date | null;
        isActive: boolean;
    }) | null>;
    findGroupByAccessCode(accessCode: string): Promise<({
        creator: {
            id: string;
            username: string;
        };
        memberships: ({
            user: {
                id: string;
                username: string;
            };
        } & {
            id: string;
            isActive: boolean;
            userId: string;
            groupId: string;
            joinedAt: Date;
            role: import(".prisma/client").$Enums.Role;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        name: string;
        description: string | null;
        accessCode: string;
        createdBy: string;
        maxMembers: number;
    }) | null>;
    getUserCheckInsForWeek(userId: string, groupId: string, weekStartDate: Date): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        groupId: string;
        weekStartDate: Date;
        productiveScore: number;
        satisfiedScore: number;
        bodyScore: number;
        careScore: number;
        huCaresScore: number;
        submittedAt: Date;
    } | null>;
    getGroupCheckInsForWeek(groupId: string, weekStartDate: Date): Promise<({
        user: {
            id: string;
            username: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        groupId: string;
        weekStartDate: Date;
        productiveScore: number;
        satisfiedScore: number;
        bodyScore: number;
        careScore: number;
        huCaresScore: number;
        submittedAt: Date;
    })[]>;
}
declare const db: DatabaseService;
export { db };
export default db;
//# sourceMappingURL=database.d.ts.map