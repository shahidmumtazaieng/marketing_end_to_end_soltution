import { NextRequest, NextResponse } from 'next/server';
import databaseService from '@/lib/services/databaseService';

export async function GET(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    // Initialize database service
    await databaseService.initialize();

    const { vendorId } = params;

    // Get vendor order history and performance metrics
    const vendorHistory = await databaseService.getVendorOrderHistory(vendorId);

    // Transform recent orders to match frontend interface
    const transformedOrders = vendorHistory.recent_orders.map(order => ({
      id: order.order_id,
      task: order.service_type,
      vendorId: order.vendor_id,
      customer: {
        name: order.customer_name,
        phone: order.customer_phone,
        address: order.customer_address,
        location: order.customer_location,
      },
      vendor: {
        name: vendorHistory.vendor_name,
        avatar: 'https://placehold.co/100x100.png',
      },
      amount: order.dealing_price || order.estimated_value || 0,
      status: mapDatabaseStatusToFrontend(order.status),
      date: order.created_at.split('T')[0],
      images: {
        before: order.before_image_url ? [order.before_image_url] : [],
        after: order.after_image_url ? [order.after_image_url] : [],
      },
      conversation: [],
      businessName: order.business_name,
      description: order.description,
      priority: order.priority,
      assignedAt: order.assigned_at,
      onWayAt: order.on_way_at,
      processingAt: order.processing_at,
      completedAt: order.completed_at,
      invoice: order.invoice,
    }));

    // Calculate additional metrics
    const completionRate = vendorHistory.total_orders > 0 
      ? (vendorHistory.completed_orders / vendorHistory.total_orders * 100).toFixed(1)
      : '0';

    const averageOrderValue = vendorHistory.completed_orders > 0
      ? (vendorHistory.total_earnings / vendorHistory.completed_orders).toFixed(2)
      : '0';

    const response = {
      vendor_id: vendorHistory.vendor_id,
      vendor_name: vendorHistory.vendor_name,
      performance_metrics: {
        total_orders: vendorHistory.total_orders,
        completed_orders: vendorHistory.completed_orders,
        pending_orders: vendorHistory.pending_orders,
        cancelled_orders: vendorHistory.cancelled_orders,
        completion_rate: parseFloat(completionRate),
        average_rating: vendorHistory.average_rating,
        total_earnings: vendorHistory.total_earnings,
        average_order_value: parseFloat(averageOrderValue),
      },
      recent_orders: transformedOrders,
      summary: {
        this_month: {
          orders: transformedOrders.filter(order => {
            const orderDate = new Date(order.date);
            const now = new Date();
            return orderDate.getMonth() === now.getMonth() && 
                   orderDate.getFullYear() === now.getFullYear();
          }).length,
          earnings: transformedOrders
            .filter(order => {
              const orderDate = new Date(order.date);
              const now = new Date();
              return orderDate.getMonth() === now.getMonth() && 
                     orderDate.getFullYear() === now.getFullYear() &&
                     order.status === 'Completed';
            })
            .reduce((sum, order) => sum + order.amount, 0),
        },
        last_30_days: {
          orders: transformedOrders.filter(order => {
            const orderDate = new Date(order.date);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return orderDate >= thirtyDaysAgo;
          }).length,
          earnings: transformedOrders
            .filter(order => {
              const orderDate = new Date(order.date);
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
              return orderDate >= thirtyDaysAgo && order.status === 'Completed';
            })
            .reduce((sum, order) => sum + order.amount, 0),
        },
      },
    };

    return NextResponse.json({
      success: true,
      data: response,
    });

  } catch (error) {
    console.error('Error fetching vendor history:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch vendor history',
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
