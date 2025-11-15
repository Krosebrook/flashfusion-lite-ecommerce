CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION validate_stock_before_order()
RETURNS TRIGGER AS $$
DECLARE
  product_stock INTEGER;
BEGIN
  SELECT stock_quantity INTO product_stock
  FROM products
  WHERE id = NEW.product_id;

  IF product_stock IS NOT NULL AND product_stock < NEW.quantity THEN
    RAISE EXCEPTION 'Insufficient stock for product %', NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_stock_before_order_item
  BEFORE INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_stock_before_order();

CREATE OR REPLACE FUNCTION calculate_order_total()
RETURNS TRIGGER AS $$
DECLARE
  item_total BIGINT;
BEGIN
  item_total := NEW.unit_price * NEW.quantity;
  NEW.total_price := item_total;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_item_total
  BEFORE INSERT OR UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_order_total();

CREATE OR REPLACE FUNCTION get_store_revenue(p_store_id BIGINT, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_revenue BIGINT,
  order_count BIGINT,
  avg_order_value DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(total_amount), 0) as total_revenue,
    COUNT(*)::BIGINT as order_count,
    COALESCE(AVG(total_amount), 0) as avg_order_value
  FROM orders
  WHERE store_id = p_store_id
    AND status IN ('paid', 'shipped', 'delivered')
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_low_stock_products(p_store_id BIGINT, p_threshold INTEGER DEFAULT 10)
RETURNS TABLE (
  product_id BIGINT,
  product_name TEXT,
  current_stock INTEGER,
  category_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as product_id,
    p.name as product_name,
    p.stock_quantity as current_stock,
    c.name as category_name
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  WHERE p.store_id = p_store_id
    AND p.stock_quantity IS NOT NULL
    AND p.stock_quantity <= p_threshold
    AND p.is_active = true
  ORDER BY p.stock_quantity ASC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_top_products(p_store_id BIGINT, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  product_id BIGINT,
  product_name TEXT,
  total_sold BIGINT,
  revenue BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as product_id,
    p.name as product_name,
    SUM(oi.quantity)::BIGINT as total_sold,
    SUM(oi.total_price)::BIGINT as revenue
  FROM products p
  JOIN order_items oi ON p.id = oi.product_id
  JOIN orders o ON oi.order_id = o.id
  WHERE p.store_id = p_store_id
    AND o.status IN ('paid', 'shipped', 'delivered')
  GROUP BY p.id, p.name
  ORDER BY total_sold DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_stock_quantity ON products(stock_quantity) WHERE stock_quantity IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
