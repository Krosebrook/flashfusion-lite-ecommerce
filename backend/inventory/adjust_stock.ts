import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { inventoryDB } from "./db";
import { stockUpdateTopic } from "../realtime/topics";

interface AdjustStockParams {
  storeId: number;
  productId: number;
}

interface AdjustStockRequest {
  quantity: number;
  operation: "set" | "add" | "subtract";
}

interface Product {
  id: number;
  store_id: number;
  name: string;
  stock_quantity: number | null;
}

export const adjustStock = api<AdjustStockParams & AdjustStockRequest, Product>(
  { auth: true, expose: true, method: "POST", path: "/stores/:storeId/inventory/:productId/adjust" },
  async (req) => {
    const auth = getAuthData()!;

    const permission = await inventoryDB.queryRow`
      SELECT p.id, p.stock_quantity
      FROM products p
      JOIN stores s ON p.store_id = s.id
      LEFT JOIN store_members sm ON s.id = sm.store_id
      WHERE p.id = ${req.productId} AND p.store_id = ${req.storeId} AND (s.owner_id = ${auth.userID} OR (sm.user_id = ${auth.userID} AND sm.role IN ('owner', 'editor')))
    `;

    if (!permission) {
      throw APIError.notFound("Product not found or insufficient permissions");
    }

    const oldStock = permission.stock_quantity ?? 0;
    let newStock: number;

    if (req.operation === "set") {
      newStock = req.quantity;
    } else if (req.operation === "add") {
      newStock = oldStock + req.quantity;
    } else if (req.operation === "subtract") {
      newStock = oldStock - req.quantity;
      if (newStock < 0) {
        throw APIError.invalidArgument("Stock quantity cannot be negative");
      }
    } else {
      throw APIError.invalidArgument("Invalid operation. Must be 'set', 'add', or 'subtract'");
    }

    const product = await inventoryDB.queryRow<Product>`
      UPDATE products
      SET stock_quantity = ${newStock}, updated_at = NOW()
      WHERE id = ${req.productId}
      RETURNING *
    `;

    if (!product) {
      throw APIError.internal("Failed to update stock");
    }

    await stockUpdateTopic.publish({
      productId: product.id,
      storeId: product.store_id,
      oldStock,
      newStock,
      timestamp: new Date(),
    });

    return product;
  }
);
