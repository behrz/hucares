import type { User } from '@prisma/client';
export interface JWTPayload {
    userId: string;
    username: string;
    iat: number;
    exp: number;
}
export interface RegisterData {
    username: string;
    password: string;
    email?: string;
}
export interface LoginData {
    username: string;
    password: string;
}
export interface AuthResponse {
    user: {
        id: string;
        username: string;
        email: string | null;
        createdAt: Date;
        lastLoginAt: Date | null;
    };
    token: string;
    expiresIn: string;
}
export declare class AuthService {
    static generateToken(user: User): string;
    static verifyToken(token: string): JWTPayload;
    static hashPassword(password: string): Promise<string>;
    static comparePassword(password: string, hashedPassword: string): Promise<boolean>;
    static validatePassword(password: string): void;
    static validateUsername(username: string): void;
    static register(userData: RegisterData): Promise<AuthResponse>;
    static login(loginData: LoginData): Promise<AuthResponse>;
    static changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    static getUserByToken(token: string): Promise<User | null>;
    private static isValidEmail;
    static deactivateAccount(userId: string): Promise<void>;
}
export default AuthService;
//# sourceMappingURL=auth.d.ts.map