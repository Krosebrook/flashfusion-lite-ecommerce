import React, { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useBackend } from '../hooks/useBackend';
import { useAnalytics } from '../providers/AnalyticsProvider';
import type { ProductWithImages } from '~backend/product/types';

interface CartItem {
  product: ProductWithImages;
  quantity: number;
}

export default function CheckoutPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { track } = useAnalytics();
  const backend = useBackend();
  
  const cart: CartItem[] = location.state?.cart || [];
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    email: '',
    name: '',
  });

  const { data: store } = useQuery({
    queryKey: ['store', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Store slug is required');
      return backend.store.getBySlug({ slug });
    },
    enabled: !!slug,
  });

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (!store || cart.length === 0) return;

    if (!customerInfo.email || !customerInfo.name) {
      toast({
        title: "Missing information",
        description: "Please fill in your email and name.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const items = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
      }));

      const result = await backend.payment.createCheckoutSession({
        storeId: store.id,
        items,
        success_url: `${window.location.origin}/store/${slug}?success=true`,
        cancel_url: `${window.location.origin}/store/${slug}/checkout`,
        customer_email: customerInfo.email,
      });

      // Track checkout initiation
      track('checkout_initiated', {
        store_id: store.id,
        total_amount: getTotalPrice(),
        item_count: cart.length,
      });

      // Redirect to Stripe Checkout
      window.location.href = result.url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout failed",
        description: "There was an error processing your checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!store || cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {cart.length === 0 ? 'Your cart is empty' : 'Store not found'}
          </h1>
          <p className="text-gray-600 mb-4">
            {cart.length === 0 
              ? 'Add some products to your cart before checking out.'
              : 'The store you\'re looking for doesn\'t exist.'
            }
          </p>
          <Button onClick={() => navigate(`/store/${slug}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Store
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate(`/store/${slug}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Store
            </Button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: store.primary_color }}>
                Checkout - {store.name}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Customer Information */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                  <CardDescription>
                    Please provide your details to complete the purchase.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                          {item.product.images.length > 0 ? (
                            <img
                              src={item.product.images[0].url}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{item.product.name}</h3>
                          <p className="text-sm text-gray-600">
                            Quantity: {item.quantity}
                          </p>
                          {item.product.is_subscription && (
                            <p className="text-sm text-blue-600">
                              Subscription - {item.product.subscription_interval}ly
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            ${((item.product.price * item.quantity) / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>${(getTotalPrice() / 100).toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-6"
                    size="lg"
                    style={{ backgroundColor: store.primary_color }}
                    onClick={handleCheckout}
                    disabled={isProcessing || !customerInfo.email || !customerInfo.name}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Complete Purchase
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-600 text-center mt-4">
                    You will be redirected to Stripe to complete your payment securely.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
