import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import DashboardHome from '../components/dashboard/DashboardHome';
import StoresManagement from '../components/dashboard/StoresManagement';
import ProductsManagement from '../components/dashboard/ProductsManagement';
import OrdersManagement from '../components/dashboard/OrdersManagement';
import AnalyticsDashboard from '../components/dashboard/AnalyticsDashboard';

export default function DashboardPage() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/stores" element={<StoresManagement />} />
        <Route path="/stores/:storeId/products" element={<ProductsManagement />} />
        <Route path="/stores/:storeId/orders" element={<OrdersManagement />} />
        <Route path="/stores/:storeId/analytics" element={<AnalyticsDashboard />} />
      </Routes>
    </DashboardLayout>
  );
}
