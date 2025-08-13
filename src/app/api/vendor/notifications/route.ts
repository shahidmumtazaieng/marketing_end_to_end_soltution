import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { unifiedBackend } from '@/lib/services/unifiedBackendService';

/**
 * GET /api/vendor/notifications
 * Vendor: Get notifications (matches Notifications.txs.txt functionality)
 * Shows new order notifications with accept/decline actions
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const filters = {
      type: searchParams.get('type') || undefined, // 'new_order', 'order_update', 'system_message'
      status: searchParams.get('status') || undefined, // 'pending', 'read', 'expired'
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0')
    };

    console.log(`🔔 Vendor ${vendorId}: Getting notifications`);

    // Get vendor notifications using unified backend
    // For now, we'll get new orders as notifications (matching Notifications.txs.txt)
    const newOrders = await unifiedBackend.getVendorOrders(vendorId, {
      status: 'new',
      limit: filters.limit,
      offset: filters.offset
    });

    // Format as notifications (matching vendor app expectations)
    const notifications = newOrders.map(order => ({
      id: `notif_${order.order_id}`,
      notification_type: 'new_order',
      title: `New ${order.service_type} Request`,
      body: `${order.customer_name} needs ${order.service_type} service at ${order.customer_address}`,
      
      // Order data for notification
      order_data: {
        order_id: order.order_id,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        customer_address: order.customer_address,
        service_type: order.service_type,
        priority: order.priority,
        description: order.description,
        estimated_value: order.estimated_value || 0,
        scheduled_date: order.scheduled_date,
        created_date: order.created_date
      },
      
      // Action buttons (matching vendor app Notifications.txs.txt)
      actions: [
        {
          id: 'accept',
          title: 'Accept Order',
          action: 'accept_order',
          style: 'primary'
        },
        {
          id: 'decline',
          title: 'Decline',
          action: 'decline_order',
          style: 'destructive'
        },
        {
          id: 'view_details',
          title: 'View Details',
          action: 'view_order_details',
          style: 'default'
        }
      ],
      
      // Timing and status
      created_at: order.created_date,
      expires_at: calculateNotificationExpiry(order.priority),
      status: 'pending',
      is_read: false,
      
      // Priority styling
      priority: order.priority,
      urgent: order.priority === 'urgent'
    }));

    // Get system notifications (if any)
    // const systemNotifications = await unifiedBackend.getVendorNotifications(vendorId, filters);

    return NextResponse.json({
      success: true,
      notifications,
      statistics: {
        total: notifications.length,
        unread: notifications.filter(n => !n.is_read).length,
        new_orders: notifications.filter(n => n.notification_type === 'new_order').length,
        urgent: notifications.filter(n => n.urgent).length
      },
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        has_more: notifications.length === filters.limit
      }
    });

  } catch (error) {
    console.error('Vendor get notifications error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve notifications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vendor/notifications/action
 * Vendor: Handle notification actions (accept/decline orders)
 * Matches vendor app Notifications.txs.txt accept/decline functionality
 */
export async function POST(request: NextRequest) {
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
    const { notification_id, action, order_id } = await request.json();

    if (!action || !order_id) {
      return NextResponse.json(
        { success: false, error: 'Action and order ID are required' },
        { status: 400 }
      );
    }

    console.log(`🔔 Vendor ${vendorId}: Taking action ${action} on order ${order_id}`);

    let updatedOrder;
    let message = '';

    switch (action) {
      case 'accept_order':
        // Update order status to accepted
        updatedOrder = await unifiedBackend.updateOrderByVendor(order_id, vendorId, {
          status: 'accepted'
        });
        message = 'Order accepted successfully. You can now start the service.';
        break;

      case 'decline_order':
        // Update order status to cancelled
        updatedOrder = await unifiedBackend.updateOrderByVendor(order_id, vendorId, {
          status: 'cancelled'
        });
        message = 'Order declined successfully.';
        break;

      case 'view_order_details':
        // Just mark notification as read
        message = 'Order details viewed.';
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Mark notification as read/handled
    // await markNotificationAsRead(notification_id, vendorId);

    // Determine next action for vendor app
    const nextAction = action === 'accept_order' ? 'navigate_to_order_progress' : 'refresh_notifications';

    return NextResponse.json({
      success: true,
      message,
      action_taken: action,
      order_id,
      next_action: nextAction,
      order_status: updatedOrder?.status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Vendor notification action error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process notification action' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/vendor/notifications/[id]/read
 * Vendor: Mark notification as read
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
    const { notification_ids } = await request.json();

    if (!notification_ids || !Array.isArray(notification_ids)) {
      return NextResponse.json(
        { success: false, error: 'Notification IDs array is required' },
        { status: 400 }
      );
    }

    console.log(`🔔 Vendor ${vendorId}: Marking ${notification_ids.length} notifications as read`);

    // Mark notifications as read
    // In production, implement actual notification marking
    /*
    await Promise.all(
      notification_ids.map(id => 
        unifiedBackend.markNotificationRead(id, vendorId)
      )
    );
    */

    return NextResponse.json({
      success: true,
      message: `${notification_ids.length} notifications marked as read`,
      notification_ids,
      marked_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Mark notifications read error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}

/**
 * Calculate notification expiry based on order priority
 */
function calculateNotificationExpiry(priority: string): string {
  const now = new Date();
  
  switch (priority) {
    case 'urgent':
      now.setMinutes(now.getMinutes() + 15); // 15 minutes for urgent
      break;
    case 'high':
      now.setHours(now.getHours() + 1); // 1 hour for high priority
      break;
    case 'medium':
      now.setHours(now.getHours() + 4); // 4 hours for medium priority
      break;
    default:
      now.setHours(now.getHours() + 24); // 24 hours for low priority
      break;
  }

  return now.toISOString();
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
