import { Router } from 'express';
import * as shareController from "../controllers/share";

const router = Router();

router.post('/post', shareController.shareablePost)
router.post('/comment', shareController.shareableComment)

export default router;