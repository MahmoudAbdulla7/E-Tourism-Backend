import { Router } from "express";
import { fileUpload, fileValidation } from "../../utils/multer.js";
import * as TouristDestinationController from "./controller/TouristDestination.js";
import { validation } from "../../middleware/validation.js";
import * as validators from "./TouristDestination.validation.js";
import { auth } from "../../middleware/auth.js";
import { endPoint } from "./TouristDestination.endPoint.js";
import reviewRouter from '../reviews/reviews.router.js'

const router = Router({ mergeParams: true });

router.post(
  "/",
  fileUpload(fileValidation.image).fields([
    { name: "image", maxCount: 1 },
    { name: "subImages", maxCount: 3 },
  ]),
  validation(validators.createTouristDestination),
  auth(endPoint.create),
  TouristDestinationController.createTouristDestination
);

router.put(
  "/:touristDestinationId",
  fileUpload(fileValidation.image).fields([
    { name: "image", maxCount: 1 },
    { name: "subImages", maxCount: 3 },
  ]),
  validation(validators.updateTouristDestination),
  auth(endPoint.update),
  TouristDestinationController.updateTouristDestination
);

router.delete(
  "/:touristDestinationId",
  validation(validators.deleteTouristDestination),
  auth(endPoint.delete),
  TouristDestinationController.deleteTouristDestination
);

router.get("/",TouristDestinationController.getTouristDestinationsByCityId);

router.get("/:destinationId",TouristDestinationController.getTouristDestinationById);

router.use("/:touristDestinationId/review",reviewRouter);

export default router;
