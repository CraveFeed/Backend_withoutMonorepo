import { NextFunction, Request, Response } from "express";
import pclient from "../db/client";

export const afterBusinessMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user.userId;
        const user = await pclient.user.findUnique({
            where: {
                id: userId,
                Type: 'BUSINESS'
            },
            include: {
                Restaurant: true
            }
        });
        if (!user) {
            res.status(401).json({ error: "User is not a registered business" });
            return Promise.resolve();
        }
        (req as any).restaurantID = user.Restaurant!.id;
        next();
        return Promise.resolve();
    } catch (err) {
        res.status(400).json({ error: err });
        return Promise.resolve();
    }
};
