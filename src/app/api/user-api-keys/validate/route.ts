import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * POST /api/user-api-keys/validate
 * Validate a specific API key for the user
 */
export async function POST(request: NextRequest) {
  try {
    // Get user ID from authentication
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const userId = getUserIdFromAuth(authorization);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { provider } = body;

    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'Provider is required' },
        { status: 400 }
      );
    }

    // Get the encrypted API key from database
    const userApiKey = await getUserApiKey(userId, provider);
    
    if (!userApiKey) {
      return NextResponse.json(
        { success: false, error: 'API key not found for this provider' },
        { status: 404 }
      );
    }

    // Decrypt the API key
    const decryptedKey = await decryptApiKey(userApiKey.encrypted_key);

    // Validate the API key
    const validation = await validateApiKey(provider, decryptedKey);
    
    // Update validation status in database
    await updateApiKeyValidation(userId, provider, validation);

    return NextResponse.json({
      success: true,
      valid: validation.valid,
      error: validation.error,
      metadata: validation.metadata,
      last_validated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Validate API key error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to validate API key' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user-api-keys/validate-service
 * Check if user has all required API keys for a service
 */
export async function validateServiceRequirements(request: NextRequest) {
  try {
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const userId = getUserIdFromAuth(authorization);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { service_type } = body;

    if (!service_type) {
      return NextResponse.json(
        { success: false, error: 'Service type is required' },
        { status: 400 }
      );
    }

    // Define service requirements
    const serviceRequirements: Record<string, string[]> = {
      'data-scraper': ['serpapi'],
      'ai-calling': ['elevenlabs', 'openai', 'twilio'],
      'voice-cloning': ['elevenlabs'],
      'calling-operations': ['twilio']
    };

    const requiredProviders = serviceRequirements[service_type] || [];
    
    // Get user's API keys
    const userApiKeys = await getUserApiKeys(userId);
    const userProviders = userApiKeys
      .filter(key => key.is_active)
      .map(key => key.provider);

    // Check which providers are missing
    const missingProviders = requiredProviders.filter(
      provider => !userProviders.includes(provider)
    );

    const isValid = missingProviders.length === 0;

    return NextResponse.json({
      success: true,
      valid: isValid,
      missing: missingProviders,
      required: requiredProviders,
      message: isValid 
        ? 'All required API keys are configured'
        : `Missing API keys: ${missingProviders.join(', ')}`
    });

  } catch (error) {
    console.error('Service validation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to validate service requirements' },
      { status: 500 }
    );
  }
}

/**
 * Validate API key with the respective service
 */
async function validateApiKey(provider: string, apiKey: string): Promise<{
  valid: boolean;
  error?: string;
  metadata?: any;
}> {
  try {
    switch (provider) {
      case 'elevenlabs':
        return await validateElevenLabsKey(apiKey);
      case 'openai':
        return await validateOpenAIKey(apiKey);
      case 'twilio':
        return await validateTwilioKey(apiKey);
      case 'serpapi':
        return await validateSerpApiKey(apiKey);
      case 'anthropic':
        return await validateAnthropicKey(apiKey);
      case 'google':
        return await validateGoogleKey(apiKey);
      default:
        return { valid: false, error: 'Unsupported provider' };
    }
  } catch (error) {
    console.error(`${provider} validation error:`, error);
    return { valid: false, error: 'Validation request failed' };
  }
}

/**
 * Validate ElevenLabs API key
 */
async function validateElevenLabsKey(apiKey: string) {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/user', {
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        valid: true,
        metadata: {
          subscription: data.subscription?.tier || 'free',
          character_count: data.subscription?.character_count || 0,
          character_limit: data.subscription?.character_limit || 10000
        }
      };
    } else {
      return { valid: false, error: 'Invalid ElevenLabs API key' };
    }
  } catch (error) {
    return { valid: false, error: 'ElevenLabs API validation failed' };
  }
}

/**
 * Validate OpenAI API key
 */
async function validateOpenAIKey(apiKey: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      return { valid: true, metadata: { status: 'active' } };
    } else {
      return { valid: false, error: 'Invalid OpenAI API key' };
    }
  } catch (error) {
    return { valid: false, error: 'OpenAI API validation failed' };
  }
}

/**
 * Validate SerpAPI key
 */
async function validateSerpApiKey(apiKey: string) {
  try {
    const response = await fetch(`https://serpapi.com/account?api_key=${apiKey}`);
    
    if (response.ok) {
      const data = await response.json();
      return {
        valid: true,
        metadata: {
          searches_left: data.searches_left || 0,
          plan: data.plan || 'free'
        }
      };
    } else {
      return { valid: false, error: 'Invalid SerpAPI key' };
    }
  } catch (error) {
    return { valid: false, error: 'SerpAPI validation failed' };
  }
}

/**
 * Validate Twilio API key (simplified)
 */
async function validateTwilioKey(apiKey: string) {
  // Simplified validation
  return { valid: true, metadata: { status: 'active' } };
}

/**
 * Validate Anthropic API key
 */
async function validateAnthropicKey(apiKey: string) {
  return { 
    valid: apiKey.startsWith('sk-ant-'), 
    metadata: { status: 'active' } 
  };
}

/**
 * Validate Google API key
 */
async function validateGoogleKey(apiKey: string) {
  return { 
    valid: apiKey.startsWith('AIza'), 
    metadata: { status: 'active' } 
  };
}

/**
 * Get user API key from database
 */
async function getUserApiKey(userId: string, provider: string) {
  // Mock data - replace with actual database query
  const mockKeys: Record<string, any> = {
    'elevenlabs': { encrypted_key: 'encrypted_elevenlabs_key', is_active: true },
    'openai': { encrypted_key: 'encrypted_openai_key', is_active: true },
    'serpapi': { encrypted_key: 'encrypted_serpapi_key', is_active: true }
  };
  
  return mockKeys[provider] || null;
}

/**
 * Get all user API keys
 */
async function getUserApiKeys(userId: string) {
  // Mock data - replace with actual database query
  return [
    { provider: 'elevenlabs', is_active: true },
    { provider: 'openai', is_active: true },
    { provider: 'serpapi', is_active: true }
  ];
}

/**
 * Decrypt API key
 */
async function decryptApiKey(encryptedKey: string): Promise<string> {
  // Mock decryption - replace with actual decryption
  return Buffer.from(encryptedKey, 'base64').toString();
}

/**
 * Update API key validation status
 */
async function updateApiKeyValidation(userId: string, provider: string, validation: any) {
  // Mock update - replace with actual database update
  console.log(`Updated validation for ${userId}/${provider}:`, validation.valid);
}

/**
 * Extract user ID from authorization header
 */
function getUserIdFromAuth(authorization: string | null): string | null {
  if (!authorization) return null;
  
  try {
    const token = authorization.replace('Bearer ', '');
    return 'user_123'; // Replace with actual user ID extraction
  } catch (error) {
    console.error('Auth extraction error:', error);
    return null;
  }
}
