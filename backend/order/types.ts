export interface Order {
  id: number;
  store_id: number;
  customer_id?: string;
  customer_email: string;
  customer_name?: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  total_amount: number;
  currency: string;
  stripe_payment_intent_id?: string;
  stripe_session_id?: string;
  shipping_address?: any;
  billing_address?: any;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: Date;
}

export interface OrderWithItems extends Order {
  items: (OrderItem & {
    product_name: string;
    product_description?: string;
  })[];
}

export interface CreateOrderRequest {
  customer_email: string;
  customer_name?: string;
  items: Array<{
    product_id: number;
    quantity: number;
  }>;
  shipping_address?: any;
  billing_address?: any;
}
