import joi from "joi";
import {generalFields} from '../../middleware/validation.js';

export const createReview =joi.object({
    touristDestinationId:generalFields.id.required(),
    cityId:generalFields.id.required(),
    comment:joi.string().min(3).max(15000).required(),
    rating:joi.number().min(1).max(5)
}).required();

export const updateReview =joi.object({
    cityId:generalFields.id.required(),
    touristDestinationId:generalFields.id.required(),
    reviewId:generalFields.id,
    comment:joi.string().min(3).max(15000),
    rating:joi.number().min(1).max(5)

}).required();

export const deleteReview =joi.object({
    
    cityId:generalFields.id.required(),
    touristDestinationId:generalFields.id.required(),
    reviewId:generalFields.id,

}).required();