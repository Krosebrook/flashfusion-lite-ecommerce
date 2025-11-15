import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { orderDB } from "./db";
import type { Order } from "./types";
import { orderStatusTopic } from "../realtime/topics";

interface UpdateOrderStatusParams {
  storeId: number;
  id: number;
}

interface UpdateOrderStatusRequest {
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
}

// Updates an order status if the user has permission.
export const updateStatus = api<UpdateOrderStatusParams & UpdateOrderStatusRequest, Order>(
  {auth: true, expose: true, method: "PUT", path: "/stores/:storeId/orders/:id/status"},
  async (req) => {
    const auth = getAuthData()!;

    // Check if user has permission to manage orders for this store
    const permission = await orderDB.queryRow`
      SELECT o.id
      FROM orders o
      JOIN stores s ON o.store_id = s.id
      LEFT JOIN store_members sm ON s.id = sm.store_id
      WHERE o.id = ${req.id} AND o.store_id = ${req.storeId} AND (s.owner_id = ${auth.userID} OR (sm.user_id = ${auth.userID} AND sm.role IN ('owner', 'editor')))
    `;

    if (!permission) {
      throw APIError.notFound("Order not found or insufficient permissions");
    }

    const currentOrder = await orderDB.queryRow<Order>`
      SELECT * FROM orders WHERE id = ${req.id}
    `;

    if (!currentOrder) {
      throw APIError.notFound("Order not found");
    }

    const order = await orderDB.queryRow<Order>`
      UPDATE orders 
      SET status = ${req.status}, updated_at = NOW()
      WHERE id = ${req.id}
      RETURNING *
    `;

    if (!order) {
      throw APIError.internal("Failed to update order status");
    }

    await orderStatusTopic.publish({
      orderId: order.id,
      storeId: order.store_id,
      customerId: order.customer_id || "",
      customerEmail: order.customer_email,
      oldStatus: currentOrder.status,
      newStatus: order.status,
      timestamp: new Date(),
    });

    return order;
  }
);
