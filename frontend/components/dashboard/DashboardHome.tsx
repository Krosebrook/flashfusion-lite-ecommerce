import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store, Package, ShoppingCart, BarChart3, Plus } from 'lucide-react';
import { useBackend } from '../../hooks/useBackend';

export default function DashboardHome() {
  const backend = useBackend();

  const { data: storesData } = useQuery({
    queryKey: ['stores'],
    queryFn: () => backend.store.list(),
  });

  const stores = storesData?.stores || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome to your FlashFusion Lite dashboard. Manage your stores and track your success.
        </p>
      </div>

      {stores.length === 0 ? (
        <Card>
          <CardHeader className="text-center">
            <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <CardTitle>Create Your First Store</CardTitle>
            <CardDescription>
              Get started by creating your first online store. It only takes a few minutes!
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link to="/dashboard/stores">
              <Button size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Create Store
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Stores</CardTitle>
                <Store className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stores.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active stores
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">
                  Across all stores
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$0</div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>
          </div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Stores</h2>
              <Link to="/dashboard/stores">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Store
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((store) => (
                <Card key={store.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      {store.logo_url ? (
                        <img 
                          src={store.logo_url} 
                          alt={store.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div 
                          className="h-12 w-12 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: store.primary_color }}
                        >
                          <Store className="h-6 w-6" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">{store.name}</CardTitle>
                        <CardDescription>/{store.slug}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {store.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {store.description}
                      </p>
                    )}
                    <div className="flex space-x-2">
                      <Link to={`/dashboard/stores/${store.id}/products`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Package className="h-4 w-4 mr-2" />
                          Products
                        </Button>
                      </Link>
                      <Link to={`/store/${store.slug}`} className="flex-1">
                        <Button size="sm" className="w-full">
                          View Store
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
