import { Router } from "express";
import * as orderController from "./controller/order.js";
import {auth} from '../../middleware/auth.js'
import { endPoint } from "./order.endPoint.js";
import {validation} from '../../middleware/validation.js'
import express from "express"
import * as validator from './order.validation.js'

const router = Router();

router.post('/',validation(validator.createOrder),auth(endPoint.create), orderController.createOrder);

router.get('/:token',validation(validator.getTicket), orderController.getTicket);

router.get('/',auth(endPoint.getAll), orderController.getAllOrders);

router.patch('/:orderId',validation(validator.cancel),auth(endPoint.cancel), orderController.cancelOrder);

router.patch('/:orderId',validation(validator.update),auth(endPoint.update), orderController.updateByAdmin);

router.post('/webhook', express.raw({type: 'application/json'}), orderController.webhook);

export default router;