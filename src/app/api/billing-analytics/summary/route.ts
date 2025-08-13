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

    // Fetch completed orders analytics
    const { data: completedOrders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        dealing_price,
        completed_at,
        vendor_id,
        user_profiles!orders_vendor_id_fkey (
          full_name
        )
      `)
      .eq('status', 'completed')
      .eq('user_id', userId)
      .not('dealing_price', 'is', null);

    if (ordersError) {
      console.error('Error fetching completed orders:', ordersError);
      throw ordersError;
    }

    // Fetch invoices analytics
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        id,
        total_amount,
        status,
        invoice_date
      `)
      .eq('user_id', userId);

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError);
      throw invoicesError;
    }

    // Calculate analytics
    const totalCompletedOrders = completedOrders?.length || 0;
    const totalRevenue = completedOrders?.reduce((sum, order) => sum + (order.dealing_price || 0), 0) || 0;
    const totalInvoicesGenerated = invoices?.length || 0;
    
    // Calculate pending payments (invoices that are sent but not paid)
    const pendingPayments = invoices
      ?.filter(invoice => invoice.status === 'sent' || invoice.status === 'overdue')
      ?.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0) || 0;

    const averageOrderValue = totalCompletedOrders > 0 ? totalRevenue / totalCompletedOrders : 0;

    // Calculate top performing vendors
    const vendorPerformance = new Map();
    completedOrders?.forEach(order => {
      const vendorId = order.vendor_id;
      const vendorName = order.user_profiles?.full_name || 'Unknown Vendor';
      const revenue = order.dealing_price || 0;

      if (vendorPerformance.has(vendorId)) {
        const existing = vendorPerformance.get(vendorId);
        existing.total_orders += 1;
        existing.total_revenue += revenue;
      } else {
        vendorPerformance.set(vendorId, {
          vendor_name: vendorName,
          vendor_id: vendorId,
          total_orders: 1,
          total_revenue: revenue,
        });
      }
    });

    const topPerformingVendors = Array.from(vendorPerformance.values())
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 5);

    // Calculate monthly revenue (last 12 months)
    const monthlyRevenue = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      
      const monthOrders = completedOrders?.filter(order => {
        const orderDate = new Date(order.completed_at);
        return orderDate >= monthStart && orderDate <= monthEnd;
      }) || [];

      const monthRevenue = monthOrders.reduce((sum, order) => sum + (order.dealing_price || 0), 0);

      monthlyRevenue.push({
        month: monthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        revenue: monthRevenue,
        orders: monthOrders.length,
      });
    }

    const analytics = {
      total_completed_orders: totalCompletedOrders,
      total_revenue: totalRevenue,
      total_invoices_generated: totalInvoicesGenerated,
      pending_payments: pendingPayments,
      average_order_value: averageOrderValue,
      top_performing_vendors: topPerformingVendors,
      monthly_revenue: monthlyRevenue,
    };

    return NextResponse.json({
      success: true,
      data: analytics,
      message: 'Billing analytics summary retrieved successfully',
    });

  } catch (error) {
    console.error('Error fetching billing analytics summary:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch billing analytics summary',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
