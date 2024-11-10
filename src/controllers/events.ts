import {Request, Response} from "express";
import pclient from "../db/client";

export const addEventDetails = async (req: Request, res: Response): Promise<any> => {
    try {
        const { name, description, startDate, endDate, location } = req.body;
        const userId = (req as any).user.userId;

        const { month: startMonth, day: startDay, year: startYear } = startDate;
        const { month: endMonth, day: endDay, year: endYear } = endDate;

        const startFullDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0); // 0:00:00 for start time
        const endFullDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59); // 23:59:59 for end

        const restaurant = await pclient.restaurant.update({
            where: {
                userId: userId
            },
            data: {
                events: {
                    create: {
                        name,
                        description,
                        startDate: startFullDate,
                        endDate: endFullDate,
                        location,
                    }
                }
            }
        })
        res.status(200).json({ "message": "Event Created Successfully" });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getEventDetails = async (req: Request, res: Response): Promise<any> => {
    try {
        const { eventId } = req.params;

        const event = await pclient.event.findUnique({
            where: {
                id: eventId
            }
        })
        res.status(200).json({ event: event });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}


export const getAllEvents = async (req: Request, res: Response): Promise<any> => {
    try {
        const resID = (req as any).restaurantID;

        const events = await pclient.event.findMany({
            where: {
                restaurantId: resID
            },
        })
        res.status(200).json({ events: events });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}


export const getCompletedEvents = async (req: Request, res: Response): Promise<any> => {
    try {
        const resID = (req as any).restaurantID;

        const events = await pclient.event.findMany({
            where: {
                restaurantId: resID,
                completed: true
            },
        })
        res.status(200).json({ events: events });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}