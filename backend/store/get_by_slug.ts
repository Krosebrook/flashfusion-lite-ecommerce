import { api, APIError } from "encore.dev/api";
import { storeDB } from "./db";
import type { Store } from "./types";

interface GetStoreBySlugParams {
  slug: string;
}

// Gets a store by slug for public access.
export const getBySlug = api<GetStoreBySlugParams, Store>(
  {expose: true, method: "GET", path: "/stores/slug/:slug"},
  async (params) => {
    const store = await storeDB.queryRow<Store>`
      SELECT * FROM stores WHERE slug = ${params.slug} AND is_active = true
    `;

    if (!store) {
      throw APIError.notFound("Store not found");
    }

    return store;
  }
);
