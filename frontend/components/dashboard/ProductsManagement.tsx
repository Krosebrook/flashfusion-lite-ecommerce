import React from 'react';
import { useParams } from 'react-router-dom';

export default function ProductsManagement() {
  const { storeId } = useParams<{ storeId: string }>();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        <p className="text-gray-600 mt-2">
          Manage your store's products and inventory.
        </p>
      </div>
      
      <div className="text-center py-12">
        <p className="text-gray-600">Products management coming soon...</p>
        <p className="text-sm text-gray-500 mt-2">Store ID: {storeId}</p>
      </div>
    </div>
  );
}
