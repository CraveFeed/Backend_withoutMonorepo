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

        const resId = await pclient.restaurant.findUnique({
            where: { id: restaurantId },
            select: {
                id: true,
            }
        });

        if (!resId) {
            return res.status(400).json({ error: "Restaurant not found for the provided restaurantId." });
        }

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
                restaurantId: resId!.id,
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

export const repostPost = async (req: Request, res: Response): Promise<any> => {
    try {
        const { originalPostId } = req.body;
        const userId = (req as any).user.userId;

        const originalPost = await pclient.post.findUnique({
            where: { id: originalPostId },
            include: {
                hashTags: true,
            }
        });

        if (!originalPost) {
            return res.status(404).json({ error: "Original post not found" });
        }
        const existingRepost = await pclient.post.findFirst({
            where: { originalPostId: originalPost.id, userId }
        });

        if (existingRepost) {
            await pclient.post.delete({
                where: { id: existingRepost.id }
            });
            return res.status(200).json({ message: "Post unreposted successfully" });
        } else {
            const repost = await pclient.post.create({
                data: {
                    title: originalPost.title,
                    description: originalPost.description,
                    latitude: originalPost.latitude,
                    longitude: originalPost.longitude,
                    Cuisine: originalPost.Cuisine,
                    Dish: originalPost.Dish,
                    isBusinessPost: originalPost.isBusinessPost,
                    pictures: originalPost.pictures,
                    impressions: 0,
                    userId,
                    originalPostId: originalPost.id,
                    restaurantId: originalPost.restaurantId,
                    hashTags: { connect: originalPost.hashTags.map((hashtag) => ({ id: hashtag.id })) },
                },
            });
            return res.status(201).json({ repost });
        }
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};


export const followUnfollowUser = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId } = (req as any).user;
        const userToFollowId = req.body.userId;

        const follow = await pclient.follows.findFirst({
            where: {
                followerId: userId,
                followingId: userToFollowId,
            },
        });

        if (follow) {
            await pclient.follows.delete({
                where: {
                    followerId_followingId: {
                        followerId: userId,
                        followingId: userToFollowId,
                    }
                },
            })
            res.status(200).json({ message: "Unfollowed successfully" });
        } else {
            await pclient.follows.create({
                data: {
                    followerId: userId,
                    followingId: userToFollowId,
                },
            });
            res.status(200).json({ message: "Followed successfully" });
        }
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}
