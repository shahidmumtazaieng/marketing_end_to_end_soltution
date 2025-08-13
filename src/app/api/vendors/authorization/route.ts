import { NextRequest, NextResponse } from 'next/server';
import vendorAuthorizationService from '@/lib/services/vendorAuthorizationService';

export async function POST(request: NextRequest) {
  try {
    // Initialize vendor authorization service
    await vendorAuthorizationService.initialize();

    const body = await request.json();
    const { action, vendor_id, user_id, reason } = body;

    // Validate required fields
    if (!action || !vendor_id || !user_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: action, vendor_id, user_id' 
        },
        { status: 400 }
      );
    }

    // Validate action
    if (!['block', 'reactivate'].includes(action)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid action. Must be "block" or "reactivate"' 
        },
        { status: 400 }
      );
    }

    let result;
    let message;

    if (action === 'block') {
      if (!reason) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Reason is required for blocking vendor' 
          },
          { status: 400 }
        );
      }

      await vendorAuthorizationService.blockVendor(vendor_id, user_id, reason);
      message = 'Vendor blocked successfully';
    } else if (action === 'reactivate') {
      await vendorAuthorizationService.reactivateVendor(vendor_id, user_id);
      message = 'Vendor reactivated successfully';
    }

    return NextResponse.json({
      success: true,
      message: message,
      data: {
        vendor_id: vendor_id,
        action: action,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Error in vendor authorization:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process vendor authorization',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Initialize vendor authorization service
    await vendorAuthorizationService.initialize();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const type = searchParams.get('type') || 'blocked'; // 'blocked' or 'active'

    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User ID is required' 
        },
        { status: 400 }
      );
    }

    let data;
    let message;

    if (type === 'blocked') {
      // Get blocked vendors
      data = await vendorAuthorizationService.getBlockedVendors(userId);
      message = 'Blocked vendors retrieved successfully';
    } else {
      // Get active vendors (this would be handled by the main vendors API)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Use /api/vendors for active vendors' 
        },
        { status: 400 }
      );
    }

    // Transform data for frontend
    const transformedData = data.map(vendor => ({
      id: vendor.vendor_id,
      name: vendor.vendor_name,
      email: vendor.vendor_email,
      services: vendor.services,
      blockedAt: vendor.blocked_at,
      blockedBy: vendor.blocked_by,
      blockedReason: vendor.blocked_reason,
      canReactivate: vendor.can_reactivate,
      ordersStats: vendor.orders_stats,
    }));

    return NextResponse.json({
      success: true,
      data: transformedData,
      total: transformedData.length,
      message: message,
    });

  } catch (error) {
    console.error('Error fetching vendor authorization data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch vendor authorization data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
