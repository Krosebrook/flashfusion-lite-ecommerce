import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Store, Plus, Edit, Trash2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBackend } from '../../hooks/useBackend';
import type { CreateStoreRequest, UpdateStoreRequest } from '~backend/store/types';

export default function StoresManagement() {
  const backend = useBackend();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<any>(null);
  const [formData, setFormData] = useState<CreateStoreRequest>({
    name: '',
    slug: '',
    description: '',
    logo_url: '',
    primary_color: '#3B82F6',
    secondary_color: '#1F2937',
  });

  const { data: storesData, isLoading } = useQuery({
    queryKey: ['stores'],
    queryFn: () => backend.store.list(),
  });

  const createStoreMutation = useMutation({
    mutationFn: (data: CreateStoreRequest) => backend.store.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Store created",
        description: "Your store has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating store",
        description: error.message || "There was an error creating your store.",
        variant: "destructive",
      });
    },
  });

  const updateStoreMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStoreRequest }) => 
      backend.store.update({ id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      setEditingStore(null);
      resetForm();
      toast({
        title: "Store updated",
        description: "Your store has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating store",
        description: error.message || "There was an error updating your store.",
        variant: "destructive",
      });
    },
  });

  const deleteStoreMutation = useMutation({
    mutationFn: (id: number) => backend.store.deleteStore({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast({
        title: "Store deleted",
        description: "Your store has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting store",
        description: error.message || "There was an error deleting your store.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      logo_url: '',
      primary_color: '#3B82F6',
      secondary_color: '#1F2937',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingStore) {
      updateStoreMutation.mutate({ id: editingStore.id, data: formData });
    } else {
      createStoreMutation.mutate(formData);
    }
  };

  const handleEdit = (store: any) => {
    setEditingStore(store);
    setFormData({
      name: store.name,
      slug: store.slug,
      description: store.description || '',
      logo_url: store.logo_url || '',
      primary_color: store.primary_color,
      secondary_color: store.secondary_color,
    });
  };

  const handleDelete = (store: any) => {
    if (confirm(`Are you sure you want to delete "${store.name}"? This action cannot be undone.`)) {
      deleteStoreMutation.mutate(store.id);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const stores = storesData?.stores || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stores</h1>
          <p className="text-gray-600 mt-2">
            Manage your online stores and track their performance.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen || !!editingStore} onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingStore(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Store
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingStore ? 'Edit Store' : 'Create New Store'}
              </DialogTitle>
              <DialogDescription>
                {editingStore 
                  ? 'Update your store information.'
                  : 'Create a new online store to start selling your products.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Store Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData(prev => ({ 
                      ...prev, 
                      name,
                      slug: prev.slug || generateSlug(name)
                    }));
                  }}
                  placeholder="My Awesome Store"
                  required
                />
              </div>
              <div>
                <Label htmlFor="slug">Store URL</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="my-awesome-store"
                  required
                />
                <p className="text-xs text-gray-600 mt-1">
                  Your store will be available at: /store/{formData.slug}
                </p>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Tell customers about your store..."
                />
              </div>
              <div>
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primary_color">Primary Color</Label>
                  <Input
                    id="primary_color"
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="secondary_color">Secondary Color</Label>
                  <Input
                    id="secondary_color"
                    type="color"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setEditingStore(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createStoreMutation.isPending || updateStoreMutation.isPending}
                >
                  {editingStore ? 'Update Store' : 'Create Store'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {stores.length === 0 ? (
        <Card>
          <CardHeader className="text-center">
            <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <CardTitle>No stores yet</CardTitle>
            <CardDescription>
              Create your first store to start selling online.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <Card key={store.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
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
                  <Badge variant={store.is_active ? "default" : "secondary"}>
                    {store.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {store.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {store.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <Badge variant="outline">
                    {store.subscription_tier}
                  </Badge>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(store)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(store)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Link to={`/store/${store.slug}`}>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link to={`/dashboard/stores/${store.id}/products`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Products
                    </Button>
                  </Link>
                  <Link to={`/dashboard/stores/${store.id}/orders`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Orders
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
