import { NextRequest, NextResponse } from 'next/server';
import databaseService from '@/lib/services/databaseService';

export async function GET(request: NextRequest) {
  try {
    // Initialize database service
    await databaseService.initialize();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const filters = {
      status: searchParams.get('status') || undefined,
      vendor_id: searchParams.get('vendor_id') || undefined,
      customer_name: searchParams.get('customer_name') || undefined,
      service_type: searchParams.get('service_type') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    // Fetch orders from database
    const orders = await databaseService.getOrders(filters);

    // Transform data to match frontend interface
    const transformedOrders = orders.map(order => ({
      id: order.order_id,
      task: order.service_type,
      vendorId: order.vendor_id,
      customer: {
        name: order.customer_name,
        phone: order.customer_phone,
        address: order.customer_address,
        location: order.customer_location,
      },
      vendor: order.vendor ? {
        name: order.vendor.full_name,
        avatar: order.vendor.avatar_url || 'https://placehold.co/100x100.png',
      } : null,
      amount: order.dealing_price || order.estimated_value || 0,
      status: mapDatabaseStatusToFrontend(order.status),
      date: order.created_at.split('T')[0],
      images: {
        before: order.before_image_url ? [order.before_image_url] : [],
        after: order.after_image_url ? [order.after_image_url] : [],
      },
      conversation: order.conversation?.conversation_data?.messages || [],
      // Additional fields from database
      businessName: order.business_name,
      description: order.description,
      priority: order.priority,
      triggerPoint: order.trigger_point,
      scheduledDate: order.scheduled_date,
      assignedAt: order.assigned_at,
      onWayAt: order.on_way_at,
      processingAt: order.processing_at,
      completedAt: order.completed_at,
      invoice: order.invoice,
    }));

    return NextResponse.json({
      success: true,
      data: transformedOrders,
      total: transformedOrders.length,
      filters: filters,
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch orders',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Initialize database service
    await databaseService.initialize();

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'business_name',
      'customer_name', 
      'customer_phone',
      'customer_address',
      'service_type',
      'description',
      'user_id'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Missing required field: ${field}` 
          },
          { status: 400 }
        );
      }
    }

    // Create order in database
    const order = await databaseService.createOrder({
      business_name: body.business_name,
      customer_name: body.customer_name,
      customer_phone: body.customer_phone,
      customer_email: body.customer_email,
      customer_address: body.customer_address,
      customer_location: body.customer_location,
      service_type: body.service_type,
      description: body.description,
      priority: body.priority || 'medium',
      estimated_value: body.estimated_value || 0,
      selected_vendors: body.selected_vendors || [],
      conversation_id: body.conversation_id,
      trigger_point_id: body.trigger_point_id,
      user_id: body.user_id,
      price_package: body.price_package,
      scheduled_date: body.scheduled_date,
    });

    // Transform response to match frontend interface
    const transformedOrder = {
      id: order.order_id,
      task: order.service_type,
      vendorId: order.vendor_id,
      customer: {
        name: order.customer_name,
        phone: order.customer_phone,
        address: order.customer_address,
        location: order.customer_location,
      },
      vendor: null,
      amount: order.dealing_price || order.estimated_value || 0,
      status: mapDatabaseStatusToFrontend(order.status),
      date: order.created_at.split('T')[0],
      images: { before: [], after: [] },
      conversation: [],
      businessName: order.business_name,
      description: order.description,
      priority: order.priority,
    };

    return NextResponse.json({
      success: true,
      data: transformedOrder,
      message: 'Order created successfully',
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create order',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to map database status to frontend status
function mapDatabaseStatusToFrontend(dbStatus: string): string {
  const statusMap: { [key: string]: string } = {
    'new': 'Pending',
    'pending': 'Pending',
    'accepted': 'Accepted',
    'on_way': 'On the Way',
    'processing': 'Processing',
    'completed': 'Completed',
    'cancelled': 'Canceled',
    'declined': 'Canceled',
  };

  return statusMap[dbStatus] || 'Pending';
}
