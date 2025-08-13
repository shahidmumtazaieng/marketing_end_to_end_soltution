/**
 * API Key Validation Middleware
 * Ensures users have configured required API keys before accessing services
 */

import { NextRequest, NextResponse } from 'next/server';

interface ApiKeyRequirement {
  service: string;
  requiredProviders: string[];
  message: string;
}

// Define API key requirements for each service
const SERVICE_REQUIREMENTS: Record<string, ApiKeyRequirement> = {
  'data-scraper': {
    service: 'Data Scraper',
    requiredProviders: ['serpapi'],
    message: 'SerpAPI key is required for data scraping functionality'
  },
  'ai-calling': {
    service: 'AI Calling Agent',
    requiredProviders: ['elevenlabs', 'openai', 'twilio'],
    message: 'ElevenLabs, OpenAI, and Twilio API keys are required for AI calling'
  },
  'voice-cloning': {
    service: 'Voice Cloning',
    requiredProviders: ['elevenlabs'],
    message: 'ElevenLabs API key is required for voice cloning functionality'
  },
  'calling-operations': {
    service: 'Calling Operations',
    requiredProviders: ['twilio'],
    message: 'Twilio API key is required for calling operations'
  }
};

export class ApiKeyValidator {
  private static instance: ApiKeyValidator;
  private userApiKeysCache: Map<string, { keys: string[], timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): ApiKeyValidator {
    if (!ApiKeyValidator.instance) {
      ApiKeyValidator.instance = new ApiKeyValidator();
    }
    return ApiKeyValidator.instance;
  }

  /**
   * Check if user has required API keys for a service
   */
  async validateUserApiKeys(userId: string, serviceType: string): Promise<{
    valid: boolean;
    missing: string[];
    message?: string;
  }> {
    try {
      const requirement = SERVICE_REQUIREMENTS[serviceType];
      if (!requirement) {
        return { valid: true, missing: [] };
      }

      // Get user's API keys
      const userKeys = await this.getUserApiKeys(userId);
      
      // Check which required providers are missing
      const missing = requirement.requiredProviders.filter(
        provider => !userKeys.includes(provider)
      );

      return {
        valid: missing.length === 0,
        missing,
        message: missing.length > 0 ? requirement.message : undefined
      };
    } catch (error) {
      console.error('API key validation error:', error);
      return {
        valid: false,
        missing: [],
        message: 'Failed to validate API keys'
      };
    }
  }

  /**
   * Get user's configured API keys (cached)
   */
  private async getUserApiKeys(userId: string): Promise<string[]> {
    // Check cache first
    const cached = this.userApiKeysCache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.keys;
    }

    try {
      // Fetch from API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user-api-keys`, {
        headers: {
          'Authorization': `Bearer ${this.getSystemToken()}`,
          'X-User-ID': userId,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user API keys');
      }

      const data = await response.json();
      const keys = data.success ? data.api_keys.map((key: any) => key.provider) : [];

      // Update cache
      this.userApiKeysCache.set(userId, {
        keys,
        timestamp: Date.now()
      });

      return keys;
    } catch (error) {
      console.error('Failed to fetch user API keys:', error);
      return [];
    }
  }

  /**
   * Clear cache for a user (call when API keys are updated)
   */
  clearUserCache(userId: string): void {
    this.userApiKeysCache.delete(userId);
  }

  /**
   * Get system token for internal API calls
   */
  private getSystemToken(): string {
    return process.env.SYSTEM_API_TOKEN || 'system-token';
  }

  /**
   * Middleware function for Next.js API routes
   */
  static createMiddleware(serviceType: string) {
    return async (req: NextRequest, context: any, next: () => Promise<NextResponse>) => {
      const validator = ApiKeyValidator.getInstance();
      
      // Extract user ID from request (adjust based on your auth implementation)
      const userId = req.headers.get('x-user-id') || 
                    req.headers.get('authorization')?.split(' ')[1]; // Simplified

      if (!userId) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Authentication required',
            code: 'AUTH_REQUIRED'
          },
          { status: 401 }
        );
      }

      // Validate API keys
      const validation = await validator.validateUserApiKeys(userId, serviceType);
      
      if (!validation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing required API keys',
            message: validation.message,
            missing_providers: validation.missing,
            code: 'API_KEYS_REQUIRED',
            setup_url: '/settings/api-keys'
          },
          { status: 403 }
        );
      }

      // Continue to the actual handler
      return next();
    };
  }
}

/**
 * React hook for checking API key requirements in components
 */
export function useApiKeyValidation(serviceType: string) {
  const [validation, setValidation] = React.useState<{
    loading: boolean;
    valid: boolean;
    missing: string[];
    message?: string;
  }>({
    loading: true,
    valid: false,
    missing: []
  });

  React.useEffect(() => {
    const checkApiKeys = async () => {
      try {
        setValidation(prev => ({ ...prev, loading: true }));

        const response = await fetch('/api/user-api-keys/validate-service', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ service_type: serviceType })
        });

        const data = await response.json();
        
        if (data.success) {
          setValidation({
            loading: false,
            valid: data.valid,
            missing: data.missing || [],
            message: data.message
          });
        } else {
          setValidation({
            loading: false,
            valid: false,
            missing: [],
            message: data.error || 'Validation failed'
          });
        }
      } catch (error) {
        console.error('API key validation error:', error);
        setValidation({
          loading: false,
          valid: false,
          missing: [],
          message: 'Failed to validate API keys'
        });
      }
    };

    checkApiKeys();
  }, [serviceType]);

  return validation;
}

/**
 * Component wrapper that shows API key setup prompt if required keys are missing
 */
interface ApiKeyGuardProps {
  serviceType: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ApiKeyGuard({ serviceType, children, fallback }: ApiKeyGuardProps) {
  const validation = useApiKeyValidation(serviceType);

  if (validation.loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking API key configuration...</p>
        </div>
      </div>
    );
  }

  if (!validation.valid) {
    if (fallback) {
      return <>{fallback}</>;
    }

    const requirement = SERVICE_REQUIREMENTS[serviceType];
    
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            API Keys Required
          </h2>
          <p className="text-gray-600">
            {validation.message || `Configure your API keys to use ${requirement?.service || serviceType}`}
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-yellow-800 mb-2">Missing API Keys:</h3>
          <ul className="list-disc list-inside text-yellow-700 space-y-1">
            {validation.missing.map((provider) => (
              <li key={provider} className="capitalize">
                {provider.replace('_', ' ')} API Key
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-center gap-4">
          <Button
            onClick={() => window.location.href = '/settings/api-keys'}
            className="flex items-center gap-2"
          >
            <Key className="w-4 h-4" />
            Configure API Keys
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Export service requirements for use in other components
export { SERVICE_REQUIREMENTS };

// Helper function to get required providers for a service
export function getRequiredProviders(serviceType: string): string[] {
  return SERVICE_REQUIREMENTS[serviceType]?.requiredProviders || [];
}

// Helper function to check if a service is available
export async function isServiceAvailable(serviceType: string, userId: string): Promise<boolean> {
  const validator = ApiKeyValidator.getInstance();
  const validation = await validator.validateUserApiKeys(userId, serviceType);
  return validation.valid;
}
