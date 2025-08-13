/**
 * Mobile App Integration Service
 * Handles real-time communication with vendor mobile apps
 * Manages order notifications, status updates, and vendor responses
 */

export interface VendorAppNotification {
  vendor_id: string;
  notification_type: 'new_order' | 'order_update' | 'order_cancelled' | 'system_message';
  title: string;
  body: string;
  data: {
    order_id: string;
    action_required?: 'accept_or_decline' | 'update_status' | 'upload_images' | 'complete_order';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    expires_at?: string;
    [key: string]: any;
  };
  action_buttons?: Array<{
    id: string;
    title: string;
    action: string;
    style?: 'default' | 'primary' | 'destructive';
  }>;
}

export interface VendorAppResponse {
  vendor_id: string;
  order_id: string;
  action: 'accept' | 'decline' | 'status_update' | 'image_upload' | 'complete';
  response_data: {
    status?: 'accepted' | 'on_way' | 'processing' | 'completed' | 'cancelled';
    dealing_price?: number;
    before_image_url?: string;
    after_image_url?: string;
    notes?: string;
    estimated_completion?: string;
  };
  timestamp: string;
}

export interface OrderSyncData {
  order_id: string;
  vendor_id: string;
  status: 'new' | 'accepted' | 'on_way' | 'processing' | 'completed' | 'cancelled';
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  service_type: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduled_date: string;
  created_date: string;
  
  // Progress tracking
  before_image_url?: string;
  after_image_url?: string;
  dealing_price?: number;
  
  // Invoice data
  invoice?: {
    final_price: number;
    service_name: string;
    service_details: string;
    primary_contact: string;
    secondary_contact: string;
    invoice_url: string;
  };
}

export class MobileAppIntegrationService {
  private static instance: MobileAppIntegrationService;
  private activeConnections: Map<string, any> = new Map();
  private pendingNotifications: Map<string, VendorAppNotification[]> = new Map();

  static getInstance(): MobileAppIntegrationService {
    if (!MobileAppIntegrationService.instance) {
      MobileAppIntegrationService.instance = new MobileAppIntegrationService();
    }
    return MobileAppIntegrationService.instance;
  }

