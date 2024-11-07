import { Router } from 'express';
import * as emailVerifyController from "../controllers/emailVerify";

const router = Router();

router.post('/send-otp', emailVerifyController.sendOTP)
router.get('/verify-otp', emailVerifyController.verifyOTP)
router.post('/check-email-verified', emailVerifyController.checkVerification)

export default router;
