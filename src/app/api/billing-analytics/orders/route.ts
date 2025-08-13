import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your_supabase_url_here';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_supabase_service_key_here';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function GET(request: NextRequest) {
  try {
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

    // Fetch completed orders with invoice information for user's vendors only
    const { data: completedOrders, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_id,
        customer_name,
        customer_email,
        service_type,
        dealing_price,
        completed_at,
        invoice_id,
        invoice_number,
        invoice_generated,
        vendor_id,
        user_profiles!orders_vendor_id_fkey (
          full_name
        ),
        invoices (
          id,
          invoice_number,
          status,
          pdf_url,
          total_amount
        )
      `)
      .eq('status', 'completed')
      .eq('user_id', userId) // Only orders for this user's vendors
      .not('dealing_price', 'is', null)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching completed orders:', error);
      throw error;
    }

    // Transform data for frontend
    const transformedOrders = (completedOrders || []).map(order => ({
      id: order.id,
      order_id: order.order_id,
      vendor_name: order.user_profiles?.full_name || 'Unknown Vendor',
      vendor_id: order.vendor_id,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      service_type: order.service_type,
      final_price: order.dealing_price || 0,
      completed_at: order.completed_at,
      invoice_number: order.invoice_number,
      invoice_id: order.invoice_id,
      invoice_status: order.invoices?.[0]?.status || 'draft',
      pdf_url: order.invoices?.[0]?.pdf_url,
    }));

    return NextResponse.json({
      success: true,
      data: transformedOrders,
      total: transformedOrders.length,
      message: 'Completed orders retrieved successfully',
    });

  } catch (error) {
    console.error('Error fetching billing analytics orders:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch completed orders',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
