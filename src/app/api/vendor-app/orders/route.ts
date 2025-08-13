import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { mobileAppIntegration } from '@/lib/services/mobileAppIntegration';

/**
 * POST /api/vendor-app/orders
 * Create new order and notify vendor mobile app
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const orderData = await request.json();

    // Validate required fields
    const requiredFields = ['order_id', 'customer_name', 'customer_phone', 'customer_address', 'service_type'];
    const missingFields = requiredFields.filter(field => !orderData[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    console.log(`📱 Creating order for vendor app: ${orderData.order_id}`);

    // Send new order notification to vendor mobile app
    const notificationResult = await mobileAppIntegration.sendNewOrderNotification(
      vendorId,
      {
        order_id: orderData.order_id,
        vendor_id: vendorId,
        status: 'new',
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        customer_address: orderData.customer_address,
        service_type: orderData.service_type,
        description: orderData.description || '',
        priority: orderData.priority || 'medium',
        scheduled_date: orderData.scheduled_date || new Date().toISOString(),
        created_date: new Date().toISOString()
      }
    );

    if (notificationResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Order created and vendor notified successfully',
        order_id: orderData.order_id,
        notification_result: {
          notification_id: notificationResult.notification_id,
          delivery_status: notificationResult.delivery_status
        }
      });

    } else {
      return NextResponse.json({
        success: false,
        error: notificationResult.error || 'Failed to notify vendor',
        order_id: orderData.order_id
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Vendor app order creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/vendor-app/orders/[id]/response
 * Handle vendor response to order (accept/decline/update)
 */
export async function PUT(request: NextRequest) {
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

    // Parse request body
    const responseData = await request.json();

    // Validate required fields
    if (!responseData.order_id || !responseData.action) {
      return NextResponse.json(
        { success: false, error: 'Order ID and action are required' },
        { status: 400 }
      );
    }

    console.log(`📱 Processing vendor response: ${responseData.action} for order ${responseData.order_id}`);

    // Handle vendor response
    const result = await mobileAppIntegration.handleVendorResponse({
      vendor_id: vendorId,
      order_id: responseData.order_id,
      action: responseData.action,
      response_data: responseData.response_data || {},
      timestamp: new Date().toISOString()
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Vendor response processed successfully',
        order_updated: result.order_updated,
        next_action: result.next_action
      });

    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to process vendor response'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Vendor response processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/vendor-app/orders
 * Get orders for vendor mobile app
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log(`📱 Getting orders for vendor ${vendorId}:`, { status, limit, offset });

    // In production, fetch orders from database
    /*
    const orders = await db.orders.findMany({
      where: {
        vendor_id: vendorId,
        status: status || undefined
      },
      orderBy: { created_date: 'desc' },
      take: limit,
      skip: offset
    });
    */

    // Mock orders for development
    const mockOrders = [
      {
        order_id: 'ORD_001',
        customer_name: 'John Smith',
        customer_phone: '555-1234',
        customer_address: '123 Main St, City, State',
        service_type: 'Plumbing',
        description: 'Kitchen sink repair needed',
        status: 'new',
        priority: 'medium',
        scheduled_date: new Date().toISOString(),
        created_date: new Date().toISOString()
      },
      {
        order_id: 'ORD_002',
        customer_name: 'Jane Doe',
        customer_phone: '555-5678',
        customer_address: '456 Oak Ave, City, State',
        service_type: 'Electrical',
        description: 'Light fixture installation',
        status: 'accepted',
        priority: 'low',
        scheduled_date: new Date().toISOString(),
        created_date: new Date().toISOString()
      }
    ];

    const filteredOrders = status ? mockOrders.filter(order => order.status === status) : mockOrders;

    return NextResponse.json({
      success: true,
      orders: filteredOrders.slice(offset, offset + limit),
      total_count: filteredOrders.length,
      has_more: offset + limit < filteredOrders.length
    });

  } catch (error) {
    console.error('Get vendor orders error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
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
