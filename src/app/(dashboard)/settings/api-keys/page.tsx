"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Key, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Shield,
  Zap,
  RefreshCw,
  ExternalLink,
  Info
} from 'lucide-react';

interface ApiKey {
  provider: string;
  metadata: any;
  last_validated: string;
  is_active: boolean;
  created_at: string;
  has_key: boolean;
}

interface ApiKeyValidation {
  valid: boolean;
  error?: string;
  metadata?: any;
}

export default function ApiKeysPage() {
  // State management
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [validatingProvider, setValidatingProvider] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    provider: '',
    api_key: '',
    show_key: false
  });
  const [saving, setSaving] = useState(false);

  // API key providers configuration
  const providers = {
    elevenlabs: {
      name: 'ElevenLabs',
      description: 'Voice synthesis and cloning',
      icon: '🎤',
      required_for: ['Voice Cloning', 'AI Calling'],
      docs_url: 'https://elevenlabs.io/docs/api-reference',
      placeholder: 'sk_...'
    },
    openai: {
      name: 'OpenAI',
      description: 'GPT models for AI conversations',
      icon: '🧠',
      required_for: ['AI Calling', 'Conversation AI'],
      docs_url: 'https://platform.openai.com/docs/api-reference',
      placeholder: 'sk-...'
    },
    twilio: {
      name: 'Twilio',
      description: 'Phone calling and SMS services',
      icon: '📞',
      required_for: ['AI Calling', 'Phone Operations'],
      docs_url: 'https://www.twilio.com/docs/usage/api',
      placeholder: 'AC...'
    },
    serpapi: {
      name: 'SerpAPI',
      description: 'Google Maps and search data scraping',
      icon: '🔍',
      required_for: ['Data Scraper'],
      docs_url: 'https://serpapi.com/search-api',
      placeholder: 'your_api_key_here'
    },
    anthropic: {
      name: 'Anthropic Claude',
      description: 'Claude AI for advanced conversations',
      icon: '🤖',
      required_for: ['AI Calling (Optional)'],
      docs_url: 'https://docs.anthropic.com/claude/reference',
      placeholder: 'sk-ant-...'
    },
    google: {
      name: 'Google AI',
      description: 'Google AI services and speech',
      icon: '🔊',
      required_for: ['Speech Services (Optional)'],
      docs_url: 'https://cloud.google.com/docs/authentication',
      placeholder: 'AIza...'
    }
  };

  // Load API keys on mount
  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user-api-keys', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load API keys');
      }

      const data = await response.json();
      if (data.success) {
        setApiKeys(data.api_keys);
        setError(null);
      } else {
        setError(data.error || 'Failed to load API keys');
      }
    } catch (err) {
      setError('Failed to load API keys');
      console.error('Load API keys error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!formData.provider || !formData.api_key.trim()) {
      setError('Provider and API key are required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/user-api-keys/store', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: formData.provider,
          api_key: formData.api_key
        })
      });

      const data = await response.json();

      if (data.success) {
        await loadApiKeys(); // Refresh the list
        setIsAddDialogOpen(false);
        resetForm();
      } else {
        setError(data.error || data.details || 'Failed to save API key');
      }
    } catch (err) {
      setError('Failed to save API key');
      console.error('Save API key error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleValidateApiKey = async (provider: string) => {
    try {
      setValidatingProvider(provider);
      
      const response = await fetch('/api/user-api-keys/validate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ provider })
      });

      const data = await response.json();
      
      if (data.success) {
        // Update the API key status
        await loadApiKeys();
        
        if (data.valid) {
          // Show success message
        } else {
          setError(`${provider} API key validation failed: ${data.error}`);
        }
      } else {
        setError(data.error || 'Validation failed');
      }
    } catch (err) {
      setError('Failed to validate API key');
      console.error('Validate API key error:', err);
    } finally {
      setValidatingProvider(null);
    }
  };

  const handleDeleteApiKey = async (provider: string) => {
    if (!confirm(`Are you sure you want to delete the ${provider} API key?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/user-api-keys/${provider}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        await loadApiKeys(); // Refresh the list
      } else {
        setError(data.error || 'Failed to delete API key');
      }
    } catch (err) {
      setError('Failed to delete API key');
      console.error('Delete API key error:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      provider: '',
      api_key: '',
      show_key: false
    });
  };

  const getProviderStatus = (provider: string) => {
    const apiKey = apiKeys.find(key => key.provider === provider);
    if (!apiKey) return 'not_configured';
    if (!apiKey.is_active) return 'inactive';
    
    // Check if validation is recent (within 24 hours)
    const lastValidated = new Date(apiKey.last_validated);
    const now = new Date();
    const hoursSinceValidation = (now.getTime() - lastValidated.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceValidation > 24) return 'needs_validation';
    return 'active';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'inactive': return 'text-red-600';
      case 'needs_validation': return 'text-yellow-600';
      case 'not_configured': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'inactive': return <XCircle className="h-4 w-4" />;
      case 'needs_validation': return <AlertCircle className="h-4 w-4" />;
      case 'not_configured': return <Key className="h-4 w-4" />;
      default: return <Key className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'needs_validation': return 'Needs Validation';
      case 'not_configured': return 'Not Configured';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading API keys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Key className="h-6 w-6" />
            API Key Management
          </h1>
          <p className="text-gray-600">
            Configure your API keys to enable all platform features
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add API Key</DialogTitle>
              <DialogDescription>
                Configure a new API key for platform services
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <select
                  value={formData.provider}
                  onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">Select a provider</option>
                  {Object.entries(providers).map(([key, provider]) => (
                    <option key={key} value={key}>
                      {provider.icon} {provider.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {formData.provider && (
                <>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        {providers[formData.provider as keyof typeof providers].name}
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 mb-2">
                      {providers[formData.provider as keyof typeof providers].description}
                    </p>
                    <p className="text-xs text-blue-600">
                      Required for: {providers[formData.provider as keyof typeof providers].required_for.join(', ')}
                    </p>
                    <a
                      href={providers[formData.provider as keyof typeof providers].docs_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1"
                    >
                      View Documentation <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <div className="relative">
                      <Input
                        type={formData.show_key ? "text" : "password"}
                        value={formData.api_key}
                        onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
                        placeholder={providers[formData.provider as keyof typeof providers].placeholder}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        onClick={() => setFormData(prev => ({ ...prev, show_key: !prev.show_key }))}
                      >
                        {formData.show_key ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </>
              )}
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  onClick={() => setIsAddDialogOpen(false)} 
                  variant="outline"
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveApiKey}
                  disabled={saving || !formData.provider || !formData.api_key.trim()}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Save & Validate
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* API Keys Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(providers).map(([providerKey, provider]) => {
          const status = getProviderStatus(providerKey);
          const apiKey = apiKeys.find(key => key.provider === providerKey);
          
          return (
            <Card key={providerKey} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{provider.icon}</div>
                    <div>
                      <CardTitle className="text-base">{provider.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {provider.description}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-1 ${getStatusColor(status)}`}>
                    {getStatusIcon(status)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge variant={status === 'active' ? 'default' : status === 'not_configured' ? 'secondary' : 'destructive'}>
                      {getStatusText(status)}
                    </Badge>
                  </div>
                  
                  {/* Required For */}
                  <div>
                    <span className="text-sm text-gray-600">Required for:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {provider.required_for.map((feature) => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {/* Last Validated */}
                  {apiKey && (
                    <div className="text-xs text-gray-500">
                      Last validated: {new Date(apiKey.last_validated).toLocaleDateString()}
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {status === 'not_configured' ? (
                      <Button
                        onClick={() => {
                          setFormData(prev => ({ ...prev, provider: providerKey }));
                          setIsAddDialogOpen(true);
                        }}
                        size="sm"
                        className="flex-1"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Configure
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={() => handleValidateApiKey(providerKey)}
                          disabled={validatingProvider === providerKey}
                          size="sm"
                          variant="outline"
                          className="flex-1"
                        >
                          {validatingProvider === providerKey ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <RefreshCw className="h-3 w-3 mr-1" />
                          )}
                          Validate
                        </Button>
                        <Button
                          onClick={() => handleDeleteApiKey(providerKey)}
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Setup Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Setup Status
          </CardTitle>
          <CardDescription>
            Overview of your API key configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {apiKeys.filter(key => key.is_active).length}
              </div>
              <p className="text-sm text-gray-600">Active API Keys</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {Object.keys(providers).length - apiKeys.length}
              </div>
              <p className="text-sm text-gray-600">Pending Configuration</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((apiKeys.filter(key => key.is_active).length / Object.keys(providers).length) * 100)}%
              </div>
              <p className="text-sm text-gray-600">Setup Complete</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
