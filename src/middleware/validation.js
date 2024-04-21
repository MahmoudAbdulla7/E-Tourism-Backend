import joi from "joi";
import { Types } from "mongoose";
const dataMethods = ["body", "params", "query", "headers", "file"];

const validateObjectId = (value, helper) => {
  return Types.ObjectId.isValid(value)
    ? true
    : helper.message("In-valid objectId");
};

export const generalFields = {
  email: joi
    .string()
    .email({
      minDomainSegments: 2,
      maxDomainSegments: 4,
      tlds: { allow: ["com", "net"] },
    })
    .required(),

  password: joi
    .string()
    .pattern(new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/))
    .required(),

  cPassword: joi.string().required(),
  id: joi.string().custom(validateObjectId).required(),
  optionalId: joi.string().custom(validateObjectId).required(),

  file: joi.object({
    size: joi.number().positive().required(),
    path: joi.string().required(),
    filename: joi.string().required(),
    destination: joi.string().required(),
    mimetype: joi.string().required(),
    encoding: joi.string().required(),
    originalname: joi.string().required(),
    fieldname: joi.string().required(),
  }),
  
  name:joi.string().min(2).max(12),
  phone:joi.string().pattern(new RegExp('^\\+?\\d{6,15}$')),
};

export const validation = (schema) => {
  return (req, res, next) => {
    const inputsData = { ...req.body, ...req.params, ...req.query };
    if (req.file || req.files) {
      inputsData.file = req.file || req.files;
    }
    const validationResult = schema.validate(inputsData, { abortEarly: false });
    if (validationResult.error) {
      return res
        .status(400)
        .json({
          message: "validation err",
          validationErr: validationResult.error.details,
        });
    }
    return next();
  };
};
