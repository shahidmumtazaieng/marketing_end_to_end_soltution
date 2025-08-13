import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: Health Check
 * Checks the health of all calling agent services
 */

export async function GET(request: NextRequest) {
  try {
    // Get the backend API URL
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    // Check backend health
    const response = await fetch(`${backendUrl}/api/calling-agent/health`, {
      headers: {
        'Authorization': `Bearer ${process.env.API_SECRET_KEY || 'dev-key'}`,
      },
      // Add timeout
      signal: AbortSignal.timeout(5000)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Backend health check failed');
    }

    return NextResponse.json({
      success: true,
      health_status: data.health_status,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Health check failed:', error);
    
    // Return mock health status for development
    const mockHealthStatus = {
      backend: {
        status: 'degraded',
        message: 'Backend not available',
        latency: null
      },
      elevenlabs: {
        status: 'unknown',
        message: 'Cannot verify ElevenLabs status',
        latency: null
      },
      scam_detection: {
        status: 'unknown',
        message: 'Cannot verify scam detection service',
        latency: null
      },
      nlp_processing: {
        status: 'unknown',
        message: 'Cannot verify NLP processing service',
        latency: null
      },
      voice_analysis: {
        status: 'unknown',
        message: 'Cannot verify voice analysis service',
        latency: null
      },
      database: {
        status: 'unknown',
        message: 'Cannot verify database connection',
        latency: null
      }
    };
    
    return NextResponse.json({
      success: false,
      health_status: mockHealthStatus,
      error: error instanceof Error ? error.message : 'Health check failed',
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
