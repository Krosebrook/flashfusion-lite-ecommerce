import { api, APIError } from "encore.dev/api";
import { Header } from "encore.dev/api";
import { paymentDB } from "./db";
import { stripe } from "./stripe";
import { secret } from "encore.dev/config";

const stripeWebhookSecret = secret("StripeWebhookSecret");

interface WebhookRequest {
  signature: Header<"stripe-signature">;
}

// Handles Stripe webhook events.
export const webhook = api<WebhookRequest, void>(
  {expose: true, method: "POST", path: "/webhooks/stripe"},
  async (req, body) => {
    const sig = req.signature;
    
    if (!sig) {
      throw APIError.invalidArgument("Missing stripe-signature header");
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, stripeWebhookSecret());
    } catch (err) {
      throw APIError.invalidArgument(`Webhook signature verification failed: ${err}`);
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }
);

async function handleCheckoutSessionCompleted(session: any) {
  const metadata = session.metadata;
  if (!metadata?.store_id || !metadata?.items) {
    console.error('Missing metadata in checkout session');
    return;
  }

  const storeId = parseInt(metadata.store_id);
  const items = JSON.parse(metadata.items);
  const customerId = metadata.user_id;

  // Create order
  const order = await paymentDB.queryRow`
    INSERT INTO orders (
      store_id, customer_id, customer_email, customer_name,
      total_amount, currency, stripe_session_id, status
    )
    VALUES (
      ${storeId}, ${customerId}, ${session.customer_details?.email}, ${session.customer_details?.name},
      ${session.amount_total}, ${session.currency?.toUpperCase()}, ${session.id}, 'paid'
    )
    RETURNING id
  `;

  if (!order) {
    console.error('Failed to create order from checkout session');
    return;
  }

  // Create order items
  for (const item of items) {
    const product = await paymentDB.queryRow<{price: number}>`
      SELECT price FROM products WHERE id = ${item.product_id}
    `;
    
    if (product) {
      await paymentDB.exec`
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (${order.id}, ${item.product_id}, ${item.quantity}, ${product.price}, ${product.price * item.quantity})
      `;

      // Update stock
      await paymentDB.exec`
        UPDATE products 
        SET stock_quantity = CASE 
          WHEN stock_quantity IS NOT NULL THEN stock_quantity - ${item.quantity}
          ELSE stock_quantity
        END
        WHERE id = ${item.product_id}
      `;
    }
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  // Update order status if payment intent is associated with an order
  await paymentDB.exec`
    UPDATE orders 
    SET status = 'paid', stripe_payment_intent_id = ${paymentIntent.id}
    WHERE stripe_payment_intent_id = ${paymentIntent.id} OR stripe_session_id IN (
      SELECT id FROM checkout_sessions WHERE payment_intent = ${paymentIntent.id}
    )
  `;
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  // Handle subscription payment success
  if (invoice.subscription) {
    await paymentDB.exec`
      UPDATE subscriptions 
      SET status = 'active'
      WHERE stripe_subscription_id = ${invoice.subscription}
    `;
  }
}

async function handleSubscriptionCreated(subscription: any) {
  // Create subscription record
  const metadata = subscription.metadata;
  if (!metadata?.store_id || !metadata?.product_id) {
    console.error('Missing metadata in subscription');
    return;
  }

  await paymentDB.exec`
    INSERT INTO subscriptions (
      store_id, customer_id, customer_email, product_id, stripe_subscription_id,
      status, current_period_start, current_period_end
    )
    VALUES (
      ${parseInt(metadata.store_id)}, ${metadata.user_id}, ${subscription.customer?.email},
      ${parseInt(metadata.product_id)}, ${subscription.id}, ${subscription.status},
      ${new Date(subscription.current_period_start * 1000)}, ${new Date(subscription.current_period_end * 1000)}
    )
    ON CONFLICT (stripe_subscription_id) DO UPDATE SET
      status = EXCLUDED.status,
      current_period_start = EXCLUDED.current_period_start,
      current_period_end = EXCLUDED.current_period_end,
      updated_at = NOW()
  `;
}

async function handleSubscriptionUpdated(subscription: any) {
  await paymentDB.exec`
    UPDATE subscriptions 
    SET 
      status = ${subscription.status},
      current_period_start = ${new Date(subscription.current_period_start * 1000)},
      current_period_end = ${new Date(subscription.current_period_end * 1000)},
      cancel_at_period_end = ${subscription.cancel_at_period_end},
      updated_at = NOW()
    WHERE stripe_subscription_id = ${subscription.id}
  `;
}

async function handleSubscriptionDeleted(subscription: any) {
  await paymentDB.exec`
    UPDATE subscriptions 
    SET status = 'canceled', updated_at = NOW()
    WHERE stripe_subscription_id = ${subscription.id}
  `;
}
