import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { storeDB } from "./db";
import type { CreateStoreRequest, Store } from "./types";

// Creates a new store for the authenticated user.
export const create = api<CreateStoreRequest, Store>(
  {auth: true, expose: true, method: "POST", path: "/stores"},
  async (req) => {
    const auth = getAuthData()!;

    // Check if slug is already taken
    const existingStore = await storeDB.queryRow`
      SELECT id FROM stores WHERE slug = ${req.slug}
    `;
    if (existingStore) {
      throw APIError.alreadyExists("A store with this slug already exists");
    }

    // Create user record if it doesn't exist
    await storeDB.exec`
      INSERT INTO users (id, email, image_url)
      VALUES (${auth.userID}, ${auth.email}, ${auth.imageUrl})
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        image_url = EXCLUDED.image_url,
        updated_at = NOW()
    `;

    // Create the store
    const store = await storeDB.queryRow<Store>`
      INSERT INTO stores (owner_id, name, slug, description, logo_url, primary_color, secondary_color)
      VALUES (${auth.userID}, ${req.name}, ${req.slug}, ${req.description || null}, ${req.logo_url || null}, ${req.primary_color || '#3B82F6'}, ${req.secondary_color || '#1F2937'})
      RETURNING *
    `;

    if (!store) {
      throw APIError.internal("Failed to create store");
    }

    // Add the owner as a store member
    await storeDB.exec`
      INSERT INTO store_members (store_id, user_id, role)
      VALUES (${store.id}, ${auth.userID}, 'owner')
    `;

    return store;
  }
);
