import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { clerkPublishableKey } from './config';
import HomePage from './pages/HomePage';
import StorePage from './pages/StorePage';
import DashboardPage from './pages/DashboardPage';
import CheckoutPage from './pages/CheckoutPage';
import { AnalyticsProvider } from './providers/AnalyticsProvider';

const queryClient = new QueryClient();

function App() {
  if (!clerkPublishableKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Configuration Required</h1>
          <p className="text-gray-600">
            Please set your Clerk publishable key in <code>frontend/config.ts</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <QueryClientProvider client={queryClient}>
        <AnalyticsProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/dashboard/*" element={<DashboardPage />} />
                <Route path="/store/:slug" element={<StorePage />} />
                <Route path="/store/:slug/checkout" element={<CheckoutPage />} />
              </Routes>
              <Toaster />
            </div>
          </Router>
        </AnalyticsProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
