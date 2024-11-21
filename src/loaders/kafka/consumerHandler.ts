import kafka from "./kafkaHandler";
import dotenv from "dotenv";
import { WebSocketServer, WebSocket } from "ws";
import pclient from "../../db/client";
import {userDeviceConnections} from "../webSockets/chatSocket";

dotenv.config();

const kafka_topic = process.env.KAFKA_TOPIC as string;
const kafka_group = process.env.KAFKA_GROUP as string;
const consumer = kafka.consumer({ groupId: kafka_group });

const MAX_RETRIES = 10;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 30000; // 30 seconds

export const initializeKafkaConsumer = (wss: WebSocketServer) => {
    const run = async (retryCount = 0) => {
        try {
            console.log('Attempting to connect to Kafka...');
            await consumer.connect();
            console.log('Successfully connected to Kafka');
            
            await consumer.subscribe({ topic: kafka_topic, fromBeginning: false });
            
            await consumer.run({
                eachMessage: async ({ message }) => {
                    try {
                        const userId = message.key?.toString();
                        const notification = JSON.parse(message.value?.toString() || '{}');

                        if (!userId || !notification || notification.type !== "notification") {
                            console.log(`Invalid message format:`, { userId, notification });
                            return;
                        }

                        console.log(`Processing notification for userId: ${userId}`);

                        const result = await pclient.$transaction(async (prisma) => {
                            const createNotification = await prisma.notification.create({
                                data: {
                                    message: notification.message,
                                    creatorId: notification.senderId,
                                    avatar: notification.avatar,
                                    creatorUserName: notification.creatorUserName,
                                    postId: notification.postId,
                                    User: {
                                        connect: {
                                            id: notification.receiverId,
                                        }
                                    }
                                },
                            });

                            const creatorData = await prisma.user.findUnique({
                                where: { id: notification.senderId },
                                select: { id: true, username: true, avatar: true },
                            });

                            if (!creatorData) {
                                throw new Error(`Creator data not found for senderId: ${notification.senderId}`);
                            }

                            const notificationCount = await prisma.notificationUpdate.upsert({
                                where: { userId },
                                update: { count: { increment: 1 } },
                                create: { userId, count: 1 },
                                select: { count: true },
                            });

                            return { createNotification, creatorData, notificationCount };
                        });

                        const userDevices = userDeviceConnections.get(userId);
                        if (userDevices) {
                            userDevices.forEach(client => {
                                if (client.readyState === WebSocket.OPEN) {
                                    client.send(JSON.stringify({
                                        type: 'notification',
                                        avatar: result.creatorData.avatar,
                                        message: notification.message,
                                        userName: result.creatorData.username,
                                        count: result.notificationCount.count,
                                    }));
                                }
                            });
                        }
                    } catch (error) {
                        console.error("Error processing message:", error);
                    }
                },
            });
        } catch (error) {
            console.error("Kafka consumer error:", error);
            
            if (retryCount < MAX_RETRIES) {
                const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, retryCount), MAX_RETRY_DELAY);
                console.log(`Retrying connection in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
                
                await new Promise(resolve => setTimeout(resolve, delay));
                return run(retryCount + 1);
            } else {
                console.error("Max retries exceeded. Failed to connect to Kafka.");
            }
        }
    };

    // Handle graceful shutdown
    const shutdown = async () => {
        try {
            await consumer.disconnect();
            console.log('Kafka consumer disconnected');
        } catch (error) {
            console.error('Error during Kafka consumer shutdown:', error);
        }
    };

    run().catch(console.error);
    
    // Handle process termination
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    return shutdown;
};