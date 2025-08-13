import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function UnipileStatusBanner() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const checkStatus = async () => {
    try {
      // Try to reach Unipile through our proxy
      const response = await fetch('/.netlify/functions/unipile-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/accounts', method: 'GET' })
      });
      
      const data = await response.json();
      setStatus(data.ok ? 'online' : 'offline');
    } catch {
      setStatus('offline');
    }
    setLastChecked(new Date());
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  if (status === 'checking') {
    return null;
  }

  if (status === 'offline') {
    return (
      <Alert className="mb-4 border-red-200 bg-red-50">
        <XCircle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800">LinkedIn Sync Service Unavailable</AlertTitle>
        <AlertDescription className="text-red-700">
          The Unipile API service is currently experiencing issues. LinkedIn sync functionality is temporarily unavailable.
          We're monitoring the situation and will restore service as soon as possible.
          <div className="text-xs mt-2">
            Last checked: {lastChecked.toLocaleTimeString()}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mb-4 border-green-200 bg-green-50">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertTitle className="text-green-800">LinkedIn Sync Active</AlertTitle>
      <AlertDescription className="text-green-700">
        All sync services are operational.
      </AlertDescription>
    </Alert>
  );
}