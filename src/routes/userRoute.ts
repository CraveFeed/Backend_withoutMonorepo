import { Router } from 'express';
import * as authController from "../controllers/auth"
import { authenticateUser } from "../middlewares/authMiddleware";

const router = Router();

router.post('/signUp', authController.register)

router.use(authenticateUser);

router.get('/signIn', authController.login)

export default router;
