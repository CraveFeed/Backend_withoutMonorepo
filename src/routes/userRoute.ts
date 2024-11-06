import { Router } from 'express';
import * as authController from "../controllers/auth"
import { authenticateUser } from "../middlewares/authMiddleware";

const router = Router();

router.post('/signUp', authController.register)
router.post('/signIn', authController.login)

router.use(authenticateUser);

export default router;
