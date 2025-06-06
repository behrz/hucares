"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = require("@/middleware/auth");
const authController_1 = require("@/controllers/authController");
const router = (0, express_1.Router)();
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        error: 'TooManyRequests',
        message: 'Too many authentication attempts, please try again later.',
        timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const strictAuthLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: {
        error: 'TooManyRequests',
        message: 'Too many attempts, please try again later.',
        timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
});
router.post('/register', authLimiter, authController_1.registerValidation, authController_1.register);
router.post('/login', authLimiter, authController_1.loginValidation, authController_1.login);
router.get('/me', auth_1.authenticateToken, authController_1.getProfile);
router.put('/change-password', strictAuthLimiter, auth_1.authenticateToken, authController_1.changePasswordValidation, authController_1.changePassword);
router.post('/logout', auth_1.authenticateToken, authController_1.logout);
router.delete('/account', strictAuthLimiter, auth_1.authenticateToken, authController_1.deactivateAccount);
router.get('/verify', auth_1.authenticateToken, (req, res) => {
    res.status(200).json({
        valid: true,
        user: {
            id: req.user?.id,
            username: req.user?.username,
            email: req.user?.email,
        },
        timestamp: new Date().toISOString(),
    });
});
router.get('/health', (req, res) => {
    res.status(200).json({
        service: 'Authentication Service',
        status: 'healthy',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        features: {
            registration: 'enabled',
            login: 'enabled',
            passwordChange: 'enabled',
            accountDeactivation: 'enabled',
            rateLimiting: 'enabled',
        },
    });
});
exports.default = router;
//# sourceMappingURL=auth.js.map