import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * PUT /api/call-tracking/conversations/[id]/lead-status
 * Update lead status for a conversation
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
    const { lead_status } = body;

    // Validate lead status
    const validStatuses = ['new', 'interested', 'not_interested', 'callback', 'converted', 'do_not_call'];
    if (!validStatuses.includes(lead_status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid lead status',
          valid_statuses: validStatuses
        },
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

    // Update lead status in database
    const updatedConversation = await updateConversationLeadStatus(
      conversationId, 
      userId, 
      lead_status,
      conversation.lead_status // Previous status for logging
    );

    return NextResponse.json({
      success: true,
      message: 'Lead status updated successfully',
      conversation_id: conversationId,
      previous_status: conversation.lead_status,
      new_status: lead_status,
      updated_conversation: updatedConversation
    });

  } catch (error) {
    console.error('Update lead status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update lead status' },
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
      lead_status: 'new',
      lead_score: 85,
      priority_level: 3
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
 * Update conversation lead status in database
 */
async function updateConversationLeadStatus(
  conversationId: string, 
  userId: string, 
  newLeadStatus: string,
  previousLeadStatus: string
) {
  try {
    // Calculate new priority level based on lead status
    const newPriorityLevel = calculatePriorityFromLeadStatus(newLeadStatus);
    
    // Set follow-up date if needed
    const followUpDate = calculateFollowUpDate(newLeadStatus);

    const updateData = {
      lead_status: newLeadStatus,
      priority_level: newPriorityLevel,
      follow_up_date: followUpDate,
      updated_at: new Date().toISOString()
    };

    console.log(`Updating lead status for conversation ${conversationId}:`, {
      user_id: userId,
      previous_status: previousLeadStatus,
      new_status: newLeadStatus,
      new_priority: newPriorityLevel,
      follow_up_date: followUpDate,
      timestamp: new Date().toISOString()
    });

    // In production, update the database
    /*
    const updatedConversation = await db.call_conversations.update({
      where: {
        id: conversationId,
        user_id: userId
      },
      data: updateData
    });
    */

    // Mock updated conversation
    const updatedConversation = {
      id: conversationId,
      lead_status: newLeadStatus,
      priority_level: newPriorityLevel,
      follow_up_date: followUpDate,
      updated_at: updateData.updated_at
    };

    // Log the status change
    await logLeadStatusChange(
      conversationId, 
      userId, 
      previousLeadStatus, 
      newLeadStatus,
      newPriorityLevel
    );

    // Update related analytics
    await updateLeadStatusAnalytics(userId, previousLeadStatus, newLeadStatus);

    return updatedConversation;

  } catch (error) {
    console.error('Failed to update conversation lead status:', error);
    throw error;
  }
}

/**
 * Calculate priority level based on lead status
 */
function calculatePriorityFromLeadStatus(leadStatus: string): number {
  const priorityMap: Record<string, number> = {
    'converted': 5,      // Highest priority - already converted
    'interested': 4,     // High priority - hot lead
    'callback': 3,       // Medium priority - needs follow-up
    'new': 2,           // Low-medium priority - needs qualification
    'not_interested': 1, // Low priority - nurture campaign
    'do_not_call': 1    // Low priority - compliance
  };

  return priorityMap[leadStatus] || 2;
}

/**
 * Calculate follow-up date based on lead status
 */
function calculateFollowUpDate(leadStatus: string): string | null {
  const now = new Date();
  
  switch (leadStatus) {
    case 'interested':
      // Follow up within 1-2 days for interested leads
      now.setDate(now.getDate() + 1);
      return now.toISOString().split('T')[0];
      
    case 'callback':
      // Follow up within 3-5 days for callback requests
      now.setDate(now.getDate() + 3);
      return now.toISOString().split('T')[0];
      
    case 'not_interested':
      // Follow up in 30 days for nurture campaign
      now.setDate(now.getDate() + 30);
      return now.toISOString().split('T')[0];
      
    case 'converted':
    case 'do_not_call':
      // No follow-up needed
      return null;
      
    default:
      // Default follow-up in 7 days
      now.setDate(now.getDate() + 7);
      return now.toISOString().split('T')[0];
  }
}

/**
 * Log lead status change for audit trail
 */
async function logLeadStatusChange(
  conversationId: string,
  userId: string,
  previousStatus: string,
  newStatus: string,
  newPriority: number
) {
  try {
    console.log(`Lead status change logged:`, {
      conversation_id: conversationId,
      user_id: userId,
      previous_status: previousStatus,
      new_status: newStatus,
      new_priority: newPriority,
      timestamp: new Date().toISOString()
    });

    // In production, log this activity
    /*
    await db.activity_logs.create({
      data: {
        user_id: userId,
        entity_type: 'conversation',
        entity_id: conversationId,
        action: 'lead_status_change',
        metadata: {
          previous_status: previousStatus,
          new_status: newStatus,
          new_priority: newPriority
        },
        created_at: new Date()
      }
    });
    */
  } catch (error) {
    console.error('Failed to log lead status change:', error);
    // Don't throw error for logging failures
  }
}

/**
 * Update analytics when lead status changes
 */
async function updateLeadStatusAnalytics(
  userId: string,
  previousStatus: string,
  newStatus: string
) {
  try {
    console.log(`Updating lead status analytics:`, {
      user_id: userId,
      previous_status: previousStatus,
      new_status: newStatus,
      timestamp: new Date().toISOString()
    });

    // In production, update analytics tables
    /*
    // Decrement previous status count
    await db.lead_status_analytics.upsert({
      where: {
        user_id_status_date: {
          user_id: userId,
          status: previousStatus,
          date: new Date().toISOString().split('T')[0]
        }
      },
      update: {
        count: { decrement: 1 }
      },
      create: {
        user_id: userId,
        status: previousStatus,
        date: new Date().toISOString().split('T')[0],
        count: 0
      }
    });

    // Increment new status count
    await db.lead_status_analytics.upsert({
      where: {
        user_id_status_date: {
          user_id: userId,
          status: newStatus,
          date: new Date().toISOString().split('T')[0]
        }
      },
      update: {
        count: { increment: 1 }
      },
      create: {
        user_id: userId,
        status: newStatus,
        date: new Date().toISOString().split('T')[0],
        count: 1
      }
    });
    */
  } catch (error) {
    console.error('Failed to update lead status analytics:', error);
    // Don't throw error for analytics failures
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
