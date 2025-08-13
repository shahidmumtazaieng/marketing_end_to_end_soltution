import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: Get ElevenLabs Models
 * Fetches available voice models from our Node.js backend
 */

export async function GET(request: NextRequest) {
  try {
    // Get the backend API URL
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    // Forward the request to our Node.js backend
    const response = await fetch(`${backendUrl}/api/elevenlabs/models`, {
      headers: {
        'Authorization': `Bearer ${process.env.API_SECRET_KEY || 'dev-key'}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch models');
    }

    return NextResponse.json({
      success: true,
      models: data.models || [],
    });

  } catch (error) {
    console.error('❌ Failed to fetch models:', error);
    
    // Return mock data for development
    const mockModels = [
      {
        model_id: 'eleven_flash_v2_5',
        name: 'Eleven Flash v2.5',
        description: 'Fastest model with great quality for real-time applications',
        languages: 32,
        latency: 'Lowest',
        quality: 'High',
        use_cases: ['Conversational AI', 'Real-time applications', 'Gaming'],
        max_characters_request_free_user: 500,
        max_characters_request_subscribed_user: 5000
      },
      {
        model_id: 'eleven_turbo_v2_5',
        name: 'Eleven Turbo v2.5',
        description: 'Balanced speed and quality for most applications',
        languages: 32,
        latency: 'Low',
        quality: 'High',
        use_cases: ['Conversational AI', 'Narration', 'Content creation'],
        max_characters_request_free_user: 500,
        max_characters_request_subscribed_user: 5000
      },
      {
        model_id: 'eleven_multilingual_v2',
        name: 'Eleven Multilingual v2',
        description: 'Best quality for multiple languages',
        languages: 29,
        latency: 'Medium',
        quality: 'Highest',
        use_cases: ['Multilingual content', 'Professional narration', 'Audiobooks'],
        max_characters_request_free_user: 500,
        max_characters_request_subscribed_user: 5000
      },
      {
        model_id: 'eleven_monolingual_v1',
        name: 'Eleven Monolingual v1',
        description: 'High quality English-only model',
        languages: 1,
        latency: 'Medium',
        quality: 'High',
        use_cases: ['English content', 'Podcasts', 'Audiobooks'],
        max_characters_request_free_user: 500,
        max_characters_request_subscribed_user: 5000
      }
    ];
    
    return NextResponse.json({
      success: true,
      models: mockModels,
      note: 'Using mock data - backend not available'
    });
  }
}
