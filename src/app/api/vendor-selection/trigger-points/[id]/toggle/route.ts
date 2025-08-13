import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * PUT /api/vendor-selection/trigger-points/[id]/toggle
 * Toggle trigger point active status
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id: triggerPointId } = params;
    
    if (!triggerPointId) {
      return NextResponse.json(
        { success: false, error: 'Trigger point ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { is_active } = body;

    if (typeof is_active !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'is_active must be a boolean' },
        { status: 400 }
      );
    }

    // Verify trigger point belongs to user
    const existingTriggerPoint = await getTriggerPoint(triggerPointId, userId);
    
    if (!existingTriggerPoint) {
      return NextResponse.json(
        { success: false, error: 'Trigger point not found or access denied' },
        { status: 404 }
      );
    }

    // Toggle trigger point status
    await toggleTriggerPointStatus(triggerPointId, userId, is_active);

    return NextResponse.json({
      success: true,
      trigger_point_id: triggerPointId,
      is_active: is_active,
      message: `Trigger point ${is_active ? 'activated' : 'deactivated'} successfully`
    });

  } catch (error) {
    console.error('Toggle trigger point error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to toggle trigger point status' },
      { status: 500 }
    );
  }
}

/**
 * Get trigger point by ID and user ID
 */
async function getTriggerPoint(triggerPointId: string, userId: string) {
  // Mock data - replace with actual database query
  const mockTriggerPoints: Record<string, any> = {
    'trigger_1': {
      id: 'trigger_1',
      user_id: 'user_123',
      name: 'Appointment Booking',
      is_active: true
    },
    'trigger_2': {
      id: 'trigger_2',
      user_id: 'user_123',
      name: 'Location Visit Request',
      is_active: false
    }
  };

  const triggerPoint = mockTriggerPoints[triggerPointId];
  
  // Check if trigger point exists and belongs to user
  if (triggerPoint && triggerPoint.user_id === userId) {
    return triggerPoint;
  }
  
  return null;
}

/**
 * Toggle trigger point status in database
 */
async function toggleTriggerPointStatus(triggerPointId: string, userId: string, isActive: boolean) {
  console.log(`Toggling trigger point ${triggerPointId} for user ${userId} to ${isActive ? 'active' : 'inactive'}`);

  // In production, update the database
  /*
  await db.vendor_trigger_points.update({
    where: {
      id: triggerPointId,
      user_id: userId
    },
    data: {
      is_active: isActive,
      updated_at: new Date()
    }
  });
  */

  // Log the status change for audit trail
  await logTriggerPointStatusChange(triggerPointId, userId, isActive);
}

/**
 * Log trigger point status change for audit trail
 */
async function logTriggerPointStatusChange(triggerPointId: string, userId: string, isActive: boolean) {
  try {
    console.log(`Trigger point status change logged:`, {
      trigger_point_id: triggerPointId,
      user_id: userId,
      new_status: isActive ? 'active' : 'inactive',
      timestamp: new Date().toISOString()
    });

    // In production, log this activity
    /*
    await db.activity_logs.create({
      data: {
        user_id: userId,
        entity_type: 'trigger_point',
        entity_id: triggerPointId,
        action: isActive ? 'activated' : 'deactivated',
        metadata: {
          new_status: isActive
        },
        created_at: new Date()
      }
    });
    */
  } catch (error) {
    console.error('Failed to log trigger point status change:', error);
    // Don't throw error for logging failures
  }
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
