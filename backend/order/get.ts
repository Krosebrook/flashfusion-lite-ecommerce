import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { orderDB } from "./db";
import type { OrderWithItems } from "./types";

interface GetOrderParams {
  storeId: number;
  id: number;
}

// Gets an order by ID if the user has permission.
export const get = api<GetOrderParams, OrderWithItems>(
  {auth: true, expose: true, method: "GET", path: "/stores/:storeId/orders/:id"},
  async (params) => {
    const auth = getAuthData()!;

    // Check if user has permission to view this order
    const orderResult = await orderDB.rawQueryRow<OrderWithItems & {items_data: string}>(
      `
      SELECT 
        o.*,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', oi.id,
              'order_id', oi.order_id,
              'product_id', oi.product_id,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'total_price', oi.total_price,
              'created_at', oi.created_at,
              'product_name', p.name,
              'product_description', p.description
            ) ORDER BY oi.id
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) as items_data
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      JOIN stores s ON o.store_id = s.id
      LEFT JOIN store_members sm ON s.id = sm.store_id
      WHERE o.id = $1 AND o.store_id = $2 AND (
        s.owner_id = $3 OR 
        sm.user_id = $3 OR 
        o.customer_id = $3
      )
      GROUP BY o.id
      `,
      params.id,
      params.storeId,
      auth.userID
    );

    if (!orderResult) {
      throw APIError.notFound("Order not found or access denied");
    }

    return {
      ...orderResult,
      items: typeof orderResult.items_data === 'string' ? JSON.parse(orderResult.items_data) : orderResult.items_data
    };
  }
);
