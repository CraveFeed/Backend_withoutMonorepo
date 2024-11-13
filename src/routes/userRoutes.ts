import { Router } from 'express';
import * as userController from "../controllers/user"
import * as chatController from "../controllers/chat"
import * as restaurantController from "../controllers/restaurant"
import * as nibbleController from "../controllers/chefCorner"

const router = Router();

router.post('/comment-post', userController.commentOnPost)
router.post('/deleteComment-post', userController.deleteComment)
router.post('/likeUnlike-post', userController.likeUnlikePost)
router.post('/create-post', userController.createPost)
router.post('/repost-post', userController.repostPost)
router.post('/followUnfolow-user', userController.followUnfollowUser)
router.post('/getChatList', chatController.getChatList)
router.post('/getChatHistory', chatController.getChatHistory)
router.post('/getRestaurantDetails', restaurantController.getRestaurantDetails)
router.post('/getRestaurantFollowers', restaurantController.getRestaurantFollowers)
router.post('/getRestaurantFollowing', restaurantController.getRestaurantFollowing)
router.post('/getNibbles', nibbleController.getNibbles)
router.post('/createReel', nibbleController.createReel)
router.post('/likeUnlikeReel', nibbleController.likeUnlikeReel)
router.post('/createCommentOnReel', nibbleController.createCommentOnReel)
router.post('/deleteCommentOnReel', nibbleController.deleteCommentOnReel)

export default router;
