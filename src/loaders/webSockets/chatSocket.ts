import WebSocket, { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pclient from '../../db/client';
import { ChatMessage, ExtendedWebSocket, BaseMessage } from "../../interfaces/chatMessage";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET as string;

export const userDeviceConnections = new Map<string, Map<string, ExtendedWebSocket>>();
const activeChats = new Map<string, string>();

export const initializeChatSocket = (server: any): WebSocketServer => {
    const wss = new WebSocketServer({ server });

    wss.on('connection', async (ws: ExtendedWebSocket, req) => {
        const token = req.headers?.['sec-websocket-protocol'];
        const deviceId = req.headers?.['device-id'];

        if (!token || !deviceId || Array.isArray(deviceId)) {
            ws.close(1008, "Unauthorized");
            return;
        }

        try {
            const decoded: any = jwt.verify(token.toString(), JWT_SECRET);
            if(!decoded.userId) {
                ws.close(1008, "Unauthorized");
                return;
            }

            const userId = decoded.userId as string;
            ws.userId = userId;
            ws.deviceId = deviceId;

            if (!userDeviceConnections.has(userId)) {
                userDeviceConnections.set(userId, new Map<string, ExtendedWebSocket>());
            }

            const userDevices = userDeviceConnections.get(userId);
            if (userDevices) {
                userDevices.set(deviceId, ws);
                console.log(`New connection for user ${userId} on device ${deviceId}`);
            }

        } catch (err) {
            ws.close(1008, "Unauthorized");
            return;
        }

        ws.on('message', async (data) => {
            try {
                const message = JSON.parse(data.toString()) as BaseMessage;

                if (message.type === 'activeChat' && ws.userId) {
                    ws.activeChat = message.receiverId;
                    activeChats.set(ws.userId, message.receiverId);
                    return;
                }

                if (message.type === 'unsetActiveChat' && ws.userId) {
                    activeChats.delete(ws.userId);
                    ws.activeChat = undefined;
                    console.log(`Active chat unset for user ${ws.userId}`);
                    return;
                }

                if (message.type === 'chat') {
                    const chatMessage = message as ChatMessage;
                    if (!ws.userId) {
                        ws.send(JSON.stringify({ error: "User not authenticated" }));
                        return;
                    }

                    const savedMessage = await pclient.message.create({
                        data: {
                            content: chatMessage.content,
                            senderId: ws.userId,
                            receiverId: chatMessage.receiverId,
                        },
                    });

                    const receiverDevices = userDeviceConnections.get(chatMessage.receiverId);
                    if (receiverDevices) {
                        receiverDevices.forEach(receiverWs => {
                            if (receiverWs.readyState === WebSocket.OPEN) {
                                const outgoingMessage = receiverWs.activeChat === ws.userId
                                    ? { type: 'chat' as const, ...savedMessage }
                                    : { 
                                        type: 'New-Message' as const,
                                        message: 'New message received',
                                    };
                                
                                receiverWs.send(JSON.stringify(outgoingMessage));
                            }
                        });
                    }
                }
            } catch (error) {
                console.error("Error processing message:", error);
                ws.send(JSON.stringify({ error: "Invalid message format" }));
            }
        });

        ws.on('close', () => {
            if (ws.userId && ws.deviceId) {
                const userDevices = userDeviceConnections.get(ws.userId);
                userDevices?.delete(ws.deviceId);
                if (userDevices?.size === 0) {
                    userDeviceConnections.delete(ws.userId);
                    activeChats.delete(ws.userId);
                }
            }
        });
    });

    return wss;
};