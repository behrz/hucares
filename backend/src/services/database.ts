import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';
import { env } from '@/config/env';

// Extend PrismaClient for custom logging
class DatabaseService extends PrismaClient {
  constructor() {
    super({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
      datasources: {
        db: {
          url: env.DATABASE_URL,
        },
      },
    });

    // Log database queries in development
    if (env.NODE_ENV === 'development') {
      // Note: Query logging disabled due to type issues - can be re-enabled with proper typing
      // this.$on('query', (e: any) => {
      //   logger.debug('Database Query:', {
      //     query: e.query,
      //     params: e.params,
      //     duration: `${e.duration}ms`,
      //     target: e.target,
      //   });
      // });
    }
  }

  // Test database connection
  async testConnection(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      logger.info('✅ Database connection successful');
      return true;
    } catch (error) {
      logger.error('❌ Database connection failed:', error);
      return false;
    }
  }

  // Graceful disconnect
  async disconnect(): Promise<void> {
    try {
      await this.$disconnect();
      logger.info('🔌 Database disconnected successfully');
    } catch (error) {
      logger.error('❌ Error disconnecting from database:', error);
    }
  }

  // Health check for monitoring
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    message: string;
    timestamp: string;
  }> {
    try {
      const start = Date.now();
      await this.$queryRaw`SELECT 1`;
      const duration = Date.now() - start;

      return {
        status: 'healthy',
        message: `Database responding in ${duration}ms`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Utility method to get week start date (Monday)
  getWeekStartDate(date: Date = new Date()): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
    const weekStart = new Date(d.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  // Calculate HuCares score
  calculateHuCaresScore(
    productive: number,
    satisfied: number,
    body: number,
    care: number,
  ): number {
    return productive + satisfied + body - care;
  }

  // User methods
  async findUserByUsername(username: string) {
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

  async findUserById(id: string) {
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

  // Group methods
  async findGroupByAccessCode(accessCode: string) {
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

  // Check-in methods
  async getUserCheckInsForWeek(userId: string, groupId: string, weekStartDate: Date) {
    return this.checkIn.findFirst({
      where: {
        userId,
        groupId,
        weekStartDate,
      },
    });
  }

  async getGroupCheckInsForWeek(groupId: string, weekStartDate: Date) {
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

// Create singleton instance
const db = new DatabaseService();

// Graceful shutdown
process.on('beforeExit', async () => {
  await db.disconnect();
});

export { db };
export default db; 