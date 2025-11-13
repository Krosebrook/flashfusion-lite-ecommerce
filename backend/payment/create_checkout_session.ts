import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { paymentDB } from "./db";
import { stripe } from "./stripe";

interface CreateCheckoutSessionParams {
  storeId: number;
}

interface CreateCheckoutSessionRequest {
  items: Array<{
    product_id: number;
    quantity: number;
  }>;
  success_url: string;
  cancel_url: string;
  customer_email?: string;
}

interface CreateCheckoutSessionResponse {
  session_id: string;
  url: string;
}

// Creates a Stripe checkout session for an order.
export const createCheckoutSession = api<CreateCheckoutSessionParams & CreateCheckoutSessionRequest, CreateCheckoutSessionResponse>(
  {auth: true, expose: true, method: "POST", path: "/stores/:storeId/checkout"},
  async (req) => {
    const auth = getAuthData()!;

    // Verify store exists
    const store = await paymentDB.queryRow<{id: number; name: string}>`
      SELECT id, name FROM stores WHERE id = ${req.storeId} AND is_active = true
    `;

    if (!store) {
      throw APIError.notFound("Store not found");
    }

    if (!req.items || req.items.length === 0) {
      throw APIError.invalidArgument("Checkout must contain at least one item");
    }

    // Validate products and build line items
    const lineItems = [];
    let totalAmount = 0;

    for (const item of req.items) {
      const product = await paymentDB.queryRow<{
        id: number; 
        name: string; 
        description?: string;
        price: number; 
        currency: string;
        is_subscription: boolean;
        subscription_interval?: string;
        subscription_interval_count: number;
        stock_quantity?: number; 
        is_active: boolean;
      }>`
        SELECT id, name, description, price, currency, is_subscription, subscription_interval, subscription_interval_count, stock_quantity, is_active
        FROM products 
        WHERE id = ${item.product_id} AND store_id = ${req.storeId}
      `;

      if (!product) {
        throw APIError.invalidArgument(`Product with ID ${item.product_id} not found`);
      }

      if (!product.is_active) {
        throw APIError.invalidArgument(`Product ${product.name} is not available`);
      }

      if (product.stock_quantity !== null && product.stock_quantity !== undefined && product.stock_quantity < item.quantity) {
        throw APIError.invalidArgument(`Insufficient stock for product ${product.name}`);
      }

      totalAmount += product.price * item.quantity;

      if (product.is_subscription) {
        // Create subscription line item
        lineItems.push({
          price_data: {
            currency: product.currency.toLowerCase(),
            product_data: {
              name: product.name,
              description: product.description || undefined,
            },
            unit_amount: product.price,
            recurring: {
              interval: product.subscription_interval as 'month' | 'year',
              interval_count: product.subscription_interval_count,
            },
          },
          quantity: item.quantity,
        });
      } else {
        // Create one-time payment line item
        lineItems.push({
          price_data: {
            currency: product.currency.toLowerCase(),
            product_data: {
              name: product.name,
              description: product.description || undefined,
            },
            unit_amount: product.price,
          },
          quantity: item.quantity,
        });
      }
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: lineItems.some(item => item.price_data?.recurring) ? 'subscription' : 'payment',
      success_url: req.success_url,
      cancel_url: req.cancel_url,
      customer_email: req.customer_email || auth.email || undefined,
      metadata: {
        store_id: req.storeId.toString(),
        user_id: auth.userID,
        items: JSON.stringify(req.items),
      },
    });

    if (!session.id || !session.url) {
      throw APIError.internal("Failed to create checkout session");
    }

    return {
      session_id: session.id,
      url: session.url,
    };
  }
);
