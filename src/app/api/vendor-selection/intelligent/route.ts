import { NextRequest, NextResponse } from 'next/server';
import intelligentVendorSelectionService from '@/lib/services/intelligentVendorSelectionService';

export async function POST(request: NextRequest) {
  try {
    // Initialize intelligent vendor selection service
    await intelligentVendorSelectionService.initialize();

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'serviceType',
      'customerLocation',
      'priority',
      'estimatedValue',
      'userId'
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

    // Validate customer location
    if (!body.customerLocation.latitude || !body.customerLocation.longitude) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Customer location must include latitude and longitude' 
        },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(body.priority)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid priority. Must be one of: low, medium, high, urgent' 
        },
        { status: 400 }
      );
    }

    // Prepare selection criteria
    const criteria = {
      serviceType: body.serviceType,
      customerLocation: {
        latitude: body.customerLocation.latitude,
        longitude: body.customerLocation.longitude,
      },
      priority: body.priority,
      estimatedValue: body.estimatedValue,
      userId: body.userId,
      maxVendors: body.maxVendors || undefined,
      preferNewVendors: body.preferNewVendors || false,
    };

    // Perform intelligent vendor selection
    const selectionResult = await intelligentVendorSelectionService.selectVendorsForOrder(criteria);

    // Transform response for frontend/vendor selection agent
    const response = {
      success: true,
      data: {
        selected_vendors: selectionResult.selected_vendors.map(vendor => ({
          vendor_id: vendor.vendor_id,
          vendor_name: vendor.vendor_name,
          vendor_email: vendor.vendor_email,
          vendor_phone: vendor.vendor_phone,
          services: vendor.services,
          distance_km: vendor.distance_km,
          performance_score: vendor.performance_score,
          opportunity_score: vendor.opportunity_score,
          selection_reason: vendor.selection_reason,
          estimated_response_time: vendor.estimated_response_time,
          is_online: vendor.is_online,
        })),
        fallback_vendors: selectionResult.fallback_vendors.map(vendor => ({
          vendor_id: vendor.vendor_id,
          vendor_name: vendor.vendor_name,
          vendor_email: vendor.vendor_email,
          distance_km: vendor.distance_km,
          selection_reason: vendor.selection_reason,
        })),
        selection_metadata: {
          total_available_vendors: selectionResult.total_available_vendors,
          selection_algorithm: selectionResult.selection_algorithm,
          selection_timestamp: selectionResult.selection_timestamp,
          selection_criteria: selectionResult.selection_criteria,
        },
      },
      message: `Selected ${selectionResult.selected_vendors.length} vendors using intelligent algorithm`,
      algorithm_details: {
        scoring_factors: [
          'Performance history and ratings',
          'Distance from customer location',
          'Current availability and workload',
          'Opportunity for new vendors',
          'Priority-based adjustments',
        ],
        selection_strategy: selectionResult.selected_vendors.length > 0 
          ? 'Multi-factor weighted scoring with opportunity balancing'
          : 'No suitable vendors found',
      },
    };

    console.log(`✅ Intelligent vendor selection completed: ${selectionResult.selected_vendors.length} vendors selected`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in intelligent vendor selection:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to perform intelligent vendor selection',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: {
          timestamp: new Date().toISOString(),
          source: 'intelligent-vendor-selection',
        }
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Initialize intelligent vendor selection service
    await intelligentVendorSelectionService.initialize();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const days = searchParams.get('days') ? parseInt(searchParams.get('days')!) : 30;

    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User ID is required for analytics' 
        },
        { status: 400 }
      );
    }

    // Get vendor selection analytics
    const analytics = await intelligentVendorSelectionService.getVendorSelectionAnalytics(userId, days);

    return NextResponse.json({
      success: true,
      data: analytics,
      period: `${days} days`,
      message: 'Vendor selection analytics retrieved successfully',
    });

  } catch (error) {
    console.error('Error fetching vendor selection analytics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch vendor selection analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
