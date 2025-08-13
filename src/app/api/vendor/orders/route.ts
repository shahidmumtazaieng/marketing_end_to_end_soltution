import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { unifiedBackend } from '@/lib/services/unifiedBackendService';

/**
 * GET /api/vendor/orders
 * Vendor: Get orders (Base44 SDK compatible - Order.list())
 * Matches vendor app Orders.tsx.txt functionality
 */
export async function GET(request: NextRequest) {
  try {
    // Get vendor ID from authentication
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const { userId: vendorId, role } = getUserFromAuth(authorization);

    if (!vendorId || role !== 'vendor') {
      return NextResponse.json(
        { success: false, error: 'Vendor authentication required' },
        { status: 401 }
      );
    }

    // Parse query parameters (matching vendor app filters)
    const { searchParams } = new URL(request.url);
    const filters = {
      status: searchParams.get('status') || undefined, // 'new', 'accepted', 'on_way', 'processing', 'completed', 'cancelled'
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
      sort: searchParams.get('sort') || '-created_date', // Default sort by newest first
      search: searchParams.get('search') || undefined // Customer name search
    };

    console.log(`📦 Vendor ${vendorId}: Getting orders with filters:`, filters);

    // Get vendor orders using unified backend
    const orders = await unifiedBackend.getVendorOrders(vendorId, filters);

    // Format response to match vendor app expectations (Base44 SDK format)
    const formattedOrders = orders.map(order => ({
      // Core fields (matching Order.db entity)
      order_id: order.order_id,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_address: order.customer_address,
      service_type: order.service_type,
      status: order.status,
      priority: order.priority,
      description: order.description,
      
      // Progress tracking fields
      before_image_url: order.before_image_url || '',
      after_image_url: order.after_image_url || '',
      dealing_price: order.dealing_price || 0,
      
      // Invoice data
      invoice: order.invoice || {
        final_price: 0,
        service_name: '',
        service_details: '',
        primary_contact: '',
        secondary_contact: '',
        invoice_url: ''
      },
      
      // Scheduling
      scheduled_date: order.scheduled_date || order.created_date,
      created_date: order.created_date,
      
      // Vendor assignment
      vendor_id: order.vendor_id || vendorId,
      
      // Additional fields for vendor app
      estimated_value: order.estimated_value || 0,
      customer_email: order.customer_email || ''
    }));

    // Calculate statistics for Dashboard.txs.txt
    const statistics = {
      total: formattedOrders.length,
      new: formattedOrders.filter(o => o.status === 'new').length,
      in_progress: formattedOrders.filter(o => ['accepted', 'on_way', 'processing'].includes(o.status)).length,
      completed: formattedOrders.filter(o => o.status === 'completed').length,
      cancelled: formattedOrders.filter(o => o.status === 'cancelled').length
    };

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      statistics,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        total: formattedOrders.length,
        has_more: formattedOrders.length === filters.limit
      },
      filters_applied: filters
    });

  } catch (error) {
    console.error('Vendor get orders error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve orders' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/vendor/orders
 * Vendor: Update order status (Base44 SDK compatible - Order.update())
 * Matches vendor app OrderProgress.txs.txt functionality
 */
export async function PUT(request: NextRequest) {
  try {
    // Get vendor ID from authentication
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const { userId: vendorId, role } = getUserFromAuth(authorization);

    if (!vendorId || role !== 'vendor') {
      return NextResponse.json(
        { success: false, error: 'Vendor authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const updateData = await request.json();

    // Validate required fields
    if (!updateData.order_id) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔄 Vendor ${vendorId}: Updating order ${updateData.order_id}`);

    // Update order using unified backend
    const updatedOrder = await unifiedBackend.updateOrderByVendor(
      updateData.order_id,
      vendorId,
      {
        status: updateData.status,
        dealing_price: updateData.dealing_price,
        before_image_url: updateData.before_image_url,
        after_image_url: updateData.after_image_url,
        description: updateData.notes || updateData.description,
        invoice: updateData.invoice
      }
    );

    // Format response to match vendor app expectations
    const formattedOrder = {
      order_id: updatedOrder.order_id,
      customer_name: updatedOrder.customer_name,
      customer_phone: updatedOrder.customer_phone,
      customer_address: updatedOrder.customer_address,
      service_type: updatedOrder.service_type,
      status: updatedOrder.status,
      priority: updatedOrder.priority,
      description: updatedOrder.description,
      before_image_url: updatedOrder.before_image_url || '',
      after_image_url: updatedOrder.after_image_url || '',
      dealing_price: updatedOrder.dealing_price || 0,
      invoice: updatedOrder.invoice,
      scheduled_date: updatedOrder.scheduled_date,
      created_date: updatedOrder.created_date,
      vendor_id: updatedOrder.vendor_id,
      updated_at: updatedOrder.updated_at
    };

    // Determine next action for vendor app
    const nextAction = determineNextAction(updatedOrder.status);

    return NextResponse.json({
      success: true,
      message: getUpdateMessage(updateData.status),
      order: formattedOrder,
      next_action: nextAction,
      updated_at: updatedOrder.updated_at
    });

  } catch (error) {
    console.error('Vendor update order error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update order' },
      { status: 500 }
    );
  }
}

/**
 * Determine next action for vendor app workflow
 */
function determineNextAction(status: string): string {
  switch (status) {
    case 'new':
      return 'accept_or_decline';
    case 'accepted':
      return 'start_service'; // Navigate to OrderProgress
    case 'on_way':
      return 'upload_before_image';
    case 'processing':
      return 'upload_after_image';
    case 'completed':
      return 'generate_invoice';
    case 'cancelled':
      return 'none';
    default:
      return 'continue_workflow';
  }
}

/**
 * Get update message for vendor app
 */
function getUpdateMessage(status: string): string {
  const messages: Record<string, string> = {
    'accepted': 'Order accepted successfully. You can now start the service.',
    'on_way': 'Status updated to "On the way". Please upload before image when you arrive.',
    'processing': 'Service started. Please upload after image when completed.',
    'completed': 'Order marked as completed. Invoice will be generated.',
    'cancelled': 'Order cancelled successfully.'
  };

  return messages[status] || 'Order updated successfully.';
}

/**
 * Extract user info from authorization header
 */
function getUserFromAuth(authorization: string | null): { userId: string | null; role: string | null } {
  if (!authorization) return { userId: null, role: null };
  
  try {
    const token = authorization.replace('Bearer ', '');
    // In production, decode JWT token and extract vendor info
    return { 
      userId: 'VEND001', // Mock vendor ID
      role: 'vendor' 
    };
  } catch (error) {
    console.error('Auth extraction error:', error);
    return { userId: null, role: null };
  }
}
