import { useState, useEffect } from 'react';
import { realLinkedInSync } from '@/services/linkedin/RealLinkedInSync';
import { toast } from 'sonner';
import { Key, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

export function UnipileApiConfig() {
  const [apiKey, setApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    // Check if API key is already configured
    const storedKey = localStorage.getItem('unipile_api_key') || '';
    if (storedKey) {
      setApiKey(storedKey);
      setIsConfigured(true);
    }
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    setTesting(true);
    
    // Save the API key
    realLinkedInSync.setApiKey(apiKey);
    
    // Test the connection
    const isValid = await realLinkedInSync.initialize();
    
    if (isValid) {
      setIsConfigured(true);
      toast.success('Unipile API configured successfully!');
    } else {
      toast.error('Invalid API key or connection failed');
    }
    
    setTesting(false);
  };

  const handleClearApiKey = () => {
    localStorage.removeItem('unipile_api_key');
    setApiKey('');
    setIsConfigured(false);
    toast.info('API key cleared');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Key className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Unipile API Configuration</h3>
            <p className="text-sm text-gray-600">
              Connect to Unipile to sync real LinkedIn data
            </p>
          </div>
        </div>
        {isConfigured ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Configured</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-400">
            <XCircle className="h-5 w-5" />
            <span className="text-sm">Not configured</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Unipile API Key
          </label>
          <div className="flex gap-2">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Unipile API key"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ExternalLink className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">
                Don't have a Unipile API key?
              </p>
              <p className="text-blue-700">
                Sign up at{' '}
                <a
                  href="https://unipile.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-800"
                >
                  unipile.com
                </a>{' '}
                to get your API credentials. Unipile provides secure access to LinkedIn data
                through their official API integration.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSaveApiKey}
            disabled={testing || !apiKey.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {testing ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Testing...
              </>
            ) : (
              'Save & Test Connection'
            )}
          </button>
          {isConfigured && (
            <button
              onClick={handleClearApiKey}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Clear API Key
            </button>
          )}
        </div>

        {isConfigured && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700">
              ✓ Your Unipile API is configured. LinkedIn sync will now fetch real data from your connected accounts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}