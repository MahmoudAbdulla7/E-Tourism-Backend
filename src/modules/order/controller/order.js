import { asyncHandler } from "../../../utils/errorHandling.js";
import Cart from "../../../../DB/model/Cart.model.js";
import TouristDestination from "../../../../DB/model/TouristDestination.model.js";
import Order from "../../../../DB/model/Order.model.js";
import sendEmail from "../../../utils/email.js";
import QRCode from "qrcode";
import {
  generateToken,
  verifyToken,
} from "../../../utils/GenerateAndVerifyToken.js";
import payment from "../../../utils/payment.js";
import Stripe from "stripe";
import User from "../../../../DB/model/User.model.js";

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

  const dummyOrder = {
    userId: req.user._id,
    phone: req.user.phone,
    touristDestination: req.body.touristDestination,
    paymentType,
    faceId: req.body.faceId,
    status: "waitPayment",
    DateOfVisit,
  };

  const order = await Order.create(dummyOrder);

  if (!order) {
    return next(new Error("faild to create order ", { cause: 500 }));
  }

  const session = await payment({
    customer_email: req.user.email,
    metadata: {
      orderId: order._id.toString(),
    },
    cancel_url: `${process.env.CANCEL_URL}?orderId=${order._id.toString()}`,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: order.touristDestination.name },
          unit_amount: order.touristDestination.unitPrice * 100,
        },
        quantity: order.touristDestination.quantity,
      },
    ],
  });

  return res.status(200).json({ message: "Done", order, url: session.url });
});

export const webhook = asyncHandler(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const stripe = new Stripe(process.env.STRIPE_KEY);
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.endpointSecret
    );
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  const { orderId } = event.data.object.metadata;

  if (event.type !== "checkout.session.completed") {
    await Order.findByIdAndUpdate(orderId, { status: "rejected" });
    return res.status(400).json({ message: "Ticket is rejected" });
  }

  const order = await Order.findByIdAndUpdate(
    orderId,
    { status: "placed" },
    { new: true }
  );

  if (!order) {
    res.status(404).json({ message: "Order not found" });
    return;
  }

  const user = await User.findById(order.userId);

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  // Generate a token for the order ticket
  const token = generateToken({
    payload: {
      userId: user._id,
      orderId,
      userName: user.userName,
      orderStatus: order.status,
      touristDestinationName: order.touristDestination.name,
      dateOfVisit: order.dateOfVisit,
      faceId: order.faceId,
    },
    signature: process.env.ORDER_TOKEN_SIGNATURE,
    expiresIn: 60 * 60 * 24 * 365,
  });

  const ticketLink = `https://e-tourism-backend.vercel.app/order/${token}`;
  const emailContent = `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Ticket Confirmation</title>
</head>

<body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0;">

  <table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: auto; border-collapse: collapse;">
    <tr>
      <td bgcolor="#F0F0F0" style="padding: 20px;">
        <table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px;">
          <tr>
            <td bgcolor="#131550" align="center" style="padding: 20px; color: #ffffff;">
              <h1 style="margin: 0;">Egypt Here</h1>
            </td>
          </tr>
          <tr>
            <td bgcolor="#ffffff" style="padding: 20px;">
              <p><strong>Hello!</strong></p>
              <p>Thank you for choosing us, and we look forward to welcoming you soon!</p>
              <p>Your ticket for the <strong>${order.touristDestination.name.toUpperCase()}</strong> has been successfully booked!</p>
              <p>Date of visit: ${order.DateOfVisit}</p> <!-- Add the date of the visit here -->
              <p>Click the button below to view your ticket:</p>
              <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                <tr>
                  <td bgcolor="#131550" style="border-radius: 5px;">
                    <a href="${ticketLink}" target="_blank" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #ffffff; text-decoration: none;">View Your Ticket</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

</body>

</html>`;

  await sendEmail({
    to: user.email,
    subject: `${order.touristDestination.name.toUpperCase()} Ticket`,
    html: emailContent,
  });

  res.status(201).json({ message: "Ticket is placed" });
});

