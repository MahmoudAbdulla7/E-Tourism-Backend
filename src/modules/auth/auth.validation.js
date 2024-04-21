import joi from 'joi'
import {generalFields} from '../../middleware/validation.js'

export const signUp =joi.object({
    firstName: generalFields.name.required(),
    lastName: generalFields.name.required(),
    userName:joi.string().min(3).max(20).required(),
    email:generalFields.email,
    password:generalFields.password,
    cpassword:generalFields.cPassword.valid(joi.ref("password")),
    phone: generalFields.phone.required(),
    file:generalFields.file.required(),
    gender: joi.string().valid('male', 'female').required(),
    country:generalFields.name.required()
});

export const resetPassword =joi.object({
    email:generalFields.email,
    password:generalFields.password,
    cpassword:generalFields.cPassword.valid(joi.ref("password")).required(),
    forgetCode:joi.string().min(6).max(6).required()
});

export const logIn =joi.object({
    email:generalFields.email,
    password:generalFields.password,
});

export const sendCode =joi.object({
    email:generalFields.email,
});