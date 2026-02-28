import { Request, Response, NextFunction } from 'express';
import jwt from "jsonwebtoken"
import { UserPayload } from '../utils/generateToken';


export const authorizeRoles = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ message: 'Missing Authorization Header' });

        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as UserPayload;

            if (!allowedRoles.includes(decoded.role)) {
                return res.sendStatus(403);
            }

            next();
        } catch (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }
    };
};