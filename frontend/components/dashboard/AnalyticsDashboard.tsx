import React from 'react';
import { useParams } from 'react-router-dom';

export default function AnalyticsDashboard() {
  const { storeId } = useParams<{ storeId: string }>();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">
          Track your store's performance and customer insights.
        </p>
      </div>
      
      <div className="text-center py-12">
        <p className="text-gray-600">Analytics dashboard coming soon...</p>
        <p className="text-sm text-gray-500 mt-2">Store ID: {storeId}</p>
      </div>
    </div>
  );
}
