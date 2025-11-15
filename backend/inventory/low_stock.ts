import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { inventoryDB } from "./db";

interface LowStockParams {
  storeId: number;
  threshold?: number;
}

interface LowStockProduct {
  product_id: number;
  product_name: string;
  current_stock: number;
  category_name: string | null;
}

interface LowStockResponse {
  products: LowStockProduct[];
}

export const getLowStock = api<LowStockParams, LowStockResponse>(
  { auth: true, expose: true, method: "GET", path: "/stores/:storeId/inventory/low-stock" },
  async (req) => {
    const auth = getAuthData()!;
    const threshold = req.threshold || 10;

    const permission = await inventoryDB.queryRow`
      SELECT s.id
      FROM stores s
      LEFT JOIN store_members sm ON s.id = sm.store_id
      WHERE s.id = ${req.storeId} AND (s.owner_id = ${auth.userID} OR (sm.user_id = ${auth.userID} AND sm.role IN ('owner', 'editor', 'viewer')))
    `;

    if (!permission) {
      throw APIError.notFound("Store not found or insufficient permissions");
    }

    const products = await inventoryDB.rawQueryAll<LowStockProduct>(
      `SELECT * FROM get_low_stock_products($1, $2)`,
      req.storeId,
      threshold
    );

    return { products };
  }
);
