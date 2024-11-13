import { Router } from 'express';
import * as restaurantController from "../controllers/restaurant"

const router = Router();

router.post('/createMenu', restaurantController.createMenu)
router.post('/deleteMenu', restaurantController.deleteMenu)
router.post('/updateMenu', restaurantController.updateMenu)

export default router;