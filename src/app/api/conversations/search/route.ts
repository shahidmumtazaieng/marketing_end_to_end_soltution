import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { realTimeConversationProcessor } from '@/lib/services/realTimeConversationProcessor';

/**
 * GET /api/conversations/search
 * Search and filter conversations with advanced analytics
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
    
    const filter = {
      user_id: userId,
      calling_system: searchParams.get('calling_system') as 'elevenlabs' | 'cloned_voice' | undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      status: searchParams.get('status') as 'active' | 'completed' | 'failed' | undefined,
      has_triggers: searchParams.get('has_triggers') === 'true' ? true : 
                   searchParams.get('has_triggers') === 'false' ? false : undefined,
      lead_score_min: searchParams.get('lead_score_min') ? parseInt(searchParams.get('lead_score_min')!) : undefined,
      lead_score_max: searchParams.get('lead_score_max') ? parseInt(searchParams.get('lead_score_max')!) : undefined,
      search_query: searchParams.get('search_query') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sort_by: searchParams.get('sort_by') as 'created_at' | 'updated_at' | 'lead_score' | 'duration' || 'created_at',
      sort_order: searchParams.get('sort_order') as 'asc' | 'desc' || 'desc'
    };

    console.log(`🔍 Searching conversations for user ${userId}:`, {
      calling_system: filter.calling_system,
      date_range: filter.date_from && filter.date_to ? `${filter.date_from} to ${filter.date_to}` : 'all',
      has_triggers: filter.has_triggers,
      page: filter.page,
      limit: filter.limit
    });

    // Search conversations
    const searchResult = await realTimeConversationProcessor.searchConversations(filter);

    return NextResponse.json({
      success: true,
      conversations: searchResult.conversations,
      pagination: {
        total_count: searchResult.total_count,
        page: searchResult.page,
        limit: searchResult.limit,
        total_pages: searchResult.total_pages,
        has_next: searchResult.page < searchResult.total_pages,
        has_previous: searchResult.page > 1
      },
      performance_stats: searchResult.processing_stats,
      filter_applied: filter
    });

  } catch (error) {
    console.error('Conversation search error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search conversations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/conversations/search/export
 * Export conversations data in various formats
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
      filter = {},
      format = 'csv',
      include_details = false
    } = body;

    // Validate format
    if (!['csv', 'json', 'excel'].includes(format)) {
      return NextResponse.json(
        { success: false, error: 'Invalid format. Must be csv, json, or excel' },
        { status: 400 }
      );
    }

    console.log(`📊 Exporting conversations for user ${userId} in ${format} format`);

    // Add user ID to filter
    const exportFilter = { ...filter, user_id: userId };

    // Export conversations
    const exportResult = await realTimeConversationProcessor.exportConversations(
      exportFilter,
      format
    );

    if (exportResult.success) {
      return NextResponse.json({
        success: true,
        download_url: exportResult.download_url,
        file_info: {
          format: format,
          file_size: exportResult.file_size,
          record_count: exportResult.record_count,
          include_details: include_details
        },
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      });

    } else {
      return NextResponse.json({
        success: false,
        error: exportResult.error || 'Export failed'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Conversation export error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export conversations' },
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
