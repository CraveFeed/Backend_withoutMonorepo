import pclient from "../db/client";
import { Request, Response } from "express";

export const getNibbles = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as any).user.userId;
        const { page = 1 } = req.query;

        const pageSize = 1;
        const skipCount = (parseInt(page as string) - 1) * pageSize;

        const reel = await pclient.chefCorner.findFirst({
            where: {
                userId: { not: userId }
            },
            orderBy: {
                createdAt: 'desc'
            },
            select: {
                id: true,
                title: true,
                description: true,
                video: true,
                viewsCount: true,
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    }
                },
                User: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        Type: true,
                    }
                },
            },
            take: pageSize,
            skip: skipCount,
        });

        if(!reel){
            return res.status(404).json({ error: "No more reels available" });
        }

        await pclient.chefCorner.update({
            where: {
                id: reel.id
            },
            data: {
                viewsCount: {
                    increment: 1
                }
            }
        });

        if (reel) {
            res.status(200).json({ reel });
        } else {
            res.status(200).json({ message: "No more reels available" });
        }
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getCommentsOfReel = async (req: Request, res: Response): Promise<any> => {
    try {
        const { reelId } = req.body;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const comments = pclient.comment.findMany({
            where: {
                videoId: reelId
            },
            select: {
                id: true,
                content: true,
                createdAt: true,
                user: {
                    select: {
                        username: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        Type: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: (page - 1) * limit,
            take: limit,
        });
        res.status(200).json({ comments });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getLikesOfReel = async (req: Request, res: Response): Promise<any> => {
    try {
        const { reelId } = req.body;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const likes = await pclient.like.findMany({
            where: {
                videoId: reelId
            },
            select: {
                id: true,
                user: {
                    select: {
                        username: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        Type: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: (page - 1) * limit,
            take: limit,
        });
        res.status(200).json({ likes });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}

export const createReel = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as any).user.userId;
        const { title, description, video } = req.body;

        const reel = await pclient.chefCorner.create({
            data: {
                title,
                description,
                video,
                userId,
            }
        });

        res.status(201).json({ reel, "message": "Reel created successfully" });
    } catch (error) {
        res.status(400).json({ error: error });
    }
}

export const likeUnlikeReel = async (req: Request, res: Response): Promise<any> => {
    try {
        const { reelId } = req.body;
        const userId = (req as any).user.userId;

        const reel = await pclient.chefCorner.findUnique({
            where: {
                id: reelId
            },
        });

        if (!reel) {
            return res.status(404).json({ error: "No reel found with the provided reelId" });
        }

        const like = await pclient.like.findFirst({
            where: {
                videoId: reelId,
                userId: userId
            }
        });

        if (like) {
            await pclient.like.delete({
                where: {
                    id: like.id
                }
            });
            return res.status(200).json({ message: "Reel unliked successfully" });
        } else {
            await pclient.like.create({
                data: {
                    videoId: reelId,
                    userId
                }
            });
            return res.status(200).json({ message: "Reel liked successfully" });
        }
    } catch (error) {
        res.status(400).json({ error: error });
    }
}

export const createCommentOnReel = async (req: Request, res: Response): Promise<any> => {
    try {
        const { reelId, content } = req.body;
        const userId = (req as any).user.userId;

        const reel = await pclient.chefCorner.findUnique({
            where: {
                id: reelId
            },
        });

        if (!reel) {
            return res.status(404).json({ error: "No reel found with the provided reelId" });
        }

        const comment = await pclient.comment.create({
            data: {
                content,
                videoId: reelId,
                userId
            }
        });

        await pclient.chefCorner.update({
            where: {
                id: reelId
            },
            data: {
                comments: {
                    connect: {
                        id: comment.id
                    }
                }
            }
        });

        res.status(200).json({ message: "Comment added successfully" });
    } catch (error) {
        res.status(400).json({ error: error });
    }
}

export const deleteCommentOnReel = async (req: Request, res: Response): Promise<any> => {
    try {
        const { commentId } = req.body;
        const userId = (req as any).user.userId;

        const comment = await pclient.comment.delete({
            where: {
                id: commentId,
                userId
            }
        });

        res.status(200).json({ comment });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}