import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { orderDB } from "./db";
import type { CreateOrderRequest, OrderWithItems, Order, OrderItem } from "./types";
import { newOrderTopic, stockUpdateTopic } from "../realtime/topics";

interface CreateOrderParams {
  storeId: number;
}

interface CreateOrderBody extends CreateOrderRequest {}

// Creates a new order for a store.
export const create = api<CreateOrderParams & CreateOrderBody, OrderWithItems>(
  {auth: true, expose: true, method: "POST", path: "/stores/:storeId/orders"},
  async (req) => {
    const auth = getAuthData()!;

    // Verify store exists
    const store = await orderDB.queryRow`
      SELECT id FROM stores WHERE id = ${req.storeId} AND is_active = true
    `;

    if (!store) {
      throw APIError.notFound("Store not found");
    }

    if (!req.items || req.items.length === 0) {
      throw APIError.invalidArgument("Order must contain at least one item");
    }

    // Validate products and calculate total
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of req.items) {
      const product = await orderDB.queryRow<{id: number; name: string; price: number; stock_quantity?: number; is_active: boolean}>`
        SELECT id, name, price, stock_quantity, is_active
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

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: product.price,
        total_price: itemTotal,
        product_name: product.name
      });
    }

    // Create the order
    const order = await orderDB.queryRow<Order>`
      INSERT INTO orders (
        store_id, customer_id, customer_email, customer_name,
        total_amount, shipping_address, billing_address
      )
      VALUES (
        ${req.storeId}, ${auth.userID}, ${req.customer_email}, ${req.customer_name || null},
        ${totalAmount}, ${req.shipping_address || null}, ${req.billing_address || null}
      )
      RETURNING *
    `;

    if (!order) {
      throw APIError.internal("Failed to create order");
    }

    // Create order items
    const orderItems = [];
    for (const item of validatedItems) {
      const orderItem = await orderDB.queryRow<OrderItem>`
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (${order.id}, ${item.product_id}, ${item.quantity}, ${item.unit_price}, ${item.total_price})
        RETURNING *
      `;
      if (orderItem) {
        orderItems.push({
          ...orderItem,
          product_name: item.product_name
        });
      }
    }

    for (const item of validatedItems) {
      const product = await orderDB.queryRow<{stock_quantity: number | null}>`
        SELECT stock_quantity FROM products WHERE id = ${item.product_id}
      `;
      
      const oldStock = product?.stock_quantity ?? 0;
      
      await orderDB.exec`
        UPDATE products 
        SET stock_quantity = CASE 
          WHEN stock_quantity IS NOT NULL THEN stock_quantity - ${item.quantity}
          ELSE stock_quantity
        END
        WHERE id = ${item.product_id}
      `;
      
      const newStock = oldStock - item.quantity;
      
      if (product?.stock_quantity !== null) {
        await stockUpdateTopic.publish({
          productId: item.product_id,
          storeId: req.storeId,
          oldStock,
          newStock,
          timestamp: new Date(),
        });
      }
    }

    await newOrderTopic.publish({
      orderId: order.id,
      storeId: order.store_id,
      customerId: auth.userID,
      customerEmail: order.customer_email,
      totalAmount: order.total_amount,
      timestamp: new Date(),
    });

    return {
      ...order,
      items: orderItems
    };
  }
);
