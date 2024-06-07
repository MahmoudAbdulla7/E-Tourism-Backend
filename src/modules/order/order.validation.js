import joi from"joi";
import {generalFields} from '../../middleware/validation.js'

export const createOrder =joi.object({
    paymentType:joi.string().valid("cash","card"),
    DateOfVisit:joi.date().required().min('now').messages({
        'date.base': 'Invalid date format.',
        'date.min': 'Date must be in the future.',
        'any.required': 'Event date is required.'
    }),
    faceId:joi.string().min(36).max(38).required(),
    touristDestination:joi.object({
        touristDestinationId:generalFields.id,
        quantity:joi.number().min(1).positive().integer().required()
    })
}).required();

export const getTicket =joi.object({
    token:joi.string().required()
});

export const cancel =joi.object({
    reason:joi.string().min(3).required(),
    orderId:generalFields.id
});

export const update =joi.object({
    status:joi.string().valid('onWay','delivered').required(),
    orderId:generalFields.id.required()
}).required();