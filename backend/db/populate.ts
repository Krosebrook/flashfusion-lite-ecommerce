import { api } from "encore.dev/api";
import { storeDB } from "../store/db";

interface PopulateResponse {
  message: string;
  stores: number;
  products: number;
  categories: number;
  orders: number;
}

export const populate = api<void, PopulateResponse>(
  { method: "POST", path: "/admin/populate", expose: true },
  async (): Promise<PopulateResponse> => {
    await storeDB.exec`DELETE FROM analytics_events`;
    await storeDB.exec`DELETE FROM order_items`;
    await storeDB.exec`DELETE FROM orders`;
    await storeDB.exec`DELETE FROM subscriptions`;
    await storeDB.exec`DELETE FROM product_images`;
    await storeDB.exec`DELETE FROM products`;
    await storeDB.exec`DELETE FROM categories`;
    await storeDB.exec`DELETE FROM store_members`;
    await storeDB.exec`DELETE FROM stores`;
    await storeDB.exec`DELETE FROM users`;

    const userId = "user_demo_12345";
    await storeDB.exec`
      INSERT INTO users (id, email, image_url)
      VALUES (${userId}, 'demo@flashfusion.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo')
    `;

    const storeNames = [
      { name: "TechGear Pro", slug: "techgear-pro", desc: "Premium tech accessories and gadgets", color: "#3B82F6" },
      { name: "Fashion Forward", slug: "fashion-forward", desc: "Trendy clothing and accessories", color: "#EC4899" },
      { name: "Home & Living", slug: "home-living", desc: "Modern furniture and home decor", color: "#10B981" },
    ];

    const storeIds: number[] = [];
    for (const store of storeNames) {
      const row = await storeDB.queryRow<{ id: number }>`
        INSERT INTO stores (owner_id, name, slug, description, primary_color, subscription_tier)
        VALUES (${userId}, ${store.name}, ${store.slug}, ${store.desc}, ${store.color}, 'pro')
        RETURNING id
      `;
      if (row) storeIds.push(row.id);
    }

    const categoryData = [
      { storeIdx: 0, name: "Smartphones", slug: "smartphones" },
      { storeIdx: 0, name: "Laptops", slug: "laptops" },
      { storeIdx: 0, name: "Accessories", slug: "accessories" },
      { storeIdx: 1, name: "Men's Wear", slug: "mens-wear" },
      { storeIdx: 1, name: "Women's Wear", slug: "womens-wear" },
      { storeIdx: 1, name: "Shoes", slug: "shoes" },
      { storeIdx: 2, name: "Furniture", slug: "furniture" },
      { storeIdx: 2, name: "Decor", slug: "decor" },
      { storeIdx: 2, name: "Lighting", slug: "lighting" },
    ];

    const categoryIds: number[] = [];
    for (const cat of categoryData) {
      const row = await storeDB.queryRow<{ id: number }>`
        INSERT INTO categories (store_id, name, slug, description)
        VALUES (${storeIds[cat.storeIdx]}, ${cat.name}, ${cat.slug}, 'Browse our ${cat.name} collection')
        RETURNING id
      `;
      if (row) categoryIds.push(row.id);
    }

    const products = [
      { storeIdx: 0, catIdx: 0, name: "iPhone 15 Pro", desc: "Latest flagship smartphone", price: 99900, stock: 50, images: ["https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800"] },
      { storeIdx: 0, catIdx: 0, name: "Samsung Galaxy S24", desc: "Premium Android experience", price: 89900, stock: 45, images: ["https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800"] },
      { storeIdx: 0, catIdx: 1, name: "MacBook Pro 16\"", desc: "M3 Max chip, 32GB RAM", price: 349900, stock: 20, images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800"] },
      { storeIdx: 0, catIdx: 1, name: "Dell XPS 15", desc: "4K OLED display", price: 189900, stock: 30, images: ["https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800"] },
      { storeIdx: 0, catIdx: 2, name: "AirPods Pro", desc: "Active noise cancellation", price: 24900, stock: 100, images: ["https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=800"] },
      { storeIdx: 0, catIdx: 2, name: "USB-C Hub 8-in-1", desc: "Multi-port adapter", price: 4900, stock: 75, images: ["https://images.unsplash.com/photo-1625948515291-69613efd103f?w=800"] },
      
      { storeIdx: 1, catIdx: 3, name: "Classic Denim Jacket", desc: "Vintage blue denim", price: 7900, stock: 60, images: ["https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800"] },
      { storeIdx: 1, catIdx: 3, name: "Premium Cotton T-Shirt", desc: "100% organic cotton", price: 2900, stock: 120, images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800"] },
      { storeIdx: 1, catIdx: 4, name: "Floral Summer Dress", desc: "Lightweight and comfortable", price: 5900, stock: 80, images: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800"] },
      { storeIdx: 1, catIdx: 4, name: "Elegant Evening Gown", desc: "Perfect for special occasions", price: 14900, stock: 25, images: ["https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800"] },
      { storeIdx: 1, catIdx: 5, name: "Running Sneakers", desc: "Lightweight and breathable", price: 8900, stock: 90, images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"] },
      
      { storeIdx: 2, catIdx: 6, name: "Modern Sofa Set", desc: "3-seater with ottoman", price: 89900, stock: 15, images: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800"] },
      { storeIdx: 2, catIdx: 6, name: "Dining Table Set", desc: "6 chairs included", price: 119900, stock: 10, images: ["https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800"] },
      { storeIdx: 2, catIdx: 7, name: "Abstract Wall Art", desc: "Canvas print set of 3", price: 12900, stock: 40, images: ["https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800"] },
      { storeIdx: 2, catIdx: 7, name: "Ceramic Vase Collection", desc: "Handcrafted set of 5", price: 6900, stock: 55, images: ["https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=800"] },
      { storeIdx: 2, catIdx: 8, name: "LED Floor Lamp", desc: "Dimmable smart lighting", price: 15900, stock: 35, images: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800"] },
    ];

    let productCount = 0;
    for (const prod of products) {
      const row = await storeDB.queryRow<{ id: number }>`
        INSERT INTO products (store_id, category_id, name, description, price, stock_quantity, is_active)
        VALUES (
          ${storeIds[prod.storeIdx]},
          ${categoryIds[prod.catIdx]},
          ${prod.name},
          ${prod.desc},
          ${prod.price},
          ${prod.stock},
          true
        )
        RETURNING id
      `;
      
      if (row) {
        productCount++;
        for (let i = 0; i < prod.images.length; i++) {
          await storeDB.exec`
            INSERT INTO product_images (product_id, url, alt_text, sort_order)
            VALUES (${row.id}, ${prod.images[i]}, ${prod.name}, ${i})
          `;
        }
      }
    }

    const allProducts = await storeDB.queryAll<{ id: number; store_id: number; price: number }>`
      SELECT id, store_id, price FROM products LIMIT 10
    `;

    let orderCount = 0;
    for (let i = 0; i < 15; i++) {
      const randomProduct = allProducts[Math.floor(Math.random() * allProducts.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const totalAmount = randomProduct.price * quantity;
      
      const statuses = ['pending', 'paid', 'shipped', 'delivered'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const orderRow = await storeDB.queryRow<{ id: number }>`
        INSERT INTO orders (
          store_id,
          customer_id,
          customer_email,
          customer_name,
          status,
          total_amount,
          shipping_address
        )
        VALUES (
          ${randomProduct.store_id},
          ${userId},
          'customer${i}@example.com',
          'Customer ${i + 1}',
          ${status},
          ${totalAmount},
          '{"street": "123 Main St", "city": "New York", "zip": "10001"}'::jsonb
        )
        RETURNING id
      `;
      
      if (orderRow) {
        orderCount++;
        await storeDB.exec`
          INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
          VALUES (${orderRow.id}, ${randomProduct.id}, ${quantity}, ${randomProduct.price}, ${totalAmount})
        `;
      }
    }

    for (const storeId of storeIds) {
      for (let i = 0; i < 50; i++) {
        const eventTypes = ['view', 'click', 'purchase', 'signup'];
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        
        await storeDB.exec`
          INSERT INTO analytics_events (store_id, event_type, session_id, created_at)
          VALUES (
            ${storeId},
            ${eventType},
            'session_${Math.random().toString(36).substr(2, 9)}',
            NOW() - INTERVAL '${Math.floor(Math.random() * 30)} days'
          )
        `;
      }
    }

    return {
      message: "Database populated successfully",
      stores: storeIds.length,
      products: productCount,
      categories: categoryIds.length,
      orders: orderCount,
    };
  }
);
