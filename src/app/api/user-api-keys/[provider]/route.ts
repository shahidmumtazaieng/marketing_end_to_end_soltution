import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * DELETE /api/user-api-keys/[provider]
 * Delete a specific API key for the user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
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

    const { provider } = params;

    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'Provider is required' },
        { status: 400 }
      );
    }

    // Check if API key exists
    const existingKey = await getUserApiKey(userId, provider);
    
    if (!existingKey) {
      return NextResponse.json(
        { success: false, error: 'API key not found for this provider' },
        { status: 404 }
      );
    }

    // Delete the API key from database
    await deleteUserApiKey(userId, provider);

    return NextResponse.json({
      success: true,
      message: `${provider} API key deleted successfully`,
      provider
    });

  } catch (error) {
    console.error('Delete API key error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user-api-keys/[provider]
 * Get specific API key information (without exposing the actual key)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
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

    const { provider } = params;

    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'Provider is required' },
        { status: 400 }
      );
    }

    // Get API key information
    const apiKey = await getUserApiKey(userId, provider);
    
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key not found for this provider' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      api_key: {
        provider: apiKey.provider,
        metadata: apiKey.metadata,
        last_validated: apiKey.last_validated,
        is_active: apiKey.is_active,
        created_at: apiKey.created_at,
        has_key: true
      }
    });

  } catch (error) {
    console.error('Get API key error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve API key' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user-api-keys/[provider]
 * Update an existing API key
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
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

    const { provider } = params;
    const body = await request.json();
    const { api_key } = body;

    if (!provider || !api_key) {
      return NextResponse.json(
        { success: false, error: 'Provider and API key are required' },
        { status: 400 }
      );
    }

    // Validate the new API key
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

    // Encrypt and update the API key
    const encryptedKey = await encryptApiKey(api_key);
    
    await updateUserApiKey(userId, provider, {
      encrypted_key: encryptedKey,
      metadata: validation.metadata,
      is_active: true,
      last_validated: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'API key updated and validated successfully',
      provider,
      metadata: validation.metadata
    });

  } catch (error) {
    console.error('Update API key error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update API key' },
      { status: 500 }
    );
  }
}

/**
 * Mock function to get user API key from database
 */
async function getUserApiKey(userId: string, provider: string) {
  // Mock data - replace with actual database query
  const mockKeys: Record<string, any> = {
    'elevenlabs': {
      provider: 'elevenlabs',
      encrypted_key: 'encrypted_elevenlabs_key',
      metadata: { subscription: 'free', character_limit: 10000 },
      last_validated: new Date().toISOString(),
      is_active: true,
      created_at: new Date().toISOString()
    },
    'openai': {
      provider: 'openai',
      encrypted_key: 'encrypted_openai_key',
      metadata: { model_access: ['gpt-4', 'gpt-3.5-turbo'] },
      last_validated: new Date().toISOString(),
      is_active: true,
      created_at: new Date().toISOString()
    }
  };
  
  return mockKeys[provider] || null;
}

/**
 * Mock function to delete user API key from database
 */
async function deleteUserApiKey(userId: string, provider: string) {
  // Mock deletion - replace with actual database operation
  console.log(`Deleting API key for user ${userId}, provider: ${provider}`);
  
  // In production, delete from database:
  // await db.userApiKeys.delete({
  //   where: {
  //     userId_provider: { userId, provider }
  //   }
  // });
}

/**
 * Mock function to update user API key in database
 */
async function updateUserApiKey(userId: string, provider: string, keyData: any) {
  // Mock update - replace with actual database operation
  console.log(`Updating API key for user ${userId}, provider: ${provider}`, {
    encrypted: true,
    metadata: keyData.metadata
  });
  
  // In production, update in database:
  // await db.userApiKeys.update({
  //   where: { userId_provider: { userId, provider } },
  //   data: keyData
  // });
}

/**
 * Validate API key with the respective service
 */
async function validateApiKey(provider: string, apiKey: string): Promise<{
  valid: boolean;
  error?: string;
  metadata?: any;
}> {
  // Simplified validation - in production, make actual API calls
  const validations: Record<string, boolean> = {
    'elevenlabs': apiKey.startsWith('sk_'),
    'openai': apiKey.startsWith('sk-'),
    'twilio': apiKey.startsWith('AC'),
    'serpapi': apiKey.length > 10,
    'anthropic': apiKey.startsWith('sk-ant-'),
    'google': apiKey.startsWith('AIza')
  };

  const isValid = validations[provider] || false;
  
  return {
    valid: isValid,
    error: isValid ? undefined : 'Invalid API key format',
    metadata: isValid ? { status: 'active', validated_at: new Date().toISOString() } : undefined
  };
}

/**
 * Encrypt API key for secure storage
 */
async function encryptApiKey(apiKey: string): Promise<string> {
  // Mock encryption - replace with actual encryption
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  return Buffer.from(data).toString('base64');
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
