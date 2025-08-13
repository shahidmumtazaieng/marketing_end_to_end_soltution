import { NextRequest, NextResponse } from 'next/server';
import dashboardAnalyticsService from '@/lib/services/dashboardAnalyticsService';

export async function GET(request: NextRequest) {
  try {
    // Initialize dashboard analytics service
    await dashboardAnalyticsService.initialize();

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

    // Get comprehensive dashboard analytics
    const analytics = await dashboardAnalyticsService.getDashboardAnalytics(userId);

    return NextResponse.json({
      success: true,
      data: analytics,
      message: 'Dashboard analytics retrieved successfully',
      generated_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch dashboard analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
