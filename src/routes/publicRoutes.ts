import { Router } from 'express';
import * as postController from "../controllers/posts"
import * as restaurantController from "../controllers/restaurant"
import * as nibbleController from "../controllers/chefCorner"

const router = Router();

router.post('/getHashStartingWith', postController.getHashStartingWith)
router.post('/getPostsByHashtag', postController.getPostsByHashtag)
router.post('/getCommentsOfPosts', postController.getCommentsOfPosts)
router.post('/getLikesOfPosts', postController.getLikesOfPosts)
router.post('/getRestaurantDetails', restaurantController.getRestaurantDetails)
router.post('/getRestaurantFollowers', restaurantController.getRestaurantFollowers)
router.post('/getRestaurantFollowing', restaurantController.getRestaurantFollowing)
router.post('/getRestaurantStartingWith', postController.getRestaurantStartingWith)
router.post('/getUsersStartingWith', postController.getUsersStartingWith)
router.post('/getUserProfileSummary', postController.getUserProfileSummary)
router.post('/getUsersPosts', postController.getUsersPosts)
router.post('/getUserFollowers', postController.getUserFollowers)
router.post('/getUserFollowing', postController.getUserFollowing)
router.post('/getRestaurantMenu', restaurantController.getRestaurantMenu)
router.post('/getRestaurantPosts', restaurantController.getRestaurantPosts)
router.post('/getNibbles', nibbleController.getNibbles)
router.post('/getCommentsOfReel', nibbleController.getCommentsOfReel)
router.post('/getLikesOfReel', nibbleController.getLikesOfReel)


export default router;