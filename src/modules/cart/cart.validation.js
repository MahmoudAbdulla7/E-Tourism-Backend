import joi from "joi";
import {generalFields} from '../../middleware/validation.js';

export const createCart =joi.object({

    touristDestinationId:generalFields.id.required(),
    quantity:joi.number().positive().required()

}).required();
