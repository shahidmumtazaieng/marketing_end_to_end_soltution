import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: Get ElevenLabs Voices
 * Fetches available voices from our Node.js backend
 */

export async function GET(request: NextRequest) {
  try {
    // Get the backend API URL
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    // Forward the request to our Node.js backend
    const response = await fetch(`${backendUrl}/api/elevenlabs/voices`, {
      headers: {
        'Authorization': `Bearer ${process.env.API_SECRET_KEY || 'dev-key'}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch voices');
    }

    return NextResponse.json({
      success: true,
      voices: data.voices || [],
    });

  } catch (error) {
    console.error('❌ Failed to fetch voices:', error);
    
    // Return mock data for development
    const mockVoices = [
      {
        voice_id: 'pNInz6obpgDQGcFmaJgB',
        name: 'Adam',
        category: 'premade',
        description: 'Deep, authoritative voice',
        labels: { gender: 'male', age: 'middle_aged', accent: 'american' },
        verified_languages: [{ language: 'en', accent: 'american' }],
        preview_url: null
      },
      {
        voice_id: 'EXAVITQu4vr4xnSDxMaL',
        name: 'Bella',
        category: 'premade', 
        description: 'Warm, friendly voice',
        labels: { gender: 'female', age: 'young', accent: 'american' },
        verified_languages: [{ language: 'en', accent: 'american' }],
        preview_url: null
      },
      {
        voice_id: 'ErXwobaYiN019PkySvjV',
        name: 'Antoni',
        category: 'premade',
        description: 'Professional, clear voice',
        labels: { gender: 'male', age: 'young', accent: 'american' },
        verified_languages: [{ language: 'en', accent: 'american' }],
        preview_url: null
      },
      {
        voice_id: 'VR6AewLTigWG4xSOukaG',
        name: 'Arnold',
        category: 'premade',
        description: 'Confident, strong voice',
        labels: { gender: 'male', age: 'middle_aged', accent: 'american' },
        verified_languages: [{ language: 'en', accent: 'american' }],
        preview_url: null
      },
      {
        voice_id: 'ThT5KcBeYPX3keUQqHPh',
        name: 'Dorothy',
        category: 'premade',
        description: 'Pleasant, mature voice',
        labels: { gender: 'female', age: 'middle_aged', accent: 'british' },
        verified_languages: [{ language: 'en', accent: 'british' }],
        preview_url: null
      }
    ];
    
    return NextResponse.json({
      success: true,
      voices: mockVoices,
      note: 'Using mock data - backend not available'
    });
  }
}
