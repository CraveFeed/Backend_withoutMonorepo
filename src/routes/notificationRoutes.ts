import { Router } from "express";
import * as notificationController from "../controllers/notification";

const router = Router();

router.post("/read", notificationController.getNotifications);

export default router;