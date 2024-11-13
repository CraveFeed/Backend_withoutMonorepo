import { Request, Response } from "express";
import pclient from "../db/client";

export const getChatList = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as any).user.userId;
        console.log("User ID:", userId);  // Ensure correct userId is used

        // Fetch messages where the user is either the sender or receiver
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

        console.log("Fetched Messages:", messages);  // Check if messages are fetched

        // If no messages are found, return empty list
        if (!messages || messages.length === 0) {
            console.log("No messages found for user", userId);
            return res.status(200).json({ chattedUsers: [] });
        }

        // Map to store the most recent message for each conversation
        const usersMap = new Map<string, any>();

        // Iterate over all messages
        messages.forEach((message) => {
            const senderId = message.senderId;
            const receiverId = message.receiverId;

            // Ensure valid sender and receiver IDs
            if (!senderId || !receiverId) {
                console.log("Invalid sender or receiver ID, skipping message:", message);  // Log invalid entries
                return; // Skip invalid entries
            }

            console.log("Processing message from:", senderId, "to:", receiverId);  // Log sender and receiver IDs

            // Determine the other user in the conversation
            const otherUser = senderId === userId ? message.receiver : message.sender;

            // Skip if the otherUser is null
            if (!otherUser) {
                console.log("No other user found for this message, skipping.");
                return;  // Skip processing if otherUser is null
            }

            // Generate a unique conversation key based on lexicographical order of string IDs
            const conversationKey = `${[senderId, receiverId].sort().join('-')}`;
            console.log("Conversation Key:", conversationKey);  // Log conversation key

            // Update the conversation with the latest message
            const existingConversation = usersMap.get(conversationKey);
            const messageDate = new Date(message.createdAt).getTime();

            if (!existingConversation) {
                // If no existing conversation, create a new entry
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
                console.log("New conversation created for user:", otherUser.username);  // Log new conversation
            } else {
                // Compare the dates and update the latest message if the current one is newer
                const existingDate = new Date(existingConversation.lastMessageDate).getTime();
                if (messageDate > existingDate) {
                    existingConversation.latestMessage = message.content;
                    existingConversation.lastMessageDate = message.createdAt;
                }
            }
        });

        // Convert the map to an array and sort by the last message date (latest first)
        const chattedUsers = Array.from(usersMap.values()).sort((a, b) => {
            const aDate = new Date(a.lastMessageDate).getTime();
            const bDate = new Date(b.lastMessageDate).getTime();
            return bDate - aDate; // Sort descending, with the latest message first
        });

        console.log("Chatted Users:", chattedUsers);  // Log the final list of chatted users

        // Send the list of chatted users
        res.status(200).json({ chattedUsers });

    } catch (error) {
        console.error('Error fetching chat list:', error);
        res.status(500).json({ error: "Internal server error" });
    }
};


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
