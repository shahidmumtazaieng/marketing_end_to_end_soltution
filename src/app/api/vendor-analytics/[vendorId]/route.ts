import { NextRequest, NextResponse } from 'next/server';
import vendorPerformanceAnalyticsService from '@/lib/services/vendorPerformanceAnalyticsService';

export async function GET(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    // Initialize vendor performance analytics service
    await vendorPerformanceAnalyticsService.initialize();

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

    const { vendorId } = params;

    if (!vendorId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Vendor ID is required' 
        },
        { status: 400 }
      );
    }

    // Get comprehensive vendor performance analytics
    const analytics = await vendorPerformanceAnalyticsService.getVendorPerformanceAnalytics(
      vendorId, 
      userId
    );

    return NextResponse.json({
      success: true,
      data: analytics,
      message: 'Vendor performance analytics retrieved successfully',
      generated_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching vendor performance analytics:', error);
    
    // Handle specific error cases
    let errorMessage = 'Failed to fetch vendor performance analytics';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('Vendor not found')) {
        errorMessage = 'Vendor not found or access denied';
        statusCode = 404;
      } else if (error.message.includes('access denied')) {
        errorMessage = 'Access denied to vendor data';
        statusCode = 403;
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: statusCode }
    );
  }
}
