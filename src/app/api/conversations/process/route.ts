import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { realTimeConversationProcessor } from '@/lib/services/realTimeConversationProcessor';

/**
 * POST /api/conversations/process
 * Process conversation from either calling system (ElevenLabs or Cloned Voice)
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
    const {
      conversation_data,
      calling_system,
      options = {}
    } = body;

    // Validate required fields
    if (!conversation_data || !calling_system) {
      return NextResponse.json(
        { success: false, error: 'Conversation data and calling system are required' },
        { status: 400 }
      );
    }

    // Validate calling system
    if (!['elevenlabs', 'cloned_voice'].includes(calling_system)) {
      return NextResponse.json(
        { success: false, error: 'Invalid calling system. Must be "elevenlabs" or "cloned_voice"' },
        { status: 400 }
      );
    }

    console.log(`🚀 Processing conversation from ${calling_system} for user ${userId}`);

    // Process conversation
    const result = await realTimeConversationProcessor.processConversation(
      conversation_data,
      calling_system,
      userId,
      options
    );

    if (result.success) {
      console.log(`✅ Conversation processed successfully:`, {
        conversation_id: result.conversation_id,
        processing_time_ms: result.processing_time_ms,
        cache_status: result.cache_status,
        database_status: result.database_status,
        triggers_detected: result.analysis_result.summary?.trigger_detection?.triggers_detected?.length || 0,
        vendor_selection_triggered: result.vendor_selection_result?.triggered || false
      });

      return NextResponse.json({
        success: true,
        conversation_id: result.conversation_id,
        processing_time_ms: result.processing_time_ms,
        analysis_summary: {
          primary_intent: result.analysis_result.summary.intent_analysis.primary_intent,
          sentiment: result.analysis_result.summary.sentiment_analysis.overall_sentiment,
          lead_score: result.analysis_result.summary.quality_metrics.lead_score,
          triggers_detected: result.analysis_result.summary.trigger_detection.triggers_detected.length,
          vendor_selection_triggered: result.analysis_result.summary.trigger_detection.vendor_selection_triggered
        },
        vendor_selection: result.vendor_selection_result ? {
          triggered: result.vendor_selection_result.triggered,
          vendors_selected: result.vendor_selection_result.selected_vendors?.length || 0,
          actions_taken: result.vendor_selection_result.actions_taken,
          order_id: result.vendor_selection_result.order_id
        } : null,
        performance: {
          cache_status: result.cache_status,
          database_status: result.database_status,
          processing_time_ms: result.processing_time_ms
        }
      });

    } else {
      console.error(`❌ Conversation processing failed:`, result.error);

      return NextResponse.json({
        success: false,
        error: result.error || 'Processing failed',
        conversation_id: result.conversation_id,
        processing_time_ms: result.processing_time_ms
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Conversation processing API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/conversations/process/status
 * Get processing status and statistics
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
    const timeRange = searchParams.get('time_range') as '1h' | '24h' | '7d' | '30d' || '24h';

    // Get processing statistics
    const stats = await realTimeConversationProcessor.getProcessingStatistics(userId, timeRange);

    return NextResponse.json({
      success: true,
      time_range: timeRange,
      statistics: stats,
      system_status: {
        cache_connected: true, // Would check actual Redis connection
        database_connected: true, // Would check actual database connection
        processing_queue_size: 0, // Would check actual queue size
        avg_response_time_ms: stats.avg_processing_time_ms
      }
    });

  } catch (error) {
    console.error('Get processing status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve processing status' },
      { status: 500 }
    );
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
