import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * GET /api/vendor-selection/trigger-points
 * Retrieve user's configured trigger points
 */
export async function GET(request: NextRequest) {
  try {
    // Get user ID from authentication
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const userId = getUserIdFromAuth(authorization);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get trigger points from database
    const triggerPoints = await getTriggerPoints(userId);

    return NextResponse.json({
      success: true,
      trigger_points: triggerPoints
    });

  } catch (error) {
    console.error('Get trigger points error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve trigger points' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vendor-selection/trigger-points
 * Create a new trigger point
 */
export async function POST(request: NextRequest) {
  try {
    // Get user ID from authentication
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const userId = getUserIdFromAuth(authorization);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const triggerPointData = body;

    // Validate required fields
    if (!triggerPointData.name || !triggerPointData.instructions) {
      return NextResponse.json(
        { success: false, error: 'Name and instructions are required' },
        { status: 400 }
      );
    }

    // Create trigger point
    const triggerPoint = await createTriggerPoint(userId, triggerPointData);

    return NextResponse.json({
      success: true,
      trigger_point: triggerPoint,
      message: 'Trigger point created successfully'
    });

  } catch (error) {
    console.error('Create trigger point error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create trigger point' },
      { status: 500 }
    );
  }
}

/**
 * Get trigger points from database
 */
async function getTriggerPoints(userId: string) {
  // Mock data - replace with actual database query
  const mockTriggerPoints = [
    {
      id: 'trigger_1',
      name: 'Appointment Booking',
      type: 'appointment_booking',
      description: 'Customer requests to schedule an appointment or service visit',
      instructions: 'Trigger when customer mentions scheduling, booking appointment, or wants to set up a service visit. Ensure customer provides name, location, and preferred time.',
      keywords: ['appointment', 'schedule', 'book', 'visit', 'come over', 'service call'],
      conditions: {
        customer_name_required: true,
        location_required: true,
        contact_details_required: true,
        service_type_required: true,
        budget_mentioned: false,
        timeline_mentioned: true
      },
      actions: {
        send_customer_email: true,
        notify_vendors: true,
        create_order: true,
        priority_level: 4
      },
      vendor_selection_criteria: {
        location_radius: 15,
        min_rating: 4.0,
        max_vendors_to_notify: 3,
        prefer_available: true,
        work_type_match: true
      },
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'trigger_2',
      name: 'Location Visit Request',
      type: 'location_visit',
      description: 'Customer agrees to location visit or site inspection',
      instructions: 'Trigger when customer agrees to have someone visit their location for inspection, assessment, or service delivery. Must have customer name and location details.',
      keywords: ['visit', 'come over', 'inspection', 'assessment', 'site visit', 'location'],
      conditions: {
        customer_name_required: true,
        location_required: true,
        contact_details_required: true,
        service_type_required: false,
        budget_mentioned: false,
        timeline_mentioned: true
      },
      actions: {
        send_customer_email: true,
        notify_vendors: true,
        create_order: true,
        priority_level: 5
      },
      vendor_selection_criteria: {
        location_radius: 10,
        min_rating: 4.5,
        max_vendors_to_notify: 2,
        prefer_available: true,
        work_type_match: true
      },
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  return mockTriggerPoints;
}

/**
 * Create trigger point in database
 */
async function createTriggerPoint(userId: string, triggerPointData: any) {
  const triggerPoint = {
    id: `trigger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...triggerPointData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  console.log(`Creating trigger point for user ${userId}:`, {
    id: triggerPoint.id,
    name: triggerPoint.name,
    type: triggerPoint.type,
    is_active: triggerPoint.is_active
  });

  // In production, save to database
  /*
  await db.vendor_trigger_points.create({
    data: {
      id: triggerPoint.id,
      user_id: userId,
      name: triggerPoint.name,
      type: triggerPoint.type,
      description: triggerPoint.description,
      instructions: triggerPoint.instructions,
      keywords: triggerPoint.keywords,
      conditions: triggerPoint.conditions,
      actions: triggerPoint.actions,
      vendor_selection_criteria: triggerPoint.vendor_selection_criteria,
      is_active: triggerPoint.is_active,
      created_at: new Date(triggerPoint.created_at),
      updated_at: new Date(triggerPoint.updated_at)
    }
  });
  */

  return triggerPoint;
}

/**
 * Extract user ID from authorization header
 */
function getUserIdFromAuth(authorization: string | null): string | null {
  if (!authorization) return null;
  
  try {
    const token = authorization.replace('Bearer ', '');
    return 'user_123'; // Replace with actual user ID extraction
  } catch (error) {
    console.error('Auth extraction error:', error);
    return null;
  }
}
