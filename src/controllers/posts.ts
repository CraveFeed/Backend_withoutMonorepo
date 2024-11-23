import { Request, Response } from "express";
import pclient from "../db/client";

export const getHashStartingWith = async (req: Request, res: Response): Promise<any> => {
    try {
        const { hash } = req.body;

        const hashTags = await pclient.hashTag.findMany({
            where: {
                word: {
                    startsWith: hash
                }
            },
            select: {
                id: true,
                word: true,
            }
        })

        res.status(200).json(hashTags)
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getPostsByHashtag = async (req: Request, res: Response): Promise<any> => {
    try {
        const { hash } = req.body;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const posts = await pclient.post.findMany({
            where: {
                hashTags: {
                    some: {
                        word: hash
                    }
                }
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
                User: {
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
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: (page - 1) * limit,
            take: limit,
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

export const getCommentsOfPosts = async (req: Request, res: Response): Promise<any> => {
    try {
        const { postId } = req.body;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const comments = await pclient.comment.findMany({
            where: {
                postId: postId
            },
            select: {
                id: true,
                content: true,
                createdAt: true,
                user: {
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


export const getLikesOfPosts = async (req: Request, res: Response): Promise<any> => {
    try {
        const { postId } = req.body;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const likes = await pclient.like.findMany({
            where: {
                postId: postId
            },
            select: {
                id: true,
                user: {
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

export const getRestaurantStartingWith = async (req: Request, res: Response): Promise<any> => {
    try {
        const { restaurant } = req.body;

        const restaurants = await pclient.user.findMany({
            where: {
                username: {
                    startsWith: restaurant
                },
                Type: 'BUSINESS',
                Restaurant: {
                    isNot: null,
                },
            },
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
            }
        })

        res.status(200).json(restaurants)
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getUsersStartingWith = async (req: Request, res: Response): Promise<any> => {
    try {
        const { username } = req.body;

        const users = await pclient.user.findMany({
            where: {
                username: {
                    startsWith: username
                }
            },
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
            }
        })

        res.status(200).json(users)
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getUserProfileSummary = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId } = req.body;

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

export const getUsersPosts = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId } = req.body;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

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
                createdAt: true,
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
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    }
                },
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: (page - 1) * limit,
            take: limit,
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
        const { userId } = req.body;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

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
            },
            skip: (page - 1) * limit,
            take: limit,
        });
        res.status(200).json({ followers });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getUserFollowing = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId } = req.body;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

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
            },
            skip: (page - 1) * limit,
            take: limit,
        });
        res.status(200).json({ following });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getUserAndRestaurantDetails = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required." });
        }

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

        if (!profileData) {
            return res.status(404).json({ error: "User not found" });
        }

        let restaurantDetails = null;
        if (profileData.Type === 'BUSINESS') {
            const restaurant = await pclient.user.findUnique({
                where: { id: userId, Type: 'BUSINESS' },
                select: {
                    Restaurant: {
                        select: {
                            id: true,
                            address: true,
                            city: true,
                            state: true,
                            zipCode: true,
                            latitude: true,
                            longitude: true,
                            User: {
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
                            }
                        }
                    }
                },
            });

            if (restaurant && restaurant.Restaurant) {
                restaurantDetails = restaurant.Restaurant;
            }
        }

        res.status(200).json({
            profileData,
            restaurant: restaurantDetails || null
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
}
