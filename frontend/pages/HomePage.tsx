import React from 'react';
import { Link } from 'react-router-dom';
import { SignInButton, SignUpButton, useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, ShoppingCart, BarChart3, CreditCard } from 'lucide-react';

export default function HomePage() {
  const { isSignedIn } = useUser();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Store className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">FlashFusion Lite</h1>
          </div>
          <div className="flex items-center space-x-4">
            {isSignedIn ? (
              <Link to="/dashboard">
                <Button>Dashboard</Button>
              </Link>
            ) : (
              <>
                <SignInButton>
                  <Button variant="outline">Sign In</Button>
                </SignInButton>
                <SignUpButton>
                  <Button>Get Started</Button>
                </SignUpButton>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Create Your Online Store in Minutes
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            FlashFusion Lite is the fastest way for creators to build and launch their own ecommerce store. 
            No coding required, just pure simplicity.
          </p>
          {!isSignedIn && (
            <SignUpButton>
              <Button size="lg" className="text-lg px-8 py-3">
                Start Building Your Store
              </Button>
            </SignUpButton>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything You Need to Sell Online
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card>
              <CardHeader>
                <Store className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Custom Storefront</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Create a beautiful, branded store with your own domain, colors, and logo.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <ShoppingCart className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Product Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Easily add products with images, descriptions, pricing, and inventory tracking.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CreditCard className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>Secure Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Accept payments and subscriptions securely with Stripe integration.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-orange-600 mb-4" />
                <CardTitle>Analytics & Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Track sales, customer behavior, and store performance with detailed analytics.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-6">Ready to Start Selling?</h3>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of creators who have already launched their stores with FlashFusion Lite.
          </p>
          {!isSignedIn && (
            <SignUpButton>
              <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                Create Your Store Now
              </Button>
            </SignUpButton>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-white border-t">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2024 FlashFusion Lite. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
