import { secret } from "encore.dev/config";
import Stripe from "stripe";

const stripeSecretKey = secret("StripeSecretKey");

export const stripe = new Stripe(stripeSecretKey(), {
  apiVersion: "2025-02-24.acacia",
});
