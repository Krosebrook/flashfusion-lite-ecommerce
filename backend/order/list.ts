import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { Query } from "encore.dev/api";
import { orderDB } from "./db";
import type { OrderWithItems } from "./types";

interface ListOrdersParams {
  storeId: number;
  status?: Query<string>;
  limit?: Query<number>;
  offset?: Query<number>;
}

export interface ListOrdersResponse {
  orders: OrderWithItems[];
  total: number;
}

// Lists orders for a store if the user has permission.
export const list = api<ListOrdersParams, ListOrdersResponse>(
  {auth: true, expose: true, method: "GET", path: "/stores/:storeId/orders"},
  async (params) => {
    const auth = getAuthData()!;

    // Check if user has permission to view orders for this store
    const permission = await orderDB.queryRow`
      SELECT s.id
      FROM stores s
      LEFT JOIN store_members sm ON s.id = sm.store_id
      WHERE s.id = ${params.storeId} AND (s.owner_id = ${auth.userID} OR sm.user_id = ${auth.userID})
    `;

    if (!permission) {
      throw APIError.notFound("Store not found or insufficient permissions");
    }

    const limit = params.limit || 50;
    const offset = params.offset || 0;

    let whereConditions = [`o.store_id = ${params.storeId}`];
    
    if (params.status) {
      whereConditions.push(`o.status = '${params.status}'`);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countResult = await orderDB.rawQueryRow<{count: number}>(
      `SELECT COUNT(*) as count FROM orders o WHERE ${whereClause}`
    );
    const total = countResult?.count || 0;

    // Get orders with items
    const orders = await orderDB.rawQueryAll<OrderWithItems & {items_data: string}>(
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
      WHERE ${whereClause}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
      `
    );

    const ordersWithItems = orders.map(order => ({
      ...order,
      items: typeof order.items_data === 'string' ? JSON.parse(order.items_data) : order.items_data
    }));

    return {
      orders: ordersWithItems,
      total
    };
  }
);
