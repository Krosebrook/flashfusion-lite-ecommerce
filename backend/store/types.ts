export interface Store {
  id: number;
  owner_id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateStoreRequest {
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
}

export interface UpdateStoreRequest {
  name?: string;
  description?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
}

export interface StoreMember {
  id: number;
  store_id: number;
  user_id: string;
  role: 'owner' | 'editor' | 'viewer';
  created_at: Date;
}

export interface Category {
  id: number;
  store_id: number;
  name: string;
  description?: string;
  slug: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  slug: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  slug?: string;
}
