import { Router } from "express";
import {fileUpload,fileValidation} from '../../utils/multer.js'
import * as cityController from './controller/city.js'
import { validation } from "../../middleware/validation.js";
import * as validators from "./city.validation.js";
import touristDestination from '../touristdestination/TouristDestination.router.js'
import {auth} from "../../middleware/auth.js";
import { endPoint } from "./city.endPoint.js";

const router = Router();

router.post("/",fileUpload(fileValidation.image).single('image'),
            validation(validators.createCity),auth(endPoint.create),
            cityController.createCity);

router.put("/:cityId",fileUpload(fileValidation.image).single('image'),
            validation(validators.updateCity),
            auth(endPoint.update),
            cityController.updateCity);

router.delete("/:cityId",
            validation(validators.deleteCity),
            auth(endPoint.delete),
            cityController.deleteCity);

router.get("/",cityController.getCities);

router.get("/:cityId",cityController.getCityById);

router.use("/:cityId/destination",touristDestination);


export default router