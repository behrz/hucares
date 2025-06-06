import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                username: string;
                email: string | null;
                isActive: boolean;
            };
        }
    }
}
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (role: "ADMIN") => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validateRefreshToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
declare const _default: {
    authenticateToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    requireRole: (role: "ADMIN") => (req: Request, res: Response, next: NextFunction) => Promise<void>;
    validateRefreshToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
};
export default _default;
//# sourceMappingURL=auth.d.ts.map