import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { productDB } from "./db";
import type { CreateProductRequest, ProductWithImages, Product, ProductImage } from "./types";

interface CreateProductParams {
  storeId: number;
}

interface CreateProductBody extends CreateProductRequest {}

// Creates a new product for a store.
export const create = api<CreateProductParams & CreateProductBody, ProductWithImages>(
  {auth: true, expose: true, method: "POST", path: "/stores/:storeId/products"},
  async (req): Promise<ProductWithImages> => {
    const auth = getAuthData()!;

    // Check if user has permission to manage this store
    const permission = await productDB.queryRow`
      SELECT s.id
      FROM stores s
      LEFT JOIN store_members sm ON s.id = sm.store_id
      WHERE s.id = ${req.storeId} AND (s.owner_id = ${auth.userID} OR (sm.user_id = ${auth.userID} AND sm.role IN ('owner', 'editor')))
    `;

    if (!permission) {
      throw APIError.notFound("Store not found or insufficient permissions");
    }

    // Validate category if provided
    if (req.category_id) {
      const category = await productDB.queryRow`
        SELECT id FROM categories WHERE id = ${req.category_id} AND store_id = ${req.storeId}
      `;
      if (!category) {
        throw APIError.invalidArgument("Invalid category ID");
      }
    }

    // Validate subscription fields
    if (req.is_subscription && !req.subscription_interval) {
      throw APIError.invalidArgument("Subscription interval is required for subscription products");
    }

    const product = await productDB.queryRow<Product>`
      INSERT INTO products (
        store_id, category_id, name, description, price, currency,
        is_subscription, subscription_interval, subscription_interval_count,
        stock_quantity, is_digital, tags
      )
      VALUES (
        ${req.storeId}, ${req.category_id || null}, ${req.name}, ${req.description || null}, 
        ${req.price}, ${req.currency || 'USD'}, ${req.is_subscription || false}, 
        ${req.subscription_interval || null}, ${req.subscription_interval_count || 1},
        ${req.stock_quantity || null}, ${req.is_digital || false}, ${req.tags || []}
      )
      RETURNING *
    `;

    if (!product) {
      throw APIError.internal("Failed to create product");
    }

    // Add images if provided
    const images: ProductImage[] = [];
    if (req.images && req.images.length > 0) {
      for (const image of req.images) {
        const productImage = await productDB.queryRow<ProductImage>`
          INSERT INTO product_images (product_id, url, alt_text, sort_order)
          VALUES (${product.id}, ${image.url}, ${image.alt_text || null}, ${image.sort_order || 0})
          RETURNING *
        `;
        if (productImage) {
          images.push(productImage);
        }
      }
    }

    return {
      ...product,
      images
    };
  }
);
