"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
async function main() {
    logger_1.logger.info('🌱 Starting database seed...');
    try {
        if (process.env.NODE_ENV === 'development') {
            logger_1.logger.info('🧹 Clearing existing data...');
            await prisma.checkIn.deleteMany();
            await prisma.weeklyGroupSummary.deleteMany();
            await prisma.groupMembership.deleteMany();
            await prisma.group.deleteMany();
            await prisma.user.deleteMany();
            logger_1.logger.info('✅ Existing data cleared');
        }
        logger_1.logger.info('👤 Creating sample users...');
        const hashedPassword = await bcryptjs_1.default.hash('password123', 12);
        const alice = await prisma.user.create({
            data: {
                username: 'alice',
                passwordHash: hashedPassword,
                email: 'alice@example.com',
            },
        });
        const bob = await prisma.user.create({
            data: {
                username: 'bob',
                passwordHash: hashedPassword,
                email: 'bob@example.com',
            },
        });
        const charlie = await prisma.user.create({
            data: {
                username: 'charlie',
                passwordHash: hashedPassword,
                email: 'charlie@example.com',
            },
        });
        const diana = await prisma.user.create({
            data: {
                username: 'diana',
                passwordHash: hashedPassword,
                email: 'diana@example.com',
            },
        });
        logger_1.logger.info(`✅ Created ${4} sample users`);
        logger_1.logger.info('👥 Creating sample groups...');
        const friendsGroup = await prisma.group.create({
            data: {
                name: 'Best Friends Forever',
                description: 'Our close-knit group of college friends staying connected!',
                accessCode: 'FRIEND24',
                createdBy: alice.id,
                maxMembers: 10,
            },
        });
        const workGroup = await prisma.group.create({
            data: {
                name: 'Work Wellness Warriors',
                description: 'Colleagues supporting each other in wellness journey',
                accessCode: 'WORK2024',
                createdBy: bob.id,
                maxMembers: 15,
            },
        });
        logger_1.logger.info(`✅ Created ${2} sample groups`);
        logger_1.logger.info('🤝 Creating group memberships...');
        await prisma.groupMembership.create({
            data: {
                userId: alice.id,
                groupId: friendsGroup.id,
                role: 'ADMIN',
            },
        });
        await prisma.groupMembership.create({
            data: {
                userId: bob.id,
                groupId: friendsGroup.id,
                role: 'MEMBER',
            },
        });
        await prisma.groupMembership.create({
            data: {
                userId: charlie.id,
                groupId: friendsGroup.id,
                role: 'MEMBER',
            },
        });
        await prisma.groupMembership.create({
            data: {
                userId: bob.id,
                groupId: workGroup.id,
                role: 'ADMIN',
            },
        });
        await prisma.groupMembership.create({
            data: {
                userId: diana.id,
                groupId: workGroup.id,
                role: 'MEMBER',
            },
        });
        logger_1.logger.info(`✅ Created group memberships`);
        logger_1.logger.info('📝 Creating sample check-ins...');
        const getCurrentWeekStart = () => {
            const now = new Date();
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            const weekStart = new Date(now.setDate(diff));
            weekStart.setHours(0, 0, 0, 0);
            return weekStart;
        };
        const weekStart = getCurrentWeekStart();
        const aliceCheckIn = await prisma.checkIn.create({
            data: {
                userId: alice.id,
                groupId: friendsGroup.id,
                weekStartDate: weekStart,
                productiveScore: 8,
                satisfiedScore: 7,
                bodyScore: 6,
                careScore: 9,
                huCaresScore: 8 + 7 + 6 - 9,
            },
        });
        const bobCheckIn = await prisma.checkIn.create({
            data: {
                userId: bob.id,
                groupId: friendsGroup.id,
                weekStartDate: weekStart,
                productiveScore: 9,
                satisfiedScore: 8,
                bodyScore: 7,
                careScore: 8,
                huCaresScore: 9 + 8 + 7 - 8,
            },
        });
        const charlieCheckIn = await prisma.checkIn.create({
            data: {
                userId: charlie.id,
                groupId: friendsGroup.id,
                weekStartDate: weekStart,
                productiveScore: 6,
                satisfiedScore: 9,
                bodyScore: 8,
                careScore: 7,
                huCaresScore: 6 + 9 + 8 - 7,
            },
        });
        await prisma.checkIn.create({
            data: {
                userId: bob.id,
                groupId: workGroup.id,
                weekStartDate: weekStart,
                productiveScore: 7,
                satisfiedScore: 6,
                bodyScore: 5,
                careScore: 6,
                huCaresScore: 7 + 6 + 5 - 6,
            },
        });
        await prisma.checkIn.create({
            data: {
                userId: diana.id,
                groupId: workGroup.id,
                weekStartDate: weekStart,
                productiveScore: 8,
                satisfiedScore: 7,
                bodyScore: 9,
                careScore: 8,
                huCaresScore: 8 + 7 + 9 - 8,
            },
        });
        logger_1.logger.info(`✅ Created ${5} sample check-ins`);
        logger_1.logger.info('📊 Creating weekly group summaries...');
        const friendsCheckIns = [aliceCheckIn, bobCheckIn, charlieCheckIn];
        const friendsAverage = friendsCheckIns.reduce((sum, checkIn) => sum + checkIn.huCaresScore, 0) / friendsCheckIns.length;
        const friendsScores = friendsCheckIns.map(checkIn => checkIn.huCaresScore);
        await prisma.weeklyGroupSummary.create({
            data: {
                groupId: friendsGroup.id,
                weekStartDate: weekStart,
                averageHuCaresScore: Math.round(friendsAverage * 100) / 100,
                totalCheckIns: friendsCheckIns.length,
                participationRate: (friendsCheckIns.length / 3) * 100,
                highestScore: Math.max(...friendsScores),
                lowestScore: Math.min(...friendsScores),
            },
        });
        logger_1.logger.info(`✅ Created weekly group summaries`);
        logger_1.logger.info('🎉 Database seed completed successfully!');
        logger_1.logger.info(`
📊 Seed Summary:
- 👤 Users: 4 (alice, bob, charlie, diana)
- 👥 Groups: 2 (Best Friends Forever, Work Wellness Warriors)
- 🤝 Memberships: 5 group memberships
- 📝 Check-ins: 5 check-ins for current week
- 📊 Summaries: 1 weekly group summary

🔐 All users have password: "password123"
🎯 Access codes: FRIEND24, WORK2024
    `);
    }
    catch (error) {
        logger_1.logger.error('❌ Error during database seed:', error);
        throw error;
    }
}
main()
    .catch((e) => {
    logger_1.logger.error('Fatal error during seed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map