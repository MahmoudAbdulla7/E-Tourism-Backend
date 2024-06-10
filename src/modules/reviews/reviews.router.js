import { Router } from "express";
import * as reviewController from './controller/review.js'
import {auth} from '../../middleware/auth.js'
import {endPoint} from './reviews.endPoint.js'
import {validation} from '../../middleware/validation.js'
import * as validators from './reviews.validation.js'

const router = Router({mergeParams:true});

router.post('/',validation(validators.createReview),auth(endPoint.create) ,reviewController.createComment);

router.put('/:reviewId',validation(validators.updateReview),auth(endPoint.update), reviewController.updateComment);

router.delete('/:reviewId',validation(validators.updateReview),auth(endPoint.delete), reviewController.deleteComment);

router.get('/', reviewController.getAllReviews);

export default router;