import { WebSocket } from 'ws';

export interface ChatMessage {
    content: string;
    senderId: string;
    receiverId: string;
}

export interface ExtendedWebSocket extends WebSocket {
    userId?: string;
}