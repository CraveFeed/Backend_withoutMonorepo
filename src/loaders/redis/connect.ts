import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

let client: RedisClientType | null = null;

const RedisClient = async (): Promise<RedisClientType> => {
    if (!client) {
        client = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });
        client.on('error', err => console.log('Redis Client Error', err));
        await client.connect();
    }
    return client;
};

export default RedisClient;
