import { WebSocket } from 'ws';

export type MessageType = 'chat'| 'activeChat' | 'unsetActiveChat';

export interface BaseMessage {
    type: MessageType;
    senderId: string;
    receiverId: string;
}

export interface ChatMessage extends BaseMessage {
    type: 'chat';
    content: string;
}

export interface NotificationMessage {
    type: 'notification';
    message: string;
    senderId: string;
    avatar: string;
    receiverId: string;
    creatorUserName: string;
    postId?: string;
}

export interface ExtendedWebSocket extends WebSocket {
    userId?: string;
    activeChat?: string;
    deviceId?: string;
}