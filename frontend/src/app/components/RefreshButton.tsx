'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
  className?: string;
}

export default function RefreshButton({ onRefresh, className = '' }: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={`
        inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm 
        leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      <RefreshCw 
        className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} 
      />
      {isRefreshing ? 'Refreshing...' : 'Refresh'}
    </button>
  );
}
