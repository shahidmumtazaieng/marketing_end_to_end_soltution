import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { vendorSelectionAgent, ConversationContext } from '@/lib/services/vendorSelectionAgent';

/**
 * POST /api/vendor-selection/process-conversation
 * Process a conversation through the vendor selection agent
 * This endpoint is called automatically when a conversation ends
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { conversation_id, call_id, conversation_data } = body;

    if (!conversation_id || !conversation_data) {
      return NextResponse.json(
        { success: false, error: 'Conversation ID and data are required' },
        { status: 400 }
      );
    }

    console.log(`🧠 Processing conversation ${conversation_id} for vendor selection`);

    // Prepare conversation context
    const context: ConversationContext = {
      conversation_id,
      call_id: call_id || conversation_id,
      user_id: userId,
      conversation_turns: conversation_data.turns || [],
      extracted_data: conversation_data.extracted_data || {},
      analysis: conversation_data.analysis || {},
      call_metadata: {
        phone_number: conversation_data.metadata?.phone_number || '',
        call_type: conversation_data.metadata?.call_type || 'unknown',
        started_at: conversation_data.metadata?.started_at || new Date().toISOString(),
        ended_at: conversation_data.metadata?.ended_at,
        duration: conversation_data.metadata?.duration
      }
    };

    // Process through vendor selection agent
    const result = await vendorSelectionAgent.processConversation(context);

    // Log the result
    console.log(`Vendor selection result:`, {
      triggered: result.triggered,
      trigger_point: result.trigger_point?.name,
      vendors_selected: result.selected_vendors.length,
      actions_taken: result.actions_taken,
      confidence_score: result.confidence_score
    });

    // Store the result for tracking
    await storeVendorSelectionResult(userId, conversation_id, result);

    return NextResponse.json({
      success: true,
      result: {
        triggered: result.triggered,
        trigger_point_name: result.trigger_point?.name,
        vendors_selected: result.selected_vendors.length,
        vendor_names: result.selected_vendors.map(v => v.vendor_name),
        actions_taken: result.actions_taken,
        order_id: result.order_id,
        confidence_score: result.confidence_score,
        trigger_reason: result.trigger_reason
      },
      message: result.triggered 
        ? `Vendor selection triggered: ${result.trigger_point?.name}` 
        : 'No trigger points activated'
    });

  } catch (error) {
    console.error('Vendor selection processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process conversation for vendor selection' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/vendor-selection/process-conversation
 * Get vendor selection processing history
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const triggered = searchParams.get('triggered'); // 'true', 'false', or null for all

    // Get processing history
    const history = await getVendorSelectionHistory(userId, {
      page,
      limit,
      date_from: dateFrom,
      date_to: dateTo,
      triggered: triggered === 'true' ? true : triggered === 'false' ? false : undefined
    });

    return NextResponse.json({
      success: true,
      history: history.records,
      total_count: history.total_count,
      page,
      limit,
      total_pages: Math.ceil(history.total_count / limit)
    });

  } catch (error) {
    console.error('Get vendor selection history error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve processing history' },
      { status: 500 }
    );
  }
}

/**
 * Store vendor selection result for tracking and analytics
 */
