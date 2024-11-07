import { createClient, RedisClientType } from 'redis';

let client: RedisClientType | null = null;

const RedisClient = async (): Promise<RedisClientType> => {
    if (!client) {
        client = createClient();
        client.on('error', err => console.log('Redis Client Error', err));
        await client.connect();
    }
    return client;
};

export default RedisClient;
