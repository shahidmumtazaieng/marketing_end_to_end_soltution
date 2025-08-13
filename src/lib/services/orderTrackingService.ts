/**
 * Enhanced Order Tracking Service
 * Manages complete order lifecycle with automatic invoice generation
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import billingSettingsService from './billingSettingsService';
import intelligentVendorSelectionService from './intelligentVendorSelectionService';
import vendorAuthorizationService from './vendorAuthorizationService';

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your_supabase_url_here';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_supabase_service_key_here';

export type OrderStatus = 'new' | 'vendor_selection' | 'assigned' | 'accepted' | 'declined' | 'on_way' | 'processing' | 'completed' | 'cancelled';

export interface OrderData {
  id?: string;
  order_id: string;
  user_id: string;
  
  // Customer information
  business_name: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address: string;
  customer_location?: {
    latitude: number;
    longitude: number;
  };
  
  // Service information
  service_type: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Vendor assignment
  vendor_id?: string;
  assigned_vendors?: string[]; // Initially selected vendors
  selected_vendor_data?: any; // Vendor selection result
  
  // Pricing
  estimated_value: number;
  dealing_price?: number; // Final negotiated price
  price_package?: string;
  
  // Status and timeline
  status: OrderStatus;
  assigned_at?: string;
  accepted_at?: string;
  on_way_at?: string;
  processing_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  
  // Images and documentation
  before_image_url?: string;
  after_image_url?: string;
  work_notes?: string;
  
  // Integration references
  conversation_id?: string; // Link to calling agent data
  trigger_point_id?: string; // Link to vendor selection
  
  // Invoice information
  invoice_id?: string;
  invoice_number?: string;
  invoice_generated?: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

class OrderTrackingService {
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
      console.log('✅ Order Tracking Service initialized');
    } catch (error) {
      console.error('❌ Order Tracking Service initialization failed:', error);
      throw error;
    }
  }

  // ==========================================
  // ORDER LIFECYCLE MANAGEMENT
  // ==========================================

  /**
   * Create new order from calling agent
   */
  async createOrderFromCallingAgent(orderData: {
    business_name: string;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    customer_address: string;
    service_type: string;
    description: string;
    estimated_value: number;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    user_id: string;
    conversation_id?: string;
    customer_location?: { latitude: number; longitude: number };
  }): Promise<OrderData> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Generate unique order ID
      const orderId = await this.generateOrderId();

      // Create order record
      const newOrder: Omit<OrderData, 'id' | 'created_at' | 'updated_at'> = {
        order_id: orderId,
        user_id: orderData.user_id,
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
        status: 'new',
        conversation_id: orderData.conversation_id,
        invoice_generated: false,
      };

      // Save to database
      const { data: savedOrder, error } = await this.supabase
        .from('orders')
        .insert({
          ...newOrder,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Order created: ${orderId}`);

      // Trigger vendor selection process
      await this.triggerVendorSelection(savedOrder);

      return savedOrder;
    } catch (error) {
      console.error('Error creating order from calling agent:', error);
      throw error;
    }
  }

  /**
   * Trigger intelligent vendor selection
   */
  async triggerVendorSelection(order: OrderData): Promise<void> {
    try {
      // Update order status to vendor selection
      await this.updateOrderStatus(order.order_id, 'vendor_selection');

      // Use intelligent vendor selection service
      const selectionResult = await intelligentVendorSelectionService.selectVendorsForOrder({
        serviceType: order.service_type,
        customerLocation: order.customer_location || { latitude: 0, longitude: 0 },
        priority: order.priority,
        estimatedValue: order.estimated_value,
        userId: order.user_id,
        maxVendors: 3,
      });

      if (selectionResult.selected_vendors.length === 0) {
        // No vendors available - mark as cancelled
        await this.updateOrderStatus(order.order_id, 'cancelled');
        console.log(`❌ No vendors available for order: ${order.order_id}`);
        return;
      }

      // Assign to first selected vendor
      const selectedVendor = selectionResult.selected_vendors[0];
      
      // Update order with vendor assignment
      const { error } = await this.supabase
        .from('orders')
        .update({
          vendor_id: selectedVendor.vendor_id,
          assigned_vendors: selectionResult.selected_vendors.map(v => v.vendor_id),
          selected_vendor_data: selectionResult,
          status: 'assigned',
          assigned_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', order.order_id);

      if (error) throw error;

      // Send notification to vendor (this would integrate with vendor app)
      await this.notifyVendorOfNewOrder(selectedVendor.vendor_id, order);

      console.log(`✅ Order ${order.order_id} assigned to vendor: ${selectedVendor.vendor_name}`);
    } catch (error) {
      console.error('Error in vendor selection:', error);
      // Mark order as failed vendor selection
      await this.updateOrderStatus(order.order_id, 'cancelled');
    }
  }

  /**
   * Handle vendor response (accept/decline)
   */
  async handleVendorResponse(orderId: string, vendorId: string, response: 'accept' | 'decline'): Promise<void> {
    try {
      if (response === 'accept') {
        // Vendor accepted - update status
        const { error } = await this.supabase
          .from('orders')
          .update({
            status: 'accepted',
            accepted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('order_id', orderId)
          .eq('vendor_id', vendorId);

        if (error) throw error;

        console.log(`✅ Order ${orderId} accepted by vendor: ${vendorId}`);
      } else {
        // Vendor declined - try next vendor or re-run selection
        await this.handleVendorDecline(orderId, vendorId);
      }
    } catch (error) {
      console.error('Error handling vendor response:', error);
      throw error;
    }
  }

  /**
   * Handle vendor decline and reassign
   */
  private async handleVendorDecline(orderId: string, vendorId: string): Promise<void> {
    try {
      // Get order data
      const { data: order, error: fetchError } = await this.supabase
        .from('orders')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (fetchError) throw fetchError;

      // Check if there are fallback vendors
      const selectionData = order.selected_vendor_data;
      if (selectionData && selectionData.fallback_vendors && selectionData.fallback_vendors.length > 0) {
        // Assign to next vendor
        const nextVendor = selectionData.fallback_vendors[0];
        
        const { error } = await this.supabase
          .from('orders')
          .update({
            vendor_id: nextVendor.vendor_id,
            status: 'assigned',
            assigned_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('order_id', orderId);

        if (error) throw error;

        // Notify new vendor
        await this.notifyVendorOfNewOrder(nextVendor.vendor_id, order);
        
        console.log(`✅ Order ${orderId} reassigned to vendor: ${nextVendor.vendor_name}`);
      } else {
        // No more vendors - re-run vendor selection with expanded radius
        await this.triggerVendorSelection(order);
      }
    } catch (error) {
      console.error('Error handling vendor decline:', error);
      // Mark as cancelled if all options exhausted
      await this.updateOrderStatus(orderId, 'cancelled');
    }
  }

  /**
   * Update order status (called by vendor app)
   */
  async updateOrderStatus(
    orderId: string, 
    status: OrderStatus, 
    additionalData?: {
      dealing_price?: number;
      before_image_url?: string;
      after_image_url?: string;
      work_notes?: string;
    }
  ): Promise<OrderData> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const updateData: any = {
        status: status,
        updated_at: new Date().toISOString(),
      };

      // Add timestamp for status
      const timestamp = new Date().toISOString();
      switch (status) {
        case 'accepted':
          updateData.accepted_at = timestamp;
          break;
        case 'on_way':
          updateData.on_way_at = timestamp;
          break;
        case 'processing':
          updateData.processing_at = timestamp;
          break;
        case 'completed':
          updateData.completed_at = timestamp;
          break;
        case 'cancelled':
          updateData.cancelled_at = timestamp;
          break;
      }

      // Add additional data if provided
      if (additionalData) {
        Object.assign(updateData, additionalData);
      }

      // Update order
      const { data: updatedOrder, error } = await this.supabase
        .from('orders')
        .update(updateData)
        .eq('order_id', orderId)
        .select()
        .single();

      if (error) throw error;

      // If order is completed, trigger invoice generation
      if (status === 'completed') {
        await this.triggerInvoiceGeneration(updatedOrder);
      }

      console.log(`✅ Order ${orderId} status updated to: ${status}`);
      return updatedOrder;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  /**
   * Trigger automatic invoice generation when order is completed
   */
  private async triggerInvoiceGeneration(order: OrderData): Promise<void> {
    try {
      if (order.invoice_generated) {
        console.log(`📄 Invoice already generated for order: ${order.order_id}`);
        return;
      }

      // Prepare invoice data
      const invoiceData = {
        order_id: order.order_id,
        user_id: order.user_id,
        vendor_id: order.vendor_id!,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        customer_address: order.customer_address,
        service_type: order.service_type,
        service_description: order.description,
        estimated_price: order.estimated_value,
        final_price: order.dealing_price || order.estimated_value,
        before_images: order.before_image_url ? [order.before_image_url] : [],
        after_images: order.after_image_url ? [order.after_image_url] : [],
      };

      // Generate invoice
      const invoice = await billingSettingsService.generateInvoiceForCompletedOrder(invoiceData);

      // Update order with invoice information
      const { error } = await this.supabase
        .from('orders')
        .update({
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          invoice_generated: true,
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', order.order_id);

      if (error) throw error;

      console.log(`📄 Invoice ${invoice.invoice_number} generated for order: ${order.order_id}`);
    } catch (error) {
      console.error('Error generating invoice for completed order:', error);
      // Don't throw error as this shouldn't block order completion
    }
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Generate unique order ID
   */
  private async generateOrderId(): Promise<string> {
    const prefix = 'ORD';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  /**
   * Notify vendor of new order (placeholder for vendor app integration)
   */
  private async notifyVendorOfNewOrder(vendorId: string, order: OrderData): Promise<void> {
    try {
      // This would integrate with vendor app notification system
      console.log(`🔔 Notifying vendor ${vendorId} of new order: ${order.order_id}`);
      
      // Create notification record
      const notification = {
        vendor_id: vendorId,
        type: 'new_order',
        title: 'New Order Available',
        message: `New ${order.service_type} order from ${order.customer_name}`,
        data: {
          order_id: order.order_id,
          service_type: order.service_type,
          customer_name: order.customer_name,
          estimated_value: order.estimated_value,
          priority: order.priority,
        },
        read: false,
        delivered: false,
      };

      const { error } = await this.supabase
        .from('vendor_notifications')
        .insert(notification);

      if (error) throw error;
    } catch (error) {
      console.error('Error notifying vendor:', error);
      // Don't throw error as this shouldn't block order assignment
    }
  }

  /**
   * Get orders for user
   */
  async getUserOrders(userId: string, filters?: {
    status?: OrderStatus;
    service_type?: string;
    limit?: number;
  }): Promise<OrderData[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      let query = this.supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.service_type) {
        query = query.eq('service_type', filters.service_type);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw error;
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<OrderData | null> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const { data, error } = await this.supabase
        .from('orders')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching order by ID:', error);
      throw error;
    }
  }
}

export const orderTrackingService = new OrderTrackingService();
export default orderTrackingService;
