import { NextRequest, NextResponse } from 'next/server';
import billingSettingsService from '@/lib/services/billingSettingsService';

export async function GET(request: NextRequest) {
  try {
    // Initialize billing settings service
    await billingSettingsService.initialize();

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

    // Get business information
    const businessInfo = await billingSettingsService.getBusinessInformation(userId);

    if (!businessInfo) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No business information found',
      });
    }

    return NextResponse.json({
      success: true,
      data: businessInfo,
      message: 'Business information retrieved successfully',
    });

  } catch (error) {
    console.error('Error fetching business information:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch business information',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Initialize billing settings service
    await billingSettingsService.initialize();

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'user_id',
      'business_name',
      'business_address',
      'business_phone',
      'business_email'
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.business_email)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email format' 
        },
        { status: 400 }
      );
    }

    // Validate invoice template
    const validTemplates = ['modern', 'classic', 'vibrant'];
    if (body.invoice_template && !validTemplates.includes(body.invoice_template)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid invoice template. Must be one of: modern, classic, vibrant' 
        },
        { status: 400 }
      );
    }

    // Save business information
    const savedInfo = await billingSettingsService.saveBusinessInformation(body);

    return NextResponse.json({
      success: true,
      data: savedInfo,
      message: 'Business information saved successfully',
    });

  } catch (error) {
    console.error('Error saving business information:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save business information',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
