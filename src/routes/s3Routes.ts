import { Router } from 'express';
import * as s3Controller from "../controllers/s3"
import multer from "multer";

const router = Router();
const upload = multer();

router.post('/upload',upload.single('photo'), s3Controller.s3Upload)

export default router;