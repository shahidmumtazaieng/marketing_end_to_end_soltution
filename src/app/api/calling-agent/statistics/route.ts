import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: Calling Agent Statistics
 * Fetches performance statistics and analytics data
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';
    
    // Get the backend API URL
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    // Forward the request to our Node.js backend
    const response = await fetch(`${backendUrl}/api/calling-agent/statistics?timeRange=${timeRange}`, {
      headers: {
        'Authorization': `Bearer ${process.env.API_SECRET_KEY || 'dev-key'}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch statistics');
    }

    return NextResponse.json({
      success: true,
      statistics: data.statistics,
      timeRange,
    });

  } catch (error) {
    console.error('❌ Failed to fetch statistics:', error);
    
    // Return mock statistics for development
    const mockStatistics = {
      totalCalls: 1284,
      activeCalls: 3,
      successRate: 87.4,
      avgDuration: 245, // seconds
      scamsDetected: 35,
      callsToday: 67,
      callsThisWeek: 342,
      callsThisMonth: 1284,
      
      // Performance metrics
      performance: {
        detectionAccuracy: 95.2,
        responseTime: 85, // ms
        customerSatisfaction: 4.6,
        falsePositiveRate: 2.1
      },
      
      // Scam detection breakdown
      scamTypes: {
        techSupport: 35,
        financial: 28,
        authorityImpersonation: 22,
        prizeScam: 15
      },
      
      // Hourly distribution
      hourlyDistribution: [
        { hour: 0, calls: 2, scams: 0 },
        { hour: 1, calls: 1, scams: 0 },
        { hour: 2, calls: 0, scams: 0 },
        { hour: 3, calls: 1, scams: 0 },
        { hour: 4, calls: 3, scams: 0 },
        { hour: 5, calls: 8, scams: 1 },
        { hour: 6, calls: 15, scams: 1 },
        { hour: 7, calls: 25, scams: 2 },
        { hour: 8, calls: 45, scams: 3 },
        { hour: 9, calls: 62, scams: 4 },
        { hour: 10, calls: 78, scams: 5 },
        { hour: 11, calls: 85, scams: 6 },
        { hour: 12, calls: 92, scams: 7 },
        { hour: 13, calls: 88, scams: 6 },
        { hour: 14, calls: 82, scams: 5 },
        { hour: 15, calls: 75, scams: 4 },
        { hour: 16, calls: 68, scams: 4 },
        { hour: 17, calls: 55, scams: 3 },
        { hour: 18, calls: 42, scams: 2 },
        { hour: 19, calls: 32, scams: 2 },
        { hour: 20, calls: 25, scams: 1 },
        { hour: 21, calls: 18, scams: 1 },
        { hour: 22, calls: 12, scams: 0 },
        { hour: 23, calls: 5, scams: 0 }
      ],
      
      // Weekly trends
      weeklyTrends: [
        { date: '2024-01-01', calls: 45, scams: 3, success: 38 },
        { date: '2024-01-02', calls: 52, scams: 5, success: 42 },
        { date: '2024-01-03', calls: 38, scams: 2, success: 33 },
        { date: '2024-01-04', calls: 61, scams: 7, success: 48 },
        { date: '2024-01-05', calls: 55, scams: 4, success: 46 },
        { date: '2024-01-06', calls: 48, scams: 6, success: 39 },
        { date: '2024-01-07', calls: 67, scams: 8, success: 52 }
      ],
      
      // Service health
      serviceHealth: {
        elevenlabs: { status: 'healthy', latency: 45, uptime: 99.9 },
        scamDetection: { status: 'healthy', latency: 120, accuracy: 95.2 },
        nlpProcessing: { status: 'healthy', latency: 85, accuracy: 92.1 },
        voiceAnalysis: { status: 'healthy', latency: 200, accuracy: 88.5 }
      }
    };
    
    return NextResponse.json({
      success: true,
      statistics: mockStatistics,
      timeRange,
      note: 'Using mock data - backend not available'
    });
  }
}
