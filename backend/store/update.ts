import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { storeDB } from "./db";
import type { UpdateStoreRequest, Store } from "./types";

interface UpdateStoreParams {
  id: number;
}

interface UpdateStoreBody extends UpdateStoreRequest {}

// Updates a store if the user has owner or editor access.
export const update = api<UpdateStoreParams & UpdateStoreBody, Store>(
  {auth: true, expose: true, method: "PUT", path: "/stores/:id"},
  async (req) => {
    const auth = getAuthData()!;

    // Check if user has permission to update this store
    const permission = await storeDB.queryRow`
      SELECT s.id, sm.role
      FROM stores s
      LEFT JOIN store_members sm ON s.id = sm.store_id
      WHERE s.id = ${req.id} AND (s.owner_id = ${auth.userID} OR (sm.user_id = ${auth.userID} AND sm.role IN ('owner', 'editor')))
    `;

    if (!permission) {
      throw APIError.notFound("Store not found or insufficient permissions");
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
    if (req.logo_url !== undefined) {
      updates.push(`logo_url = $${values.length + 1}`);
      values.push(req.logo_url);
    }
    if (req.primary_color !== undefined) {
      updates.push(`primary_color = $${values.length + 1}`);
      values.push(req.primary_color);
    }
    if (req.secondary_color !== undefined) {
      updates.push(`secondary_color = $${values.length + 1}`);
      values.push(req.secondary_color);
    }

    if (updates.length === 0) {
      throw APIError.invalidArgument("No fields to update");
    }

    updates.push(`updated_at = NOW()`);
    values.push(req.id);

    const query = `
      UPDATE stores 
      SET ${updates.join(', ')}
      WHERE id = $${values.length}
      RETURNING *
    `;

    const store = await storeDB.rawQueryRow<Store>(query, ...values);

    if (!store) {
      throw APIError.internal("Failed to update store");
    }

    return store;
  }
);
