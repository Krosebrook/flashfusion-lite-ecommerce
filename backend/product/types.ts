export interface Product {
  id: number;
  store_id: number;
  category_id?: number;
  name: string;
  description?: string;
  price: number;
  currency: string;
  is_subscription: boolean;
  subscription_interval?: 'month' | 'year';
  subscription_interval_count: number;
  stock_quantity?: number;
  is_digital: boolean;
  is_active: boolean;
  tags: string[];
  created_at: Date;
  updated_at: Date;
}

export interface ProductImage {
  id: number;
  product_id: number;
  url: string;
  alt_text?: string;
  sort_order: number;
  created_at: Date;
}

export interface ProductWithImages extends Product {
  images: ProductImage[];
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  category_id?: number;
  is_subscription?: boolean;
  subscription_interval?: 'month' | 'year';
  subscription_interval_count?: number;
  stock_quantity?: number;
  is_digital?: boolean;
  tags?: string[];
  images?: Array<{
    url: string;
    alt_text?: string;
    sort_order?: number;
  }>;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  category_id?: number;
  is_subscription?: boolean;
  subscription_interval?: 'month' | 'year';
  subscription_interval_count?: number;
  stock_quantity?: number;
  is_digital?: boolean;
  is_active?: boolean;
  tags?: string[];
  images?: Array<{
    url: string;
    alt_text?: string;
    sort_order?: number;
  }>;
}
