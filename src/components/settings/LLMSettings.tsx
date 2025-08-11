/**
 * LLM Settings Component
 * Allows users to configure their own LLM API keys and preferences
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Save, TestTube, CheckCircle, XCircle, Info, Key, Zap, Brain } from "lucide-react";
import { LLMService } from "@/services/llm/LLMService";

interface LLMProvider {
  id: string;
  name: string;
  description: string;
  models: { id: string; name: string; description: string }[];
  requiresApiKey: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

const providers: LLMProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Direct OpenAI API access',
    models: [
      { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo', description: 'Latest GPT-4 model' },
      { id: 'gpt-4', name: 'GPT-4', description: 'Most capable model' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and cost-effective' }
    ],
    requiresApiKey: true,
    icon: Brain
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Direct Claude API access',
    models: [
      { id: 'claude-3-opus', name: 'Claude 3 Opus', description: 'Most capable Claude model' },
      { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Balanced performance' },
      { id: 'claude-3-haiku', name: 'Claude 3 Haiku', description: 'Fast and efficient' }
    ],
    requiresApiKey: true,
    icon: Brain
  },
  {
    id: 'custom',
    name: 'Custom Endpoint',
    description: 'Connect to your own LLM endpoint',
    models: [
      { id: 'custom', name: 'Custom Model', description: 'Your own model' }
    ],
    requiresApiKey: false,
    icon: Key
  }
];

export function LLMSettings() {
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({
    openai: '',
    anthropic: '',
    custom: ''
  });
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-3.5-sonnet');
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [autoSelectModel, setAutoSelectModel] = useState(true);

  // Load saved settings
  useEffect(() => {
    const savedSettings = localStorage.getItem('llm_settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setSelectedProvider(settings.provider || 'openai');
      setApiKeys(settings.apiKeys || {});
      setCustomEndpoint(settings.customEndpoint || '');
      setSelectedModel(settings.model || 'anthropic/claude-3.5-sonnet');
      setAutoSelectModel(settings.autoSelectModel !== false);
    }
    
    // Check for environment variables
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (openaiKey) {
      setApiKeys(prev => ({ ...prev, openai: openaiKey }));
    }
    if (anthropicKey) {
      setApiKeys(prev => ({ ...prev, anthropic: anthropicKey }));
    }
  }, []);

  const saveSettings = () => {
    const settings = {
      provider: selectedProvider,
      apiKeys,
      customEndpoint,
      model: selectedModel,
      autoSelectModel
    };
    
    localStorage.setItem('llm_settings', JSON.stringify(settings));
    
    // Re-initialize LLM service with new settings
    LLMService.initialize({
      provider: selectedProvider as any,
      apiKey: apiKeys[selectedProvider],
      model: selectedModel,
      baseUrl: selectedProvider === 'custom' ? customEndpoint : undefined
    });
    
    setTestStatus('success');
    setTestMessage('Settings saved successfully!');
    setTimeout(() => setTestStatus('idle'), 3000);
  };

  const testConnection = async () => {
    setTestStatus('testing');
    setTestMessage('Testing connection...');
    
    try {
      const llm = LLMService.getInstance();
      const response = await llm.chat([
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "Connection successful!" in 5 words or less.' }
      ], {
        model: selectedModel,
        maxTokens: 50
      });
      
      if (response.content) {
        setTestStatus('success');
        setTestMessage(`Success! Response: "${response.content}"`);
      } else {
        throw new Error('No response received');
      }
    } catch (error: any) {
      setTestStatus('error');
      setTestMessage(`Connection failed: ${error?.message || 'Unknown error'}`);
    }
  };

  const currentProvider = providers.find(p => p.id === selectedProvider);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            LLM Configuration
          </CardTitle>
          <CardDescription>
            Configure your preferred Large Language Model provider and API keys
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label>LLM Provider</Label>
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {providers.map(provider => (
                  <SelectItem key={provider.id} value={provider.id}>
                    <div className="flex items-center gap-2">
                      <provider.icon className="h-4 w-4" />
                      <span>{provider.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentProvider && (
              <p className="text-sm text-muted-foreground">
                {currentProvider.description}
              </p>
            )}
          </div>

          {/* API Key Input */}
          {currentProvider?.requiresApiKey && (
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showApiKeys ? "text" : "password"}
                    value={apiKeys[selectedProvider]}
                    onChange={(e) => setApiKeys(prev => ({
                      ...prev,
                      [selectedProvider]: e.target.value
                    }))}
                    placeholder={`Enter your ${currentProvider.name} API key`}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-0 top-0"
                    onClick={() => setShowApiKeys(!showApiKeys)}
                  >
                    {showApiKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Your API key is stored locally and never sent to our servers
              </p>
            </div>
          )}

          {/* Custom Endpoint */}
          {selectedProvider === 'custom' && (
            <div className="space-y-2">
              <Label>Custom Endpoint URL</Label>
              <Input
                value={customEndpoint}
                onChange={(e) => setCustomEndpoint(e.target.value)}
                placeholder="https://your-llm-endpoint.com/v1"
              />
              <p className="text-xs text-muted-foreground">
                Enter your OpenAI-compatible endpoint URL
              </p>
            </div>
          )}

          {/* Model Selection */}
          {currentProvider && (
            <div className="space-y-2">
              <Label>Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currentProvider.models.map(model => (
                    <SelectItem key={model.id} value={model.id}>
                      <div>
                        <div className="font-medium">{model.name}</div>
                        <div className="text-xs text-muted-foreground">{model.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Auto Model Selection */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Smart Model Selection</Label>
              <p className="text-xs text-muted-foreground">
                Automatically choose the best model for each task
              </p>
            </div>
            <Switch
              checked={autoSelectModel}
              onCheckedChange={setAutoSelectModel}
            />
          </div>

          {/* Test Connection */}
          <div className="flex items-center gap-2">
            <Button
              onClick={testConnection}
              disabled={testStatus === 'testing' || !apiKeys[selectedProvider]}
              variant="outline"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Test Connection
            </Button>
            
            {testStatus !== 'idle' && (
              <Badge variant={testStatus === 'success' ? 'default' : testStatus === 'error' ? 'destructive' : 'secondary'}>
                {testStatus === 'testing' && 'Testing...'}
                {testStatus === 'success' && <CheckCircle className="h-3 w-3 mr-1" />}
                {testStatus === 'error' && <XCircle className="h-3 w-3 mr-1" />}
                {testMessage}
              </Badge>
            )}
          </div>

          {/* Save Button */}
          <Button onClick={saveSettings} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Quick Setup:</strong> Configure your OpenAI and Anthropic API keys for direct access to GPT-4 and Claude models.
        </AlertDescription>
      </Alert>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Current Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Provider:</span>
              <span className="font-medium">{currentProvider?.name || 'Not configured'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Model:</span>
              <span className="font-medium">
                {currentProvider?.models.find(m => m.id === selectedModel)?.name || 'Not selected'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">API Key:</span>
              <span className="font-medium">
                {apiKeys[selectedProvider] ? '••••••••' : 'Not configured'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={apiKeys[selectedProvider] ? 'default' : 'secondary'}>
                {apiKeys[selectedProvider] ? 'Configured' : 'Not configured'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default LLMSettings;