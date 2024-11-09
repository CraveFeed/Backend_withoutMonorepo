import express from 'express';
import pclient from '../db/client';

const router = express.Router();

router.get('/history/:userId', async (req, res) => {
    const { userId } = req.params;
    const currentUserId = (req as any).user.userId;

    try {
        const messages = await pclient.message.findMany({
            where: {
                OR: [
                    { senderId: currentUserId, receiverId: userId },
                    { senderId: userId, receiverId: currentUserId }
                ]
            },
            orderBy: { createdAt: 'asc' }
        });

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;