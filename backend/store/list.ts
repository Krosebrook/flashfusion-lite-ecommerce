import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { storeDB } from "./db";
import type { Store } from "./types";

export interface ListStoresResponse {
  stores: Store[];
}

// Lists all stores owned by or accessible to the authenticated user.
export const list = api<void, ListStoresResponse>(
  {auth: true, expose: true, method: "GET", path: "/stores"},
  async () => {
    const auth = getAuthData()!;

    const stores = await storeDB.queryAll<Store>`
      SELECT DISTINCT s.*
      FROM stores s
      LEFT JOIN store_members sm ON s.id = sm.store_id
      WHERE s.owner_id = ${auth.userID} OR sm.user_id = ${auth.userID}
      ORDER BY s.created_at DESC
    `;

    return { stores };
  }
);
