import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { categoryDB } from "./db";
import type { CreateCategoryRequest, Category } from "../store/types";

interface CreateCategoryParams {
  storeId: number;
}

interface CreateCategoryBody extends CreateCategoryRequest {}

// Creates a new category for a store.
export const create = api<CreateCategoryParams & CreateCategoryBody, Category>(
  {auth: true, expose: true, method: "POST", path: "/stores/:storeId/categories"},
  async (req) => {
    const auth = getAuthData()!;

    // Check if user has permission to manage this store
    const permission = await categoryDB.queryRow`
      SELECT s.id
      FROM stores s
      LEFT JOIN store_members sm ON s.id = sm.store_id
      WHERE s.id = ${req.storeId} AND (s.owner_id = ${auth.userID} OR (sm.user_id = ${auth.userID} AND sm.role IN ('owner', 'editor')))
    `;

    if (!permission) {
      throw APIError.notFound("Store not found or insufficient permissions");
    }

    // Check if slug is already taken in this store
    const existingCategory = await categoryDB.queryRow`
      SELECT id FROM categories WHERE store_id = ${req.storeId} AND slug = ${req.slug}
    `;
    if (existingCategory) {
      throw APIError.alreadyExists("A category with this slug already exists in this store");
    }

    const category = await categoryDB.queryRow<Category>`
      INSERT INTO categories (store_id, name, description, slug)
      VALUES (${req.storeId}, ${req.name}, ${req.description || null}, ${req.slug})
      RETURNING *
    `;

    if (!category) {
      throw APIError.internal("Failed to create category");
    }

    return category;
  }
);
