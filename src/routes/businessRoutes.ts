import { Router } from 'express';
import * as restaurantController from "../controllers/restaurant"

const router = Router();

router.post('/createMenu', restaurantController.createMenu)
router.post('/deleteMenu', restaurantController.deleteMenu)
router.post('/updateMenu', restaurantController.updateMenu)
router.post('/updateRestaurant', restaurantController.updateRestaurant)

export default router;