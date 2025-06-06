"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("@/utils/logger");
const env_1 = require("@/config/env");
class DatabaseService extends client_1.PrismaClient {
    constructor() {
        super({
            log: [
                { level: 'query', emit: 'event' },
                { level: 'error', emit: 'stdout' },
                { level: 'warn', emit: 'stdout' },
            ],
            datasources: {
                db: {
                    url: env_1.env.DATABASE_URL,
                },
            },
        });
        if (env_1.env.NODE_ENV === 'development') {
        }
    }
    async testConnection() {
        try {
            await this.$queryRaw `SELECT 1`;
            logger_1.logger.info('✅ Database connection successful');
            return true;
        }
        catch (error) {
            logger_1.logger.error('❌ Database connection failed:', error);
            return false;
        }
    }
    async disconnect() {
        try {
            await this.$disconnect();
            logger_1.logger.info('🔌 Database disconnected successfully');
        }
        catch (error) {
            logger_1.logger.error('❌ Error disconnecting from database:', error);
        }
    }
    async healthCheck() {
        try {
            const start = Date.now();
            await this.$queryRaw `SELECT 1`;
            const duration = Date.now() - start;
            return {
                status: 'healthy',
                message: `Database responding in ${duration}ms`,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                timestamp: new Date().toISOString(),
            };
        }
    }
    getWeekStartDate(date = new Date()) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(d.setDate(diff));
        weekStart.setHours(0, 0, 0, 0);
        return weekStart;
    }
    calculateHuCaresScore(productive, satisfied, body, care) {
        return productive + satisfied + body - care;
    }
    async findUserByUsername(username) {
        return this.user.findUnique({
            where: { username },
            include: {
                groupMemberships: {
                    where: { isActive: true },
                    include: {
                        group: true,
                    },
                },
            },
        });
    }
    async findUserById(id) {
        return this.user.findUnique({
            where: { id },
            include: {
                groupMemberships: {
                    where: { isActive: true },
                    include: {
                        group: true,
                    },
                },
            },
        });
    }
    async findGroupByAccessCode(accessCode) {
        return this.group.findUnique({
            where: { accessCode },
            include: {
                creator: {
                    select: { id: true, username: true },
                },
                memberships: {
                    where: { isActive: true },
                    include: {
                        user: {
                            select: { id: true, username: true },
                        },
                    },
                },
            },
        });
    }
    async getUserCheckInsForWeek(userId, groupId, weekStartDate) {
        return this.checkIn.findFirst({
            where: {
                userId,
                groupId,
                weekStartDate,
            },
        });
    }
    async getGroupCheckInsForWeek(groupId, weekStartDate) {
        return this.checkIn.findMany({
            where: {
                groupId,
                weekStartDate,
            },
            include: {
                user: {
                    select: { id: true, username: true },
                },
            },
            orderBy: {
                submittedAt: 'desc',
            },
        });
    }
}
const db = new DatabaseService();
exports.db = db;
process.on('beforeExit', async () => {
    await db.disconnect();
});
exports.default = db;
//# sourceMappingURL=database.js.map