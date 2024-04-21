import { Router } from "express";
import * as authController from './controller/auth.js'
import * as validators from './auth.validation.js'
import {validation} from '../../middleware/validation.js'
import { fileUpload, fileValidation } from "../../utils/multer.js";
import { auth } from "../../middleware/auth.js";

const router = Router();

router.post("/signup",fileUpload(fileValidation.image).single("image"),validation(validators.signUp),authController.signUp);

router.post("/login",validation(validators.logIn),authController.logIn);

router.get("/confirmEmail/:confirmationToken",authController.confirmationToken);

router.get("/unsubscribe/:newConfirmToken",authController.unsubscribe);

router.get("/requestNewConfirmMail/:newConfirmToken",authController.requestNewConfirmMail);

router.patch("/send-code",validation(validators.sendCode),authController.sendCode);

router.patch("/change-password",validation(validators.changePassword),auth(["User","Admin"]),authController.changePassword);

router.patch("/reset-password",validation(validators.resetPassword),authController.resetPassword);

router.get("/:userId",authController.profile);

export default router;