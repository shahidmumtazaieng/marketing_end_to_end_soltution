import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { unifiedBackend } from '@/lib/services/unifiedBackendService';

/**
 * POST /api/admin/vendor-selection
 * Admin: Trigger vendor selection and create order
 */
export async function POST(request: NextRequest) {
  try {
    // Get admin user ID from authentication
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const { userId, role } = getUserFromAuth(authorization);

    if (!userId || role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const selectionData = await request.json();

    // Validate required fields
    const requiredFields = ['service_type', 'customer_name', 'customer_phone', 'customer_address'];
    const missingFields = requiredFields.filter(field => !selectionData[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    console.log(`🎯 Admin: Triggering vendor selection for ${selectionData.service_type} service`);

    // Get available vendors for the service type
    const availableVendors = await unifiedBackend.getVendorsForSelection(userId, {
      service_type: selectionData.service_type,
      location: selectionData.customer_location,
      status: 'active',
      is_online: true
    });

    if (availableVendors.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No available vendors found for this service type and location'
      }, { status: 404 });
    }

    // Select top vendors (implement selection algorithm)
    const selectedVendors = availableVendors.slice(0, 3); // Simple selection for now
    const selectedVendorIds = selectedVendors.map(v => v.id);

    // Create trigger point record
    const triggerPoint = await unifiedBackend.createTriggerPoint(userId, {
      trigger_name: `${selectionData.service_type} Service Request`,
      business_name: selectionData.customer_name,
      location: selectionData.customer_address,
      work_needed: selectionData.description || `${selectionData.service_type} service needed`,
      service_type: selectionData.service_type,
      selected_vendors: selectedVendorIds,
      vendor_count: selectedVendorIds.length,
      estimated_value: selectionData.estimated_value || 200,
      price_package: determinePricePackage(selectionData.service_type, selectionData.estimated_value || 200),
      conversation_id: selectionData.conversation_id
    });

    // Create order
    const order = await unifiedBackend.createOrder(userId, {
      customer_name: selectionData.customer_name,
      customer_phone: selectionData.customer_phone,
      customer_address: selectionData.customer_address,
      customer_email: selectionData.customer_email,
      service_type: selectionData.service_type,
      description: selectionData.description || `${selectionData.service_type} service needed`,
      priority: selectionData.priority || 'medium',
      assigned_vendors: selectedVendorIds,
      vendor_id: selectedVendorIds[0], // Primary vendor
      conversation_id: selectionData.conversation_id,
      trigger_point_id: triggerPoint.trigger_id,
      customer_location: selectionData.customer_location,
      estimated_value: selectionData.estimated_value || 200,
      scheduled_date: selectionData.scheduled_date
    });

    // Send notifications to vendors (implement notification service)
    const notificationResults = await Promise.all(
      selectedVendors.map(vendor => sendVendorNotification(vendor, order))
    );

    const notificationsSuccessful = notificationResults.filter(r => r.success).length;

    console.log(`✅ Admin: Vendor selection complete`, {
      order_id: order.order_id,
      vendors_selected: selectedVendorIds.length,
      notifications_sent: notificationsSuccessful
    });

    return NextResponse.json({
      success: true,
      message: 'Vendor selection completed successfully',
      results: {
        trigger_point: {
          trigger_id: triggerPoint.trigger_id,
          trigger_name: triggerPoint.trigger_name,
          business_name: triggerPoint.business_name,
          location: triggerPoint.location,
          work_needed: triggerPoint.work_needed,
          selected_vendors: triggerPoint.selected_vendors,
          price_package: triggerPoint.price_package
        },
        order: {
          order_id: order.order_id,
          customer_name: order.customer_name,
          service_type: order.service_type,
          priority: order.priority,
          assigned_vendors: order.assigned_vendors,
          estimated_value: order.estimated_value,
          status: order.status
        },
        vendor_selection: {
          total_vendors_evaluated: availableVendors.length,
          vendors_selected: selectedVendorIds.length,
          notifications_sent: notificationsSuccessful,
          selected_vendors: selectedVendors.map(v => ({
            vendor_id: v.id,
            vendor_name: v.full_name,
            services: v.services,
            rating: v.orders_stats?.total ? 
              (v.orders_stats.completed / v.orders_stats.total * 5) : 4.0
          }))
        }
      }
    });

  } catch (error) {
    console.error('Admin vendor selection error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to complete vendor selection' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/vendor-selection/vendors
 * Admin: Get available vendors for selection
 */
export async function GET(request: NextRequest) {
  try {
    // Get admin user ID from authentication
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const { userId, role } = getUserFromAuth(authorization);

    if (!userId || role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const filters = {
      service_type: searchParams.get('service_type') || undefined,
      status: searchParams.get('status') || 'active',
      is_online: searchParams.get('is_online') !== 'false'
    };

    console.log(`👥 Admin: Getting vendors for selection with filters:`, filters);

    // Get vendors using unified backend
    const vendors = await unifiedBackend.getVendorsForSelection(userId, filters);

    return NextResponse.json({
      success: true,
      vendors: vendors.map(vendor => ({
        vendor_id: vendor.id,
        vendor_name: vendor.full_name,
        email: vendor.email,
        phone: vendor.phone,
        services: vendor.services || [],
        service_area: vendor.service_area,
        status: vendor.status,
        is_online: vendor.is_online,
        orders_stats: vendor.orders_stats,
        rating: vendor.orders_stats?.total ? 
          (vendor.orders_stats.completed / vendor.orders_stats.total * 5) : 4.0,
        last_seen: vendor.last_seen
      })),
      total_count: vendors.length,
      filters_applied: filters
    });

  } catch (error) {
    console.error('Admin get vendors error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve vendors' },
      { status: 500 }
    );
  }
}

/**
 * Determine price package based on service type and estimated value
 */
function determinePricePackage(serviceType: string, estimatedValue: number): string {
  const pricePackages: Record<string, Record<string, string>> = {
    'cleaning': {
      'basic': 'Basic Cleaning Package ($100-200)',
      'standard': 'Standard Cleaning Package ($200-350)',
      'premium': 'Premium Cleaning Package ($350+)'
    },
    'plumbing': {
      'basic': 'Basic Plumbing Service ($150-250)',
      'standard': 'Standard Plumbing Service ($250-400)',
      'premium': 'Premium Plumbing Service ($400+)'
    },
    'electrical': {
      'basic': 'Basic Electrical Service ($200-300)',
      'standard': 'Standard Electrical Service ($300-500)',
      'premium': 'Premium Electrical Service ($500+)'
    }
  };

  const servicePackages = pricePackages[serviceType.toLowerCase()];
  if (!servicePackages) {
    return `${serviceType} Service Package ($${estimatedValue})`;
  }

  if (estimatedValue <= 200) {
    return servicePackages.basic;
  } else if (estimatedValue <= 400) {
    return servicePackages.standard;
  } else {
    return servicePackages.premium;
  }
}

/**
 * Send notification to vendor
 */
async function sendVendorNotification(vendor: any, order: any): Promise<{ success: boolean }> {
  try {
    // In production, implement actual notification service
    console.log(`📱 Sending notification to vendor ${vendor.id} for order ${order.order_id}`);
    
    // Simulate notification sending
    return { success: true };

  } catch (error) {
    console.error('Send vendor notification error:', error);
    return { success: false };
  }
}

/**
 * Extract user info from authorization header
 */
function getUserFromAuth(authorization: string | null): { userId: string | null; role: string | null } {
  if (!authorization) return { userId: null, role: null };
  
  try {
    const token = authorization.replace('Bearer ', '');
    // In production, decode JWT token and extract user info
    return { 
      userId: 'admin_user_123', // Mock admin user ID
      role: 'admin' 
    };
  } catch (error) {
    console.error('Auth extraction error:', error);
    return { userId: null, role: null };
  }
}
