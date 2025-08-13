import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * GET /api/vendor-selection/settings
 * Retrieve user's vendor selection settings
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

    // Get settings from database
    const settings = await getVendorSelectionSettings(userId);

    return NextResponse.json({
      success: true,
      settings: settings
    });

  } catch (error) {
    console.error('Get vendor selection settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/vendor-selection/settings
 * Update user's vendor selection settings
 */
export async function PUT(request: NextRequest) {
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
    const settingsData = body;

    // Validate settings data
    if (!settingsData.global_settings) {
      return NextResponse.json(
        { success: false, error: 'Global settings are required' },
        { status: 400 }
      );
    }

    // Update settings
    const updatedSettings = await updateVendorSelectionSettings(userId, settingsData);

    return NextResponse.json({
      success: true,
      settings: updatedSettings,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('Update vendor selection settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

/**
 * Get vendor selection settings from database
 */
async function getVendorSelectionSettings(userId: string) {
  // Mock data - replace with actual database query
  const mockSettings = {
    global_settings: {
      auto_vendor_selection: true,
      default_location_radius: 15,
      min_vendor_rating: 4.0,
      max_response_time: 30, // minutes
      business_hours_only: false,
      weekend_operations: true
    },
    email_templates: {
      customer_confirmation: `Dear {{customer_name}},

Thank you for your interest in our {{service_type}} services. We have received your request and are currently matching you with the best available service providers in your area.

Service Details:
- Service Type: {{service_type}}
- Location: {{location}}
- Business: {{business_name}}

One of our qualified service providers will contact you shortly to discuss your requirements and schedule the service.

If you have any questions, please don't hesitate to contact us.

Best regards,
{{business_name}} Team`,

      vendor_notification: `New Service Request Available

Hello {{vendor_name}},

A new service request has been assigned to you based on your location and expertise.

Customer Details:
- Name: {{customer_name}}
- Service Type: {{service_type}}
- Location: {{location}}
- Priority: {{priority}}

Please respond within 30 minutes to accept this request. The customer is expecting contact from a qualified service provider.

Login to your vendor app to view full details and accept the request.

Best regards,
Service Coordination Team`
    },
    notification_settings: {
      email_notifications: true,
      sms_notifications: false,
      push_notifications: true,
      webhook_url: ''
    }
  };

  return mockSettings;
}

/**
 * Update vendor selection settings in database
 */
async function updateVendorSelectionSettings(userId: string, settingsData: any) {
  const updatedSettings = {
    ...settingsData,
    updated_at: new Date().toISOString()
  };

  console.log(`Updating vendor selection settings for user ${userId}:`, {
    auto_vendor_selection: settingsData.global_settings?.auto_vendor_selection,
    default_location_radius: settingsData.global_settings?.default_location_radius,
    min_vendor_rating: settingsData.global_settings?.min_vendor_rating,
    email_notifications: settingsData.notification_settings?.email_notifications
  });

  // In production, update the database
  /*
  await db.vendor_selection_settings.upsert({
    where: {
      user_id: userId
    },
    update: {
      global_settings: settingsData.global_settings,
      email_templates: settingsData.email_templates,
      notification_settings: settingsData.notification_settings,
      updated_at: new Date()
    },
    create: {
      user_id: userId,
      global_settings: settingsData.global_settings,
      email_templates: settingsData.email_templates,
      notification_settings: settingsData.notification_settings,
      created_at: new Date(),
      updated_at: new Date()
    }
  });
  */

  return updatedSettings;
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
