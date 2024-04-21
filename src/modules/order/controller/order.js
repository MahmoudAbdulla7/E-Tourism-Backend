import { asyncHandler } from "../../../utils/errorHandling.js";
import Cart from "../../../../DB/model/Cart.model.js";
import TouristDestination from "../../../../DB/model/TouristDestination.model.js";
import Order from "../../../../DB/model/Order.model.js";
import sendEmail from "../../../utils/email.js";
import QRCode from "qrcode";
import { generateToken ,verifyToken } from "../../../utils/GenerateAndVerifyToken.js";

export const createOrder = asyncHandler(async (req, res, next) => {
  const { paymentType, DateOfVisit } = req.body;

  if (!req.body.touristDestination) {
    const cart = await Cart.findOne({ createdBy: req.user._id });
    if (!cart) {
      return next(new Error("cart does not exist", { cayse: 404 }));
    }

    req.body.isCart = true;
    req.body.touristDestination = cart.touristDestination;
  }

  const checkTouristDestination = await TouristDestination.findOne({
    _id: req.body.touristDestination.touristDestinationId,
  });

  if (!checkTouristDestination) {
    return next(
      new Error(
        `not found tourist destination with id :${req.body.touristDestination.touristDestinationId}`,
        { cause: 404 }
      )
    );
  }
  req.body.touristDestination.name = checkTouristDestination.name;

  if (req.body.isCart) {
    //BSON ==> Object
    req.body.touristDestination = req.body.touristDestination.toObject();
  }

  if (!req.body.isCart) {
    req.body.touristDestination.unitPrice = Number(
      checkTouristDestination.ticketPrice
    );
    req.body.touristDestination.finalPrice =
      req.body.touristDestination.unitPrice *
      Number(req.body.touristDestination.quantity);
  }
  // await Cart.findOneAndDelete({createdBy:req.user._id});

  const dummyOrder = {
    userId: req.user._id,
    phone: req.user.phone,
    touristDestination: req.body.touristDestination,
    paymentType,
    status: paymentType == "cash" ? "waitPayment" : "placed",
    DateOfVisit,
  };

  const order = await Order.create(dummyOrder);
  if (!order) {
    return next(new Error("faild to create order ", { cause: 500 }));
  }

  const token = generateToken({
    payload: {
      userId: req.user._id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      orderId: order._id,
      orderStatus: order.status,
      touristDestinationName: req.body.touristDestination.name,
      DateOfVisit,
    },
    signature: process.env.ORDER_TOKEN_SIGNATURE,
    expiresIn: 60 * 60 * 24 * 365,
  });

  const ticketLink = `${req.protocol}://${req.headers.host}/order/${token}`;
  const html =`
  <h2>Your ticket to ${req.body.touristDestination.name.toUpperCase()} ${checkTouristDestination.type}</h2>
  <a href="${ticketLink}">Click Here</a>
  `;

  await sendEmail({
    to: req.user.email,
    subject: `${req.body.touristDestination.name.toUpperCase()} Ticket`,
    html
  });
  return res.status(200).json({ message: "Done", order });

});

export const getTicket =asyncHandler(async(req,res,next)=>{

  const {token} =req.params;
  const ticketData=verifyToken({token,signature:process.env.ORDER_TOKEN_SIGNATURE});
  
  try {
    const url = await QRCode.toDataURL(`${JSON.stringify(ticketData)}`);
    
    return res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
        <title>${ticketData.touristDestinationName.toUpperCase()} Ticket</title>
        </head>
        <body>

        <h1>${ticketData.touristDestinationName.toUpperCase()} Ticket</h1>
        <p>Scan QR Code</p>
        <img src="${url}" alt="Ticket Link"></img>

        </body>
        </html>
    `);
} catch (err) {
    return next(new Error(err, { cause: 500 }));
};
});

export const cancelOrder = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  const { orderId } = req.params;
  const order = await Order.findOne({ _id: orderId, userId: req.user._id });

  if (!order) {
    return next(new Error("you have not order", { cause: 404 }));
  };

  if (order.status=="canceled") {
    return next(new Error(`your order was already canceled`, { cause: 400 }));
  };

  if (
    (order.status !== "placed" && order.paymentType == "cash") ||
    (order.status !== "waitPayment" && order.paymentType == "card")
  ) {
    return next(
      new Error(
        `can not cancel your order after it been changed to ${order.status} `,
        { cause: 400 }
      )
    );
  };

  const canceledOrder = await Order.findOneAndUpdate(
    { _id: orderId },
    { status: "canceled", reason, updatedBy: req.user._id }
  );

  if (!canceledOrder.reason) {
    return next(new Error(`fail to cancel your order `, { cause: 400 }));
  };

  return res.status(200).json({ message: "order is canceled successfully" });
});

export const updateByAdmin = asyncHandler(async (req, res, next) => {

  const { status } = req.body;
  const { orderId } = req.params;
  const order = await Order.findOne({ _id: orderId });

  if (!order) {
    return next(new Error(`order with id :${orderId} is not fouded`, { cause: 404 }));
  };

  const updatedOrder = await Order.findOneAndUpdate(
    { _id: orderId },
    { status, updatedBy: req.user._id }
  );

  if (updatedOrder.status!==status) {
    return next(new Error(`fail to update this order `, { cause: 400 }));
  }

  res.status(200).json({ message: "Order is updated successfully" });
});

export const getAllOrders =asyncHandler(async(req,res,next)=>{

  const orders =await Order.find({}).populate([{
    path:"userId",
    select:"-forgetCode -confirmEmail -password"
  }]);

    return res.status(200).json({orders});

});
