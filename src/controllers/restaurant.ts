import { Request, Response } from "express";
import pclient from "../db/client";

export const getRestaurantMenu = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId }= req.body;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const restaurantId = await pclient.user.findUnique({
            where: {
                id: userId,
                Type: 'BUSINESS'
            },
            select: {
                Restaurant: {
                    select: {
                        id: true
                    }
                }
            },
        });

        if (!restaurantId || !restaurantId.Restaurant) {
            return res.status(404).json({ error: "Restaurant not found" });
        }

        const menus = await pclient.menu.findMany({
            where: {
                restaurantId: restaurantId.Restaurant.id
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            },
        });

        res.status(200).json({ menus });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getRestaurantPosts = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId } = req.body;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const restaurantId = await pclient.user.findUnique({
            where: {
                id: userId,
                Type: 'BUSINESS'
            },
            select: {
                Restaurant: {
                    select: {
                        id: true
                    }
                }
            },
        });

        if (!restaurantId || !restaurantId.Restaurant) {
            return res.status(404).json({ error: "Restaurant not found" });
        }

        const posts = await pclient.post.findMany({
            where: {
                restaurantId: restaurantId.Restaurant.id
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            }
        });

        const totalPosts = await pclient.post.updateMany({
            where: {
                restaurantId: restaurantId.Restaurant.id
            },
            data: {
                impressions: {
                    increment: 1
                }
            }
        });

        res.status(200).json({ posts });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}

export const createMenu = async ( req: Request, res: Response ): Promise<any> =>{
    try {
        const restaurantId = (req as any).body.restaurantId;
        const { name, description, price } = req.body;

        if(!restaurantId){
            return res.status(400).json({ error: "Restaurant not found for the provided restaurantId." });
        }

        const menu = await pclient.menu.create({
            data:{
                name,
                description,
                price,
                restaurantId
            }
        })

        res.status(201).json(menu)
    } catch (error){
        res.status(500).json({ error: "Internal server error" });
    }
}

export const deleteMenu = async (req: Request, res: Response): Promise<any> => {
    try {
        const { menuId } = req.body;
        const restaurantId = (req as any).restaurantID;

        if(!restaurantId){
            return res.status(400).json({ error: "Restaurant not found for the provided restaurantId." });
        }

        const menu = await pclient.menu.delete({
            where: {
                id: menuId,
                restaurantId: restaurantId
            }
        });

        res.status(200).json({ menu });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}

export const updateMenu = async (req: Request, res: Response): Promise<any> => {
    try {
        const { menuId } = req.body;
        const restaurantId = (req as any).restaurantID;
        const { name, description, price } = req.body;

        if(!restaurantId){
            return res.status(400).json({ error: "Restaurant not found for the provided restaurantId." });
        }

        const menu = await pclient.menu.update({
            where: {
                id: menuId,
                restaurantId: restaurantId
            },
            data: {
                name,
                description,
                price
            }
        });

        res.status(200).json({ menu });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getRestaurantDetails = async (req: Request, res: Response): Promise<any> => {
    try {
        const {userId} = req.body;

        if(!userId){
            return res.status(400).json({ error: "User not found for the provided userId." });
        }

        const restaurantId = await pclient.user.findUnique({
            where: {
                id: userId,
                Type: 'BUSINESS'
            },
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

        if (!restaurantId || !restaurantId.Restaurant) {
            return res.status(404).json({error: "Restaurant not found"});
        }

        res.status(200).json({restaurant: restaurantId.Restaurant});
    } catch (error) {
        res.status(500).json({error: "Internal server error"});
    }
}

export const getRestaurantFollowers = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId } = req.body;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        if(!userId){
            return res.status(400).json({ error: "User not found for the provided userId." });
        }

        const restaurantId = await pclient.user.findUnique({ where: { id: userId, Type: 'BUSINESS' }, select: { Restaurant: { select: { id: true, address: true, city: true, state: true, zipCode: true, latitude: true, longitude: true, User: { select: { id: true, username: true, firstName: true, lastName: true, avatar: true, Type: true, bio: true, banner: true, _count: { select: { posts: true, followers: true, following: true } } } } } } } });

        if (!restaurantId || !restaurantId.Restaurant) {
            return res.status(404).json({ error: "Restaurant not found" });
        }

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
                createdAt: 'desc'
            },
            skip: (page - 1) * limit,
            take: limit,
        });
        res.status(200).json({ followers });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getRestaurantFollowing = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId } = req.body;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const restaurantId = await pclient.user.findUnique({ where: { id: userId, Type: 'BUSINESS' }, select: { Restaurant: { select: { id: true, address: true, city: true, state: true, zipCode: true, latitude: true, longitude: true, User: { select: { id: true, username: true, firstName: true, lastName: true, avatar: true, Type: true, bio: true, banner: true, _count: { select: { posts: true, followers: true, following: true } } } } } } } });

        if (!restaurantId || !restaurantId.Restaurant) {
            return res.status(404).json({ error: "Restaurant not found" });
        }

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
                createdAt: 'desc'
            },
            skip: (page - 1) * limit,
            take: limit,
        });
        res.status(200).json({ following });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}