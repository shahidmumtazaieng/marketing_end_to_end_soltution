import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * GET /api/call-tracking/export
 * Export call tracking data in CSV or Excel format
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
    const format = searchParams.get('format') || 'csv';
    const search = searchParams.get('search') || '';
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const callType = searchParams.get('call_type');
    const leadStatus = searchParams.get('lead_status');

    // Validate format
    if (!['csv', 'excel'].includes(format)) {
      return NextResponse.json(
        { success: false, error: 'Invalid export format. Use csv or excel.' },
        { status: 400 }
      );
    }

    // Build filters for data retrieval
    const filters = {
      user_id: userId,
      search,
      date_from: dateFrom,
      date_to: dateTo,
      call_type: callType !== 'all' ? callType : undefined,
      lead_status: leadStatus !== 'all' ? leadStatus : undefined
    };

    // Get all conversations matching filters (no pagination for export)
    const conversations = await getConversationsForExport(filters);

    // Generate export file based on format
    let fileContent: string | Buffer;
    let contentType: string;
    let fileName: string;

    if (format === 'csv') {
      fileContent = generateCSV(conversations);
      contentType = 'text/csv';
      fileName = `call-tracking-${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      fileContent = await generateExcel(conversations);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileName = `call-tracking-${new Date().toISOString().split('T')[0]}.xlsx`;
    }

    // Log export activity
    await logExportActivity(userId, format, filters, conversations.length);

    // Return file
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileContent.length.toString()
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

/**
 * Get conversations for export (all matching records)
 */
async function getConversationsForExport(filters: any) {
  // Mock data - replace with actual database query
  const mockConversations = [
    {
      id: 'conv_1',
      call_id: 'call_123',
      phone_number: '+1234567890',
      call_type: 'elevenlabs_agent',
      started_at: '2024-01-15T10:30:00Z',
      ended_at: '2024-01-15T10:33:00Z',
      duration: 180,
      status: 'completed',
      business_name: 'Tech Solutions Inc',
      contact_name: 'John Smith',
      owner_name: 'John Smith',
      location: 'New York, NY',
      industry: 'Technology',
      email: 'john@techsolutions.com',
      website: 'https://techsolutions.com',
      conversation_summary: 'Discussed marketing automation needs. Customer showed interest in our AI calling solution.',
      lead_status: 'interested',
      lead_score: 85,
      sentiment_score: 0.7,
      engagement_level: 0.8,
      user_comments: 'High-quality lead. Schedule demo for next week.',
      follow_up_date: '2024-01-22',
      priority_level: 4,
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:35:00Z'
    },
    {
      id: 'conv_2',
      call_id: 'call_124',
      phone_number: '+1234567891',
      call_type: 'ai_cloned_voice',
      started_at: '2024-01-15T14:15:00Z',
      ended_at: '2024-01-15T14:17:00Z',
      duration: 120,
      status: 'completed',
      business_name: 'Local Restaurant',
      contact_name: 'Maria Garcia',
      owner_name: 'Maria Garcia',
      location: 'Los Angeles, CA',
      industry: 'Hospitality',
      email: 'maria@localrestaurant.com',
      website: null,
      conversation_summary: 'Restaurant owner interested in customer management system.',
      lead_status: 'callback',
      lead_score: 65,
      sentiment_score: 0.4,
      engagement_level: 0.6,
      user_comments: 'Needs to discuss with business partner. Call back in 3 days.',
      follow_up_date: '2024-01-18',
      priority_level: 3,
      created_at: '2024-01-15T14:15:00Z',
      updated_at: '2024-01-15T14:20:00Z'
    },
    {
      id: 'conv_3',
      call_id: 'call_125',
      phone_number: '+1234567892',
      call_type: 'elevenlabs_agent',
      started_at: '2024-01-16T09:45:00Z',
      ended_at: '2024-01-16T09:46:00Z',
      duration: 60,
      status: 'completed',
      business_name: 'Construction Co',
      contact_name: 'Bob Wilson',
      owner_name: null,
      location: 'Chicago, IL',
      industry: 'Construction',
      email: null,
      website: null,
      conversation_summary: 'Not interested in digital marketing services at this time.',
      lead_status: 'not_interested',
      lead_score: 25,
      sentiment_score: -0.3,
      engagement_level: 0.2,
      user_comments: 'Add to nurture campaign for future follow-up.',
      follow_up_date: null,
      priority_level: 1,
      created_at: '2024-01-16T09:45:00Z',
      updated_at: '2024-01-16T09:50:00Z'
    }
  ];

  // Apply filters (simplified)
  let filtered = mockConversations;

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(conv => 
      conv.business_name?.toLowerCase().includes(searchLower) ||
      conv.contact_name?.toLowerCase().includes(searchLower) ||
      conv.phone_number.includes(searchLower) ||
      conv.email?.toLowerCase().includes(searchLower)
    );
  }

  if (filters.call_type) {
    filtered = filtered.filter(conv => conv.call_type === filters.call_type);
  }

  if (filters.lead_status) {
    filtered = filtered.filter(conv => conv.lead_status === filters.lead_status);
  }

  if (filters.date_from) {
    filtered = filtered.filter(conv => conv.started_at >= filters.date_from);
  }

  if (filters.date_to) {
    filtered = filtered.filter(conv => conv.started_at <= filters.date_to);
  }

  return filtered;
}

/**
 * Generate CSV content
 */
function generateCSV(conversations: any[]): string {
  const headers = [
    'Call ID',
    'Date & Time',
    'Phone Number',
    'Call Type',
    'Duration (seconds)',
    'Status',
    'Business Name',
    'Contact Name',
    'Owner Name',
    'Location',
    'Industry',
    'Email',
    'Website',
    'Lead Status',
    'Lead Score',
    'Sentiment Score',
    'Engagement Level',
    'Priority Level',
    'Conversation Summary',
    'User Comments',
    'Follow Up Date',
    'Created At',
    'Updated At'
  ];

  const csvRows = [headers.join(',')];

  conversations.forEach(conv => {
    const row = [
      conv.call_id,
      conv.started_at,
      conv.phone_number,
      conv.call_type,
      conv.duration || 0,
      conv.status,
      escapeCSV(conv.business_name || ''),
      escapeCSV(conv.contact_name || ''),
      escapeCSV(conv.owner_name || ''),
      escapeCSV(conv.location || ''),
      escapeCSV(conv.industry || ''),
      conv.email || '',
      conv.website || '',
      conv.lead_status,
      conv.lead_score,
      conv.sentiment_score,
      conv.engagement_level,
      conv.priority_level,
      escapeCSV(conv.conversation_summary || ''),
      escapeCSV(conv.user_comments || ''),
      conv.follow_up_date || '',
      conv.created_at,
      conv.updated_at
    ];
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

/**
 * Escape CSV values
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Generate Excel content (simplified - in production use a proper Excel library)
 */
async function generateExcel(conversations: any[]): Promise<Buffer> {
  // For this example, we'll generate a simple tab-separated format
  // In production, use libraries like 'exceljs' or 'xlsx'
  
  const headers = [
    'Call ID',
    'Date & Time',
    'Phone Number',
    'Call Type',
    'Duration (seconds)',
    'Status',
    'Business Name',
    'Contact Name',
    'Owner Name',
    'Location',
    'Industry',
    'Email',
    'Website',
    'Lead Status',
    'Lead Score',
    'Sentiment Score',
    'Engagement Level',
    'Priority Level',
    'Conversation Summary',
    'User Comments',
    'Follow Up Date',
    'Created At',
    'Updated At'
  ];

  const rows = [headers.join('\t')];

  conversations.forEach(conv => {
    const row = [
      conv.call_id,
      conv.started_at,
      conv.phone_number,
      conv.call_type,
      conv.duration || 0,
      conv.status,
      conv.business_name || '',
      conv.contact_name || '',
      conv.owner_name || '',
      conv.location || '',
      conv.industry || '',
      conv.email || '',
      conv.website || '',
      conv.lead_status,
      conv.lead_score,
      conv.sentiment_score,
      conv.engagement_level,
      conv.priority_level,
      conv.conversation_summary || '',
      conv.user_comments || '',
      conv.follow_up_date || '',
      conv.created_at,
      conv.updated_at
    ];
    rows.push(row.join('\t'));
  });

  const content = rows.join('\n');
  return Buffer.from(content, 'utf-8');
}

/**
 * Log export activity
 */
async function logExportActivity(
  userId: string, 
  format: string, 
  filters: any, 
  recordCount: number
) {
  try {
    console.log(`Export activity logged:`, {
      user_id: userId,
      export_type: format,
      filter_criteria: filters,
      total_records: recordCount,
      timestamp: new Date().toISOString()
    });

    // In production, save to call_export_logs table
    /*
    await db.call_export_logs.create({
      data: {
        user_id: userId,
        export_type: format,
        filter_criteria: filters,
        total_records: recordCount,
        file_size: 0, // Would calculate actual file size
        created_at: new Date(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    });
    */
  } catch (error) {
    console.error('Failed to log export activity:', error);
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
