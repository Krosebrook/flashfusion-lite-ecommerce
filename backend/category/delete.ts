import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { categoryDB } from "./db";

interface DeleteCategoryParams {
  storeId: number;
  id: number;
}

// Deletes a category if the user has permission.
export const deleteCategory = api<DeleteCategoryParams, void>(
  {auth: true, expose: true, method: "DELETE", path: "/stores/:storeId/categories/:id"},
  async (params) => {
    const auth = getAuthData()!;

    // Check if user has permission to manage this store
    const permission = await categoryDB.queryRow`
      SELECT c.id
      FROM categories c
      JOIN stores s ON c.store_id = s.id
      LEFT JOIN store_members sm ON s.id = sm.store_id
      WHERE c.id = ${params.id} AND c.store_id = ${params.storeId} AND (s.owner_id = ${auth.userID} OR (sm.user_id = ${auth.userID} AND sm.role IN ('owner', 'editor')))
    `;

    if (!permission) {
      throw APIError.notFound("Category not found or insufficient permissions");
    }

    await categoryDB.exec`
      DELETE FROM categories WHERE id = ${params.id}
    `;
  }
);
