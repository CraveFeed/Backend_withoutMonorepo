import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pclient from "../db/client";
import { Request, Response } from 'express';
import { UserType } from "@prisma/client"
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;

export const register = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, username, password, firstName, lastName, userType, Sweetness,  Spiciness,  Dish, Sourness } = req.body;

        const existingUser = await pclient.user.findFirst({
            where: { OR: [{ email }, { username }] }
        });

        if (existingUser) {
            return res.status(400).json({ error: "Email or Username already taken" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await pclient.user.create({
            data: {
                email,
                username,
                password: hashedPassword,
                firstName,
                lastName,
                Type: userType as UserType,
                Sweetness,
                Spiciness,
                Dish,
                Sourness
            }
        });
        res.status(201).json({ message: "User registered successfully", user });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

export const login = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, password } = req.body;
        const user = await pclient.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(400).json({ error: "Invalid email or password" });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: "Invalid email or password" });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        });

        res.json({ message: "Login successful", token });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};
