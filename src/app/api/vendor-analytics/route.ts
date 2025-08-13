import { NextRequest, NextResponse } from 'next/server';
import vendorPerformanceAnalyticsService from '@/lib/services/vendorPerformanceAnalyticsService';

export async function GET(request: NextRequest) {
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

    // Get performance analytics for all user's vendors
    const allVendorAnalytics = await vendorPerformanceAnalyticsService.getAllVendorsPerformanceAnalytics(userId);

    // Calculate summary statistics
    const summary = {
      total_vendors: allVendorAnalytics.length,
      active_vendors: allVendorAnalytics.filter(v => v.orders_this_month > 0).length,
      total_revenue: allVendorAnalytics.reduce((sum, v) => sum + v.total_revenue, 0),
      total_orders: allVendorAnalytics.reduce((sum, v) => sum + v.total_orders, 0),
      average_completion_rate: allVendorAnalytics.length > 0
        ? allVendorAnalytics.reduce((sum, v) => sum + v.completion_rate, 0) / allVendorAnalytics.length
        : 0,
      average_rating: allVendorAnalytics.length > 0
        ? allVendorAnalytics.reduce((sum, v) => sum + v.average_rating, 0) / allVendorAnalytics.length
        : 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        vendors: allVendorAnalytics,
        summary: summary,
      },
      message: 'All vendor analytics retrieved successfully',
      generated_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching all vendor analytics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch vendor analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
