import { Request, Response, NextFunction } from 'express';
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const authenticateUser = (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        res.status(401).json({ error: "Access denied" });
        return Promise.resolve();
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET as string);
        (req as any).user = verified;
        next();
        return Promise.resolve();
    } catch (err) {
        res.status(400).json({ error: "Invalid token" });
        return Promise.resolve();
    }
};
