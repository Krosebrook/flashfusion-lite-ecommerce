import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { productDB } from "./db";

interface DeleteProductParams {
  storeId: number;
  id: number;
}

// Deletes a product if the user has permission.
export const deleteProduct = api<DeleteProductParams, void>(
  {auth: true, expose: true, method: "DELETE", path: "/stores/:storeId/products/:id"},
  async (params) => {
    const auth = getAuthData()!;

    // Check if user has permission to manage this store
    const permission = await productDB.queryRow`
      SELECT p.id
      FROM products p
      JOIN stores s ON p.store_id = s.id
      LEFT JOIN store_members sm ON s.id = sm.store_id
      WHERE p.id = ${params.id} AND p.store_id = ${params.storeId} AND (s.owner_id = ${auth.userID} OR (sm.user_id = ${auth.userID} AND sm.role IN ('owner', 'editor')))
    `;

    if (!permission) {
      throw APIError.notFound("Product not found or insufficient permissions");
    }

    await productDB.exec`
      DELETE FROM products WHERE id = ${params.id}
    `;
  }
);
