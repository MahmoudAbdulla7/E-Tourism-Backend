import joi from "joi";
import { generalFields } from "../../middleware/validation.js";

const validateLocation = (value, helpers) => {
  // Regular expression to match Google Maps short URLs
  const googleMapsShortUrlRegex = /^https?:\/\/maps\.app\.goo\.gl\/[a-zA-Z0-9_-]+$/;

  if (googleMapsShortUrlRegex.test(value)) {
      return value; // Location is valid
  } else {
      return helpers.error('any.invalid');
  }
};

export const createTouristDestination = joi
  .object({
    cityId: generalFields.id.required(),
    type: joi.string().valid("Museum", "Monument").required(),
    name: joi.string().min(2).max(25).required(),
    description: joi.string().min(5).required(),
    location: joi.string().custom(validateLocation).required(),
    ticketPrice: joi.string().required(),

    file:joi
      .object({
        image: joi
          .array()
          .items(generalFields.file.required())
          .length(1)
          .required(),
        subImages: joi
          .array()
          .items(generalFields.file.required())
          .min(3)
          .max(3),
      })
      .required(),

    openingHours:joi
      .object({
        monday: joi.string(),
        tuesday: joi.string(),
        wednesday: joi.string(),
        thursday: joi.string(),
        friday: joi.string(),
        saturday: joi.string(),
        sunday: joi.string(),
      }),
  })
  .required();

export const updateTouristDestination = joi
.object({
  cityId: generalFields.id.required(),
  touristDestinationId: generalFields.id.required(),
  type: joi.string().valid("Museum", "Monument"),
  name: joi.string().min(2).max(25),
  description: joi.string().min(5),
  location: joi.string().custom(validateLocation),
  ticketPrice: joi.number().min(10),

  file:joi
    .object({
      image: joi
        .array()
        .items(generalFields.file)
        .length(1)
        ,
      subImages: joi
        .array()
        .items(generalFields.file)
        .min(3)
        .max(3),
    }),

  openingHours:joi
    .object({
      monday: joi.string(),
      tuesday: joi.string(),
      wednesday: joi.string(),
      thursday: joi.string(),
      friday: joi.string(),
      saturday: joi.string(),
      sunday: joi.string(),
    }),
})
.required();

export const deleteTouristDestination = joi
.object({
  cityId: generalFields.id.required(),
  touristDestinationId: generalFields.id.required(),
})
.required();