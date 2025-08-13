import { NextRequest, NextResponse } from 'next/server';
import databaseService from '@/lib/services/databaseService';

export async function PUT(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    // Initialize database service
    await databaseService.initialize();

    const { orderId } = params;
    const body = await request.json();

    // Validate required fields
    if (!body.status) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Status is required' 
        },
        { status: 400 }
      );
    }

    // Map frontend status to database status
    const dbStatus = mapFrontendStatusToDatabase(body.status);
    
    // Update order status
    const updatedOrder = await databaseService.updateOrderStatus(
      orderId,
      dbStatus,
      body.vendor_id,
      {
        dealing_price: body.dealing_price,
        before_image_url: body.before_image_url,
        after_image_url: body.after_image_url,
        notes: body.notes,
      }
    );

    // Transform response to match frontend interface
    const transformedOrder = {
      id: updatedOrder.order_id,
      task: updatedOrder.service_type,
      vendorId: updatedOrder.vendor_id,
      customer: {
        name: updatedOrder.customer_name,
        phone: updatedOrder.customer_phone,
        address: updatedOrder.customer_address,
        location: updatedOrder.customer_location,
      },
      vendor: updatedOrder.vendor ? {
        name: updatedOrder.vendor.full_name,
        avatar: updatedOrder.vendor.avatar_url || 'https://placehold.co/100x100.png',
      } : null,
      amount: updatedOrder.dealing_price || updatedOrder.estimated_value || 0,
      status: mapDatabaseStatusToFrontend(updatedOrder.status),
      date: updatedOrder.created_at.split('T')[0],
      images: {
        before: updatedOrder.before_image_url ? [updatedOrder.before_image_url] : [],
        after: updatedOrder.after_image_url ? [updatedOrder.after_image_url] : [],
      },
      conversation: [],
      businessName: updatedOrder.business_name,
      description: updatedOrder.description,
      priority: updatedOrder.priority,
      assignedAt: updatedOrder.assigned_at,
      onWayAt: updatedOrder.on_way_at,
      processingAt: updatedOrder.processing_at,
      completedAt: updatedOrder.completed_at,
      invoice: updatedOrder.invoice,
    };

    return NextResponse.json({
      success: true,
      data: transformedOrder,
      message: `Order status updated to ${body.status}`,
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update order status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper functions for status mapping
function mapFrontendStatusToDatabase(frontendStatus: string): string {
  const statusMap: { [key: string]: string } = {
    'Pending': 'pending',
    'Accepted': 'accepted',
    'On the Way': 'on_way',
    'Processing': 'processing',
    'Completed': 'completed',
    'Canceled': 'cancelled',
  };

  return statusMap[frontendStatus] || 'pending';
}

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
