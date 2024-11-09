import { Request, Response } from 'express';
import pclient from "../db/client";

export const createRestaurant = async (req: Request, res: Response): Promise<any> => {
    try {
        const { address, city, zipCode, latitude, longitude, state } = req.body;
        const userId = (req as any).user.userId;

        const findRestaurant = await pclient.restaurant.findUnique({
            where: {
                userId: userId,
            }
        })

        if(findRestaurant){
            return res.status(400).json({ message: "Restaurant already exists" });
        }

        const restaurant = await pclient.restaurant.create({
            data: {
                address,
                city,
                zipCode,
                latitude,
                longitude,
                state,
                userId
            }
        });

        return res.status(201).json({ message: "Restaurant created successfully", restaurant });
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
}


export const getRestaurant = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as any).user.userId;

        const restaurant = await pclient.restaurant.findUnique({
            where: {
                userId: userId,
            },
            include: {
                events: true,
                menus: true,
                posts: true,
            }
        })

        return res.status(200).json({ restaurant: restaurant });

    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}

const updateRestaurantDetails = async (req: Request, res: Response): Promise<any> => {
    try {
        const { address, city, zipCode, latitude, longitude, state } = req.body;
        const userId = (req as any).user.userId;

        const updateData: {[key: string]:any} = {};

        if(address!==undefined) updateData.address = address;
        if(city!==undefined) updateData.city = city;
        if(zipCode!==undefined) updateData.zipCode = zipCode;
        if(latitude!==undefined) updateData.latitude = latitude;
        if(longitude!==undefined) updateData.longitude = longitude;
        if(state!==undefined) updateData.state = state;

        const restaurant = await pclient.restaurant.update({
            where: {
                userId: userId
            },
            data: {
                ...updateData
            }
        })

        res.status(200).json({ restaurant: restaurant });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}