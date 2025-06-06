import { Request, Response } from 'express';
export declare const submitCheckinValidation: import("express-validator").ValidationChain[];
export declare const getCheckinValidation: import("express-validator").ValidationChain[];
export declare const submitCheckin: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getUserCheckins: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getGroupCheckins: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getCurrentWeekCheckins: (req: Request, res: Response, next: import("express").NextFunction) => void;
declare const _default: {
    submitCheckin: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getUserCheckins: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getGroupCheckins: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getCurrentWeekCheckins: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
export default _default;
//# sourceMappingURL=checkinController.d.ts.map