"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = require("@/middleware/auth");
const groupController_1 = require("@/controllers/groupController");
const router = (0, express_1.Router)();
const groupLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        error: 'TooManyRequests',
        message: 'Too many group requests, please try again later.',
        timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const strictGroupLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: {
        error: 'TooManyRequests',
        message: 'Too many group creation/join attempts, please try again later.',
        timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
});
router.use(auth_1.authenticateToken);
router.post('/', strictGroupLimiter, groupController_1.createGroupValidation, groupController_1.createGroup);
router.post('/join', strictGroupLimiter, groupController_1.joinGroupValidation, groupController_1.joinGroup);
router.get('/health', (req, res) => {
    res.status(200).json({
        service: 'Group Management Service',
        status: 'healthy',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        features: {
            createGroup: 'enabled',
            joinGroup: 'enabled',
            groupListing: 'enabled',
            groupManagement: 'enabled',
            memberManagement: 'enabled',
        },
    });
});
exports.default = router;
//# sourceMappingURL=groups.js.map