import kafka from "./kafkaHandler";
import dotenv from "dotenv";
import { WebSocketServer, WebSocket } from "ws";
import pclient from "../../db/client";
import {userDeviceConnections} from "../webSockets/chatSocket";

dotenv.config();

const kafka_topic = process.env.KAFKA_TOPIC as string;
const kafka_group = process.env.KAFKA_GROUP as string;
const consumer = kafka.consumer({ groupId: kafka_group });

export const initializeKafkaConsumer = (wss: WebSocketServer) => {
    const run = async () => {
        try {
            await consumer.connect();
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
            setTimeout(run, 5000);
        }
    };

    run().catch(console.error);

    return () => {
        consumer.disconnect();
    };
};