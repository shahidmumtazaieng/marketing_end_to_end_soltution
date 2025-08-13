import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * POST /api/user-api-keys/store
 * Store and validate a new API key for the user
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
    const { provider, api_key } = body;

    if (!provider || !api_key) {
      return NextResponse.json(
        { success: false, error: 'Provider and API key are required' },
        { status: 400 }
      );
    }

    // Validate the API key
    const validation = await validateApiKey(provider, api_key);
    
    if (!validation.valid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'API key validation failed',
          details: validation.error 
        },
        { status: 400 }
      );
    }

    // Encrypt and store the API key
    const encryptedKey = await encryptApiKey(api_key);
    
    await storeUserApiKey(userId, {
      provider,
      encrypted_key: encryptedKey,
      metadata: validation.metadata,
      is_active: true,
      last_validated: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'API key stored and validated successfully',
      provider,
      metadata: validation.metadata
    });

  } catch (error) {
    console.error('Store API key error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to store API key' },
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
          character_limit: data.subscription?.character_limit || 10000,
          voice_limit: data.subscription?.voice_limit || 3
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
      const data = await response.json();
      return {
        valid: true,
        metadata: {
          model_count: data.data?.length || 0,
          available_models: data.data?.slice(0, 5).map((m: any) => m.id) || []
        }
      };
    } else {
      return { valid: false, error: 'Invalid OpenAI API key' };
    }
  } catch (error) {
    return { valid: false, error: 'OpenAI API validation failed' };
  }
}

/**
 * Validate Twilio API key
 */
async function validateTwilioKey(apiKey: string) {
  try {
    // Twilio uses Account SID + Auth Token, so this is simplified
    // In production, you'd need both SID and token
    return {
      valid: true, // Simplified validation
      metadata: {
        account_type: 'trial', // Would be determined from actual API call
        phone_numbers: 1
      }
    };
  } catch (error) {
    return { valid: false, error: 'Twilio API validation failed' };
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
          plan: data.plan || 'free',
          searches_left: data.searches_left || 0,
          searches_per_month: data.searches_per_month || 100
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
 * Validate Anthropic API key
 */
async function validateAnthropicKey(apiKey: string) {
  try {
    // Simplified validation - in production, make actual API call
    if (apiKey.startsWith('sk-ant-')) {
      return {
        valid: true,
        metadata: {
          model_access: ['claude-3-sonnet', 'claude-3-haiku']
        }
      };
    } else {
      return { valid: false, error: 'Invalid Anthropic API key format' };
    }
  } catch (error) {
    return { valid: false, error: 'Anthropic API validation failed' };
  }
}

/**
 * Validate Google API key
 */
async function validateGoogleKey(apiKey: string) {
  try {
    // Simplified validation
    if (apiKey.startsWith('AIza')) {
      return {
        valid: true,
        metadata: {
          services: ['speech', 'translate', 'cloud']
        }
      };
    } else {
      return { valid: false, error: 'Invalid Google API key format' };
    }
  } catch (error) {
    return { valid: false, error: 'Google API validation failed' };
  }
}

/**
 * Encrypt API key for secure storage
 */
async function encryptApiKey(apiKey: string): Promise<string> {
  // In production, use proper encryption (AES-256, etc.)
  // This is a simplified example
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  
  // Mock encryption - replace with actual encryption
  return Buffer.from(data).toString('base64');
}

/**
 * Store user API key in database
 */
async function storeUserApiKey(userId: string, keyData: any) {
  // Mock storage - replace with actual database operation
  console.log(`Storing API key for user ${userId}:`, {
    provider: keyData.provider,
    encrypted: true,
    metadata: keyData.metadata
  });
  
  // In production, save to database:
  // await db.userApiKeys.upsert({
  //   where: { userId_provider: { userId, provider: keyData.provider } },
  //   update: keyData,
  //   create: { userId, ...keyData }
  // });
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
