import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Store, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAnalytics } from '../providers/AnalyticsProvider';
import backend from '~backend/client';
import type { Store as StoreType } from '~backend/store/types';
import type { ProductWithImages } from '~backend/product/types';
import type { Category } from '~backend/store/types';

export default function StorePage() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const { track } = useAnalytics();
  const [cart, setCart] = useState<Array<{ product: ProductWithImages; quantity: number }>>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ['store', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Store slug is required');
      return backend.store.getBySlug({ slug });
    },
    enabled: !!slug,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories', store?.id],
    queryFn: async () => {
      if (!store?.id) throw new Error('Store ID is required');
      return backend.category.list({ storeId: store.id });
    },
    enabled: !!store?.id,
  });

  const { data: productsData } = useQuery({
    queryKey: ['products', store?.id, selectedCategory],
    queryFn: async () => {
      if (!store?.id) throw new Error('Store ID is required');
      return backend.product.list({ 
        storeId: store.id,
        category_id: selectedCategory || undefined,
        is_active: true,
      });
    },
    enabled: !!store?.id,
  });

  // Track store view
  useEffect(() => {
    if (store?.id) {
      backend.analytics.track({
        storeId: store.id,
        event_type: 'view',
        session_id: Math.random().toString(36).substring(7),
      }).catch(console.error);
      
      track('store_viewed', { store_id: store.id, store_name: store.name });
    }
  }, [store?.id, track]);

  const addToCart = (product: ProductWithImages) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });

    // Track add to cart
    if (store?.id) {
      backend.analytics.track({
        storeId: store.id,
        event_type: 'click',
        product_id: product.id,
        session_id: Math.random().toString(36).substring(7),
        metadata: { action: 'add_to_cart' },
      }).catch(console.error);
    }

    track('product_added_to_cart', { 
      product_id: product.id, 
      product_name: product.name,
      store_id: store?.id,
    });

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  if (storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading store...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Store Not Found</h1>
          <p className="text-gray-600 mb-4">The store you're looking for doesn't exist.</p>
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const categories = categoriesData?.categories || [];
  const products = productsData?.products || [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: store.secondary_color + '10' }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {store.logo_url && (
                <img 
                  src={store.logo_url} 
                  alt={store.name}
                  className="h-12 w-12 rounded-lg object-cover"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold" style={{ color: store.primary_color }}>
                  {store.name}
                </h1>
                {store.description && (
                  <p className="text-gray-600">{store.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {cart.length > 0 && (
                <Link to={`/store/${slug}/checkout`} state={{ cart }}>
                  <Button 
                    style={{ backgroundColor: store.primary_color }}
                    className="relative"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Cart ({getTotalItems()})
                    <Badge 
                      variant="secondary" 
                      className="ml-2 bg-white text-gray-900"
                    >
                      ${(getTotalPrice() / 100).toFixed(2)}
                    </Badge>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Store className="h-5 w-5 mr-2" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={selectedCategory === null ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory(null)}
                >
                  All Products
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.name}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedCategory 
                  ? categories.find(c => c.id === selectedCategory)?.name 
                  : 'All Products'
                }
              </h2>
              <p className="text-gray-600">
                {products.length} product{products.length !== 1 ? 's' : ''} available
              </p>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-12">
                <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600">
                  {selectedCategory 
                    ? 'No products in this category yet.' 
                    : 'This store doesn\'t have any products yet.'
                  }
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                    <div className="aspect-square overflow-hidden rounded-t-lg">
                      {product.images.length > 0 ? (
                        <img
                          src={product.images[0].url}
                          alt={product.images[0].alt_text || product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <Store className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      {product.description && (
                        <CardDescription className="line-clamp-2">
                          {product.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="text-2xl font-bold" style={{ color: store.primary_color }}>
                            ${(product.price / 100).toFixed(2)}
                          </span>
                          {product.is_subscription && (
                            <span className="text-sm text-gray-600 ml-1">
                              /{product.subscription_interval}
                            </span>
                          )}
                        </div>
                        {product.stock_quantity !== null && (
                          <Badge variant={product.stock_quantity > 0 ? "default" : "destructive"}>
                            {product.stock_quantity > 0 ? `${product.stock_quantity} left` : 'Out of stock'}
                          </Badge>
                        )}
                      </div>
                      
                      {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {product.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <Button
                        className="w-full"
                        style={{ backgroundColor: store.primary_color }}
                        onClick={() => addToCart(product)}
                        disabled={product.stock_quantity === 0}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
