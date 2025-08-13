import { NextRequest, NextResponse } from 'next/server';
import databaseService from '@/lib/services/databaseService';

/**
 * API endpoint for vendor selection agent to create orders
 * This is called when the calling agent detects a service request
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize database service
    await databaseService.initialize();

    const body = await request.json();
    
    // Validate required fields from vendor selection agent
    const requiredFields = [
      'business_name',
      'customer_name', 
      'customer_phone',
      'customer_address',
      'service_type',
      'work_needed',
      'selected_vendors',
      'user_id'
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

    // Extract conversation details if provided
    const conversationDetails = body.conversation_details || {};
    const triggerPoints = body.trigger_points || [];

    // Save conversation data if provided
    let conversationId = body.conversation_id;
    if (conversationDetails.messages && conversationDetails.messages.length > 0) {
      await databaseService.saveConversationData({
        conversation_id: conversationId || `CONV${Date.now()}`,
        user_id: body.user_id,
        calling_system: body.calling_system || 'elevenlabs',
        conversation_data: {
          messages: conversationDetails.messages,
          customer_email: body.customer_email,
          business_name: body.business_name,
          service_request: body.work_needed,
          price_discussed: body.price_package || null,
        },
        analysis_result: {
          service_type: body.service_type,
          urgency: body.priority || 'medium',
          location_extracted: body.customer_address,
          contact_info_extracted: {
            phone: body.customer_phone,
            email: body.customer_email,
          },
        },
        triggers_detected: triggerPoints,
        vendor_selection_triggered: true,
        vendor_selection_result: {
          selected_vendors: body.selected_vendors,
          vendor_count: body.selected_vendors.length,
          selection_criteria: body.selection_criteria || {},
        },
        processing_time_ms: body.processing_time_ms || 0,
      });
    }

    // Save trigger point data
    const triggerId = `TRIG${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    await databaseService.saveTriggerPointData({
      trigger_id: triggerId,
      trigger_name: `${body.service_type} Service Request`,
      business_name: body.business_name,
      location: body.customer_address,
      work_needed: body.work_needed,
      service_type: body.service_type,
      selected_vendors: body.selected_vendors,
      vendor_count: body.selected_vendors.length,
      estimated_value: body.estimated_value || 0,
      price_package: body.price_package,
      conversation_id: conversationId,
      user_id: body.user_id,
    });

    // Create order in database
    const order = await databaseService.createOrder({
      business_name: body.business_name,
      customer_name: body.customer_name,
      customer_phone: body.customer_phone,
      customer_email: body.customer_email,
      customer_address: body.customer_address,
      customer_location: body.customer_location,
      service_type: body.service_type,
      description: body.work_needed,
      priority: body.priority || 'medium',
      estimated_value: body.estimated_value || 0,
      selected_vendors: body.selected_vendors,
      conversation_id: conversationId,
      trigger_point_id: triggerId,
      user_id: body.user_id,
      price_package: body.price_package,
      scheduled_date: body.scheduled_date,
    });

    // Prepare response for vendor selection agent
    const response = {
      success: true,
      order_id: order.order_id,
      trigger_id: triggerId,
      conversation_id: conversationId,
      data: {
        order: {
          id: order.order_id,
          business_name: order.business_name,
          customer: {
            name: order.customer_name,
            phone: order.customer_phone,
            email: order.customer_email,
            address: order.customer_address,
            location: order.customer_location,
          },
          service: {
            type: order.service_type,
            description: order.description,
            priority: order.priority,
            estimated_value: order.estimated_value,
          },
          vendors: {
            selected: body.selected_vendors,
            count: body.selected_vendors.length,
          },
          status: 'new',
          created_at: order.created_at,
        },
        trigger_point: {
          id: triggerId,
          name: `${body.service_type} Service Request`,
          location: body.customer_address,
          work_needed: body.work_needed,
        },
        conversation: conversationId ? {
          id: conversationId,
          system: body.calling_system || 'elevenlabs',
          messages_count: conversationDetails.messages?.length || 0,
        } : null,
      },
      message: 'Order created successfully from vendor selection agent',
      next_steps: [
        'Vendors will be notified via mobile app',
        'Real-time tracking enabled',
        'Customer will receive confirmation',
        'Order status updates will be synced',
      ],
    };

    console.log(`✅ Order created from vendor selection agent: ${order.order_id}`);
    console.log(`📊 Trigger point created: ${triggerId}`);
    console.log(`💬 Conversation saved: ${conversationId}`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error creating order from vendor selection agent:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create order from vendor selection agent',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: {
          timestamp: new Date().toISOString(),
          source: 'vendor-selection-agent',
        }
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to retrieve orders created by vendor selection agent
 */
export async function GET(request: NextRequest) {
  try {
    // Initialize database service
    await databaseService.initialize();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;

    // Get orders created by vendor selection agent
    const filters = {
      limit,
      offset: 0,
    };

    if (userId) {
      // Add user filter if provided
      filters.user_id = userId;
    }

    const orders = await databaseService.getOrders(filters);

    // Filter orders created by agent (created_by_role = 'agent')
    const agentOrders = orders.filter(order => order.created_by_role === 'agent');

    // Transform data for response
    const transformedOrders = agentOrders.map(order => ({
      order_id: order.order_id,
      business_name: order.business_name,
      customer: {
        name: order.customer_name,
        phone: order.customer_phone,
        email: order.customer_email,
        address: order.customer_address,
        location: order.customer_location,
      },
      service: {
        type: order.service_type,
        description: order.description,
        priority: order.priority,
        estimated_value: order.estimated_value,
      },
      vendors: {
        assigned: order.assigned_vendors || [],
        selected_vendor_id: order.vendor_id,
      },
      status: order.status,
      pricing: {
        estimated: order.estimated_value,
        dealing: order.dealing_price,
        package: order.price_package,
      },
      timeline: {
        created_at: order.created_at,
        assigned_at: order.assigned_at,
        on_way_at: order.on_way_at,
        processing_at: order.processing_at,
        completed_at: order.completed_at,
      },
      trigger_point_id: order.trigger_point_id,
      conversation_id: order.conversation_id,
    }));

    return NextResponse.json({
      success: true,
      data: transformedOrders,
      total: transformedOrders.length,
      message: 'Orders from vendor selection agent retrieved successfully',
    });

  } catch (error) {
    console.error('Error fetching vendor selection agent orders:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch vendor selection agent orders',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
