import { Request, Response } from "express";
import pclient from "../db/client";

export const getChatList = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as any).user.userId;

        const messages = await pclient.message.findMany({
            where: {
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            },
            select: {
                senderId: true,
                receiverId: true,
                content: true,
                createdAt: true,
                sender: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        Type: true,
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        Type: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc',
            }
        });

        if (!messages || messages.length === 0) {
            return res.status(200).json({ chattedUsers: [] });
        }

        const usersMap = new Map<string, any>();

        messages.forEach((message) => {
            const senderId = message.senderId;
            const receiverId = message.receiverId;

            if (!senderId || !receiverId) {
                return;
            }

            const otherUser = senderId === userId ? message.receiver : message.sender;

            if (!otherUser) {
                console.log("No other user found for this message, skipping.");
                return;
            }

            const conversationKey = `${[senderId, receiverId].sort().join('-')}`;

            const existingConversation = usersMap.get(conversationKey);
            const messageDate = new Date(message.createdAt).getTime();

            if (!existingConversation) {
                usersMap.set(conversationKey, {
                    userId: otherUser.id,
                    username: otherUser.username,
                    firstName: otherUser.firstName,
                    lastName: otherUser.lastName,
                    avatar: otherUser.avatar,
                    Type: otherUser.Type,
                    latestMessage: message.content,
                    lastMessageDate: message.createdAt,
                });
            } else {
                const existingDate = new Date(existingConversation.lastMessageDate).getTime();
                if (messageDate > existingDate) {
                    existingConversation.latestMessage = message.content;
                    existingConversation.lastMessageDate = message.createdAt;
                }
            }
        });

        const chattedUsers = Array.from(usersMap.values()).sort((a, b) => {
            const aDate = new Date(a.lastMessageDate).getTime();
            const bDate = new Date(b.lastMessageDate).getTime();
            return bDate - aDate;
        });

        res.status(200).json({ chattedUsers });

    } catch (error) {
        console.error('Error fetching chat list:', error);
        res.status(500).json({ error: "Internal server error" });
    }
};


export const getChatHistory = async (req: Request, res: Response): Promise<any> => {
    try {
        const {userId} = req.body;
        const currentUserId = (req as any).user.userId;
        const { page=1, pageSize = 20 } = req.query;

        const skip = (parseInt(page as string)-1) * parseInt(pageSize as string);

        const messages = await pclient.message.findMany({
            where: {
                    OR: [
                        { senderId: currentUserId, receiverId: userId },
                        { senderId: userId, receiverId: currentUserId }
                    ]
            },
            skip,
            take: parseInt(pageSize as string),
            orderBy: {
                createdAt: 'desc'
            },
            select: {
                id: true,
                content: true,
                createdAt: true,
                sender: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        Type: true,
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        Type: true,
                    }
                }
            }
        });

        const totalMessages = await pclient.message.count({
            where: {
                OR: [
                    { senderId: currentUserId, receiverId: userId },
                    { senderId: userId, receiverId: currentUserId }
                ]
            }
        });

        const totalPages = Math.ceil(totalMessages / parseInt(pageSize as string));

        res.status(200).json({
            messages,
            currentPage: page,
            totalPages,
        });

    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}
