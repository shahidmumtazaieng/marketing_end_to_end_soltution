import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: Create Calling Agent
 * Integrates with our Node.js backend to create a new calling agent
 * with ElevenLabs voice and scam detection capabilities
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'voice_id', 'model_id', 'language'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Get the backend API URL
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    // Forward the request to our Node.js backend
    const response = await fetch(`${backendUrl}/api/calling-agent/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_SECRET_KEY || 'dev-key'}`,
      },
      body: JSON.stringify({
        ...body,
        created_from: 'frontend',
        timestamp: new Date().toISOString(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create calling agent');
    }

    return NextResponse.json({
      success: true,
      agent: data.agent,
      message: 'Calling agent created successfully with scam detection enabled',
    });

  } catch (error) {
    console.error('❌ Failed to create calling agent:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get list of existing calling agents
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    const response = await fetch(`${backendUrl}/api/calling-agent/list`, {
      headers: {
        'Authorization': `Bearer ${process.env.API_SECRET_KEY || 'dev-key'}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch calling agents');
    }

    return NextResponse.json({
      success: true,
      agents: data.agents || [],
    });

  } catch (error) {
    console.error('❌ Failed to fetch calling agents:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
