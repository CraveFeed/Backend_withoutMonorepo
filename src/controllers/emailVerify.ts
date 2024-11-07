import { Request, Response } from 'express';
import dotenv from "dotenv";
import transporter from "../loaders/nodemailer/transporter";
import pclient from "../db/client";
import RedisClient from "../loaders/redis/connect";

dotenv.config();

const generateOtp = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit OTP
};

const port = process.env.PORT || 3000;

export const sendOTP = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email } = req.body;

        if(!email) {
            return res.status(400).send("Email is required")
        }

        const user = await pclient.user.findFirst({
            where:{
                email: email
            }
        })

        if(!user){
            return res.status(400).send("Email dosent exists")
        }

        const rClient = await RedisClient();
        const otp = generateOtp();

        await rClient.set(email, otp, 300);

        const otpLink = `http://localhost:${port}/verify-otp?email=${encodeURIComponent(email)}&otp=${otp}`;

        const mailOptions = {
            from: process.env.EMAIL as string,
            to: email,
            subject: 'Your OTP Code',
            text: `Please use the following link to verify your OTP: \n\n${otpLink}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(500).send('Error sending email');
            }
            res.status(200).send('OTP sent to your email');
        });

    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

export const verifyOTP = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, otp } = req.query;

        if (typeof email !== 'string' || typeof otp !== 'string') {
            return res.status(400).send('Invalid request');
        }

        const rClient = await RedisClient();
        const otpFromRedis = await rClient.get(email);

        if (otpFromRedis === null) {
            return res.status(400).send('Invalid OTP');
        } else {
            await pclient.user.update({
                where: {
                    email: email,
                },
                data: {
                    emailVerified: true,
                },
            });

            await rClient.del(email);

            res.status(200).send('OTP verified successfully');
        }

    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}


export const checkVerification = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email } = req.body;
        const user = await pclient.user.findUnique({
            where: {
                email: email,
            },
        });

        if(!user){
            return res.status(400).json({ message: "User not found" });
        }
        if(user.emailVerified){
            res.status(200).json({ message: "Email verified" });
        } else {
            res.status(400).json({ message: "Email not verified" });
        }
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}