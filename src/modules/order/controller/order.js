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
    faceId:req.body.faceId,
    status: "waitPayment",
    DateOfVisit,
  };

  const order = await Order.create(dummyOrder);

  if (!order) {
    return next(new Error("faild to create order ", { cause: 500 }));
  }

  const session= await payment({
    customer_email: req.user.email,
    metadata: {
      orderId: order._id.toString(),
    },
    cancel_url: `${process.env.CANCEL_URL}?orderId=${order._id.toString()}`,
    line_items:  [{
      price_data: {
        currency: "usd",
        product_data: { name:order.touristDestination.name },
        unit_amount:order.touristDestination.unitPrice*100,
      },quantity:order.touristDestination.quantity
    }],
  });

  return res.status(200).json({ message: "Done", order,url:session.url });
});

export const webhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const stripe = new Stripe(process.env.STRIPE_KEY);
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.endpointSecret);
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  const { orderId } = event.data.object.metadata;

  if (event.type !== 'checkout.session.completed') {
    await Order.findByIdAndUpdate(orderId, { status: 'rejected' });
    return res.status(400).json({ message: 'Ticket is rejected' });
  }

  const order = await Order.findByIdAndUpdate(orderId, { status: 'placed' }, { new: true });

  if (!order) {
    res.status(404).json({ message: 'Order not found' });
    return;
  }

  const user = await User.findById(order.userId);

  if (!user) {
    res.status(404).json({ message: 'User not found' });
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
  <p style="color: red;">
    <a href="${ticketLink}" style="text-align: center; border-radius: 25px; padding: 3px 15px; display: flex; margin: auto; justify-content: center; background-color: rgba(59, 158, 245, 1); color: black; text-decoration: none;">
      View Your Ticket
      <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" style="width: 20px; margin-left: 3px;">
        <path d="M490.18,181.4l-44.13-44.13a20,20,0,0,0-27-1,30.81,30.81,0,0,1-41.68-1.6h0A30.81,30.81,0,0,1,375.77,93a20,20,0,0,0-1-27L330.6,21.82a19.91,19.91,0,0,0-28.13,0L232.12,92.16a39.87,39.87,0,0,0-9.57,15.5,7.71,7.71,0,0,1-4.83,4.83,39.78,39.78,0,0,0-15.5,9.58L21.82,302.47a19.91,19.91,0,0,0,0,28.13L66,374.73a20,20,0,0,0,27,1,30.69,30.69,0,0,1,43.28,43.28,20,20,0,0,0,1,27l44.13,44.13a19.91,19.91,0,0,0,28.13,0l180.4-180.4a39.82,39.82,0,0,0,9.58-15.49,7.69,7.69,0,0,1,4.84-4.84,39.84,39.84,0,0,0,15.49-9.57l70.34-70.35A19.91,19.91,0,0,0,490.18,181.4ZM261.81,151.75a16,16,0,0,1-22.63,0l-11.51-11.51a16,16,0,0,1,22.63-22.62l11.51,11.5A16,16,0,0,1,261.81,151.75Zm44,44a16,16,0,0,1-22.62,0l-11-11a16,16,0,1,1,22.63-22.63l11,11A16,16,0,0,1,305.83,195.78Zm44,44a16,16,0,0,1-22.63,0l-11-11a16,16,0,0,1,22.63-22.62l11,11A16,16,0,0,1,349.86,239.8Zm44.43,44.54a16,16,0,0,1-22.63,0l-11.44-11.5a16,16,0,1,1,22.68-22.57l11.45,11.49A16,16,0,0,1,394.29,284.34Z"/>
      </svg>
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

  res.status(200).json({ message: 'Ticket is placed' });
});

export const getTicket = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const ticketData = verifyToken({
    token,
    signature: process.env.ORDER_TOKEN_SIGNATURE,
  });

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

export const updateByAdmin = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const { orderId } = req.params;
  const order = await Order.findOne({ _id: orderId });

  if (!order) {
    return next(
      new Error(`order with id :${orderId} is not fouded`, { cause: 404 })
    );
  }

  const updatedOrder = await Order.findOneAndUpdate(
    { _id: orderId },
    { status, updatedBy: req.user._id }
  );

  if (updatedOrder.status !== status) {
    return next(new Error(`fail to update this order `, { cause: 400 }));
  }

  res.status(200).json({ message: "Order is updated successfully" });
});

export const getAllOrders = asyncHandler(async (req, res, next) => {
  const orders = await Order.find({}).populate([
    {
      path: "userId",
      select: "-forgetCode -confirmEmail -password",
    },
  ]);

  return res.status(200).json({ orders });
});
