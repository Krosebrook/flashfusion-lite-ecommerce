import { api, APIError } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { productDB } from "./db";
import type { ProductWithImages } from "./types";

interface ListProductsParams {
  storeId: number;
  category_id?: Query<number>;
  is_active?: Query<boolean>;
  limit?: Query<number>;
  offset?: Query<number>;
}

export interface ListProductsResponse {
  products: ProductWithImages[];
  total: number;
}

// Lists products for a store with optional filtering.
export const list = api<ListProductsParams, ListProductsResponse>(
  {expose: true, method: "GET", path: "/stores/:storeId/products"},
  async (params) => {
    // Verify store exists and is active
    const store = await productDB.queryRow`
      SELECT id FROM stores WHERE id = ${params.storeId} AND is_active = true
    `;

    if (!store) {
      throw APIError.notFound("Store not found");
    }

    const limit = params.limit || 50;
    const offset = params.offset || 0;

    let whereConditions = [`p.store_id = ${params.storeId}`];
    
    if (params.category_id !== undefined) {
      whereConditions.push(`p.category_id = ${params.category_id}`);
    }
    
    if (params.is_active !== undefined) {
      whereConditions.push(`p.is_active = ${params.is_active}`);
    } else {
      // Default to only active products for public access
      whereConditions.push(`p.is_active = true`);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countResult = await productDB.rawQueryRow<{count: number}>(
      `SELECT COUNT(*) as count FROM products p WHERE ${whereClause}`
    );
    const total = countResult?.count || 0;

    // Get products with images
    const products = await productDB.rawQueryAll<ProductWithImages & {image_data: string}>(
      `
      SELECT 
        p.*,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', pi.id,
              'product_id', pi.product_id,
              'url', pi.url,
              'alt_text', pi.alt_text,
              'sort_order', pi.sort_order,
              'created_at', pi.created_at
            ) ORDER BY pi.sort_order, pi.id
          ) FILTER (WHERE pi.id IS NOT NULL),
          '[]'
        ) as image_data
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE ${whereClause}
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
      `
    );

    const productsWithImages = products.map(product => ({
      ...product,
      images: typeof product.image_data === 'string' ? JSON.parse(product.image_data) : product.image_data
    }));

    return {
      products: productsWithImages,
      total
    };
  }
);
