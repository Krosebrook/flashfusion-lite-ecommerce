import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { categoryDB } from "./db";
import type { UpdateCategoryRequest, Category } from "../store/types";

interface UpdateCategoryParams {
  storeId: number;
  id: number;
}

interface UpdateCategoryBody extends UpdateCategoryRequest {}

// Updates a category if the user has permission.
export const update = api<UpdateCategoryParams & UpdateCategoryBody, Category>(
  {auth: true, expose: true, method: "PUT", path: "/stores/:storeId/categories/:id"},
  async (req) => {
    const auth = getAuthData()!;

    // Check if user has permission to manage this store
    const permission = await categoryDB.queryRow`
      SELECT c.id
      FROM categories c
      JOIN stores s ON c.store_id = s.id
      LEFT JOIN store_members sm ON s.id = sm.store_id
      WHERE c.id = ${req.id} AND c.store_id = ${req.storeId} AND (s.owner_id = ${auth.userID} OR (sm.user_id = ${auth.userID} AND sm.role IN ('owner', 'editor')))
    `;

    if (!permission) {
      throw APIError.notFound("Category not found or insufficient permissions");
    }

    // Check if new slug conflicts with existing categories
    if (req.slug) {
      const existingCategory = await categoryDB.queryRow`
        SELECT id FROM categories 
        WHERE store_id = ${req.storeId} AND slug = ${req.slug} AND id != ${req.id}
      `;
      if (existingCategory) {
        throw APIError.alreadyExists("A category with this slug already exists in this store");
      }
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (req.name !== undefined) {
      updates.push(`name = $${values.length + 1}`);
      values.push(req.name);
    }
    if (req.description !== undefined) {
      updates.push(`description = $${values.length + 1}`);
      values.push(req.description);
    }
    if (req.slug !== undefined) {
      updates.push(`slug = $${values.length + 1}`);
      values.push(req.slug);
    }

    if (updates.length === 0) {
      throw APIError.invalidArgument("No fields to update");
    }

    updates.push(`updated_at = NOW()`);
    values.push(req.id);

    const query = `
      UPDATE categories 
      SET ${updates.join(', ')}
      WHERE id = $${values.length}
      RETURNING *
    `;

    const category = await categoryDB.rawQueryRow<Category>(query, ...values);

    if (!category) {
      throw APIError.internal("Failed to update category");
    }

    return category;
  }
);
