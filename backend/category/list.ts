import { api, APIError } from "encore.dev/api";
import { categoryDB } from "./db";
import type { Category } from "../store/types";

interface ListCategoriesParams {
  storeId: number;
}

export interface ListCategoriesResponse {
  categories: Category[];
}

// Lists all categories for a store.
export const list = api<ListCategoriesParams, ListCategoriesResponse>(
  {expose: true, method: "GET", path: "/stores/:storeId/categories"},
  async (params) => {
    // Verify store exists and is active
    const store = await categoryDB.queryRow`
      SELECT id FROM stores WHERE id = ${params.storeId} AND is_active = true
    `;

    if (!store) {
      throw APIError.notFound("Store not found");
    }

    const categories = await categoryDB.queryAll<Category>`
      SELECT * FROM categories 
      WHERE store_id = ${params.storeId}
      ORDER BY name ASC
    `;

    return { categories };
  }
);
