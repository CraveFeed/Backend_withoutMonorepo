import pclient from "../db/client";
import {Request, Response} from "express";

export const getUserProfileSummary = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as any).user.userId;

        const profileData = await pclient.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                Type: true,
                bio: true,
                banner: true,
                _count: {
                    select: {
                        posts: true,
                        followers: true,
                        following: true,
                    }
                }
            }
        });

        res.status(200).json({ profileData });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getUsersPostsWithComments = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as any).user.userId;

        const posts = await pclient.post.findMany({
            where: {
                userId: userId
            },
            select: {
                id: true,
                title: true,
                description: true,
                latitude: true,
                longitude: true,
                Cuisine: true,
                Dish: true,
                isBusinessPost: true,
                pictures: true,
                impressions: true,
                originalPostId: true,
                repostedPosts: true,
                user: {
                    select: {
                        username: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        Type: true,
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    }
                },
                comments: {
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
                    }
                },
                likes: {
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
                    }
                },
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 10
        });

        await Promise.all(posts.map(async (post) => {
            await pclient.post.update({
                where: {
                    id: post.id
                },
                data: {
                    impressions: {
                        increment: 1
                    }
                }
            })
        }));

        res.status(200).json({ posts });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getUserFollowers = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as any).user.userId;

        const followers = await pclient.follows.findMany({
            where: {
                followerId: userId
            },
            select: {
                follower: {
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
                followerId: 'asc'
            }
        });
        res.status(200).json({ followers });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getUserFollowing = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as any).user.userId;

        const following = await pclient.follows.findMany({
            where: {
                followingId: userId
            },
            select: {
                following: {
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
                followingId: 'asc'
            }
        });
        res.status(200).json({ following });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}

export const commentOnPost = async (req: Request, res: Response): Promise<any> => {
    try {
        const { postId, content } = req.body;
        const userId = (req as any).user.userId;

        const comment = await pclient.comment.create({
            data: {
                postId,
                content,
                userId
            }
        });

        res.status(201).json({ comment });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}

export const deleteComment = async (req: Request, res: Response): Promise<any> => {
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

export const likeUnlikePost = async (req: Request, res: Response): Promise<any> => {
    try {
        const { postId } = req.body;
        const userId = (req as any).user.userId;

        const likePost = await pclient.like.findFirst({
            where: {
                postId: postId,
                userId: userId
            }
        });

        if (likePost) {
            const like = await pclient.like.delete({
                where: {
                    id: likePost.id,
                }
            });
            res.status(200).json({ like });
        } else {
            const like = await pclient.like.create({
                data: {
                    postId,
                    userId,
                }
            });
            res.status(201).json({ like });
        }

    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}

export const createPost = async (req: Request, res: Response): Promise<any> => {
    try {
        const { title, description, latitude, longitude, Cuisine, Dish, isBusinessPost, pictures, impressions, restaurantId, hashtags } = req.body;
        const userId = (req as any).user.userId;

        const newPost = await pclient.post.create({
            data: {
                title,
                description,
                latitude,
                longitude,
                Cuisine,
                Dish,
                isBusinessPost,
                pictures,
                impressions,
                userId,
                restaurantId,
            },
        });

        const hashtagPromises = (hashtags || []).map(async (word: string) => {
            const hashtag = await pclient.hashTag.upsert({
                where: { word },
                create: {
                    word,
                    post: { connect: { id: newPost.id } },
                },
                update: {},
            });

            await pclient.trendingHashtag.upsert({
                where: { word },
                create: {
                    word,
                    count: 1,
                    lastUsed: new Date(),
                },
                update: {
                    count: { increment: 1 },
                    lastUsed: new Date(),
                },
            });
        });

        await Promise.all(hashtagPromises);

        res.status(201).json({ newPost });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};


