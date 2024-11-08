import WebSocket, { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pclient from '../../db/client';
import { ChatMessage, ExtendedWebSocket } from "../../interfaces/chatMessage";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET as string;


export const initializeChatSocket = (server: any) => {
    const wss  = new WebSocketServer({ server });

    wss.on('connection', async (ws: ExtendedWebSocket, req) => {
        const token = req.headers?.['sec-websocket-protocol'];

        if (!token) {
            ws.close(1008, "Unauthorized");
            return;
        }

        try {
            const decoded: any = jwt.verify(token.toString(), JWT_SECRET);
            ws.userId = decoded.userId;
            console.log(`New connection for user ${ws.userId}`);
        } catch (err) {
            ws.close(1008, "Unauthorized");
            return;
        }

        ws.on('message', async (data) => {
            try {
                const message: ChatMessage = JSON.parse(data.toString());

                const savedMessage = await pclient.message.create({
                    data: {
                        content: message.content,
                        senderId: message.senderId,
                        receiverId: message.receiverId,
                    },
                });

                wss.clients.forEach(client => {
                    const extendedClient = client as ExtendedWebSocket;
                    if (client.readyState === WebSocket.OPEN && extendedClient.userId === message.receiverId && extendedClient != ws) {
                        client.send(JSON.stringify(savedMessage));
                    }
                });

            } catch (error) {
                console.error("Error processing message:", error);
                ws.send(JSON.stringify({ error: "Invalid message format" }));
            }
        });

        ws.on('close', () => {
            console.log(`Connection closed for user ${ws.userId}`);
        });
    });
};
