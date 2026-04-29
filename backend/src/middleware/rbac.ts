import { Request, Response, NextFunction } from 'express';
import jwt from "jsonwebtoken"
import { UserPayload } from '../utils/generateToken';


export const authorizeRoles = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const jwtToken = req.cookies.jwtToken;
        if (!jwtToken) return res.status(401).json({ message: 'Missing JWT Token' });

        try {
            const decoded = jwt.verify(jwtToken, process.env.ACCESS_TOKEN_SECRET!) as UserPayload;

            if (!allowedRoles.includes(decoded.role)) {
                return res.sendStatus(403);
            }

            next();
        } catch (err) {
            return res.status(401).json({ message: 'Invalid JWT token' });
        }
    };
};