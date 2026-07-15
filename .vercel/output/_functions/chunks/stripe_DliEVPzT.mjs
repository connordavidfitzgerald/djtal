import Stripe from 'stripe';
import { r as readEnv } from './calendar_BRxYh5_w.mjs';

let client = null;
function stripeEnabled() {
  return !!readEnv("STRIPE_SECRET_KEY");
}
function getStripe() {
  if (!client) {
    const key = readEnv("STRIPE_SECRET_KEY");
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    client = new Stripe(key);
  }
  return client;
}

export { getStripe as g, stripeEnabled as s };
