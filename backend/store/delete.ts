import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { storeDB } from "./db";

interface DeleteStoreParams {
  id: number;
}

// Deletes a store if the user is the owner.
export const deleteStore = api<DeleteStoreParams, void>(
  {auth: true, expose: true, method: "DELETE", path: "/stores/:id"},
  async (params) => {
    const auth = getAuthData()!;

    // Check if user is the owner of this store
    const store = await storeDB.queryRow`
      SELECT id FROM stores WHERE id = ${params.id} AND owner_id = ${auth.userID}
    `;

    if (!store) {
      throw APIError.notFound("Store not found or insufficient permissions");
    }

    await storeDB.exec`
      DELETE FROM stores WHERE id = ${params.id}
    `;
  }
);