export const getTicket = asyncHandler(async (req, res, next) => {

  const { token } = req.params;
  const ticketData = verifyToken({
    token,
    signature: process.env.ORDER_TOKEN_SIGNATURE,
  });
  //generate front-end link
  const frontEndLink = `${process.env.Front_End}inspector/${token}`;

  try {
    const url = await QRCode.toDataURL(`${frontEndLink}`);

    return res.status(200).send(`
      <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${ticketData.touristDestinationName.toUpperCase()} Ticket</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f4f4f4;">
    <div style="background-color: white; border: 2px solid #131550; border-radius: 10px; width: 350px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2); overflow: hidden;">
        <div style="background-color:#131550; color: white; padding: 15px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Egypt Here</h1>
        </div>
        <div style="padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="${url}" alt="QR Code" style="width: 150px; height: 150px; border: 2px solid #333; border-radius: 5px;">
            </div>
            <h2 style="text-align: center; color: #333; margin: 0;">${ticketData.touristDestinationName}</h2>
            <p style="text-align: center; color: #666; margin-top: 10px;">Welcome to an unforgettable experience!</p>
        </div>
        <div style="background-color:#131550; color: white; padding: 10px; text-align: center;">
            <p style="margin: 0;">Please present this ticket at the entrance</p>
        </div>
    </div>
</body>
</html>`);
  } catch (err) {
    return next(new Error(err, { cause: 500 }));
  }
});

export const cancelOrder = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  const { orderId } = req.params;
  const order = await Order.findOne({ _id: orderId, userId: req.user._id });

  if (!order) {
    return next(new Error("you have not order", { cause: 404 }));
  }

  if (order.status == "canceled") {
    return next(new Error(`your order was already canceled`, { cause: 400 }));
  }

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
  }

  const canceledOrder = await Order.findOneAndUpdate(
    { _id: orderId },
    { status: "canceled", reason, updatedBy: req.user._id }
  );

  if (!canceledOrder.reason) {
    return next(new Error(`fail to cancel your order `, { cause: 400 }));
  }

  return res.status(200).json({ message: "order is canceled successfully" });
});

export const updateByInspector = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const { orderId } = req.params;
  const order = await Order.findOne({ _id: orderId });

  if (order?.status == "delivered") {
    console.log("error");
    return next( new Error(`Ticket is already ${order.status}`, { cause: 409 }));
  }

  if (!order) {
    return next(
      new Error(`order with id :${orderId} is not fouded`, { cause: 404 })
    );
  }

  const updatedOrder = await Order.findOneAndUpdate(
    { _id: orderId },
    { status, updatedBy: req.user._id }
  );

  if (updatedOrder.status == status) {
    return next(new Error(`fail to update this order `, { cause: 400 }));
  }

  res.status(200).json({ message: "Order is updated successfully" });
});

export const getAllOrders = asyncHandler(async (req, res, next) => {
  const { filterByDay } = req.params;

  if (filterByDay === "true") {
    const date = new Date();
    // date.setDate(date.getDate() + 1);
    const currentDay = date.toISOString();

    date.setDate(date.getDate() + 1);
    const nextDay = date.toISOString();

    console.log({ currentDay, nextDay });

    const filteredOreders = await Order.find({
      DateOfVisit: {
        $gte: currentDay,
        $lte: nextDay,
      },
    }).populate([
      {
        path: "userId",
        select: "-forgetCode -confirmEmail -password",
      },
    ]);
    return res.status(200).json({ filteredOreders });
  }

  const orders = await Order.find({}).populate([
    {
      path: "userId",
      select: "-forgetCode -confirmEmail -password",
    },
  ]);

  return res.status(200).json({ orders });
});

export const getSpecificTicket = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const orders = await Order.findById(id, " -paymentType").populate([
    {
      path: "userId",
      select:
        "-email -userName -wishList -forgetCode -confirmEmail -active -role -password ",
    },
  ]);

  return res.status(200).json({ orders });
});

export const getMyTickets = asyncHandler(async (req, res, next) => {


  const orders = await Order.find({userId:req.user._id}).populate([
    {
      path: "userId",
      select: "-forgetCode -confirmEmail -password",
    },
  ]);

  return res.status(200).json({ orders });
});
