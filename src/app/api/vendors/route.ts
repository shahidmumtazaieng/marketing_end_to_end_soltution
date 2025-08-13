import { NextRequest, NextResponse } from 'next/server';
import vendorManagementService from '@/lib/services/vendorManagementService';

export async function GET(request: NextRequest) {
  try {
    // Initialize vendor management service
    await vendorManagementService.initialize();

    // Get user ID from query params or auth
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

    // Fetch vendors for the user
    const vendors = await vendorManagementService.getUserVendors(userId);

    // Transform data to match frontend interface
    const transformedVendors = vendors.map(vendor => ({
      id: vendor.id,
      name: vendor.full_name,
      contact: vendor.email,
      phone: vendor.phone,
      status: vendor.status === 'verified' ? 'Verified' : 
              vendor.status === 'pending' ? 'Pending' : 'Blocked',
      avatar: vendor.avatar_url || 'https://placehold.co/100x100.png',
      memberSince: vendor.registration_date.split('T')[0],
      orders: vendor.orders_stats,
      services: vendor.services,
      location: {
        latitude: vendor.service_area.latitude,
        longitude: vendor.service_area.longitude,
      },
      activeOrders: vendor.orders_stats.pending,
      uniqueVendorId: vendor.unique_vendor_id,
      registeredViaApp: vendor.registered_via_app,
      isOnline: vendor.is_online,
      lastSeen: vendor.last_seen,
      verifiedAt: vendor.verified_at,
      verifiedBy: vendor.verified_by,
    }));

    return NextResponse.json({
      success: true,
      data: transformedVendors,
      total: transformedVendors.length,
    });

  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch vendors',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Initialize vendor management service
    await vendorManagementService.initialize();

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['user_id'];

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

    // Generate unique vendor ID for the user
    const uniqueVendorId = await vendorManagementService.generateUniqueVendorId(body.user_id);

    return NextResponse.json({
      success: true,
      data: {
        unique_id: uniqueVendorId.unique_id,
        user_id: uniqueVendorId.user_id,
        expires_at: uniqueVendorId.expires_at,
        created_at: uniqueVendorId.created_at,
      },
      message: 'Unique vendor ID generated successfully',
    });

  } catch (error) {
    console.error('Error generating unique vendor ID:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate unique vendor ID',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
