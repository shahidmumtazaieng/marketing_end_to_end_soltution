import { NextRequest, NextResponse } from 'next/server';
import vendorManagementService from '@/lib/services/vendorManagementService';

export async function POST(request: NextRequest) {
  try {
    // Initialize vendor management service
    await vendorManagementService.initialize();

    const body = await request.json();
    
    // Validate required fields for mobile registration
    const requiredFields = [
      'unique_vendor_id',
      'full_name',
      'email',
      'phone',
      'services',
      'service_area'
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

    // Validate service area structure
    if (!body.service_area.latitude || !body.service_area.longitude) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Service area must include latitude and longitude' 
        },
        { status: 400 }
      );
    }

    // Validate services array
    if (!Array.isArray(body.services) || body.services.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'At least one service must be specified' 
        },
        { status: 400 }
      );
    }

    // Register vendor via mobile app
    const vendor = await vendorManagementService.registerVendorViaApp({
      unique_vendor_id: body.unique_vendor_id,
      full_name: body.full_name,
      email: body.email,
      phone: body.phone,
      services: body.services,
      service_area: {
        latitude: body.service_area.latitude,
        longitude: body.service_area.longitude,
        radius: body.service_area.radius || 25, // Default 25km radius
      },
    });

    // Transform response for mobile app
    const response = {
      success: true,
      data: {
        vendor_id: vendor.id,
        unique_vendor_id: vendor.unique_vendor_id,
        full_name: vendor.full_name,
        email: vendor.email,
        phone: vendor.phone,
        status: vendor.status,
        services: vendor.services,
        service_area: vendor.service_area,
        registration_date: vendor.registration_date,
        is_active: vendor.is_active,
      },
      message: 'Vendor registered successfully via mobile app',
      next_steps: [
        'Your registration is pending approval',
        'You will receive a notification once verified',
        'You can start receiving orders after verification',
        'Update your profile and availability settings',
      ],
    };

    console.log(`✅ Vendor registered via mobile app: ${vendor.full_name} with ID: ${vendor.unique_vendor_id}`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error registering vendor via mobile app:', error);
    
    // Handle specific error cases
    let errorMessage = 'Failed to register vendor';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('Invalid unique vendor ID')) {
        errorMessage = error.message;
        statusCode = 400;
      } else if (error.message.includes('already been used')) {
        errorMessage = error.message;
        statusCode = 409; // Conflict
      } else if (error.message.includes('expired')) {
        errorMessage = error.message;
        statusCode = 410; // Gone
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        message: error instanceof Error ? error.message : 'Unknown error',
        details: {
          timestamp: new Date().toISOString(),
          source: 'mobile-app-registration',
        }
      },
      { status: statusCode }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Initialize vendor management service
    await vendorManagementService.initialize();

    const { searchParams } = new URL(request.url);
    const uniqueId = searchParams.get('unique_id');

    if (!uniqueId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unique vendor ID is required' 
        },
        { status: 400 }
      );
    }

    // Get vendor by unique ID
    const vendor = await vendorManagementService.getVendorByUniqueId(uniqueId);

    if (!vendor) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Vendor not found with this unique ID' 
        },
        { status: 404 }
      );
    }

    // Transform response for mobile app
    const response = {
      success: true,
      data: {
        vendor_id: vendor.id,
        unique_vendor_id: vendor.unique_vendor_id,
        full_name: vendor.full_name,
        email: vendor.email,
        phone: vendor.phone,
        status: vendor.status,
        services: vendor.services,
        service_area: vendor.service_area,
        orders_stats: vendor.orders_stats,
        is_online: vendor.is_online,
        is_active: vendor.is_active,
        last_seen: vendor.last_seen,
        registration_date: vendor.registration_date,
        verified_at: vendor.verified_at,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching vendor by unique ID:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch vendor information',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
