import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import s3Client from "../loaders/s3/s3handler";
import { Request, Response } from 'express';
import dotenv from "dotenv";

dotenv.config();

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME as string;
console.log(S3_BUCKET_NAME);

export const s3Upload = async (req: Request, res: Response): Promise<any> => {
    try {
        const file = req.file;
        if (!file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const uniqueImageName = `${Date.now()}-${file.originalname}`;
        const uploadParams = {
            Bucket: S3_BUCKET_NAME,
            Key: uniqueImageName,
            Body: file.buffer,
            ContentType: file.mimetype,
        };

        await s3Client.send(new PutObjectCommand(uploadParams));

        const signedUrlParams = {
            Bucket: S3_BUCKET_NAME,
            Key: uniqueImageName,
        };

        const signedUrl = await getSignedUrl(s3Client, new GetObjectCommand(signedUrlParams), { expiresIn: 50000 });

        console.log(signedUrl);
        res.status(200).json({ signedUrl });
    } catch (error) {
        res.status(500).json({ error });
    }
}