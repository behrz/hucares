"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
exports.default = async () => {
    (0, dotenv_1.config)({ path: '.env.test' });
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
    process.env.BCRYPT_SALT_ROUNDS = '4';
    console.log('🧪 Global test setup completed');
};
//# sourceMappingURL=globalSetup.js.map