'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';

interface StatusIndicatorProps {
  className?: string;
}

interface SystemStatus {
  database: 'connected' | 'error' | 'checking';
  scraper: 'active' | 'inactive' | 'error';
  ai_processing: 'ready' | 'quota_exceeded' | 'error';
  last_update: string;
}

export default function StatusIndicator({ className = '' }: StatusIndicatorProps) {
  const [status, setStatus] = useState<SystemStatus>({
    database: 'checking',
    scraper: 'inactive',
    ai_processing: 'quota_exceeded',
    last_update: new Date().toISOString()
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Check database connection
        const dbResponse = await fetch('/api/articles?limit=1');
        const dbStatus = dbResponse.ok ? 'connected' : 'error';

        // Check AI processing status (mock for now)
        const aiStatus = 'quota_exceeded'; // Based on our earlier OpenAI quota error

        setStatus({
          database: dbStatus,
          scraper: 'inactive', // Would check scraper status in real implementation
          ai_processing: aiStatus,
          last_update: new Date().toISOString()
        });
      } catch (error) {
        setStatus(prev => ({
          ...prev,
          database: 'error',
          last_update: new Date().toISOString()
        }));
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (statusType: string) => {
    switch (statusType) {
      case 'connected':
      case 'active':
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'quota_exceeded':
      case 'inactive':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'checking':
      default:
        return <Clock className="h-4 w-4 text-gray-500 animate-pulse" />;
    }
  };

  const getStatusText = (component: string, statusType: string) => {
    const statusMap: { [key: string]: { [key: string]: string } } = {
      database: {
        connected: 'Connected',
        error: 'Connection Error',
        checking: 'Checking...'
      },
      scraper: {
        active: 'Running',
        inactive: 'Stopped',
        error: 'Error'
      },
      ai_processing: {
        ready: 'Ready',
        quota_exceeded: 'Quota Exceeded',
        error: 'Error'
      }
    };
    return statusMap[component]?.[statusType] || 'Unknown';
  };

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <h3 className="text-sm font-medium text-gray-900 mb-3">System Status</h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Database</span>
          <div className="flex items-center">
            {getStatusIcon(status.database)}
            <span className="ml-2 text-sm">{getStatusText('database', status.database)}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">News Scraper</span>
          <div className="flex items-center">
            {getStatusIcon(status.scraper)}
            <span className="ml-2 text-sm">{getStatusText('scraper', status.scraper)}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">AI Processing</span>
          <div className="flex items-center">
            {getStatusIcon(status.ai_processing)}
            <span className="ml-2 text-sm">{getStatusText('ai_processing', status.ai_processing)}</span>
          </div>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Last updated: {new Date(status.last_update).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
