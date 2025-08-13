import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * POST /api/call-tracking/conversations
 * Store conversation data from local cache to database
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
    const { call_id, conversation_data } = body;

    if (!call_id || !conversation_data) {
      return NextResponse.json(
        { success: false, error: 'Call ID and conversation data are required' },
        { status: 400 }
      );
    }

    // Process and analyze conversation
    const processedData = await processConversationData(userId, conversation_data);

    // Store in database
    const conversationId = await storeConversation(userId, call_id, processedData);

    // Store conversation turns
    await storeConversationTurns(conversationId, conversation_data.turns);

    // Store analytics
    await storeConversationAnalytics(conversationId, processedData.analytics);

    return NextResponse.json({
      success: true,
      conversation_id: conversationId,
      message: 'Conversation stored successfully',
      extracted_data: processedData.extracted_data,
      analysis: processedData.analysis
    });

  } catch (error) {
    console.error('Store conversation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to store conversation' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/call-tracking/conversations
 * Retrieve user's call conversations with filters
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
    const search = searchParams.get('search') || '';
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const callType = searchParams.get('call_type');
    const leadStatus = searchParams.get('lead_status');
    const sortBy = searchParams.get('sort_by') || 'started_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    // Build filters
    const filters = {
      user_id: userId,
      search,
      date_from: dateFrom,
      date_to: dateTo,
      call_type: callType,
      lead_status: leadStatus,
      page,
      limit,
      sort_by: sortBy,
      sort_order: sortOrder
    };

    // Get conversations from database
    const result = await getConversations(filters);

    return NextResponse.json({
      success: true,
      conversations: result.conversations,
      total_count: result.total_count,
      page,
      limit,
      total_pages: Math.ceil(result.total_count / limit)
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve conversations' },
      { status: 500 }
    );
  }
}

/**
 * Process conversation data and extract insights
 */
async function processConversationData(userId: string, conversationData: any) {
  try {
    // Extract business data from conversation
    const extracted_data = extractBusinessData(conversationData.turns);
    
    // Analyze conversation content
    const analysis = analyzeConversation(conversationData.turns, conversationData.metadata);
    
    // Calculate metrics
    const metrics = calculateConversationMetrics(conversationData.turns);
    
    // Generate AI summary
    const summary = await generateConversationSummary(conversationData.turns);

    return {
      extracted_data,
      analysis,
      metrics,
      summary,
      analytics: {
        ...metrics,
        ...analysis,
        summary
      }
    };
  } catch (error) {
    console.error('Failed to process conversation data:', error);
    throw error;
  }
}

/**
 * Extract business data from conversation turns
 */
function extractBusinessData(turns: any[]) {
  const customerText = turns
    .filter(turn => turn.speaker === 'customer')
    .map(turn => turn.content)
    .join(' ');

  const extracted = {
    business_name: extractPattern(customerText, [
      /(?:my company is|we are|this is|i'm from|i work at|i represent)\s+([^,.!?]+)/i,
      /(?:company name is|business name is|we're called)\s+([^,.!?]+)/i
    ]),
    contact_name: extractPattern(customerText, [
      /(?:my name is|i'm|this is|i am)\s+([a-z]+(?:\s+[a-z]+)?)/i,
      /(?:speaking with|talking to)\s+([a-z]+(?:\s+[a-z]+)?)/i
    ]),
    location: extractPattern(customerText, [
      /(?:located in|based in|we're in|from)\s+([^,.!?]+)/i,
      /(?:our office is in|headquarters in)\s+([^,.!?]+)/i
    ]),
    email: extractPattern(customerText, [
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
    ]),
    website: extractPattern(customerText, [
      /((?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/
    ]),
    phone_number: extractPattern(customerText, [
      /(\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/
    ])
  };

  return extracted;
}

/**
 * Extract pattern from text using multiple regex patterns
 */
function extractPattern(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

/**
 * Analyze conversation for insights
 */
function analyzeConversation(turns: any[], metadata: any) {
  const customerTurns = turns.filter(turn => turn.speaker === 'customer');
  const customerText = customerTurns.map(turn => turn.content.toLowerCase()).join(' ');

  // Calculate sentiment score
  const positiveWords = ['yes', 'good', 'great', 'interested', 'perfect', 'excellent'];
  const negativeWords = ['no', 'bad', 'not interested', 'busy', 'expensive'];
  
  let sentimentScore = 0;
  positiveWords.forEach(word => {
    if (customerText.includes(word)) sentimentScore += 0.1;
  });
  negativeWords.forEach(word => {
    if (customerText.includes(word)) sentimentScore -= 0.1;
  });
  sentimentScore = Math.max(-1, Math.min(1, sentimentScore));

  // Determine intent
  let intent = 'neutral';
  if (customerText.includes('interested') || customerText.includes('tell me more')) {
    intent = 'interested';
  } else if (customerText.includes('not interested') || customerText.includes('busy')) {
    intent = 'not_interested';
  } else if (customerText.includes('call back') || customerText.includes('later')) {
    intent = 'callback';
  }

  // Calculate lead score
  let leadScore = 50; // Base score
  leadScore += sentimentScore * 30;
  leadScore += (customerTurns.length / turns.length) * 20; // Engagement
  leadScore = Math.max(0, Math.min(100, Math.round(leadScore)));

  // Determine outcome
  let outcome = 'information_gathered';
  switch (intent) {
    case 'interested': outcome = 'qualified_lead'; break;
    case 'not_interested': outcome = 'not_qualified'; break;
    case 'callback': outcome = 'follow_up_scheduled'; break;
  }

  return {
    sentiment_score: sentimentScore,
    engagement_level: customerTurns.length / turns.length,
    intent,
    outcome,
    lead_score: leadScore,
    conversion_probability: leadScore / 100,
    follow_up_needed: customerText.includes('call back') || customerText.includes('follow up'),
    priority_level: leadScore >= 80 ? 5 : leadScore >= 60 ? 4 : leadScore >= 40 ? 3 : leadScore >= 20 ? 2 : 1
  };
}

/**
 * Calculate conversation metrics
 */
function calculateConversationMetrics(turns: any[]) {
  const customerTurns = turns.filter(turn => turn.speaker === 'customer');
  const aiTurns = turns.filter(turn => turn.speaker === 'ai');

  return {
    total_turns: turns.length,
    customer_turns: customerTurns.length,
    ai_turns: aiTurns.length,
    avg_customer_response_length: customerTurns.reduce((sum, turn) => sum + turn.content.length, 0) / customerTurns.length || 0,
    questions_asked: turns.filter(turn => turn.content.includes('?')).length,
    conversation_duration: turns.length > 0 ? 
      new Date(turns[turns.length - 1].timestamp).getTime() - new Date(turns[0].timestamp).getTime() : 0
  };
}

/**
 * Generate AI-powered conversation summary
 */
async function generateConversationSummary(turns: any[]): Promise<string> {
  try {
    // In production, this would call OpenAI/Claude API
    // For now, generate a simple summary
    const customerContent = turns
      .filter(turn => turn.speaker === 'customer')
      .map(turn => turn.content)
      .join(' ');
    
    if (customerContent.length > 200) {
      return customerContent.substring(0, 200) + '...';
    }
    
    return customerContent || 'No customer response recorded.';
  } catch (error) {
    console.error('Failed to generate summary:', error);
    return 'Summary generation failed.';
  }
}

/**
 * Store conversation in database
 */
async function storeConversation(userId: string, callId: string, processedData: any): Promise<string> {
  // Mock database storage - replace with actual database operations
  const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`Storing conversation ${conversationId} for user ${userId}:`, {
    call_id: callId,
    business_name: processedData.extracted_data.business_name,
    lead_score: processedData.analysis.lead_score,
    outcome: processedData.analysis.outcome
  });

  // In production, insert into call_conversations table
  /*
  await db.call_conversations.create({
    data: {
      id: conversationId,
      user_id: userId,
      call_id: callId,
      phone_number: processedData.metadata.phone_number,
      call_type: processedData.metadata.call_type,
      started_at: processedData.metadata.started_at,
      ended_at: processedData.metadata.ended_at,
      duration: processedData.metadata.duration,
      status: processedData.metadata.status,
      business_name: processedData.extracted_data.business_name,
      contact_name: processedData.extracted_data.contact_name,
      location: processedData.extracted_data.location,
      email: processedData.extracted_data.email,
      website: processedData.extracted_data.website,
      conversation_summary: processedData.summary,
      extracted_data: processedData.extracted_data,
      ai_analysis: processedData.analysis,
      lead_status: 'new',
      quality_score: processedData.analysis.lead_score / 20, // Convert to 0-5 scale
      sentiment_score: processedData.analysis.sentiment_score,
      engagement_level: processedData.analysis.engagement_level
    }
  });
  */

  return conversationId;
}

/**
 * Store conversation turns in database
 */
async function storeConversationTurns(conversationId: string, turns: any[]) {
  console.log(`Storing ${turns.length} turns for conversation ${conversationId}`);

  // In production, insert into conversation_turns table
  /*
  for (const turn of turns) {
    await db.conversation_turns.create({
      data: {
        conversation_id: conversationId,
        turn_id: turn.id,
        timestamp: turn.timestamp,
        speaker: turn.speaker,
        content: turn.content,
        audio_url: turn.audio_url,
        confidence_score: turn.confidence,
        intent: turn.intent,
        entities: turn.entities || {}
      }
    });
  }
  */
}

/**
 * Store conversation analytics
 */
async function storeConversationAnalytics(conversationId: string, analytics: any) {
  console.log(`Storing analytics for conversation ${conversationId}:`, analytics);

  // In production, insert into call_analytics_detailed table
  /*
  await db.call_analytics_detailed.create({
    data: {
      conversation_id: conversationId,
      call_outcome: analytics.outcome,
      total_turns: analytics.total_turns,
      customer_talk_time: analytics.customer_turns * 5, // Estimate
      ai_talk_time: analytics.ai_turns * 5, // Estimate
      avg_response_time: 2.5, // Estimate
      customer_engagement_score: analytics.engagement_level,
      lead_score: analytics.lead_score,
      conversion_probability: analytics.conversion_probability
    }
  });
  */
}

/**
 * Get conversations from database with filters
 */
async function getConversations(filters: any) {
  // Mock data - replace with actual database query
  const mockConversations = [
    {
      id: 'conv_1',
      call_id: 'call_123',
      phone_number: '+1234567890',
      call_type: 'elevenlabs_agent',
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
      duration: 180,
      status: 'completed',
      business_name: 'Tech Solutions Inc',
      contact_name: 'John Smith',
      location: 'New York, NY',
      email: 'john@techsolutions.com',
      conversation_summary: 'Discussed marketing automation needs...',
      lead_status: 'interested',
      lead_score: 85,
      sentiment_score: 0.7,
      engagement_level: 0.8,
      user_comments: null,
      created_at: new Date().toISOString()
    }
  ];

  return {
    conversations: mockConversations,
    total_count: mockConversations.length
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
