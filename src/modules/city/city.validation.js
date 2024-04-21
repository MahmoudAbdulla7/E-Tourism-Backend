import joi from "joi";
import { generalFields } from "../../middleware/validation.js";

export const createCity =joi.object({
    name:joi.string().min(2).max(25).required(),
    file:generalFields.file.required()
}).required();

export const updateCity =joi.object({
    cityId:generalFields.id.required(),
    name:joi.string().min(2).max(25),
    file:generalFields.file
}).required();

export const deleteCity =joi.object({
    cityId:generalFields.id.required(),
}).required();