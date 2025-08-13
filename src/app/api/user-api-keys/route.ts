import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * GET /api/user-api-keys
 * Retrieve user's configured API keys (without exposing the actual keys)
 */
export async function GET(request: NextRequest) {
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

    // Fetch user API keys from database
    const apiKeys = await getUserApiKeys(userId);

    return NextResponse.json({
      success: true,
      api_keys: apiKeys.map(key => ({
        provider: key.provider,
        metadata: key.metadata,
        last_validated: key.last_validated,
        is_active: key.is_active,
        created_at: key.created_at,
        has_key: true // Don't expose the actual key
      }))
    });

  } catch (error) {
    console.error('Get API keys error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve API keys' },
      { status: 500 }
    );
  }
}

/**
 * Mock function to get user API keys from database
 * In production, this would connect to your actual database
 */
async function getUserApiKeys(userId: string) {
  // Mock data - replace with actual database query
  return [
    {
      provider: 'elevenlabs',
      metadata: { voice_count: 5, character_limit: 10000 },
      last_validated: new Date().toISOString(),
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      provider: 'openai',
      metadata: { model_access: ['gpt-4', 'gpt-3.5-turbo'] },
      last_validated: new Date().toISOString(),
      is_active: true,
      created_at: new Date().toISOString()
    }
  ];
}

/**
 * Extract user ID from authorization header
 * Adjust this based on your authentication implementation
 */
function getUserIdFromAuth(authorization: string | null): string | null {
  if (!authorization) return null;
  
  try {
    // Simple token extraction - replace with your JWT/auth logic
    const token = authorization.replace('Bearer ', '');
    
    // Mock user ID extraction
    // In production, decode JWT or validate session token
    return 'user_123'; // Replace with actual user ID extraction
    
  } catch (error) {
    console.error('Auth extraction error:', error);
    return null;
  }
}
