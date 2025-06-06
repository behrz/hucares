"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = require("@/middleware/auth");
const checkinController_1 = require("@/controllers/checkinController");
const router = (0, express_1.Router)();
const checkinLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: {
        error: 'TooManyRequests',
        message: 'Too many check-in requests, please try again later.',
        timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
});
router.use(auth_1.authenticateToken);
router.post('/', checkinController_1.submitCheckinValidation, checkinController_1.submitCheckin);
router.get('/', checkinController_1.getCheckinValidation, checkinController_1.getUserCheckins);
router.get('/current', checkinController_1.getCurrentWeekCheckins);
router.get('/group/:id', checkinController_1.getGroupCheckins);
exports.default = router;
//# sourceMappingURL=checkins.js.map