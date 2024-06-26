import { default as Stripe } from "stripe";

async function payment({

  stripe = new Stripe(process.env.STRIPE_KEY),
  payment_method_types = ["card"],
  mode = "payment",
  success_url=process.env.SUCCESS_URL,
  cancel_url=process.env.CANCEL_URL,
  customer_email,
  metadata={},
  discounts = [],
  line_items = [],

} = []) {

  const session = await stripe.checkout.sessions.create({
    payment_method_types,
    mode,
    customer_email,
    success_url,
    cancel_url,
    metadata,
    discounts,
    line_items,
  });

  return session;
};

export default payment;