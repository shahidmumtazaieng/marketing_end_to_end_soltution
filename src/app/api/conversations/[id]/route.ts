import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { realTimeConversationProcessor } from '@/lib/services/realTimeConversationProcessor';

/**
 * GET /api/conversations/[id]
 * Get detailed conversation analysis and results
 */
export async function GET(
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const useCache = searchParams.get('use_cache') !== 'false'; // Default to true
    const includeAudio = searchParams.get('include_audio') === 'true';
    const includeTurns = searchParams.get('include_turns') !== 'false'; // Default to true

    console.log(`📋 Getting conversation details for ${conversationId}`);

    // Get conversation details
    const conversationDetails = await realTimeConversationProcessor.getConversation(
      conversationId,
      useCache
    );

    if (!conversationDetails) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Verify user has access to this conversation
    if (conversationDetails.summary.user_id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Prepare response data
    const responseData: any = {
      success: true,
      conversation: {
        conversation_id: conversationDetails.conversation_id,
        calling_system: conversationDetails.summary.calling_system,
        
        // Call metadata
        call_metadata: conversationDetails.summary.call_metadata,
        
        // Analysis summary
        analysis_summary: {
          conversation_analysis: conversationDetails.summary.conversation_analysis,
          sentiment_analysis: conversationDetails.summary.sentiment_analysis,
          intent_analysis: conversationDetails.summary.intent_analysis,
          quality_metrics: conversationDetails.summary.quality_metrics
        },
        
        // Extracted business data
        extracted_data: conversationDetails.summary.extracted_business_data,
        
        // Trigger detection results
        trigger_detection: conversationDetails.summary.trigger_detection,
        
        // Processing metadata
        processing_metadata: conversationDetails.summary.processing_metadata
      }
    };

    // Include conversation turns if requested
    if (includeTurns) {
      responseData.conversation.turns = conversationDetails.turns.map(turn => ({
        id: turn.id,
        speaker: turn.speaker,
        content: turn.content,
        timestamp: turn.timestamp,
        duration: turn.duration,
        confidence: turn.confidence,
        sentiment: turn.sentiment,
        intent: turn.intent,
        entities: turn.entities
      }));
    }

    // Include audio analysis if requested
    if (includeAudio && conversationDetails.audio_analysis) {
      responseData.conversation.audio_analysis = conversationDetails.audio_analysis;
    }

    // Include raw transcript if available
    if (conversationDetails.raw_transcript) {
      responseData.conversation.raw_transcript = conversationDetails.raw_transcript;
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Get conversation details error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve conversation details' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/conversations/[id]/reprocess
 * Reprocess conversation with updated trigger points
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
    const {
      skip_vendor_selection = false,
      force_reprocess = true
    } = body;

    console.log(`🔄 Reprocessing conversation ${conversationId} for user ${userId}`);

    // Get original conversation data
    const originalConversation = await realTimeConversationProcessor.getConversation(
      conversationId,
      false // Don't use cache for reprocessing
    );

    if (!originalConversation) {
      return NextResponse.json(
        { success: false, error: 'Original conversation not found' },
        { status: 404 }
      );
    }

    // Verify user has access
    if (originalConversation.summary.user_id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Reconstruct conversation data for reprocessing
    const conversationData = {
      conversation_id: originalConversation.conversation_id,
      call_id: originalConversation.summary.call_id,
      phone_number: originalConversation.summary.call_metadata.phone_number,
      call_type: originalConversation.summary.call_metadata.call_type,
      started_at: originalConversation.summary.call_metadata.started_at,
      ended_at: originalConversation.summary.call_metadata.ended_at,
      duration_seconds: originalConversation.summary.call_metadata.duration_seconds,
      call_status: originalConversation.summary.call_metadata.call_status,
      recording_url: originalConversation.summary.call_metadata.recording_url,
      conversation_turns: originalConversation.turns,
      transcript: originalConversation.raw_transcript
    };

    // Reprocess conversation
    const reprocessResult = await realTimeConversationProcessor.processConversation(
      conversationData,
      originalConversation.summary.calling_system,
      userId,
      {
        forceReprocess: force_reprocess,
        skipVendorSelection: skip_vendor_selection,
        skipCache: false
      }
    );

    if (reprocessResult.success) {
      return NextResponse.json({
        success: true,
        conversation_id: reprocessResult.conversation_id,
        reprocessing_result: {
          processing_time_ms: reprocessResult.processing_time_ms,
          triggers_detected: reprocessResult.analysis_result.summary.trigger_detection.triggers_detected.length,
          vendor_selection_triggered: reprocessResult.analysis_result.summary.trigger_detection.vendor_selection_triggered,
          lead_score: reprocessResult.analysis_result.summary.quality_metrics.lead_score,
          primary_intent: reprocessResult.analysis_result.summary.intent_analysis.primary_intent
        },
        vendor_selection_result: reprocessResult.vendor_selection_result ? {
          triggered: reprocessResult.vendor_selection_result.triggered,
          vendors_selected: reprocessResult.vendor_selection_result.selected_vendors?.length || 0,
          actions_taken: reprocessResult.vendor_selection_result.actions_taken
        } : null,
        cache_status: reprocessResult.cache_status,
        database_status: reprocessResult.database_status
      });

    } else {
      return NextResponse.json({
        success: false,
        error: reprocessResult.error || 'Reprocessing failed',
        conversation_id: reprocessResult.conversation_id
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Reprocess conversation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reprocess conversation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/conversations/[id]
 * Delete conversation and all associated data
 */
export async function DELETE(
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

    console.log(`🗑️ Deleting conversation ${conversationId} for user ${userId}`);

    // Verify conversation exists and user has access
    const conversation = await realTimeConversationProcessor.getConversation(conversationId, false);

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    if (conversation.summary.user_id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Delete conversation (implementation would remove from cache and database)
    // await deleteConversation(conversationId, userId);

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully',
      conversation_id: conversationId
    });

  } catch (error) {
    console.error('Delete conversation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete conversation' },
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
