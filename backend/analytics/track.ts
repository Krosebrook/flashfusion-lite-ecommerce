import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { analyticsDB } from "./db";

interface TrackEventParams {
  storeId: number;
}

interface TrackEventRequest {
  event_type: 'view' | 'click' | 'purchase' | 'signup';
  product_id?: number;
  session_id?: string;
  metadata?: any;
}

// Tracks an analytics event for a store.
export const track = api<TrackEventParams & TrackEventRequest, void>(
  {expose: true, method: "POST", path: "/stores/:storeId/analytics/track"},
  async (req) => {
    // Get user ID if authenticated
    let userId: string | null = null;
    try {
      const auth = getAuthData();
      userId = auth?.userID || null;
    } catch {
      // Not authenticated, continue without user ID
    }

    // Verify store exists
    const store = await analyticsDB.queryRow`
      SELECT id FROM stores WHERE id = ${req.storeId} AND is_active = true
    `;

    if (!store) {
      throw APIError.notFound("Store not found");
    }

    // Validate product if provided
    if (req.product_id) {
      const product = await analyticsDB.queryRow`
        SELECT id FROM products WHERE id = ${req.product_id} AND store_id = ${req.storeId}
      `;
      if (!product) {
        throw APIError.invalidArgument("Invalid product ID");
      }
    }

    await analyticsDB.exec`
      INSERT INTO analytics_events (store_id, event_type, product_id, user_id, session_id, metadata)
      VALUES (${req.storeId}, ${req.event_type}, ${req.product_id || null}, ${userId}, ${req.session_id || null}, ${req.metadata || null})
    `;
  }
);
