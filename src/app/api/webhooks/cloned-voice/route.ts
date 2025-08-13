import { NextRequest, NextResponse } from 'next/server';
import { callingSystemIntegration } from '@/lib/services/callingSystemIntegration';

/**
 * POST /api/webhooks/cloned-voice
 * Handle webhooks from Cloned Voice calling system
 */
export async function POST(request: NextRequest) {
  try {
    // Get webhook signature from headers
    const signature = request.headers.get('x-cloned-voice-signature') || 
                     request.headers.get('x-signature') || '';
    
    // Get user ID from headers or query params
    const userId = request.headers.get('x-user-id') || 
                   new URL(request.url).searchParams.get('user_id') || '';

    if (!userId) {
      console.error('❌ Cloned Voice webhook: Missing user ID');
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      );
    }

    // Parse webhook payload
    const webhookData = await request.json();

    console.log(`🎙️ Cloned Voice webhook received:`, {
      user_id: userId,
      event_type: webhookData.event_type,
      session_id: webhookData.session_id || webhookData.conversation_id,
      timestamp: webhookData.timestamp || new Date().toISOString()
    });

    // Validate required fields
    if (!webhookData.event_type) {
      return NextResponse.json(
        { success: false, error: 'Event type is required' },
        { status: 400 }
      );
    }

    // Process webhook through integration service
    const result = await callingSystemIntegration.handleClonedVoiceWebhook(
      webhookData,
      signature,
      userId
    );

    if (result.success) {
      console.log(`✅ Cloned Voice webhook processed successfully:`, {
        conversation_id: result.conversation_id,
        event_type: webhookData.event_type,
        processing_triggered: !!result.processing_result
      });

      return NextResponse.json({
        success: true,
        message: 'Webhook processed successfully',
        conversation_id: result.conversation_id,
        processing_result: result.processing_result ? {
          processing_time_ms: result.processing_result.processing_time_ms,
          triggers_detected: result.processing_result.triggers_detected,
          vendor_selection_triggered: result.processing_result.vendor_selection_triggered,
          lead_score: result.processing_result.lead_score
        } : null
      });

    } else {
      console.error(`❌ Cloned Voice webhook processing failed:`, result.error);

      return NextResponse.json({
        success: false,
        error: result.error || 'Webhook processing failed',
        conversation_id: result.conversation_id
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Cloned Voice webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal webhook processing error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/cloned-voice
 * Webhook verification endpoint for Cloned Voice system
 */
export async function GET(request: NextRequest) {
  try {
    // Handle webhook verification challenge
    const { searchParams } = new URL(request.url);
    const challenge = searchParams.get('challenge');
    const verify_token = searchParams.get('verify_token');

    if (challenge && verify_token) {
      // Verify the token (in production, check against stored verification token)
      const expectedToken = process.env.CLONED_VOICE_VERIFY_TOKEN || 'default_verify_token';
      
      if (verify_token === expectedToken) {
        console.log('✅ Cloned Voice webhook verification successful');
        return new NextResponse(challenge, { status: 200 });
      } else {
        console.error('❌ Cloned Voice webhook verification failed: Invalid token');
        return NextResponse.json(
          { error: 'Invalid verification token' },
          { status: 403 }
        );
      }
    }

    // Return webhook endpoint information
    return NextResponse.json({
      service: 'Cloned Voice Webhook Endpoint',
      status: 'active',
      supported_events: [
        'session_started',
        'session_ended', 
        'session_failed',
        'conversation_update'
      ],
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/cloned-voice`,
      verification_method: 'GET with challenge parameter'
    });

  } catch (error) {
    console.error('Cloned Voice webhook GET error:', error);
    return NextResponse.json(
      { error: 'Webhook endpoint error' },
      { status: 500 }
    );
  }
}
