import { S3 } from '@aws-sdk/client-s3';
import dotenv from "dotenv";

dotenv.config();

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID as string;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY as string;
const AWS_REGION = process.env.AWS_REGION as string;

console.log(AWS_ACCESS_KEY_ID);
console.log(AWS_SECRET_ACCESS_KEY);
console.log(AWS_REGION);

const s3Client = new S3({
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
    region: AWS_REGION,
});

export default s3Client;