async function storeVendorSelectionResult(userId: string, conversationId: string, result: any) {
  try {
    const record = {
      id: `vs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      conversation_id: conversationId,
      triggered: result.triggered,
      trigger_point_id: result.trigger_point?.id,
      trigger_point_name: result.trigger_point?.name,
      confidence_score: result.confidence_score,
      trigger_reason: result.trigger_reason,
      vendors_selected: result.selected_vendors.length,
      selected_vendor_ids: result.selected_vendors.map((v: any) => v.vendor_id),
      actions_taken: result.actions_taken,
      order_id: result.order_id,
      customer_data: result.customer_data,
      processing_time: Date.now(), // Would calculate actual processing time
      created_at: new Date().toISOString()
    };

    console.log(`Storing vendor selection result:`, {
      id: record.id,
      triggered: record.triggered,
      trigger_point: record.trigger_point_name,
      vendors_count: record.vendors_selected
    });

    // In production, save to database
    /*
    await db.vendor_selection_results.create({
      data: record
    });
    */

    // Update analytics
    await updateVendorSelectionAnalytics(userId, result);

  } catch (error) {
    console.error('Failed to store vendor selection result:', error);
    // Don't throw error for storage failures
  }
}

/**
 * Update vendor selection analytics
 */
async function updateVendorSelectionAnalytics(userId: string, result: any) {
  try {
    const today = new Date().toISOString().split('T')[0];

    console.log(`Updating vendor selection analytics for user ${userId}:`, {
      date: today,
      triggered: result.triggered,
      trigger_point: result.trigger_point?.name
    });

    // In production, update analytics tables
    /*
    // Update daily analytics
    await db.vendor_selection_analytics.upsert({
      where: {
        user_id_date: {
          user_id: userId,
          date: today
        }
      },
      update: {
        total_processed: { increment: 1 },
        total_triggered: result.triggered ? { increment: 1 } : undefined,
        total_vendors_notified: { increment: result.selected_vendors.length },
        total_orders_created: result.actions_taken.order_created ? { increment: 1 } : undefined,
        avg_confidence_score: result.confidence_score // Would calculate proper average
      },
      create: {
        user_id: userId,
        date: today,
        total_processed: 1,
        total_triggered: result.triggered ? 1 : 0,
        total_vendors_notified: result.selected_vendors.length,
        total_orders_created: result.actions_taken.order_created ? 1 : 0,
        avg_confidence_score: result.confidence_score
      }
    });

    // Update trigger point specific analytics
    if (result.triggered && result.trigger_point) {
      await db.trigger_point_analytics.upsert({
        where: {
          trigger_point_id_date: {
            trigger_point_id: result.trigger_point.id,
            date: today
          }
        },
        update: {
          activation_count: { increment: 1 },
          avg_confidence_score: result.confidence_score,
          vendors_notified: { increment: result.selected_vendors.length }
        },
        create: {
          trigger_point_id: result.trigger_point.id,
          date: today,
          activation_count: 1,
          avg_confidence_score: result.confidence_score,
          vendors_notified: result.selected_vendors.length
        }
      });
    }
    */

  } catch (error) {
    console.error('Failed to update vendor selection analytics:', error);
    // Don't throw error for analytics failures
  }
}

/**
 * Get vendor selection processing history
 */
async function getVendorSelectionHistory(userId: string, filters: any) {
  // Mock data - replace with actual database query
  const mockHistory = [
    {
      id: 'vs_1',
      conversation_id: 'conv_123',
      triggered: true,
      trigger_point_name: 'Appointment Booking',
      confidence_score: 0.85,
      trigger_reason: 'Keywords matched (80%), Required conditions met (90%), Intent alignment (85%)',
      vendors_selected: 2,
      vendor_names: ['ABC Cleaning Service', 'XYZ Maintenance'],
      actions_taken: {
        customer_email_sent: true,
        vendors_notified: true,
        order_created: true
      },
      order_id: 'order_123',
      customer_name: 'John Smith',
      customer_location: 'New York, NY',
      processing_time: 1250, // milliseconds
      created_at: new Date().toISOString()
    },
    {
      id: 'vs_2',
      conversation_id: 'conv_124',
      triggered: false,
      trigger_point_name: null,
      confidence_score: 0.45,
      trigger_reason: 'Confidence score below threshold',
      vendors_selected: 0,
      vendor_names: [],
      actions_taken: {
        customer_email_sent: false,
        vendors_notified: false,
        order_created: false
      },
      order_id: null,
      customer_name: 'Jane Doe',
      customer_location: 'Los Angeles, CA',
      processing_time: 850,
      created_at: new Date().toISOString()
    }
  ];

  // Apply filters (simplified)
  let filtered = mockHistory;

  if (filters.triggered !== undefined) {
    filtered = filtered.filter(record => record.triggered === filters.triggered);
  }

  if (filters.date_from) {
    filtered = filtered.filter(record => record.created_at >= filters.date_from);
  }

  if (filters.date_to) {
    filtered = filtered.filter(record => record.created_at <= filters.date_to);
  }

  // Pagination
  const startIndex = (filters.page - 1) * filters.limit;
  const endIndex = startIndex + filters.limit;
  const paginatedRecords = filtered.slice(startIndex, endIndex);

  return {
    records: paginatedRecords,
    total_count: filtered.length
  };
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
