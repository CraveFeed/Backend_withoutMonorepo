import {Request, Response} from "express";
import pclient from "../db/client";

export const shareablePost = async (req: Request, res: Response): Promise<any> => {
    try {
        const { postId } = req.body;

        if (!postId) {
            return res.status(400).json({ error: "Post ID is required" });
        }

        const post = await pclient.post.findUnique({
            where: { id: postId },
            include: {
                User: {
                    select: {
                        username: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        Type: true,
                    }
                },
                hashTags: true,
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    }
                }
            },
        });

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        res.status(200).json({ post });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}


export const shareableComment = async (req: Request, res: Response): Promise<any> => {
    try {
        const {postId} = req.body;

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const comment = await pclient.comment.findMany({
            where: { id: postId },
            include: {
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
            skip: (page - 1) * limit,
            take: limit,
        });


        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }
        return res.status(200).json(comment);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}
