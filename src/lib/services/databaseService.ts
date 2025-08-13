/**
 * Enhanced Database Service with Real-Time Integration
 * Connects to Supabase for real-time order tracking and vendor management
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Order, VendorProfile, TriggerPoint, ConversationData } from '../database/unifiedSchema';

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your_supabase_url_here';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_supabase_service_key_here';

export interface OrderFilters {
  status?: string;
  vendor_id?: string;
  customer_name?: string;
  service_type?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface VendorOrderHistory {
  vendor_id: string;
  vendor_name: string;
  total_orders: number;
  completed_orders: number;
  pending_orders: number;
  cancelled_orders: number;
  average_rating: number;
  total_earnings: number;
  recent_orders: Order[];
}

class DatabaseService {
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
      if (error) throw error;
      
      this.isInitialized = true;
      console.log('✅ Database service initialized');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  // ==========================================
  // ORDER MANAGEMENT
  // ==========================================

  /**
   * Get all orders with filtering and pagination
   */
  async getOrders(filters: OrderFilters = {}): Promise<Order[]> {
    try {
      let query = this.supabase
        .from('orders')
        .select(`
          *,
          vendor:user_profiles!orders_vendor_id_fkey(
            id,
            full_name,
            phone,
            email,
            avatar_url
          ),
          trigger_point:trigger_points!orders_trigger_point_id_fkey(
            id,
            trigger_name,
            business_name,
            location,
            work_needed,
            service_type
          ),
          conversation:conversations!orders_conversation_id_fkey(
            id,
            conversation_data,
            analysis_result
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.vendor_id) {
        query = query.eq('vendor_id', filters.vendor_id);
      }
      if (filters.customer_name) {
        query = query.ilike('customer_name', `%${filters.customer_name}%`);
      }
      if (filters.service_type) {
        query = query.eq('service_type', filters.service_type);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  /**
   * Create new order from vendor selection agent
   */
  async createOrder(orderData: {
    business_name: string;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    customer_address: string;
    customer_location?: { latitude: number; longitude: number };
    service_type: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    estimated_value: number;
    selected_vendors: string[];
    conversation_id?: string;
    trigger_point_id?: string;
    user_id: string;
    price_package?: string;
    scheduled_date?: string;
  }): Promise<Order> {
    try {
      const order_id = `ORD${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      const newOrder = {
        order_id,
        business_name: orderData.business_name,
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        customer_email: orderData.customer_email,
        customer_address: orderData.customer_address,
        customer_location: orderData.customer_location,
        service_type: orderData.service_type,
        description: orderData.description,
        priority: orderData.priority,
        estimated_value: orderData.estimated_value,
        status: 'new' as const,
        assigned_vendors: orderData.selected_vendors,
        conversation_id: orderData.conversation_id,
        trigger_point_id: orderData.trigger_point_id,
        user_id: orderData.user_id,
        price_package: orderData.price_package,
        scheduled_date: orderData.scheduled_date,
        created_by_role: 'agent',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await this.supabase
        .from('orders')
        .insert(newOrder)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Order created: ${order_id}`);
      return data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  /**
   * Update order status (vendor app integration)
   */
  async updateOrderStatus(
    orderId: string,
    status: string,
    vendorId?: string,
    additionalData: any = {}
  ): Promise<Order> {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
        updated_by_role: vendorId ? 'vendor' : 'admin',
        ...additionalData,
      };

      // Add vendor assignment if accepting order
      if (status === 'accepted' && vendorId) {
        updateData.vendor_id = vendorId;
        updateData.assigned_at = new Date().toISOString();
      }

      // Add status-specific timestamps
      if (status === 'on_way') {
        updateData.on_way_at = new Date().toISOString();
      } else if (status === 'processing') {
        updateData.processing_at = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await this.supabase
        .from('orders')
        .update(updateData)
        .eq('order_id', orderId)
        .select(`
          *,
          vendor:user_profiles!orders_vendor_id_fkey(
            id,
            full_name,
            phone,
            email,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      console.log(`✅ Order ${orderId} status updated to: ${status}`);
      return data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  /**
   * Update order pricing and invoice data
   */
  async updateOrderPricing(
    orderId: string,
    dealingPrice: number,
    invoiceData: any = {}
  ): Promise<Order> {
    try {
      const { data, error } = await this.supabase
        .from('orders')
        .update({
          dealing_price: dealingPrice,
          invoice: invoiceData,
          updated_at: new Date().toISOString(),
          updated_by_role: 'vendor',
        })
        .eq('order_id', orderId)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Order ${orderId} pricing updated: ₹${dealingPrice}`);
      return data;
    } catch (error) {
      console.error('Error updating order pricing:', error);
      throw error;
    }
  }

  /**
   * Update order images (before/after)
   */
  async updateOrderImages(
    orderId: string,
    beforeImageUrl?: string,
    afterImageUrl?: string
  ): Promise<Order> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
        updated_by_role: 'vendor',
      };

      if (beforeImageUrl) updateData.before_image_url = beforeImageUrl;
      if (afterImageUrl) updateData.after_image_url = afterImageUrl;

      const { data, error } = await this.supabase
        .from('orders')
        .update(updateData)
        .eq('order_id', orderId)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Order ${orderId} images updated`);
      return data;
    } catch (error) {
      console.error('Error updating order images:', error);
      throw error;
    }
  }

  // ==========================================
  // VENDOR MANAGEMENT
  // ==========================================

  /**
   * Get vendor order history and performance metrics
   */
  async getVendorOrderHistory(vendorId: string): Promise<VendorOrderHistory> {
    try {
      // Get vendor profile
      const { data: vendor, error: vendorError } = await this.supabase
        .from('user_profiles')
        .select('id, full_name, phone, email, avatar_url, orders_stats')
        .eq('id', vendorId)
        .eq('role', 'vendor')
        .single();

      if (vendorError) throw vendorError;

      // Get vendor orders
      const { data: orders, error: ordersError } = await this.supabase
        .from('orders')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Calculate metrics
      const totalOrders = orders.length;
      const completedOrders = orders.filter(o => o.status === 'completed').length;
      const pendingOrders = orders.filter(o => ['accepted', 'on_way', 'processing'].includes(o.status)).length;
      const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
      const totalEarnings = orders
        .filter(o => o.status === 'completed' && o.dealing_price)
        .reduce((sum, o) => sum + (o.dealing_price || 0), 0);

      return {
        vendor_id: vendorId,
        vendor_name: vendor.full_name,
        total_orders: totalOrders,
        completed_orders: completedOrders,
        pending_orders: pendingOrders,
        cancelled_orders: cancelledOrders,
        average_rating: vendor.orders_stats?.average_rating || 0,
        total_earnings: totalEarnings,
        recent_orders: orders.slice(0, 10), // Last 10 orders
      };
    } catch (error) {
      console.error('Error fetching vendor order history:', error);
      throw error;
    }
  }

  /**
   * Get available vendors for order assignment
   */
  async getAvailableVendors(serviceType?: string): Promise<VendorProfile[]> {
    try {
      let query = this.supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'vendor')
        .eq('is_active', true)
        .eq('is_online', true);

      if (serviceType) {
        query = query.contains('services', [serviceType]);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching available vendors:', error);
      throw error;
    }
  }

  // ==========================================
  // REAL-TIME SUBSCRIPTIONS
  // ==========================================

  /**
   * Subscribe to order updates for real-time tracking
   */
  subscribeToOrderUpdates(callback: (payload: any) => void) {
    return this.supabase
      .channel('order_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        callback
      )
      .subscribe();
  }

  /**
   * Subscribe to new orders for vendor notifications
   */
  subscribeToNewOrders(callback: (payload: any) => void) {
    return this.supabase
      .channel('new_orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        callback
      )
      .subscribe();
  }

  /**
   * Unsubscribe from real-time channel
   */
  unsubscribe(subscription: any) {
    if (subscription) {
      this.supabase.removeChannel(subscription);
    }
  }

  // ==========================================
  // CONVERSATION & TRIGGER POINT INTEGRATION
  // ==========================================

  /**
   * Save conversation data from calling agents
   */
  async saveConversationData(conversationData: {
    conversation_id: string;
    user_id: string;
    calling_system: string;
    conversation_data: any;
    analysis_result: any;
    triggers_detected: string[];
    vendor_selection_triggered: boolean;
    vendor_selection_result?: any;
    processing_time_ms: number;
  }): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('conversations')
        .insert({
          ...conversationData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      console.log(`✅ Conversation data saved: ${conversationData.conversation_id}`);
    } catch (error) {
      console.error('Error saving conversation data:', error);
      throw error;
    }
  }

  /**
   * Save trigger point data from vendor selection agent
   */
  async saveTriggerPointData(triggerData: {
    trigger_id: string;
    trigger_name: string;
    business_name: string;
    location: string;
    work_needed: string;
    service_type: string;
    selected_vendors: string[];
    vendor_count: number;
    estimated_value: number;
    price_package?: string;
    conversation_id?: string;
    user_id: string;
  }): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('trigger_points')
        .insert({
          ...triggerData,
          status: 'active',
          triggered_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by_role: 'agent',
        });

      if (error) throw error;

      console.log(`✅ Trigger point data saved: ${triggerData.trigger_id}`);
    } catch (error) {
      console.error('Error saving trigger point data:', error);
      throw error;
    }
  }
}

export const databaseService = new DatabaseService();
export default databaseService;
