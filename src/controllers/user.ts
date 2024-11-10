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
            }
        });
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

