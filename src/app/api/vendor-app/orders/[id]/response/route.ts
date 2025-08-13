import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { mobileAppIntegration } from '@/lib/services/mobileAppIntegration';

/**
 * POST /api/vendor-app/orders/[id]/response
 * Handle specific vendor response to order (accept/decline/status update)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get vendor ID from authentication
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const vendorId = getVendorIdFromAuth(authorization);

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'Vendor authentication required' },
        { status: 401 }
      );
    }

    const { id: orderId } = params;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { action, response_data = {} } = body;

    // Validate action
    const validActions = ['accept', 'decline', 'status_update', 'image_upload', 'complete'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    console.log(`📱 Vendor ${vendorId} responding to order ${orderId} with action: ${action}`);

    // Handle vendor response
    const result = await mobileAppIntegration.handleVendorResponse({
      vendor_id: vendorId,
      order_id: orderId,
      action: action,
      response_data: response_data,
      timestamp: new Date().toISOString()
    });

    if (result.success) {
      console.log(`✅ Vendor response processed successfully:`, {
        vendor_id: vendorId,
        order_id: orderId,
        action: action,
        order_updated: result.order_updated,
        next_action: result.next_action
      });

      return NextResponse.json({
        success: true,
        message: getSuccessMessage(action),
        order_id: orderId,
        order_updated: result.order_updated,
        next_action: result.next_action,
        response_processed_at: new Date().toISOString()
      });

    } else {
      console.error(`❌ Vendor response processing failed:`, result.error);

      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to process vendor response',
        order_id: orderId
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Vendor response API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/vendor-app/orders/[id]/response
 * Get response history for specific order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get vendor ID from authentication
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const vendorId = getVendorIdFromAuth(authorization);

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'Vendor authentication required' },
        { status: 401 }
      );
    }

    const { id: orderId } = params;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    console.log(`📱 Getting response history for order ${orderId} by vendor ${vendorId}`);

    // In production, fetch response history from database
    /*
    const responseHistory = await db.vendor_responses.findMany({
      where: {
        order_id: orderId,
        vendor_id: vendorId
      },
      orderBy: { timestamp: 'desc' }
    });
    */

    // Mock response history
    const mockResponseHistory = [
      {
        id: 'resp_001',
        vendor_id: vendorId,
        order_id: orderId,
        action: 'accept',
        response_data: {
          status: 'accepted',
          notes: 'Order accepted, will start service tomorrow'
        },
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'resp_002',
        vendor_id: vendorId,
        order_id: orderId,
        action: 'status_update',
        response_data: {
          status: 'on_way',
          notes: 'On the way to customer location'
        },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      }
    ];

    return NextResponse.json({
      success: true,
      order_id: orderId,
      vendor_id: vendorId,
      response_history: mockResponseHistory,
      total_responses: mockResponseHistory.length
    });

  } catch (error) {
    console.error('Get response history error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/vendor-app/orders/[id]/response
 * Update existing response (for corrections or additional data)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get vendor ID from authentication
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const vendorId = getVendorIdFromAuth(authorization);

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'Vendor authentication required' },
        { status: 401 }
      );
    }

    const { id: orderId } = params;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { response_id, updated_data } = body;

    if (!response_id || !updated_data) {
      return NextResponse.json(
        { success: false, error: 'Response ID and updated data are required' },
        { status: 400 }
      );
    }

    console.log(`📱 Updating response ${response_id} for order ${orderId} by vendor ${vendorId}`);

    // In production, update response in database
    /*
    await db.vendor_responses.update({
      where: {
        id: response_id,
        vendor_id: vendorId,
        order_id: orderId
      },
      data: {
        response_data: updated_data,
        updated_at: new Date()
      }
    });
    */

    // Also update the main order if needed
    const updateResult = await mobileAppIntegration.handleVendorResponse({
      vendor_id: vendorId,
      order_id: orderId,
      action: 'status_update',
      response_data: updated_data,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Response updated successfully',
      order_id: orderId,
      response_id: response_id,
      order_updated: updateResult.order_updated,
      updated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Update response error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get success message based on action
 */
function getSuccessMessage(action: string): string {
  const messages: Record<string, string> = {
    'accept': 'Order accepted successfully. You can now start the service.',
    'decline': 'Order declined. Thank you for your response.',
    'status_update': 'Order status updated successfully.',
    'image_upload': 'Images uploaded successfully.',
    'complete': 'Order marked as completed. Invoice will be generated.'
  };

  return messages[action] || 'Response processed successfully.';
}

/**
 * Extract vendor ID from authorization header
 */
function getVendorIdFromAuth(authorization: string | null): string | null {
  if (!authorization) return null;
  
  try {
    const token = authorization.replace('Bearer ', '');
    // In production, decode JWT token and extract vendor ID
    return 'VEND001'; // Mock vendor ID
  } catch (error) {
    console.error('Auth extraction error:', error);
    return null;
  }
}
