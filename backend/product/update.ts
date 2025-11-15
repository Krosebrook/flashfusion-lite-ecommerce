import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { productDB } from "./db";
import type { UpdateProductRequest, ProductWithImages } from "./types";
import { stockUpdateTopic } from "../realtime/topics";

interface UpdateProductParams {
  storeId: number;
  id: number;
}

interface UpdateProductBody extends UpdateProductRequest {}

// Updates a product if the user has permission.
export const update = api<UpdateProductParams & UpdateProductBody, ProductWithImages>(
  {auth: true, expose: true, method: "PUT", path: "/stores/:storeId/products/:id"},
  async (req) => {
    const auth = getAuthData()!;

    // Check if user has permission to manage this store
    const permission = await productDB.queryRow`
      SELECT p.id
      FROM products p
      JOIN stores s ON p.store_id = s.id
      LEFT JOIN store_members sm ON s.id = sm.store_id
      WHERE p.id = ${req.id} AND p.store_id = ${req.storeId} AND (s.owner_id = ${auth.userID} OR (sm.user_id = ${auth.userID} AND sm.role IN ('owner', 'editor')))
    `;

    if (!permission) {
      throw APIError.notFound("Product not found or insufficient permissions");
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
    if (req.price !== undefined) {
      updates.push(`price = $${values.length + 1}`);
      values.push(req.price);
    }
    if (req.currency !== undefined) {
      updates.push(`currency = $${values.length + 1}`);
      values.push(req.currency);
    }
    if (req.category_id !== undefined) {
      updates.push(`category_id = $${values.length + 1}`);
      values.push(req.category_id);
    }
    if (req.is_subscription !== undefined) {
      updates.push(`is_subscription = $${values.length + 1}`);
      values.push(req.is_subscription);
    }
    if (req.subscription_interval !== undefined) {
      updates.push(`subscription_interval = $${values.length + 1}`);
      values.push(req.subscription_interval);
    }
    if (req.subscription_interval_count !== undefined) {
      updates.push(`subscription_interval_count = $${values.length + 1}`);
      values.push(req.subscription_interval_count);
    }
    let oldStock: number | null = null;
    if (req.stock_quantity !== undefined) {
      const currentProduct = await productDB.queryRow<{stock_quantity: number | null}>`
        SELECT stock_quantity FROM products WHERE id = ${req.id}
      `;
      oldStock = currentProduct?.stock_quantity ?? null;
      
      updates.push(`stock_quantity = $${values.length + 1}`);
      values.push(req.stock_quantity);
    }
    if (req.is_digital !== undefined) {
      updates.push(`is_digital = $${values.length + 1}`);
      values.push(req.is_digital);
    }
    if (req.is_active !== undefined) {
      updates.push(`is_active = $${values.length + 1}`);
      values.push(req.is_active);
    }
    if (req.tags !== undefined) {
      updates.push(`tags = $${values.length + 1}`);
      values.push(req.tags);
    }

    if (updates.length === 0 && !req.images) {
      throw APIError.invalidArgument("No fields to update");
    }

    let product;
    if (updates.length > 0) {
      updates.push(`updated_at = NOW()`);
      values.push(req.id);

      const query = `
        UPDATE products 
        SET ${updates.join(', ')}
        WHERE id = $${values.length}
        RETURNING *
      `;

      product = await productDB.rawQueryRow<ProductWithImages>(query, ...values);
    } else {
      product = await productDB.queryRow<ProductWithImages>`
        SELECT * FROM products WHERE id = ${req.id}
      `;
    }

    if (!product) {
      throw APIError.internal("Failed to update product");
    }

    if (req.stock_quantity !== undefined && oldStock !== null) {
      await stockUpdateTopic.publish({
        productId: req.id,
        storeId: req.storeId,
        oldStock,
        newStock: req.stock_quantity,
        timestamp: new Date(),
      });
    }

    // Update images if provided
    if (req.images) {
      // Delete existing images
      await productDB.exec`
        DELETE FROM product_images WHERE product_id = ${req.id}
      `;

      // Add new images
      for (const image of req.images) {
        await productDB.exec`
          INSERT INTO product_images (product_id, url, alt_text, sort_order)
          VALUES (${req.id}, ${image.url}, ${image.alt_text || null}, ${image.sort_order || 0})
        `;
      }
    }

    // Get updated product with images
    const updatedProduct = await productDB.rawQueryRow<ProductWithImages & {image_data: string}>(
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
      WHERE p.id = $1
      GROUP BY p.id
      `,
      req.id
    );

    if (!updatedProduct) {
      throw APIError.internal("Failed to retrieve updated product");
    }

    return {
      ...updatedProduct,
      images: typeof updatedProduct.image_data === 'string' ? JSON.parse(updatedProduct.image_data) : updatedProduct.image_data
    };
  }
);
