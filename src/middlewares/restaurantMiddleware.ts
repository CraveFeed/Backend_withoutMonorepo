import {NextFunction, Request, Response} from "express";
import pclient from "../db/client";

const checkBusinessOwner = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user.userId;
        const user = await pclient.user.findUnique({
            where: {
                id: userId,
                Type: 'BUSINESS'
            },
        });
        if (!user) {
            res.status(401).json({ error: "User is not a registered as business" });
            return Promise.resolve();
        }
        next();
        return Promise.resolve();
    } catch (err) {
        res.status(400).json({ error: err });
        return Promise.resolve();
    }
};

export default checkBusinessOwner;