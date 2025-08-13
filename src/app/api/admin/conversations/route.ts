import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { unifiedBackend } from '@/lib/services/unifiedBackendService';

/**
 * POST /api/admin/conversations
 * Admin: Create conversation record from calling systems
 */
export async function POST(request: NextRequest) {
  try {
    // Get admin user ID from authentication
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const { userId, role } = getUserFromAuth(authorization);

    if (!userId || role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const conversationData = await request.json();

    // Validate required fields
    if (!conversationData.calling_system || !conversationData.conversation_data) {
      return NextResponse.json(
        { success: false, error: 'Calling system and conversation data are required' },
        { status: 400 }
      );
    }

    console.log(`📞 Admin: Creating conversation record for user ${userId}`);

    // Create conversation using unified backend
    const conversation = await unifiedBackend.createConversation(userId, conversationData);

    return NextResponse.json({
      success: true,
      message: 'Conversation created successfully',
      conversation: {
        conversation_id: conversation.conversation_id,
        calling_system: conversation.calling_system,
        triggers_detected: conversation.triggers_detected.length,
        vendor_selection_triggered: conversation.vendor_selection_triggered,
        processing_time_ms: conversation.processing_time_ms,
        created_at: conversation.created_at
      }
    });

  } catch (error) {
    console.error('Admin create conversation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/conversations
 * Admin: Get conversation history with analytics
 */
export async function GET(request: NextRequest) {
  try {
    // Get admin user ID from authentication
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const { userId, role } = getUserFromAuth(authorization);

    if (!userId || role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const filters = {
      calling_system: searchParams.get('calling_system') as 'elevenlabs' | 'cloned_voice' | undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      has_triggers: searchParams.get('has_triggers') === 'true' ? true : 
                   searchParams.get('has_triggers') === 'false' ? false : undefined,
      vendor_selection_triggered: searchParams.get('vendor_selection_triggered') === 'true',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20')
    };

    console.log(`📊 Admin: Getting conversations for user ${userId}`);

    // Get conversations using unified backend
    // In production, implement getConversations method
    const conversations = []; // await unifiedBackend.getConversations(userId, filters);

    // Calculate analytics
    const analytics = {
      total_conversations: conversations.length,
      by_calling_system: {
        elevenlabs: conversations.filter(c => c.calling_system === 'elevenlabs').length,
        cloned_voice: conversations.filter(c => c.calling_system === 'cloned_voice').length
      },
      trigger_detection_rate: conversations.length > 0 ? 
        conversations.filter(c => c.triggers_detected.length > 0).length / conversations.length : 0,
      vendor_selection_rate: conversations.length > 0 ?
        conversations.filter(c => c.vendor_selection_triggered).length / conversations.length : 0,
      avg_processing_time_ms: conversations.length > 0 ?
        conversations.reduce((sum, c) => sum + c.processing_time_ms, 0) / conversations.length : 0
    };

    return NextResponse.json({
      success: true,
      conversations: conversations.map(c => ({
        conversation_id: c.conversation_id,
        calling_system: c.calling_system,
        triggers_detected: c.triggers_detected.length,
        vendor_selection_triggered: c.vendor_selection_triggered,
        processing_time_ms: c.processing_time_ms,
        cache_status: c.cache_status,
        created_at: c.created_at
      })),
      analytics,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: conversations.length,
        has_more: false
      }
    });

  } catch (error) {
    console.error('Admin get conversations error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve conversations' },
      { status: 500 }
    );
  }
}

/**
 * Extract user info from authorization header
 */
function getUserFromAuth(authorization: string | null): { userId: string | null; role: string | null } {
  if (!authorization) return { userId: null, role: null };
  
  try {
    const token = authorization.replace('Bearer ', '');
    // In production, decode JWT token and extract user info
    return { 
      userId: 'admin_user_123', // Mock admin user ID
      role: 'admin' 
    };
  } catch (error) {
    console.error('Auth extraction error:', error);
    return { userId: null, role: null };
  }
}
