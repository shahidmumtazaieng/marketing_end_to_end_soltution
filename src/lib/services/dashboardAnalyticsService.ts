/**
 * Enhanced Dashboard Analytics Service
 * Real-time analytics with Python integration for advanced calculations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your_supabase_url_here';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_supabase_service_key_here';

export interface DashboardMetrics {
  // Overview metrics
  total_orders: number;
  active_orders: number;
  completed_orders: number;
  total_revenue: number;
  
  // Growth metrics
  orders_growth: number; // Percentage change from last period
  revenue_growth: number;
  vendor_growth: number;
  
  // Performance metrics
  average_completion_time: number; // In hours
  customer_satisfaction: number; // Average rating
  vendor_utilization: number; // Percentage of active vendors
  
  // Recent activity
  recent_orders: Array<{
    order_id: string;
    customer_name: string;
    vendor_name: string;
    service_type: string;
    status: string;
    amount: number;
    created_at: string;
  }>;
  
  // Charts data
  revenue_chart: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  
  service_distribution: Array<{
    service_type: string;
    count: number;
    revenue: number;
    percentage: number;
  }>;
  
  vendor_performance: Array<{
    vendor_id: string;
    vendor_name: string;
    total_orders: number;
    completed_orders: number;
    completion_rate: number;
    average_rating: number;
    total_revenue: number;
  }>;
  
  // Time-based analytics
  hourly_distribution: Array<{
    hour: number;
    orders: number;
  }>;
  
  daily_trends: Array<{
    day: string;
    orders: number;
    revenue: number;
  }>;
}

class DashboardAnalyticsService {
  private supabase: SupabaseClient;
  private isInitialized = false;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async initialize(): Promise<void> {
    try {
      // Test connection
      const { data, error } = await this.supabase.from('orders').select('count').limit(1);
      if (error && !error.message.includes('does not exist')) throw error;
      
      this.isInitialized = true;
      console.log('✅ Dashboard Analytics Service initialized');
    } catch (error) {
      console.error('❌ Dashboard Analytics Service initialization failed:', error);
      throw error;
    }
  }

  // ==========================================
  // MAIN ANALYTICS GENERATION
  // ==========================================

  /**
   * Get comprehensive dashboard analytics for user
   */
  async getDashboardAnalytics(userId: string): Promise<DashboardMetrics> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log(`📊 Generating dashboard analytics for user: ${userId}`);

      // Fetch all orders for the user
      const { data: orders, error: ordersError } = await this.supabase
        .from('orders')
        .select(`
          *,
          user_profiles!orders_vendor_id_fkey (
            full_name,
            orders_stats
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch vendor data
      const { data: vendors, error: vendorsError } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'vendor');

      if (vendorsError) throw vendorsError;

      // Calculate analytics using advanced algorithms
      const analytics = await this.calculateAdvancedAnalytics(orders || [], vendors || []);

      console.log(`✅ Dashboard analytics generated successfully`);
      return analytics;
    } catch (error) {
      console.error('Error generating dashboard analytics:', error);
      throw error;
    }
  }

  // ==========================================
  // ADVANCED ANALYTICS CALCULATIONS
  // ==========================================

  /**
   * Calculate advanced analytics using statistical methods
   */
  private async calculateAdvancedAnalytics(orders: any[], vendors: any[]): Promise<DashboardMetrics> {
    // Basic metrics
    const totalOrders = orders.length;
    const activeOrders = orders.filter(o => ['assigned', 'accepted', 'on_way', 'processing'].includes(o.status)).length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const totalRevenue = orders
      .filter(o => o.status === 'completed' && o.dealing_price)
      .reduce((sum, o) => sum + (o.dealing_price || 0), 0);

    // Growth calculations (comparing with previous period)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentOrders = orders.filter(o => new Date(o.created_at) >= thirtyDaysAgo);
    const previousOrders = orders.filter(o => {
      const orderDate = new Date(o.created_at);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      return orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo;
    });

    const ordersGrowth = this.calculateGrowthRate(recentOrders.length, previousOrders.length);
    
    const recentRevenue = recentOrders
      .filter(o => o.status === 'completed' && o.dealing_price)
      .reduce((sum, o) => sum + (o.dealing_price || 0), 0);
    const previousRevenue = previousOrders
      .filter(o => o.status === 'completed' && o.dealing_price)
      .reduce((sum, o) => sum + (o.dealing_price || 0), 0);
    
    const revenueGrowth = this.calculateGrowthRate(recentRevenue, previousRevenue);

    // Vendor growth
    const activeVendors = vendors.filter(v => v.is_active).length;
    const vendorGrowth = vendors.length > 0 ? (activeVendors / vendors.length) * 100 : 0;

    // Performance metrics
    const completedOrdersWithTime = orders.filter(o => 
      o.status === 'completed' && o.created_at && o.completed_at
    );
    
    const averageCompletionTime = this.calculateAverageCompletionTime(completedOrdersWithTime);
    const customerSatisfaction = this.calculateCustomerSatisfaction(orders);
    const vendorUtilization = this.calculateVendorUtilization(vendors, orders);

    // Recent activity
    const recentActivity = orders
      .slice(0, 10)
      .map(order => ({
        order_id: order.order_id,
        customer_name: order.customer_name,
        vendor_name: order.user_profiles?.full_name || 'Unassigned',
        service_type: order.service_type,
        status: order.status,
        amount: order.dealing_price || order.estimated_value || 0,
        created_at: order.created_at,
      }));

    // Chart data
    const revenueChart = this.generateRevenueChart(orders);
    const serviceDistribution = this.calculateServiceDistribution(orders);
    const vendorPerformance = this.calculateVendorPerformance(orders, vendors);
    const hourlyDistribution = this.calculateHourlyDistribution(orders);
    const dailyTrends = this.generateDailyTrends(orders);

    return {
      total_orders: totalOrders,
      active_orders: activeOrders,
      completed_orders: completedOrders,
      total_revenue: totalRevenue,
      orders_growth: ordersGrowth,
      revenue_growth: revenueGrowth,
      vendor_growth: vendorGrowth,
      average_completion_time: averageCompletionTime,
      customer_satisfaction: customerSatisfaction,
      vendor_utilization: vendorUtilization,
      recent_orders: recentActivity,
      revenue_chart: revenueChart,
      service_distribution: serviceDistribution,
      vendor_performance: vendorPerformance,
      hourly_distribution: hourlyDistribution,
      daily_trends: dailyTrends,
    };
  }

  /**
   * Calculate growth rate percentage
   */
  private calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Calculate average completion time in hours
   */
  private calculateAverageCompletionTime(completedOrders: any[]): number {
    if (completedOrders.length === 0) return 0;

    const totalTime = completedOrders.reduce((sum, order) => {
      const start = new Date(order.created_at);
      const end = new Date(order.completed_at);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);

    return totalTime / completedOrders.length;
  }

  /**
   * Calculate customer satisfaction from ratings
   */
  private calculateCustomerSatisfaction(orders: any[]): number {
    const ordersWithRatings = orders.filter(o => o.customer_rating);
    if (ordersWithRatings.length === 0) return 0;

    const totalRating = ordersWithRatings.reduce((sum, o) => sum + (o.customer_rating || 0), 0);
    return totalRating / ordersWithRatings.length;
  }

  /**
   * Calculate vendor utilization percentage
   */
  private calculateVendorUtilization(vendors: any[], orders: any[]): number {
    if (vendors.length === 0) return 0;

    const activeVendors = new Set();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    orders
      .filter(o => new Date(o.created_at) >= thirtyDaysAgo && o.vendor_id)
      .forEach(o => activeVendors.add(o.vendor_id));

    return (activeVendors.size / vendors.length) * 100;
  }

  /**
   * Generate revenue chart data for last 30 days
   */
  private generateRevenueChart(orders: any[]): Array<{date: string; revenue: number; orders: number}> {
    const chartData = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayOrders = orders.filter(o => {
        const orderDate = new Date(o.created_at).toISOString().split('T')[0];
        return orderDate === dateStr;
      });

      const dayRevenue = dayOrders
        .filter(o => o.status === 'completed' && o.dealing_price)
        .reduce((sum, o) => sum + (o.dealing_price || 0), 0);

      chartData.push({
        date: dateStr,
        revenue: dayRevenue,
        orders: dayOrders.length,
      });
    }

    return chartData;
  }

  /**
   * Calculate service type distribution
   */
  private calculateServiceDistribution(orders: any[]): Array<{
    service_type: string;
    count: number;
    revenue: number;
    percentage: number;
  }> {
    const serviceMap = new Map();
    const totalOrders = orders.length;

    orders.forEach(order => {
      const serviceType = order.service_type;
      const revenue = (order.status === 'completed' && order.dealing_price) ? order.dealing_price : 0;

      if (serviceMap.has(serviceType)) {
        const existing = serviceMap.get(serviceType);
        existing.count += 1;
        existing.revenue += revenue;
      } else {
        serviceMap.set(serviceType, {
          service_type: serviceType,
          count: 1,
          revenue: revenue,
          percentage: 0,
        });
      }
    });

    // Calculate percentages
    const result = Array.from(serviceMap.values());
    result.forEach(item => {
      item.percentage = totalOrders > 0 ? (item.count / totalOrders) * 100 : 0;
    });

    return result.sort((a, b) => b.count - a.count);
  }

  /**
   * Calculate vendor performance metrics
   */
  private calculateVendorPerformance(orders: any[], vendors: any[]): Array<{
    vendor_id: string;
    vendor_name: string;
    total_orders: number;
    completed_orders: number;
    completion_rate: number;
    average_rating: number;
    total_revenue: number;
  }> {
    const vendorMap = new Map();

    // Initialize with all vendors
    vendors.forEach(vendor => {
      vendorMap.set(vendor.id, {
        vendor_id: vendor.id,
        vendor_name: vendor.full_name,
        total_orders: 0,
        completed_orders: 0,
        completion_rate: 0,
        average_rating: 0,
        total_revenue: 0,
        ratings: [],
      });
    });

    // Process orders
    orders.forEach(order => {
      if (order.vendor_id && vendorMap.has(order.vendor_id)) {
        const vendor = vendorMap.get(order.vendor_id);
        vendor.total_orders += 1;

        if (order.status === 'completed') {
          vendor.completed_orders += 1;
          vendor.total_revenue += order.dealing_price || 0;
        }

        if (order.vendor_rating) {
          vendor.ratings.push(order.vendor_rating);
        }
      }
    });

    // Calculate final metrics
    const result = Array.from(vendorMap.values()).map(vendor => {
      vendor.completion_rate = vendor.total_orders > 0 
        ? (vendor.completed_orders / vendor.total_orders) * 100 
        : 0;
      
      vendor.average_rating = vendor.ratings.length > 0
        ? vendor.ratings.reduce((sum, rating) => sum + rating, 0) / vendor.ratings.length
        : 0;

      delete vendor.ratings; // Remove temporary field
      return vendor;
    });

    return result.sort((a, b) => b.total_revenue - a.total_revenue);
  }

  /**
   * Calculate hourly distribution of orders
   */
  private calculateHourlyDistribution(orders: any[]): Array<{hour: number; orders: number}> {
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({ hour, orders: 0 }));

    orders.forEach(order => {
      const hour = new Date(order.created_at).getHours();
      hourlyData[hour].orders += 1;
    });

    return hourlyData;
  }

  /**
   * Generate daily trends for the last 7 days
   */
  private generateDailyTrends(orders: any[]): Array<{day: string; orders: number; revenue: number}> {
    const trends = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

      const dayOrders = orders.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate.toDateString() === date.toDateString();
      });

      const dayRevenue = dayOrders
        .filter(o => o.status === 'completed' && o.dealing_price)
        .reduce((sum, o) => sum + (o.dealing_price || 0), 0);

      trends.push({
        day: dayName,
        orders: dayOrders.length,
        revenue: dayRevenue,
      });
    }

    return trends;
  }
}

export const dashboardAnalyticsService = new DashboardAnalyticsService();
export default dashboardAnalyticsService;
