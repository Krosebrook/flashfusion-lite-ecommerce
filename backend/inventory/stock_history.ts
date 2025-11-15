import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { inventoryDB } from "./db";

interface StockHistoryParams {
  storeId: number;
  productId: number;
}

interface StockChange {
  order_id: number;
  quantity: number;
  created_at: Date;
  customer_email: string;
  order_status: string;
}

interface StockHistoryResponse {
  product_name: string;
  current_stock: number | null;
  changes: StockChange[];
}

export const getStockHistory = api<StockHistoryParams, StockHistoryResponse>(
  { auth: true, expose: true, method: "GET", path: "/stores/:storeId/inventory/:productId/history" },
  async (req) => {
    const auth = getAuthData()!;

    const permission = await inventoryDB.queryRow<{ name: string; stock_quantity: number | null }>`
      SELECT p.name, p.stock_quantity
      FROM products p
      JOIN stores s ON p.store_id = s.id
      LEFT JOIN store_members sm ON s.id = sm.store_id
      WHERE p.id = ${req.productId} AND p.store_id = ${req.storeId} AND (s.owner_id = ${auth.userID} OR (sm.user_id = ${auth.userID} AND sm.role IN ('owner', 'editor', 'viewer')))
    `;

    if (!permission) {
      throw APIError.notFound("Product not found or insufficient permissions");
    }

    const changes = await inventoryDB.queryAll<StockChange>`
      SELECT 
        oi.order_id,
        oi.quantity,
        oi.created_at,
        o.customer_email,
        o.status as order_status
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.product_id = ${req.productId}
      ORDER BY oi.created_at DESC
      LIMIT 100
    `;

    return {
      product_name: permission.name,
      current_stock: permission.stock_quantity,
      changes,
    };
  }
);
