import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { Query } from "encore.dev/api";
import { analyticsDB } from "./db";

interface GetStatsParams {
  storeId: number;
  start_date?: Query<string>;
  end_date?: Query<string>;
}

export interface AnalyticsStats {
  total_views: number;
  total_clicks: number;
  total_purchases: number;
  total_signups: number;
  revenue: number;
  top_products: Array<{
    product_id: number;
    product_name: string;
    views: number;
    clicks: number;
    purchases: number;
  }>;
  daily_stats: Array<{
    date: string;
    views: number;
    clicks: number;
    purchases: number;
    revenue: number;
  }>;
}

// Gets analytics stats for a store if the user has permission.
export const getStats = api<GetStatsParams, AnalyticsStats>(
  {auth: true, expose: true, method: "GET", path: "/stores/:storeId/analytics"},
  async (params) => {
    const auth = getAuthData()!;

    // Check if user has permission to view analytics for this store
    const permission = await analyticsDB.queryRow`
      SELECT s.id
      FROM stores s
      LEFT JOIN store_members sm ON s.id = sm.store_id
      WHERE s.id = ${params.storeId} AND (s.owner_id = ${auth.userID} OR sm.user_id = ${auth.userID})
    `;

    if (!permission) {
      throw APIError.notFound("Store not found or insufficient permissions");
    }

    const startDate = params.start_date ? new Date(params.start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endDate = params.end_date ? new Date(params.end_date) : new Date();

    // Get total stats
    const totalStats = await analyticsDB.queryRow<{
      total_views: number;
      total_clicks: number;
      total_purchases: number;
      total_signups: number;
    }>`
      SELECT 
        COUNT(CASE WHEN event_type = 'view' THEN 1 END) as total_views,
        COUNT(CASE WHEN event_type = 'click' THEN 1 END) as total_clicks,
        COUNT(CASE WHEN event_type = 'purchase' THEN 1 END) as total_purchases,
        COUNT(CASE WHEN event_type = 'signup' THEN 1 END) as total_signups
      FROM analytics_events 
      WHERE store_id = ${params.storeId} 
        AND created_at >= ${startDate} 
        AND created_at <= ${endDate}
    `;

    // Get revenue
    const revenueResult = await analyticsDB.queryRow<{revenue: number}>`
      SELECT COALESCE(SUM(total_amount), 0) as revenue
      FROM orders 
      WHERE store_id = ${params.storeId} 
        AND status = 'paid'
        AND created_at >= ${startDate} 
        AND created_at <= ${endDate}
    `;

    // Get top products
    const topProducts = await analyticsDB.queryAll<{
      product_id: number;
      product_name: string;
      views: number;
      clicks: number;
      purchases: number;
    }>`
      SELECT 
        ae.product_id,
        p.name as product_name,
        COUNT(CASE WHEN ae.event_type = 'view' THEN 1 END) as views,
        COUNT(CASE WHEN ae.event_type = 'click' THEN 1 END) as clicks,
        COUNT(CASE WHEN ae.event_type = 'purchase' THEN 1 END) as purchases
      FROM analytics_events ae
      JOIN products p ON ae.product_id = p.id
      WHERE ae.store_id = ${params.storeId} 
        AND ae.product_id IS NOT NULL
        AND ae.created_at >= ${startDate} 
        AND ae.created_at <= ${endDate}
      GROUP BY ae.product_id, p.name
      ORDER BY views DESC
      LIMIT 10
    `;

    // Get daily stats
    const dailyStats = await analyticsDB.queryAll<{
      date: string;
      views: number;
      clicks: number;
      purchases: number;
      revenue: number;
    }>`
      SELECT 
        DATE(ae.created_at) as date,
        COUNT(CASE WHEN ae.event_type = 'view' THEN 1 END) as views,
        COUNT(CASE WHEN ae.event_type = 'click' THEN 1 END) as clicks,
        COUNT(CASE WHEN ae.event_type = 'purchase' THEN 1 END) as purchases,
        COALESCE(SUM(o.total_amount), 0) as revenue
      FROM analytics_events ae
      LEFT JOIN orders o ON ae.store_id = o.store_id AND DATE(ae.created_at) = DATE(o.created_at) AND o.status = 'paid'
      WHERE ae.store_id = ${params.storeId} 
        AND ae.created_at >= ${startDate} 
        AND ae.created_at <= ${endDate}
      GROUP BY DATE(ae.created_at)
      ORDER BY date DESC
    `;

    return {
      total_views: totalStats?.total_views || 0,
      total_clicks: totalStats?.total_clicks || 0,
      total_purchases: totalStats?.total_purchases || 0,
      total_signups: totalStats?.total_signups || 0,
      revenue: revenueResult?.revenue || 0,
      top_products: topProducts || [],
      daily_stats: dailyStats || [],
    };
  }
);
