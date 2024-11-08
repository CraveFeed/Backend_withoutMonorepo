import { Router } from 'express';
import * as authController from "../controllers/auth"

const router = Router();

router.post('/signUp', authController.register)
router.post('/signIn', authController.login)

export default router;
