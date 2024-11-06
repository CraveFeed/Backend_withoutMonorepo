import { Request, Response } from 'express';
import dotenv from "dotenv";

dotenv.config();

export const register = async (req: Request, res: Response): Promise<any> => {
    try {

    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};
