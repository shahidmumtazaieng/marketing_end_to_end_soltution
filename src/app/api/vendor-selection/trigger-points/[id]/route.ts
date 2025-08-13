import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * PUT /api/vendor-selection/trigger-points/[id]
 * Update a trigger point
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
    const updateData = body;

    // Validate required fields
    if (!updateData.name || !updateData.instructions) {
      return NextResponse.json(
        { success: false, error: 'Name and instructions are required' },
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

    // Update trigger point
    const updatedTriggerPoint = await updateTriggerPoint(triggerPointId, userId, updateData);

    return NextResponse.json({
      success: true,
      trigger_point: updatedTriggerPoint,
      message: 'Trigger point updated successfully'
    });

  } catch (error) {
    console.error('Update trigger point error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update trigger point' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/vendor-selection/trigger-points/[id]
 * Delete a trigger point
 */
export async function DELETE(
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

    // Verify trigger point belongs to user
    const existingTriggerPoint = await getTriggerPoint(triggerPointId, userId);
    
    if (!existingTriggerPoint) {
      return NextResponse.json(
        { success: false, error: 'Trigger point not found or access denied' },
        { status: 404 }
      );
    }

    // Delete trigger point
    await deleteTriggerPoint(triggerPointId, userId);

    return NextResponse.json({
      success: true,
      message: 'Trigger point deleted successfully'
    });

  } catch (error) {
    console.error('Delete trigger point error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete trigger point' },
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
      type: 'appointment_booking',
      is_active: true
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
 * Update trigger point in database
 */
async function updateTriggerPoint(triggerPointId: string, userId: string, updateData: any) {
  const updatedTriggerPoint = {
    ...updateData,
    id: triggerPointId,
    updated_at: new Date().toISOString()
  };

  console.log(`Updating trigger point ${triggerPointId} for user ${userId}:`, {
    name: updateData.name,
    type: updateData.type,
    is_active: updateData.is_active
  });

  // In production, update the database
  /*
  await db.vendor_trigger_points.update({
    where: {
      id: triggerPointId,
      user_id: userId
    },
    data: {
      name: updateData.name,
      type: updateData.type,
      description: updateData.description,
      instructions: updateData.instructions,
      keywords: updateData.keywords,
      conditions: updateData.conditions,
      actions: updateData.actions,
      vendor_selection_criteria: updateData.vendor_selection_criteria,
      is_active: updateData.is_active,
      updated_at: new Date()
    }
  });
  */

  return updatedTriggerPoint;
}

/**
 * Delete trigger point from database
 */
async function deleteTriggerPoint(triggerPointId: string, userId: string) {
  console.log(`Deleting trigger point ${triggerPointId} for user ${userId}`);

  // In production, delete from database
  /*
  await db.vendor_trigger_points.delete({
    where: {
      id: triggerPointId,
      user_id: userId
    }
  });
  */
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
