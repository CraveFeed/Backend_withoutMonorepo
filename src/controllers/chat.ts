import { Request, Response } from "express";
import pclient from "../db/client";

export const getChatList = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as any).user.userId;

        const participants = await pclient.message.findMany({
            where: {
                OR:[
                    { senderId: userId},
                    {receiverId: userId}
                ]
            },
            select: {
                receiver: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        Type: true,
                        messages: {
                            select: {
                                content: true,
                            },
                            take: 1,
                            orderBy: {
                                createdAt: "desc"
                            }
                        }
                    }
                },
                sender: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        Type: true,
                        messages: {
                            select: {
                                content: true,
                            },
                            take: 1,
                            orderBy: {
                                createdAt: "desc"
                            }
                        }
                    }
                },
            },
            distinct: ["receiverId", "senderId"]
        });

        const usersMap = new Map();

        participants.forEach((participant) => {
            const sender = participant.sender;
            const receiver = participant.receiver;

            if (sender && sender.id !== userId && !usersMap.has(sender.id)) {
                usersMap.set(sender!.id, {
                    ...sender,
                    latestMessage: sender!.messages[0]?.content || '',
                });
            }

            if (receiver && receiver.id !== userId && !usersMap.has(receiver.id)) {
                usersMap.set(receiver!.id, {
                    ...receiver,
                    latestMessage: receiver!.messages[0]?.content || '',
                });
            }
        });

        const chattedUsers = Array.from(usersMap.values());
        res.status(200).json({ chattedUsers });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getChatHistory = async (req: Request, res: Response): Promise<any> => {
    try {
        const {userId} = req.params;
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

export const createChat = async (req: Request, res: Response): Promise<any> => {
    try {
        const { content, userId } = req.body;
        const currentUserId = (req as any).user.userId;

        const message = await pclient.message.create({
            data: {
                content,
                senderId: currentUserId,
                receiverId: userId,
            }
        });

        res.status(201).json({ message });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}