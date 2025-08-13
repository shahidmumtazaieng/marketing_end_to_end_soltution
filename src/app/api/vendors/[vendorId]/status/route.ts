import { NextRequest, NextResponse } from 'next/server';
import vendorManagementService from '@/lib/services/vendorManagementService';

export async function PUT(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    // Initialize vendor management service
    await vendorManagementService.initialize();

    const { vendorId } = params;
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

    // Validate status values
    const validStatuses = ['pending', 'verified', 'blocked'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid status. Must be one of: pending, verified, blocked' 
        },
        { status: 400 }
      );
    }

    // Update vendor status
    const updatedVendor = await vendorManagementService.updateVendorStatus(
      vendorId,
      body.status,
      body.verified_by
    );

    // Transform response to match frontend interface
    const transformedVendor = {
      id: updatedVendor.id,
      name: updatedVendor.full_name,
      contact: updatedVendor.email,
      phone: updatedVendor.phone,
      status: updatedVendor.status === 'verified' ? 'Verified' : 
              updatedVendor.status === 'pending' ? 'Pending' : 'Blocked',
      avatar: updatedVendor.avatar_url || 'https://placehold.co/100x100.png',
      memberSince: updatedVendor.registration_date.split('T')[0],
      orders: updatedVendor.orders_stats,
      services: updatedVendor.services,
      location: {
        latitude: updatedVendor.service_area.latitude,
        longitude: updatedVendor.service_area.longitude,
      },
      activeOrders: updatedVendor.orders_stats.pending,
      uniqueVendorId: updatedVendor.unique_vendor_id,
      registeredViaApp: updatedVendor.registered_via_app,
      isOnline: updatedVendor.is_online,
      lastSeen: updatedVendor.last_seen,
      verifiedAt: updatedVendor.verified_at,
      verifiedBy: updatedVendor.verified_by,
    };

    return NextResponse.json({
      success: true,
      data: transformedVendor,
      message: `Vendor status updated to ${body.status}`,
    });

  } catch (error) {
    console.error('Error updating vendor status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update vendor status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    // Initialize vendor management service
    await vendorManagementService.initialize();

    const { vendorId } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User ID is required' 
        },
        { status: 400 }
      );
    }

    // Delete vendor
    await vendorManagementService.deleteVendor(vendorId, userId);

    return NextResponse.json({
      success: true,
      message: 'Vendor deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting vendor:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete vendor',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
