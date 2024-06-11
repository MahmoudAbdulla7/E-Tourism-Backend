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
  const emailContent = `
<body style="border-radius: 25px;
             color:white; background-color: rgba(33, 36, 41, 1); padding:7px;">

<h2>Hello!</h2>
<h3>Thank you for choosing us, and we look forward to welcoming you soon!</h3>
<div style="border-radius: 25px;
            background-color: rgba(24, 25, 29, 1); text-align: center; padding: 20px;">
  <h3 >Your ticket to the ${order.touristDestination.name.toUpperCase()} has been successfully booked</h3>
  <p>
    <a href="${ticketLink}" style="text-align: center; border-radius: 25px; padding: 8px 30px; margin: auto; 
background-color: #072248; color: white; text-decoration: none;">
      <strong>View Your Ticket</strong>
    </a>
  </p>
</div>

</body>
  `;

  await sendEmail({
    to: user.email,
    subject: `${order.touristDestination.name.toUpperCase()} Ticket`,
    html: emailContent,
  });

  res.status(200).json({ message: "Ticket is placed" });
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

      <html><head>
        <title>${ticketData.touristDestinationName.toUpperCase()} Ticket</title>
        </head>

      <body style="line-height: 1; margin: 0; padding: 0; border: 0; font-size: 100%; font: inherit; vertical-align: baseline;" cz-shortcut-listen="true">

  <div id="raffle-red" class="entry raffle" style="background: #000000;text-align: center;min-height: 100vh;position: relative;height: 100%;float: left;width: 100%;">
    <div class="no-scale" style="width: 268px;height: 134px;margin-left: -109px;margin-top: -55px;background-repeat: no-repeat;position: absolute;left: 50%;top: 50%;background-image: radial-gradient(circle at top left, transparent 17px, #dc143c 17px), radial-gradient(circle at top right, transparent 17px, #dc143c 17px), radial-gradient(circle at bottom left, transparent 17px, #dc143c 17px), radial-gradient(circle at bottom right, transparent 17px, #dc143c 17px);box-shadow: 0 38px 14px -35px rgba(0,0,0,0.3);background-size: 50% 50%;background-position: top left, top right, bottom left, bottom right;">
      <div style="display: block; content: ''; position: absolute; box-sizing: border-box; color: #333;">
      </div>
      <div style="display: block; content: ''; position: absolute; box-sizing: border-box; color: #333;">
      </div>
      <div style="font-family: 'HelveticaNeue-CondensedBold', 'Arial Narrow', Impact, 'Roboto', sans-serif;letter-spacing: 2px;text-transform: uppercase;display: block;content: 'ticket';position: absolute;box-sizing: border-box;color: #b1bde9;width: 240px;height: 92px;padding-left: 40px;left: -7px;top: 17px;background-size: 7px 7px;background-repeat: repeat-y;background-position: 0 0, 0 0, 100% 0, 100% 0;/* background-image: linear-gradient(45deg, transparent 75%, #dc143c 75%), linear-gradient(135deg, transparent 75%, #dc143c 75%), linear-gradient(-45deg, transparent 75%, #dc143c 75%), linear-gradient(-135deg, transparent 75%, #dc143c 75%); */line-height: 1.9;font-size: 42px;text-align: left;">
       <img src="${url}" style="
    width: 100px;
">
      </div>
      <div style="display: block;content: 'BB94CF';position: absolute;box-sizing: border-box;color: #ffffff;border-radius: 10px;transform: rotate(-90deg);font-size: 18px;/* font-family: monospace; */text-align: center;line-height: 1;width: 167px;height: 208px;padding-top: 163px;top: -36px;left: 8px;background: linear-gradient(to bottom, transparent 155px, #000000 155px, #000000 158px, transparent 158px);/* border: 3px solid #b1bde9; */">${
        ticketData.touristDestinationName
      }</div>
      
    </div>
  </div>
    </body></html>

    `);
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
    date.setDate(date.getDate() + 1);
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
