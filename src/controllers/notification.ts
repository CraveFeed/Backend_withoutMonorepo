import { Response, Request } from 'express';
import pclient from "../db/client";

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.userId;

        const [notifications] = await pclient.$transaction([
            pclient.notification.findMany({
                where: {
                    userId: userId,
                },
                select: {
                    avatar: true,
                    message: true,
                    creatorId: true,
                    read: true,
                    creatorUserName: true,
                    createdAt: true,
                }
            }),

            pclient.notification.updateMany({
                where: {
                    read: false,
                    userId: userId
                },
                data: {
                    read: true
                }
            }),
            pclient.notificationUpdate.upsert({
                where: {
                    userId: userId,
                },
                update: {
                    count: 0,
                },
                create: {
                    userId: userId,
                    count: 0,
                }
            })
        ]);

        res.status(200).json({ notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: "Internal server error" });
    }
}
