import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { storeDB } from "./db";
import type { Store } from "./types";

interface GetStoreParams {
  id: number;
}

// Gets a store by ID if the user has access to it.
export const get = api<GetStoreParams, Store>(
  {auth: true, expose: true, method: "GET", path: "/stores/:id"},
  async (params) => {
    const auth = getAuthData()!;

    const store = await storeDB.queryRow<Store>`
      SELECT DISTINCT s.*
      FROM stores s
      LEFT JOIN store_members sm ON s.id = sm.store_id
      WHERE s.id = ${params.id} AND (s.owner_id = ${auth.userID} OR sm.user_id = ${auth.userID})
    `;

    if (!store) {
      throw APIError.notFound("Store not found or access denied");
    }

    return store;
  }
);
