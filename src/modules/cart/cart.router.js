import { Router } from "express";
import * as cartController from "./controller/cart.js";
import { auth } from "../../middleware/auth.js";
import { endPoint } from "./cart.endPoint.js";
import { validation } from "../../middleware/validation.js";
import * as validators from "./cart.validation.js";

const router = Router();

router.post('/',validation(validators.createCart),auth(endPoint.create), cartController.createCart);

router.delete('/',auth(endPoint.create), cartController.deleteCart);

router.get('/',auth(endPoint.create), cartController.getCart);

export default router;