  /**
   * Send new order notification to vendor mobile app
   */
  async sendNewOrderNotification(
    vendorId: string,
    orderData: OrderSyncData
  ): Promise<{
    success: boolean;
    notification_id?: string;
    delivery_status: 'delivered' | 'pending' | 'failed';
    error?: string;
  }> {
    try {
      console.log(`📱 Sending new order notification to vendor ${vendorId}`);

      const notification: VendorAppNotification = {
        vendor_id: vendorId,
        notification_type: 'new_order',
        title: `New ${orderData.service_type} Request`,
        body: `${orderData.customer_name} needs ${orderData.service_type} service at ${orderData.customer_address}`,
        data: {
          order_id: orderData.order_id,
          action_required: 'accept_or_decline',
          priority: orderData.priority,
          expires_at: this.calculateNotificationExpiry(orderData.priority),
          customer_name: orderData.customer_name,
          customer_phone: orderData.customer_phone,
          customer_address: orderData.customer_address,
          service_type: orderData.service_type,
          description: orderData.description,
          scheduled_date: orderData.scheduled_date,
          estimated_value: this.estimateOrderValue(orderData.service_type, orderData.priority)
        },
        action_buttons: [
          {
            id: 'accept',
            title: 'Accept Order',
            action: 'accept_order',
            style: 'primary'
          },
          {
            id: 'decline',
            title: 'Decline',
            action: 'decline_order',
            style: 'destructive'
          },
          {
            id: 'view_details',
            title: 'View Details',
            action: 'view_order_details',
            style: 'default'
          }
        ]
      };

      // Send push notification
      const pushResult = await this.sendPushNotification(notification);
      
      // Update order in vendor app database (Base44 SDK)
      const syncResult = await this.syncOrderToVendorApp(vendorId, orderData);

      // Store notification for tracking
      await this.storeNotificationRecord(notification, pushResult.success);

      return {
        success: pushResult.success && syncResult.success,
        notification_id: pushResult.notification_id,
        delivery_status: pushResult.success ? 'delivered' : 'failed',
        error: pushResult.error || syncResult.error
      };

    } catch (error) {
      console.error('Send new order notification error:', error);
      return {
        success: false,
        delivery_status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle vendor response from mobile app
   */
  async handleVendorResponse(response: VendorAppResponse): Promise<{
    success: boolean;
    order_updated: boolean;
    next_action?: string;
    error?: string;
  }> {
    try {
      console.log(`📱 Handling vendor response from ${response.vendor_id} for order ${response.order_id}`);

      // Validate response
      if (!this.validateVendorResponse(response)) {
        return {
          success: false,
          order_updated: false,
          error: 'Invalid vendor response data'
        };
      }

      // Update order status in main system
      const orderUpdateResult = await this.updateOrderFromVendorResponse(response);

      if (!orderUpdateResult.success) {
        return {
          success: false,
          order_updated: false,
          error: orderUpdateResult.error
        };
      }

      // Determine next action based on response
      const nextAction = this.determineNextAction(response);

      // Send confirmation notification to vendor
      await this.sendResponseConfirmation(response, nextAction);

      // Notify customer if needed
      if (response.action === 'accept' || response.action === 'complete') {
        await this.notifyCustomerOfUpdate(response);
      }

      console.log(`✅ Vendor response processed successfully:`, {
        vendor_id: response.vendor_id,
        order_id: response.order_id,
        action: response.action,
        next_action: nextAction
      });

      return {
        success: true,
        order_updated: true,
        next_action: nextAction
      };

    } catch (error) {
      console.error('Handle vendor response error:', error);
      return {
        success: false,
        order_updated: false,
        error: error instanceof Error ? error.message : 'Failed to process response'
      };
    }
  }

  /**
   * Sync order data to vendor mobile app
   */
  async syncOrderToVendorApp(vendorId: string, orderData: OrderSyncData): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log(`🔄 Syncing order ${orderData.order_id} to vendor app for ${vendorId}`);

      // In production, use Base44 SDK to create/update order in vendor app database
      /*
      await base44SDK.Order.create({
        order_id: orderData.order_id,
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        customer_address: orderData.customer_address,
        service_type: orderData.service_type,
        description: orderData.description,
        status: orderData.status,
        priority: orderData.priority,
        scheduled_date: orderData.scheduled_date,
        created_date: orderData.created_date,
        vendor_id: vendorId
      });
      */

      // Simulate successful sync
      console.log(`✅ Order synced to vendor app successfully`);
      return { success: true };

    } catch (error) {
      console.error('Sync order to vendor app error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed'
      };
    }
  }

  /**
   * Send push notification to vendor device
   */
  private async sendPushNotification(notification: VendorAppNotification): Promise<{
    success: boolean;
    notification_id?: string;
    error?: string;
  }> {
    try {
      // Get vendor's device tokens
      const deviceTokens = await this.getVendorDeviceTokens(notification.vendor_id);

      if (deviceTokens.length === 0) {
        return {
          success: false,
          error: 'No device tokens found for vendor'
        };
      }

      // In production, use Firebase Cloud Messaging or similar service
      /*
      const message = {
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: notification.data,
        tokens: deviceTokens
      };

      const response = await admin.messaging().sendMulticast(message);
      */

      // Simulate successful push notification
      const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
      console.log(`📱 Push notification sent successfully:`, {
        vendor_id: notification.vendor_id,
        notification_id: notificationId,
        title: notification.title
      });

      return {
        success: true,
        notification_id: notificationId
      };

    } catch (error) {
      console.error('Send push notification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Push notification failed'
      };
    }
  }

  /**
   * Get vendor device tokens for push notifications
   */
  private async getVendorDeviceTokens(vendorId: string): Promise<string[]> {
    try {
      // In production, fetch from database
      /*
      const tokens = await db.vendor_device_tokens.findMany({
        where: { vendor_id: vendorId, is_active: true }
      });
      return tokens.map(t => t.token);
      */

      // Mock device tokens
      return [`device_token_${vendorId}_1`, `device_token_${vendorId}_2`];

    } catch (error) {
      console.error('Get vendor device tokens error:', error);
      return [];
    }
  }

  /**
   * Calculate notification expiry based on priority
   */
  private calculateNotificationExpiry(priority: string): string {
    const now = new Date();
    
    switch (priority) {
      case 'urgent':
        now.setMinutes(now.getMinutes() + 15);
        break;
      case 'high':
        now.setHours(now.getHours() + 1);
        break;
      case 'medium':
        now.setHours(now.getHours() + 4);
        break;
      default:
        now.setHours(now.getHours() + 24);
        break;
    }

    return now.toISOString();
  }

  /**
   * Estimate order value for display
   */
  private estimateOrderValue(serviceType: string, priority: string): number {
    const baseValues: Record<string, number> = {
      'cleaning': 150,
      'plumbing': 200,
      'electrical': 250,
      'maintenance': 180,
      'repairs': 220,
      'landscaping': 300,
      'security': 400
    };

    const priorityMultipliers: Record<string, number> = {
      'low': 1.0,
      'medium': 1.2,
      'high': 1.5,
      'urgent': 2.0
    };

    const baseValue = baseValues[serviceType.toLowerCase()] || 200;
    const multiplier = priorityMultipliers[priority] || 1.0;

    return Math.round(baseValue * multiplier);
  }

  /**
   * Validate vendor response data
   */
  private validateVendorResponse(response: VendorAppResponse): boolean {
    if (!response.vendor_id || !response.order_id || !response.action) {
      return false;
    }

    const validActions = ['accept', 'decline', 'status_update', 'image_upload', 'complete'];
    if (!validActions.includes(response.action)) {
      return false;
    }

    return true;
  }

  /**
   * Update order from vendor response
   */
  private async updateOrderFromVendorResponse(response: VendorAppResponse): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // In production, update order in main database
      /*
      await db.orders.update({
        where: { order_id: response.order_id },
        data: {
          status: response.response_data.status,
          dealing_price: response.response_data.dealing_price,
          before_image_url: response.response_data.before_image_url,
          after_image_url: response.response_data.after_image_url,
          vendor_notes: response.response_data.notes,
          updated_at: new Date()
        }
      });
      */

      console.log(`📝 Order ${response.order_id} updated from vendor response`);
      return { success: true };

    } catch (error) {
      console.error('Update order from vendor response error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed'
      };
    }
  }

  /**
   * Determine next action for vendor
   */
  private determineNextAction(response: VendorAppResponse): string {
    switch (response.action) {
      case 'accept':
        return 'start_service';
      case 'status_update':
        if (response.response_data.status === 'on_way') {
          return 'upload_before_image';
        } else if (response.response_data.status === 'processing') {
          return 'upload_after_image';
        }
        return 'continue_service';
      case 'image_upload':
        return 'complete_service';
      case 'complete':
        return 'generate_invoice';
      default:
        return 'none';
    }
  }

  /**
   * Send response confirmation to vendor
   */
  private async sendResponseConfirmation(response: VendorAppResponse, nextAction: string): Promise<void> {
    try {
      const confirmationMessage = this.getConfirmationMessage(response.action, nextAction);
      
      // Send confirmation notification
      // Implementation would send a simple notification confirming the action

    } catch (error) {
      console.error('Send response confirmation error:', error);
    }
  }

  /**
   * Get confirmation message for vendor action
   */
  private getConfirmationMessage(action: string, nextAction: string): string {
    const messages: Record<string, string> = {
      'accept': 'Order accepted successfully. Please start service when ready.',
      'decline': 'Order declined. Thank you for your response.',
      'status_update': 'Status updated successfully.',
      'image_upload': 'Image uploaded successfully.',
      'complete': 'Order completed successfully. Invoice will be generated.'
    };

    return messages[action] || 'Action processed successfully.';
  }

  /**
   * Notify customer of order update
   */
  private async notifyCustomerOfUpdate(response: VendorAppResponse): Promise<void> {
    try {
      // In production, send customer notification via email/SMS
      console.log(`📧 Notifying customer of order update: ${response.order_id}`);

    } catch (error) {
      console.error('Notify customer of update error:', error);
    }
  }

  /**
   * Store notification record for tracking
   */
  private async storeNotificationRecord(notification: VendorAppNotification, success: boolean): Promise<void> {
    try {
      // In production, store notification record in database
      console.log(`📝 Storing notification record:`, {
        vendor_id: notification.vendor_id,
        type: notification.notification_type,
        success: success
      });

    } catch (error) {
      console.error('Store notification record error:', error);
    }
  }
}

// Export singleton instance
export const mobileAppIntegration = MobileAppIntegrationService.getInstance();
