import { Request, Response } from 'express';
export declare const createGroupValidation: import("express-validator").ValidationChain[];
export declare const joinGroupValidation: import("express-validator").ValidationChain[];
export declare const updateGroupValidation: import("express-validator").ValidationChain[];
export declare const createGroup: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getUserGroups: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getGroup: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const joinGroup: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const updateGroup: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const leaveGroup: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getGroupMembers: (req: Request, res: Response, next: import("express").NextFunction) => void;
declare const _default: {
    createGroup: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getUserGroups: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getGroup: (req: Request, res: Response, next: import("express").NextFunction) => void;
    joinGroup: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateGroup: (req: Request, res: Response, next: import("express").NextFunction) => void;
    leaveGroup: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getGroupMembers: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
export default _default;
//# sourceMappingURL=groupController.d.ts.map