import pclient from "../db/client";
import {Request, Response} from "express";

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

        res.status(200).json({ message: "Comment deleted successfully" });
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
        const { title, description, latitude, longitude, Cuisine, Dish, isBusinessPost, pictures, impressions, restaurantId, hashtags, city } = req.body;
        const userId = (req as any).user.userId;

        let restId = null;

        if(restaurantId){
        const resId = await pclient.restaurant.findUnique({
            where: { id: restaurantId },
            select: {
                id: true,
            }
        });
        if(!resId){
            return res.status(400).json({ error: "Restaurant not found for the provided restaurantId." });
        }
        restId = resId.id;
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
                city,
                restaurantId: restId!,
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
        console.error(error);
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
                    city: originalPost.city,
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

export const updateUserProfile = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as any).user.userId;
        const user = await pclient.user.findUnique({
            where: {
                id: userId,
            },
        });

        if (!user) {
            return res.status(401).json({ error: "User does not exist" });
        }

        const { firstName, lastName, bio, profilePicture, bannerImage, Latitude, Longitude, Dish,  Spiciness , Sweetness, Sourness } = req.body;

        if (firstName) {
            user.firstName = firstName;
        }
        if (lastName) {
            user.lastName = lastName;
        }
        if (bio) {
            user.bio = bio;
        }
        if (profilePicture) {
            user.avatar = profilePicture;
        }
        if (bannerImage) {
            user.banner = bannerImage;
        }
        if (Latitude) {
            user.Latitude = Latitude;
        }
        if (Longitude) {
            user.Longitude = Longitude;
        }
        if (Dish) {
            user.Dish = Dish;
        }
        if (Spiciness) {
            user.Spiciness = Spiciness;
        }
        if (Sweetness) {
            user.Sweetness = Sweetness;
        }
        if (Sourness) {
            user.Sourness = Sourness;
        }

        await pclient.user.update({
            where: {
                id: userId,
            },
            data: user,
        });

        res.status(200).json({ message: "Profile updated successfully" });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getOthersProfileSummary = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId } = (req as any).user.userId;
        const { otherUserId } = req.body;

        const [ profileData, followCheck ] = await pclient.$transaction([
         pclient.user.findUnique({
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
        }),
        pclient.follows.findUnique({
            where: {
                followerId_followingId: {
                    followerId: otherUserId,
                    followingId: userId,
                }
            }
        }),
        ]);
        if (!followCheck){
            res.status(200).json({ profileData,following: false });
        } else {
            res.status(200).json({ profileData,following: true });
        }
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}