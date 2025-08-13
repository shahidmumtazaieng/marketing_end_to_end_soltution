import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: Call Lists Management
 * Handles CRUD operations for call lists and contact management
 */

interface CallListContact {
  id: string;
  name: string;
  phone: string;
  business_name?: string;
  address?: string;
  category?: string;
  rating?: number;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'called' | 'completed' | 'failed' | 'do_not_call';
  call_attempts: number;
  last_called?: string;
  notes?: string;
  source: 'scraper' | 'upload' | 'manual';
  scraped_data?: any;
}

interface CallList {
  id: string;
  name: string;
  description?: string;
  total_contacts: number;
  pending_contacts: number;
  completed_contacts: number;
  success_rate: number;
  created_at: string;
  updated_at: string;
  agent_config?: {
    voice_id: string;
    voice_name: string;
    language: string;
    knowledge_base: string;
    call_script: string;
    rag_enabled: boolean;
  };
  contacts?: CallListContact[];
}

// GET - Fetch all call lists
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listId = searchParams.get('listId');
    
    // Get the backend API URL
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    if (listId) {
      // Fetch specific call list with contacts
      const response = await fetch(`${backendUrl}/api/calling-agent/call-lists/${listId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.API_SECRET_KEY || 'dev-key'}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch call list');
      }

      return NextResponse.json({
        success: true,
        call_list: data.call_list,
      });
    } else {
      // Fetch all call lists
      const response = await fetch(`${backendUrl}/api/calling-agent/call-lists`, {
        headers: {
          'Authorization': `Bearer ${process.env.API_SECRET_KEY || 'dev-key'}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch call lists');
      }

      return NextResponse.json({
        success: true,
        call_lists: data.call_lists || [],
      });
    }

  } catch (error) {
    console.error('❌ Failed to fetch call lists:', error);
    
    // Return mock data for development
    const mockCallLists: CallList[] = [
      {
        id: '1',
        name: 'HVAC Services - Downtown',
        description: 'HVAC companies scraped from downtown area',
        total_contacts: 247,
        pending_contacts: 189,
        completed_contacts: 58,
        success_rate: 23.5,
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-20T15:45:00Z',
        agent_config: {
          voice_id: 'pNInz6obpgDQGcFmaJgB',
          voice_name: 'Adam',
          language: 'en',
          knowledge_base: 'HVAC services and maintenance',
          call_script: 'Professional HVAC service introduction',
          rag_enabled: true
        }
      },
      {
        id: '2',
        name: 'Plumbing Services - Suburbs',
        description: 'Plumbing companies from suburban areas',
        total_contacts: 156,
        pending_contacts: 134,
        completed_contacts: 22,
        success_rate: 14.1,
        created_at: '2024-01-18T09:15:00Z',
        updated_at: '2024-01-19T11:20:00Z'
      }
    ];
    
    return NextResponse.json({
      success: true,
      call_lists: mockCallLists,
      note: 'Using mock data - backend not available'
    });
  }
}

// POST - Create new call list
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'contacts'];
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
    const response = await fetch(`${backendUrl}/api/calling-agent/call-lists`, {
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
      throw new Error(data.error || 'Failed to create call list');
    }

    return NextResponse.json({
      success: true,
      call_list: data.call_list,
      message: 'Call list created successfully',
    });

  } catch (error) {
    console.error('❌ Failed to create call list:', error);
    
    // Mock successful creation for development
    const mockCallList: CallList = {
      id: `list_${Date.now()}`,
      name: body.name,
      description: body.description,
      total_contacts: body.contacts?.length || 0,
      pending_contacts: body.contacts?.length || 0,
      completed_contacts: 0,
      success_rate: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      agent_config: body.agent_config
    };
    
    return NextResponse.json({
      success: true,
      call_list: mockCallList,
      message: 'Call list created successfully (mock)',
      note: 'Using mock data - backend not available'
    });
  }
}

// PUT - Update call list
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { listId, ...updateData } = body;
    
    if (!listId) {
      return NextResponse.json(
        { success: false, error: 'Missing listId' },
        { status: 400 }
      );
    }

    // Get the backend API URL
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    // Forward the request to our Node.js backend
    const response = await fetch(`${backendUrl}/api/calling-agent/call-lists/${listId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_SECRET_KEY || 'dev-key'}`,
      },
      body: JSON.stringify({
        ...updateData,
        updated_at: new Date().toISOString(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update call list');
    }

    return NextResponse.json({
      success: true,
      call_list: data.call_list,
      message: 'Call list updated successfully',
    });

  } catch (error) {
    console.error('❌ Failed to update call list:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete call list
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listId = searchParams.get('listId');
    
    if (!listId) {
      return NextResponse.json(
        { success: false, error: 'Missing listId' },
        { status: 400 }
      );
    }

    // Get the backend API URL
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    // Forward the request to our Node.js backend
    const response = await fetch(`${backendUrl}/api/calling-agent/call-lists/${listId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${process.env.API_SECRET_KEY || 'dev-key'}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete call list');
    }

    return NextResponse.json({
      success: true,
      message: 'Call list deleted successfully',
    });

  } catch (error) {
    console.error('❌ Failed to delete call list:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
