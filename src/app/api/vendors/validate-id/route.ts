import { NextRequest, NextResponse } from 'next/server';
import vendorManagementService from '@/lib/services/vendorManagementService';

export async function POST(request: NextRequest) {
  try {
    // Initialize vendor management service
    await vendorManagementService.initialize();

    const body = await request.json();
    
    // Validate required fields
    if (!body.unique_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unique vendor ID is required' 
        },
        { status: 400 }
      );
    }

    // Validate unique vendor ID
    const validation = await vendorManagementService.validateUniqueVendorId(body.unique_id);

    if (validation.valid) {
      return NextResponse.json({
        success: true,
        valid: true,
        message: validation.message,
        data: {
          unique_id: validation.data?.unique_id,
          user_id: validation.data?.user_id,
          expires_at: validation.data?.expires_at,
          created_at: validation.data?.created_at,
        },
      });
    } else {
      return NextResponse.json({
        success: true,
        valid: false,
        message: validation.message,
      });
    }

  } catch (error) {
    console.error('Error validating unique vendor ID:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to validate unique vendor ID',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Initialize vendor management service
    await vendorManagementService.initialize();

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

    // Get user's unique vendor IDs
    const uniqueIds = await vendorManagementService.getUserUniqueVendorIds(userId);

    // Transform data for frontend
    const transformedIds = uniqueIds.map(id => ({
      id: id.id,
      unique_id: id.unique_id,
      is_used: id.is_used,
      used_by_vendor_id: id.used_by_vendor_id,
      used_at: id.used_at,
      expires_at: id.expires_at,
      created_at: id.created_at,
      status: id.is_used ? 'Used' : 
              (id.expires_at && new Date(id.expires_at) < new Date()) ? 'Expired' : 'Active',
    }));

    return NextResponse.json({
      success: true,
      data: transformedIds,
      total: transformedIds.length,
    });

  } catch (error) {
    console.error('Error fetching unique vendor IDs:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch unique vendor IDs',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
