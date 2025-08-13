import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * PUT /api/call-tracking/conversations/[id]/comments
 * Update user comments for a conversation
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id: conversationId } = params;
    
    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { comments } = body;

    if (typeof comments !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Comments must be a string' },
        { status: 400 }
      );
    }

    // Verify conversation belongs to user
    const conversation = await getConversation(conversationId, userId);
    
    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Update comments in database
    await updateConversationComments(conversationId, userId, comments);

    return NextResponse.json({
      success: true,
      message: 'Comments updated successfully',
      conversation_id: conversationId,
      comments: comments
    });

  } catch (error) {
    console.error('Update comments error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update comments' },
      { status: 500 }
    );
  }
}

/**
 * Get conversation by ID and user ID
 */
async function getConversation(conversationId: string, userId: string) {
  // Mock data - replace with actual database query
  const mockConversations: Record<string, any> = {
    'conv_1': {
      id: 'conv_1',
      user_id: 'user_123',
      call_id: 'call_123',
      business_name: 'Tech Solutions Inc',
      user_comments: 'Previous comments...'
    }
  };

  const conversation = mockConversations[conversationId];
  
  // Check if conversation exists and belongs to user
  if (conversation && conversation.user_id === userId) {
    return conversation;
  }
  
  return null;
}

/**
 * Update conversation comments in database
 */
async function updateConversationComments(
  conversationId: string, 
  userId: string, 
  comments: string
) {
  try {
    console.log(`Updating comments for conversation ${conversationId}:`, {
      user_id: userId,
      comments_length: comments.length,
      timestamp: new Date().toISOString()
    });

    // In production, update the database
    /*
    await db.call_conversations.update({
      where: {
        id: conversationId,
        user_id: userId
      },
      data: {
        user_comments: comments,
        updated_at: new Date()
      }
    });
    */

    // Log the activity
    await logCommentActivity(conversationId, userId, 'update', comments.length);

  } catch (error) {
    console.error('Failed to update conversation comments:', error);
    throw error;
  }
}

/**
 * Log comment activity for audit trail
 */
async function logCommentActivity(
  conversationId: string,
  userId: string,
  action: string,
  commentLength: number
) {
  try {
    console.log(`Comment activity logged:`, {
      conversation_id: conversationId,
      user_id: userId,
      action,
      comment_length: commentLength,
      timestamp: new Date().toISOString()
    });

    // In production, you might want to log this activity
    /*
    await db.activity_logs.create({
      data: {
        user_id: userId,
        entity_type: 'conversation',
        entity_id: conversationId,
        action: `comment_${action}`,
        metadata: {
          comment_length: commentLength
        },
        created_at: new Date()
      }
    });
    */
  } catch (error) {
    console.error('Failed to log comment activity:', error);
    // Don't throw error for logging failures
  }
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
