import { api, APIError } from "encore.dev/api";
import { productDB } from "./db";
import type { ProductWithImages } from "./types";

interface GetProductParams {
  storeId: number;
  id: number;
}

// Gets a product by ID.
export const get = api<GetProductParams, ProductWithImages>(
  {expose: true, method: "GET", path: "/stores/:storeId/products/:id"},
  async (params) => {
    const productResult = await productDB.rawQueryRow<ProductWithImages & {image_data: string}>(
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
      WHERE p.id = $1 AND p.store_id = $2 AND p.is_active = true
      GROUP BY p.id
      `,
      params.id,
      params.storeId
    );

    if (!productResult) {
      throw APIError.notFound("Product not found");
    }

    return {
      ...productResult,
      images: typeof productResult.image_data === 'string' ? JSON.parse(productResult.image_data) : productResult.image_data
    };
  }
);
