import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { unifiedBackend } from '@/lib/services/unifiedBackendService';

/**
 * GET /api/vendor/profile
 * Vendor: Get profile (Base44 SDK compatible - User.me())
 * Matches vendor app Settings.txs.txt functionality
 */
export async function GET(request: NextRequest) {
  try {
    // Get vendor ID from authentication
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const { userId: vendorId, role } = getUserFromAuth(authorization);

    if (!vendorId || role !== 'vendor') {
      return NextResponse.json(
        { success: false, error: 'Vendor authentication required' },
        { status: 401 }
      );
    }

    console.log(`👤 Vendor ${vendorId}: Getting profile`);

    // Get vendor profile using unified backend
    const vendor = await unifiedBackend.getVendorProfile(vendorId);

    // Format response to match vendor app expectations (Settings.txs.txt structure)
    const profile = {
      // Basic profile information
      full_name: vendor.full_name,
      email: vendor.email,
      phone: vendor.phone,
      referral_id: vendor.referral_id || '',
      
      // Service area configuration (from Settings.txs.txt)
      service_area: vendor.service_area || {
        latitude: 0,
        longitude: 0,
        radius: 10 // Default 10km radius
      },
      
      // Notification preferences (from Settings.txs.txt)
      notification_preferences: vendor.notification_preferences || {
        new_orders: true,
        order_updates: true,
        whatsapp_integration: false,
        push_notifications: true,
        email_notifications: true
      },
      
      // App preferences (from Settings.txs.txt)
      preferences: vendor.preferences || {
        language: 'en',
        theme: 'light'
      },
      
      // Services offered
      services: vendor.services || [],
      
      // Performance statistics (for Dashboard.txs.txt)
      orders_stats: vendor.orders_stats || {
        total: 0,
        completed: 0,
        pending: 0,
        canceled: 0
      },
      
      // Status and availability
      status: vendor.status,
      is_online: vendor.is_online || false,
      last_seen: vendor.last_seen,
      
      // Device tokens for push notifications
      device_tokens: vendor.device_tokens || [],
      
      // Metadata
      created_at: vendor.created_at,
      updated_at: vendor.updated_at
    };

    return NextResponse.json({
      success: true,
      profile,
      account_status: {
        verified: vendor.status === 'active',
        pending_verification: vendor.status === 'pending',
        blocked: vendor.status === 'blocked'
      }
    });

  } catch (error) {
    console.error('Vendor get profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve profile' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/vendor/profile
 * Vendor: Update profile (Base44 SDK compatible - User.updateMyUserData())
 * Matches vendor app Settings.txs.txt functionality
 */
export async function PUT(request: NextRequest) {
  try {
    // Get vendor ID from authentication
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const { userId: vendorId, role } = getUserFromAuth(authorization);

    if (!vendorId || role !== 'vendor') {
      return NextResponse.json(
        { success: false, error: 'Vendor authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const updateData = await request.json();

    console.log(`👤 Vendor ${vendorId}: Updating profile`);

    // Validate service area if provided
    if (updateData.service_area) {
      const { latitude, longitude, radius } = updateData.service_area;
      if (typeof latitude !== 'number' || typeof longitude !== 'number' || typeof radius !== 'number') {
        return NextResponse.json(
          { success: false, error: 'Invalid service area coordinates' },
          { status: 400 }
        );
      }
      if (radius < 1 || radius > 100) {
        return NextResponse.json(
          { success: false, error: 'Service radius must be between 1 and 100 km' },
          { status: 400 }
        );
      }
    }

    // Validate notification preferences if provided
    if (updateData.notification_preferences) {
      const validKeys = ['new_orders', 'order_updates', 'whatsapp_integration', 'push_notifications', 'email_notifications'];
      const invalidKeys = Object.keys(updateData.notification_preferences).filter(key => !validKeys.includes(key));
      if (invalidKeys.length > 0) {
        return NextResponse.json(
          { success: false, error: `Invalid notification preference keys: ${invalidKeys.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Validate app preferences if provided
    if (updateData.preferences) {
      if (updateData.preferences.language && !['en', 'hi', 'es'].includes(updateData.preferences.language)) {
        return NextResponse.json(
          { success: false, error: 'Invalid language. Must be en, hi, or es' },
          { status: 400 }
        );
      }
      if (updateData.preferences.theme && !['light', 'dark'].includes(updateData.preferences.theme)) {
        return NextResponse.json(
          { success: false, error: 'Invalid theme. Must be light or dark' },
          { status: 400 }
        );
      }
    }

    // Update vendor profile using unified backend
    const updatedVendor = await unifiedBackend.updateVendorProfile(vendorId, updateData);

    // Format response to match vendor app expectations
    const updatedProfile = {
      full_name: updatedVendor.full_name,
      email: updatedVendor.email,
      phone: updatedVendor.phone,
      referral_id: updatedVendor.referral_id,
      service_area: updatedVendor.service_area,
      notification_preferences: updatedVendor.notification_preferences,
      preferences: updatedVendor.preferences,
      services: updatedVendor.services,
      orders_stats: updatedVendor.orders_stats,
      status: updatedVendor.status,
      is_online: updatedVendor.is_online,
      updated_at: updatedVendor.updated_at
    };

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: updatedProfile,
      updated_fields: Object.keys(updateData),
      updated_at: updatedVendor.updated_at
    });

  } catch (error) {
    console.error('Vendor update profile error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vendor/profile/device-token
 * Vendor: Register device token for push notifications
 */
export async function POST(request: NextRequest) {
  try {
    // Get vendor ID from authentication
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const { userId: vendorId, role } = getUserFromAuth(authorization);

    if (!vendorId || role !== 'vendor') {
      return NextResponse.json(
        { success: false, error: 'Vendor authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const { device_token, platform } = await request.json();

    if (!device_token) {
      return NextResponse.json(
        { success: false, error: 'Device token is required' },
        { status: 400 }
      );
    }

    console.log(`📱 Vendor ${vendorId}: Registering device token for ${platform || 'unknown'} platform`);

    // Get current vendor profile
    const vendor = await unifiedBackend.getVendorProfile(vendorId);
    
    // Add device token if not already present
    const currentTokens = vendor.device_tokens || [];
    if (!currentTokens.includes(device_token)) {
      const updatedTokens = [...currentTokens, device_token];
      
      // Update vendor profile with new device token
      await unifiedBackend.updateVendorProfile(vendorId, {
        device_tokens: updatedTokens
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Device token registered successfully',
      device_token,
      platform: platform || 'unknown'
    });

  } catch (error) {
    console.error('Register device token error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register device token' },
      { status: 500 }
    );
  }
}

/**
 * Extract user info from authorization header
 */
function getUserFromAuth(authorization: string | null): { userId: string | null; role: string | null } {
  if (!authorization) return { userId: null, role: null };
  
  try {
    const token = authorization.replace('Bearer ', '');
    // In production, decode JWT token and extract vendor info
    return { 
      userId: 'VEND001', // Mock vendor ID
      role: 'vendor' 
    };
  } catch (error) {
    console.error('Auth extraction error:', error);
    return { userId: null, role: null };
  }
}
