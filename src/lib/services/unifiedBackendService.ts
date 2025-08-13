/**
 * Unified Backend Service
 * Single service layer serving both Admin App and Vendor App
 * Implements role-based access control and data synchronization
 */

import { User, Order, Conversation, TriggerPoint, Referral, VendorResponse, VendorNotification, APIConfiguration } from '../database/unifiedSchema';

export class UnifiedBackendService {
  private static instance: UnifiedBackendService;

  static getInstance(): UnifiedBackendService {
    if (!UnifiedBackendService.instance) {
      UnifiedBackendService.instance = new UnifiedBackendService();
    }
    return UnifiedBackendService.instance;
  }

  // ===== ADMIN APP SERVICES =====

  /**
   * Admin: Create conversation record
   */
  async createConversation(
    userId: string,
    conversationData: Partial<Conversation>
  ): Promise<Conversation> {
    try {
      const conversation: Conversation = {
        id: this.generateId(),
        conversation_id: conversationData.conversation_id || this.generateConversationId(),
        user_id: userId,
        calling_system: conversationData.calling_system || 'elevenlabs',
        conversation_data: conversationData.conversation_data || {},
        analysis_result: conversationData.analysis_result || {},
        triggers_detected: conversationData.triggers_detected || [],
        vendor_selection_triggered: conversationData.vendor_selection_triggered || false,
        vendor_selection_result: conversationData.vendor_selection_result,
        processing_time_ms: conversationData.processing_time_ms || 0,
        cache_status: conversationData.cache_status || 'miss',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to database
      await this.saveToDatabase('conversations', conversation);
      
      console.log(`💾 Admin: Conversation created ${conversation.conversation_id}`);
      return conversation;

    } catch (error) {
      console.error('Create conversation error:', error);
      throw error;
    }
  }

  /**
   * Admin: Create trigger point from conversation analysis
   */
  async createTriggerPoint(
    userId: string,
    triggerData: Partial<TriggerPoint>
  ): Promise<TriggerPoint> {
    try {
      const triggerPoint: TriggerPoint = {
        id: this.generateId(),
        trigger_id: triggerData.trigger_id || this.generateTriggerId(),
        trigger_name: triggerData.trigger_name || 'Service Request',
        business_name: triggerData.business_name || '',
        location: triggerData.location || '',
        work_needed: triggerData.work_needed || '',
        service_type: triggerData.service_type || '',
        selected_vendors: triggerData.selected_vendors || [],
        vendor_count: triggerData.vendor_count || 0,
        estimated_value: triggerData.estimated_value || 0,
        price_package: triggerData.price_package || '',
        conversation_id: triggerData.conversation_id || '',
        order_id: triggerData.order_id || '',
        user_id: userId,
        status: 'active',
        triggered_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by_role: 'admin'
      };

      // Save to database
      await this.saveToDatabase('trigger_points', triggerPoint);
      
      console.log(`🎯 Admin: Trigger point created ${triggerPoint.trigger_id}`);
      return triggerPoint;

    } catch (error) {
      console.error('Create trigger point error:', error);
      throw error;
    }
  }

  /**
   * Admin: Create order and assign to vendors
   */
  async createOrder(
    userId: string,
    orderData: Partial<Order>
  ): Promise<Order> {
    try {
      const order: Order = {
        id: this.generateId(),
        order_id: orderData.order_id || this.generateOrderId(),
        customer_name: orderData.customer_name || '',
        customer_phone: orderData.customer_phone || '',
        customer_address: orderData.customer_address || '',
        customer_email: orderData.customer_email,
        service_type: orderData.service_type || 'other',
        description: orderData.description || '',
        priority: orderData.priority || 'medium',
        status: 'new',
        vendor_id: orderData.vendor_id,
        assigned_vendors: orderData.assigned_vendors || [],
        scheduled_date: orderData.scheduled_date,
        created_date: new Date().toISOString(),
        conversation_id: orderData.conversation_id,
        trigger_point_id: orderData.trigger_point_id,
        user_id: userId,
        customer_location: orderData.customer_location,
        estimated_value: orderData.estimated_value,
        created_by_role: 'admin',
        updated_by_role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notifications_sent: {
          customer_email: false,
          customer_sms: false,
          vendor_emails: false,
          vendor_push: false
        }
      };

      // Save to database
      await this.saveToDatabase('orders', order);
      
      // Sync to vendor app (Base44 SDK compatible)
      await this.syncOrderToVendorApp(order);
      
      console.log(`📋 Admin: Order created ${order.order_id} for ${order.service_type} service`);
      return order;

    } catch (error) {
      console.error('Create order error:', error);
      throw error;
    }
  }

  /**
   * Admin: Get vendors for selection (read-only)
   */
  async getVendorsForSelection(
    userId: string,
    filters: {
      service_type?: string;
      location?: { latitude: number; longitude: number; radius: number };
      status?: string;
      is_online?: boolean;
    } = {}
  ): Promise<User[]> {
    try {
      // Build query based on filters
      const query = {
        role: 'vendor',
        status: filters.status || 'active',
        is_online: filters.is_online !== false // Default to true
      };

      // Add service type filter
      if (filters.service_type) {
        // In production: WHERE services @> ARRAY[filters.service_type]
        query['services'] = { contains: filters.service_type };
      }

      // Get vendors from database
      const vendors = await this.queryDatabase('users', query);
      
      // Apply location filtering if specified
      let filteredVendors = vendors;
      if (filters.location) {
        filteredVendors = vendors.filter(vendor => {
          if (!vendor.service_area) return false;
          
          const distance = this.calculateDistance(
            filters.location!.latitude,
            filters.location!.longitude,
            vendor.service_area.latitude,
            vendor.service_area.longitude
          );
          
          return distance <= vendor.service_area.radius;
        });
      }

      console.log(`👥 Admin: Retrieved ${filteredVendors.length} vendors for selection`);
      return filteredVendors;

    } catch (error) {
      console.error('Get vendors for selection error:', error);
      return [];
    }
  }

  // ===== VENDOR APP SERVICES =====

  /**
   * Vendor: Get orders assigned to vendor (Base44 SDK compatible)
   */
  async getVendorOrders(
    vendorId: string,
    filters: {
      status?: string;
      limit?: number;
      offset?: number;
      sort?: string;
    } = {}
  ): Promise<Order[]> {
    try {
      // Build query for vendor's orders
      const query = {
        $or: [
          { vendor_id: vendorId },
          { assigned_vendors: { contains: vendorId } }
        ]
      };

      // Add status filter
      if (filters.status) {
        query['status'] = filters.status;
      }

      // Get orders from database
      const orders = await this.queryDatabase('orders', query, {
        limit: filters.limit || 20,
        offset: filters.offset || 0,
        sort: filters.sort || '-created_date'
      });

      console.log(`📦 Vendor ${vendorId}: Retrieved ${orders.length} orders`);
      return orders;

    } catch (error) {
      console.error('Get vendor orders error:', error);
      return [];
    }
  }

  /**
   * Vendor: Update order status and progress (Base44 SDK compatible)
   */
  async updateOrderByVendor(
    orderId: string,
    vendorId: string,
    updateData: Partial<Order>
  ): Promise<Order> {
    try {
      // Verify vendor has access to this order
      const order = await this.getOrderById(orderId);
      if (!order || (order.vendor_id !== vendorId && !order.assigned_vendors?.includes(vendorId))) {
        throw new Error('Vendor does not have access to this order');
      }

      // Prepare update data with vendor role
      const updates = {
        ...updateData,
        updated_by_role: 'vendor' as const,
        updated_at: new Date().toISOString()
      };

      // If vendor is accepting the order, assign them as primary vendor
      if (updateData.status === 'accepted' && !order.vendor_id) {
        updates.vendor_id = vendorId;
      }

      // Update in database
      const updatedOrder = await this.updateInDatabase('orders', orderId, updates);
      
      // Create vendor response record
      await this.createVendorResponse(vendorId, orderId, {
        action: this.determineActionFromStatus(updateData.status),
        response_data: {
          status: updateData.status,
          dealing_price: updateData.dealing_price,
          before_image_url: updateData.before_image_url,
          after_image_url: updateData.after_image_url,
          notes: updateData.description
        }
      });

      console.log(`🔄 Vendor ${vendorId}: Updated order ${orderId} status to ${updateData.status}`);
      return updatedOrder;

    } catch (error) {
      console.error('Update order by vendor error:', error);
      throw error;
    }
  }

  /**
   * Vendor: Get and update profile (Base44 SDK compatible)
   */
  async getVendorProfile(vendorId: string): Promise<User> {
    try {
      const vendor = await this.getById('users', vendorId);
      if (!vendor || vendor.role !== 'vendor') {
        throw new Error('Vendor not found');
      }

      console.log(`👤 Vendor ${vendorId}: Profile retrieved`);
      return vendor;

    } catch (error) {
      console.error('Get vendor profile error:', error);
      throw error;
    }
  }

  /**
   * Vendor: Update profile (Base44 SDK compatible)
   */
  async updateVendorProfile(
    vendorId: string,
    profileData: Partial<User>
  ): Promise<User> {
    try {
      // Prepare update data with vendor role
      const updates = {
        ...profileData,
        updated_by_role: 'vendor' as const,
        updated_at: new Date().toISOString()
      };

      // Update in database
      const updatedVendor = await this.updateInDatabase('users', vendorId, updates);
      
      console.log(`👤 Vendor ${vendorId}: Profile updated`);
      return updatedVendor;

    } catch (error) {
      console.error('Update vendor profile error:', error);
      throw error;
    }
  }

  /**
   * Vendor: Create referral code
   */
  async createReferralCode(
    vendorId: string,
    referralData: Partial<Referral>
  ): Promise<Referral> {
    try {
      const referral: Referral = {
        id: this.generateId(),
        referral_code: referralData.referral_code || this.generateReferralCode(),
        is_valid: true,
        created_by: vendorId,
        usage_limit: referralData.usage_limit || 1,
        used_count: 0,
        expires_at: referralData.expires_at,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to database
      await this.saveToDatabase('referrals', referral);
      
      console.log(`🎫 Vendor ${vendorId}: Referral code created ${referral.referral_code}`);
      return referral;

    } catch (error) {
      console.error('Create referral code error:', error);
      throw error;
    }
  }

  // ===== SHARED SERVICES =====

  /**
   * Sync order to vendor app (Base44 SDK compatible)
   */
  private async syncOrderToVendorApp(order: Order): Promise<void> {
    try {
      // In production, this would sync with Base44 SDK
      /*
      await base44SDK.Order.create({
        order_id: order.order_id,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        customer_address: order.customer_address,
        service_type: order.service_type,
        description: order.description,
        status: order.status,
        priority: order.priority,
        scheduled_date: order.scheduled_date,
        created_date: order.created_date,
        vendor_id: order.vendor_id
      });
      */

      console.log(`🔄 Order ${order.order_id} synced to vendor app`);

    } catch (error) {
      console.error('Sync order to vendor app error:', error);
    }
  }

  /**
   * Create vendor response record
   */
  private async createVendorResponse(
    vendorId: string,
    orderId: string,
    responseData: Partial<VendorResponse>
  ): Promise<VendorResponse> {
    try {
      const response: VendorResponse = {
        id: this.generateId(),
        vendor_id: vendorId,
        order_id: orderId,
        action: responseData.action || 'status_update',
        response_data: responseData.response_data || {},
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await this.saveToDatabase('vendor_responses', response);
      return response;

    } catch (error) {
      console.error('Create vendor response error:', error);
      throw error;
    }
  }

  // ===== UTILITY METHODS =====

  private generateId(): string {
    return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private generateTriggerId(): string {
    return `trigger_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private generateOrderId(): string {
    return `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private generateReferralCode(): string {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI/180);
  }

  private determineActionFromStatus(status?: string): VendorResponse['action'] {
    switch (status) {
      case 'accepted': return 'accept';
      case 'cancelled': return 'decline';
      case 'completed': return 'complete';
      default: return 'status_update';
    }
  }

  // Database abstraction methods (implement with your chosen database)
  private async saveToDatabase(table: string, data: any): Promise<void> {
    // Implementation depends on your database choice
    console.log(`💾 Saving to ${table}:`, data.id);
  }

  private async queryDatabase(table: string, query: any, options?: any): Promise<any[]> {
    // Implementation depends on your database choice
    console.log(`🔍 Querying ${table} with:`, query);
    return [];
  }

  private async getById(table: string, id: string): Promise<any> {
    // Implementation depends on your database choice
    console.log(`🔍 Getting ${table} by ID:`, id);
    return null;
  }

  private async updateInDatabase(table: string, id: string, updates: any): Promise<any> {
    // Implementation depends on your database choice
    console.log(`🔄 Updating ${table} ${id}:`, updates);
    return updates;
  }

  private async getOrderById(orderId: string): Promise<Order | null> {
    // Implementation depends on your database choice
    console.log(`🔍 Getting order by ID:`, orderId);
    return null;
  }
}

// Export singleton instance
export const unifiedBackend = UnifiedBackendService.getInstance();
