/**
 * Vendor Performance Analytics Service
 * Advanced analytics for individual vendor performance with Python-like calculations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your_supabase_url_here';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_supabase_service_key_here';

export interface VendorPerformanceMetrics {
  vendor_id: string;
  vendor_name: string;
  vendor_email: string;
  vendor_phone: string;
  
  // Basic metrics
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  pending_orders: number;
  
  // Performance rates
  completion_rate: number; // Percentage
  cancellation_rate: number; // Percentage
  acceptance_rate: number; // Percentage
  
  // Financial metrics
  total_revenue: number;
  average_order_value: number;
  revenue_growth: number; // Percentage change from last period
  
  // Time metrics
  average_response_time: number; // In minutes
  average_completion_time: number; // In hours
  on_time_delivery_rate: number; // Percentage
  
  // Customer satisfaction
  average_rating: number;
  total_reviews: number;
  customer_satisfaction_trend: number; // Percentage change
  
  // Activity metrics
  orders_this_month: number;
  orders_last_month: number;
  active_days: number; // Days active in last 30 days
  utilization_rate: number; // Percentage of time working
  
  // Trend data
  monthly_performance: Array<{
    month: string;
    orders: number;
    revenue: number;
    rating: number;
  }>;
  
  service_breakdown: Array<{
    service_type: string;
    orders: number;
    revenue: number;
    avg_rating: number;
  }>;
  
  recent_orders: Array<{
    order_id: string;
    customer_name: string;
    service_type: string;
    status: string;
    amount: number;
    completed_at?: string;
    rating?: number;
  }>;
  
  // Performance ranking
  rank_by_revenue: number;
  rank_by_orders: number;
  rank_by_rating: number;
  overall_rank: number;
}

class VendorPerformanceAnalyticsService {
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
      console.log('✅ Vendor Performance Analytics Service initialized');
    } catch (error) {
      console.error('❌ Vendor Performance Analytics Service initialization failed:', error);
      throw error;
    }
  }

  // ==========================================
  // MAIN ANALYTICS GENERATION
  // ==========================================

  /**
   * Get comprehensive performance analytics for a specific vendor
   */
  async getVendorPerformanceAnalytics(vendorId: string, userId: string): Promise<VendorPerformanceMetrics> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log(`📊 Generating performance analytics for vendor: ${vendorId}`);

      // Fetch vendor information
      const { data: vendor, error: vendorError } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', vendorId)
        .eq('user_id', userId) // Ensure vendor belongs to this user
        .single();

      if (vendorError) throw vendorError;
      if (!vendor) throw new Error('Vendor not found or access denied');

      // Fetch all orders for this vendor
      const { data: orders, error: ordersError } = await this.supabase
        .from('orders')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Calculate comprehensive analytics
      const analytics = await this.calculateVendorAnalytics(vendor, orders || []);

      // Get vendor rankings
      const rankings = await this.calculateVendorRankings(vendorId, userId);
      analytics.rank_by_revenue = rankings.revenue_rank;
      analytics.rank_by_orders = rankings.orders_rank;
      analytics.rank_by_rating = rankings.rating_rank;
      analytics.overall_rank = rankings.overall_rank;

      console.log(`✅ Performance analytics generated for vendor: ${vendor.full_name}`);
      return analytics;
    } catch (error) {
      console.error('Error generating vendor performance analytics:', error);
      throw error;
    }
  }

  /**
   * Get performance analytics for all vendors of a user
   */
  async getAllVendorsPerformanceAnalytics(userId: string): Promise<VendorPerformanceMetrics[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Fetch all vendors for this user
      const { data: vendors, error: vendorsError } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'vendor');

      if (vendorsError) throw vendorsError;

      // Generate analytics for each vendor
      const analyticsPromises = (vendors || []).map(vendor => 
        this.getVendorPerformanceAnalytics(vendor.id, userId)
      );

      const allAnalytics = await Promise.all(analyticsPromises);

      return allAnalytics.sort((a, b) => b.total_revenue - a.total_revenue);
    } catch (error) {
      console.error('Error generating all vendors performance analytics:', error);
      throw error;
    }
  }

  // ==========================================
  // ANALYTICS CALCULATIONS
  // ==========================================

  /**
   * Calculate comprehensive vendor analytics using statistical methods
   */
  private async calculateVendorAnalytics(vendor: any, orders: any[]): Promise<VendorPerformanceMetrics> {
    // Basic counts
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
    const pendingOrders = orders.filter(o => ['assigned', 'accepted', 'on_way', 'processing'].includes(o.status)).length;

    // Performance rates
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
    const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;
    const acceptanceRate = this.calculateAcceptanceRate(orders);

    // Financial metrics
    const completedOrdersWithPrice = orders.filter(o => o.status === 'completed' && o.dealing_price);
    const totalRevenue = completedOrdersWithPrice.reduce((sum, o) => sum + (o.dealing_price || 0), 0);
    const averageOrderValue = completedOrdersWithPrice.length > 0 
      ? totalRevenue / completedOrdersWithPrice.length 
      : 0;

    // Revenue growth calculation
    const revenueGrowth = this.calculateRevenueGrowth(orders);

    // Time metrics
    const averageResponseTime = this.calculateAverageResponseTime(orders);
    const averageCompletionTime = this.calculateAverageCompletionTime(orders);
    const onTimeDeliveryRate = this.calculateOnTimeDeliveryRate(orders);

    // Customer satisfaction
    const ordersWithRating = orders.filter(o => o.customer_rating);
    const averageRating = ordersWithRating.length > 0
      ? ordersWithRating.reduce((sum, o) => sum + (o.customer_rating || 0), 0) / ordersWithRating.length
      : 0;
    const totalReviews = ordersWithRating.length;
    const customerSatisfactionTrend = this.calculateSatisfactionTrend(orders);

    // Activity metrics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const ordersThisMonth = orders.filter(o => new Date(o.created_at) >= thirtyDaysAgo).length;
    
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const ordersLastMonth = orders.filter(o => {
      const orderDate = new Date(o.created_at);
      return orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo;
    }).length;

    const activeDays = this.calculateActiveDays(orders);
    const utilizationRate = this.calculateUtilizationRate(orders);

    // Trend data
    const monthlyPerformance = this.generateMonthlyPerformance(orders);
    const serviceBreakdown = this.calculateServiceBreakdown(orders);
    const recentOrders = this.getRecentOrdersData(orders);

    return {
      vendor_id: vendor.id,
      vendor_name: vendor.full_name,
      vendor_email: vendor.email,
      vendor_phone: vendor.phone,
      total_orders: totalOrders,
      completed_orders: completedOrders,
      cancelled_orders: cancelledOrders,
      pending_orders: pendingOrders,
      completion_rate: completionRate,
      cancellation_rate: cancellationRate,
      acceptance_rate: acceptanceRate,
      total_revenue: totalRevenue,
      average_order_value: averageOrderValue,
      revenue_growth: revenueGrowth,
      average_response_time: averageResponseTime,
      average_completion_time: averageCompletionTime,
      on_time_delivery_rate: onTimeDeliveryRate,
      average_rating: averageRating,
      total_reviews: totalReviews,
      customer_satisfaction_trend: customerSatisfactionTrend,
      orders_this_month: ordersThisMonth,
      orders_last_month: ordersLastMonth,
      active_days: activeDays,
      utilization_rate: utilizationRate,
      monthly_performance: monthlyPerformance,
      service_breakdown: serviceBreakdown,
      recent_orders: recentOrders,
      rank_by_revenue: 0, // Will be calculated separately
      rank_by_orders: 0,
      rank_by_rating: 0,
      overall_rank: 0,
    };
  }

  /**
   * Calculate acceptance rate (orders accepted vs declined)
   */
  private calculateAcceptanceRate(orders: any[]): number {
    const assignedOrders = orders.filter(o => o.status !== 'new' && o.status !== 'vendor_selection');
    const acceptedOrders = orders.filter(o => ['accepted', 'on_way', 'processing', 'completed'].includes(o.status));
    
    return assignedOrders.length > 0 ? (acceptedOrders.length / assignedOrders.length) * 100 : 0;
  }

  /**
   * Calculate revenue growth compared to previous period
   */
  private calculateRevenueGrowth(orders: any[]): number {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentRevenue = orders
      .filter(o => o.status === 'completed' && o.dealing_price && new Date(o.completed_at) >= thirtyDaysAgo)
      .reduce((sum, o) => sum + (o.dealing_price || 0), 0);

    const previousRevenue = orders
      .filter(o => {
        const completedDate = new Date(o.completed_at);
        return o.status === 'completed' && o.dealing_price && 
               completedDate >= sixtyDaysAgo && completedDate < thirtyDaysAgo;
      })
      .reduce((sum, o) => sum + (o.dealing_price || 0), 0);

    return previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
  }

  /**
   * Calculate average response time in minutes
   */
  private calculateAverageResponseTime(orders: any[]): number {
    const ordersWithResponse = orders.filter(o => o.assigned_at && o.accepted_at);
    
    if (ordersWithResponse.length === 0) return 0;

    const totalResponseTime = ordersWithResponse.reduce((sum, order) => {
      const assigned = new Date(order.assigned_at);
      const accepted = new Date(order.accepted_at);
      const responseTime = (accepted.getTime() - assigned.getTime()) / (1000 * 60); // minutes
      return sum + responseTime;
    }, 0);

    return totalResponseTime / ordersWithResponse.length;
  }

  /**
   * Calculate average completion time in hours
   */
  private calculateAverageCompletionTime(orders: any[]): number {
    const completedOrders = orders.filter(o => o.status === 'completed' && o.accepted_at && o.completed_at);
    
    if (completedOrders.length === 0) return 0;

    const totalCompletionTime = completedOrders.reduce((sum, order) => {
      const accepted = new Date(order.accepted_at);
      const completed = new Date(order.completed_at);
      const completionTime = (completed.getTime() - accepted.getTime()) / (1000 * 60 * 60); // hours
      return sum + completionTime;
    }, 0);

    return totalCompletionTime / completedOrders.length;
  }

  /**
   * Calculate on-time delivery rate
   */
  private calculateOnTimeDeliveryRate(orders: any[]): number {
    const completedOrders = orders.filter(o => o.status === 'completed');
    if (completedOrders.length === 0) return 0;

    // Assume orders should be completed within 24 hours of acceptance
    const onTimeOrders = completedOrders.filter(order => {
      if (!order.accepted_at || !order.completed_at) return false;
      
      const accepted = new Date(order.accepted_at);
      const completed = new Date(order.completed_at);
      const hoursToComplete = (completed.getTime() - accepted.getTime()) / (1000 * 60 * 60);
      
      return hoursToComplete <= 24; // On time if completed within 24 hours
    });

    return (onTimeOrders.length / completedOrders.length) * 100;
  }

  /**
   * Calculate customer satisfaction trend
   */
  private calculateSatisfactionTrend(orders: any[]): number {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRatings = orders
      .filter(o => o.customer_rating && new Date(o.completed_at) >= thirtyDaysAgo)
      .map(o => o.customer_rating);

    const olderRatings = orders
      .filter(o => o.customer_rating && new Date(o.completed_at) < thirtyDaysAgo)
      .map(o => o.customer_rating);

    if (recentRatings.length === 0 || olderRatings.length === 0) return 0;

    const recentAvg = recentRatings.reduce((sum, rating) => sum + rating, 0) / recentRatings.length;
    const olderAvg = olderRatings.reduce((sum, rating) => sum + rating, 0) / olderRatings.length;

    return ((recentAvg - olderAvg) / olderAvg) * 100;
  }

  /**
   * Calculate active days in last 30 days
   */
  private calculateActiveDays(orders: any[]): number {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeDates = new Set();
    orders
      .filter(o => new Date(o.created_at) >= thirtyDaysAgo)
      .forEach(order => {
        const date = new Date(order.created_at).toDateString();
        activeDates.add(date);
      });

    return activeDates.size;
  }

  /**
   * Calculate utilization rate
   */
  private calculateUtilizationRate(orders: any[]): number {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const workingOrders = orders.filter(o => 
      ['accepted', 'on_way', 'processing'].includes(o.status) ||
      (o.status === 'completed' && new Date(o.completed_at) >= thirtyDaysAgo)
    );

    // Estimate working hours based on order completion times
    const totalWorkingHours = workingOrders.reduce((sum, order) => {
      if (order.accepted_at && order.completed_at) {
        const hours = (new Date(order.completed_at).getTime() - new Date(order.accepted_at).getTime()) / (1000 * 60 * 60);
        return sum + Math.min(hours, 8); // Cap at 8 hours per order
      }
      return sum + 2; // Estimate 2 hours for incomplete orders
    }, 0);

    const totalAvailableHours = 30 * 8; // 30 days * 8 hours per day
    return totalAvailableHours > 0 ? (totalWorkingHours / totalAvailableHours) * 100 : 0;
  }

  /**
   * Generate monthly performance data
   */
  private generateMonthlyPerformance(orders: any[]): Array<{month: string; orders: number; revenue: number; rating: number}> {
    const monthlyData = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= monthStart && orderDate <= monthEnd;
      });

      const monthRevenue = monthOrders
        .filter(o => o.status === 'completed' && o.dealing_price)
        .reduce((sum, o) => sum + (o.dealing_price || 0), 0);

      const monthRatings = monthOrders.filter(o => o.customer_rating);
      const avgRating = monthRatings.length > 0
        ? monthRatings.reduce((sum, o) => sum + (o.customer_rating || 0), 0) / monthRatings.length
        : 0;

      monthlyData.push({
        month: monthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        orders: monthOrders.length,
        revenue: monthRevenue,
        rating: avgRating,
      });
    }

    return monthlyData;
  }

  /**
   * Calculate service breakdown
   */
  private calculateServiceBreakdown(orders: any[]): Array<{
    service_type: string;
    orders: number;
    revenue: number;
    avg_rating: number;
  }> {
    const serviceMap = new Map();

    orders.forEach(order => {
      const serviceType = order.service_type;
      const revenue = (order.status === 'completed' && order.dealing_price) ? order.dealing_price : 0;
      const rating = order.customer_rating || 0;

      if (serviceMap.has(serviceType)) {
        const existing = serviceMap.get(serviceType);
        existing.orders += 1;
        existing.revenue += revenue;
        existing.ratings.push(rating);
      } else {
        serviceMap.set(serviceType, {
          service_type: serviceType,
          orders: 1,
          revenue: revenue,
          ratings: rating > 0 ? [rating] : [],
        });
      }
    });

    return Array.from(serviceMap.values()).map(service => ({
      service_type: service.service_type,
      orders: service.orders,
      revenue: service.revenue,
      avg_rating: service.ratings.length > 0
        ? service.ratings.reduce((sum: number, rating: number) => sum + rating, 0) / service.ratings.length
        : 0,
    }));
  }

  /**
   * Get recent orders data
   */
  private getRecentOrdersData(orders: any[]): Array<{
    order_id: string;
    customer_name: string;
    service_type: string;
    status: string;
    amount: number;
    completed_at?: string;
    rating?: number;
  }> {
    return orders.slice(0, 10).map(order => ({
      order_id: order.order_id,
      customer_name: order.customer_name,
      service_type: order.service_type,
      status: order.status,
      amount: order.dealing_price || order.estimated_value || 0,
      completed_at: order.completed_at,
      rating: order.customer_rating,
    }));
  }

  /**
   * Calculate vendor rankings among all user's vendors
   */
  private async calculateVendorRankings(vendorId: string, userId: string): Promise<{
    revenue_rank: number;
    orders_rank: number;
    rating_rank: number;
    overall_rank: number;
  }> {
    try {
      // This would typically involve complex queries
      // For now, return placeholder rankings
      return {
        revenue_rank: 1,
        orders_rank: 1,
        rating_rank: 1,
        overall_rank: 1,
      };
    } catch (error) {
      console.error('Error calculating vendor rankings:', error);
      return {
        revenue_rank: 0,
        orders_rank: 0,
        rating_rank: 0,
        overall_rank: 0,
      };
    }
  }
}

export const vendorPerformanceAnalyticsService = new VendorPerformanceAnalyticsService();
export default vendorPerformanceAnalyticsService;
