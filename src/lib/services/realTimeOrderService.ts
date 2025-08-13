/**
 * Real-Time Order Service
 * WebSocket-based real-time order tracking and notifications
 */

import { io, Socket } from 'socket.io-client';

export type OrderStatus = 'new' | 'vendor_selection' | 'assigned' | 'accepted' | 'declined' | 'on_way' | 'processing' | 'completed' | 'cancelled';

export interface RealTimeOrderUpdate {
  order_id: string;
  status: OrderStatus;
  vendor_id?: string;
  vendor_name?: string;
  customer_name: string;
  service_type: string;
  timestamp: string;
  message: string;
  data?: any;
}

export interface OrderNotification {
  id: string;
  type: 'order_update' | 'vendor_assigned' | 'order_completed' | 'payment_received';
  title: string;
  message: string;
  order_id: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

type OrderUpdateCallback = (update: RealTimeOrderUpdate) => void;
type NotificationCallback = (notification: OrderNotification) => void;
type ConnectionCallback = (connected: boolean) => void;

class RealTimeOrderService {
  private socket: Socket | null = null;
  private isConnected = false;
  private userId: string | null = null;
  private orderUpdateCallbacks: OrderUpdateCallback[] = [];
  private notificationCallbacks: NotificationCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // ==========================================
  // CONNECTION MANAGEMENT
  // ==========================================

  /**
   * Initialize WebSocket connection
   */
  async initialize(userId: string): Promise<void> {
    try {
      this.userId = userId;
      
      // Initialize Socket.IO connection
      this.socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001', {
        auth: {
          userId: userId,
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
      });

      this.setupEventListeners();
      
      console.log('🔌 Real-time order service initializing...');
    } catch (error) {
      console.error('❌ Failed to initialize real-time order service:', error);
      throw error;
    }
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('✅ Real-time order service connected');
      this.notifyConnectionCallbacks(true);
      
      // Join user room for personalized updates
      if (this.userId) {
        this.socket?.emit('join_user_room', this.userId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('🔌 Real-time order service disconnected:', reason);
      this.notifyConnectionCallbacks(false);
      
      // Attempt to reconnect
      this.handleReconnection();
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Real-time connection error:', error);
      this.handleReconnection();
    });

    // Order update events
    this.socket.on('order_update', (update: RealTimeOrderUpdate) => {
      console.log('📦 Order update received:', update);
      this.notifyOrderUpdateCallbacks(update);
    });

    // Notification events
    this.socket.on('notification', (notification: OrderNotification) => {
      console.log('🔔 Notification received:', notification);
      this.notifyNotificationCallbacks(notification);
    });

    // Vendor assignment events
    this.socket.on('vendor_assigned', (data: any) => {
      const update: RealTimeOrderUpdate = {
        order_id: data.order_id,
        status: 'assigned',
        vendor_id: data.vendor_id,
        vendor_name: data.vendor_name,
        customer_name: data.customer_name,
        service_type: data.service_type,
        timestamp: new Date().toISOString(),
        message: `Order assigned to ${data.vendor_name}`,
        data: data,
      };
      this.notifyOrderUpdateCallbacks(update);
    });

    // Order completion events
    this.socket.on('order_completed', (data: any) => {
      const update: RealTimeOrderUpdate = {
        order_id: data.order_id,
        status: 'completed',
        vendor_id: data.vendor_id,
        vendor_name: data.vendor_name,
        customer_name: data.customer_name,
        service_type: data.service_type,
        timestamp: new Date().toISOString(),
        message: `Order completed by ${data.vendor_name}`,
        data: data,
      };
      this.notifyOrderUpdateCallbacks(update);
    });
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (this.socket && !this.isConnected) {
          this.socket.connect();
        }
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  // ==========================================
  // CALLBACK MANAGEMENT
  // ==========================================

  /**
   * Subscribe to order updates
   */
  onOrderUpdate(callback: OrderUpdateCallback): () => void {
    this.orderUpdateCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.orderUpdateCallbacks.indexOf(callback);
      if (index > -1) {
        this.orderUpdateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to notifications
   */
  onNotification(callback: NotificationCallback): () => void {
    this.notificationCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.notificationCallbacks.indexOf(callback);
      if (index > -1) {
        this.notificationCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to connection status changes
   */
  onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.connectionCallbacks.indexOf(callback);
      if (index > -1) {
        this.connectionCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify order update callbacks
   */
  private notifyOrderUpdateCallbacks(update: RealTimeOrderUpdate): void {
    this.orderUpdateCallbacks.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('Error in order update callback:', error);
      }
    });
  }

  /**
   * Notify notification callbacks
   */
  private notifyNotificationCallbacks(notification: OrderNotification): void {
    this.notificationCallbacks.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in notification callback:', error);
      }
    });
  }

  /**
   * Notify connection callbacks
   */
  private notifyConnectionCallbacks(connected: boolean): void {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(connected);
      } catch (error) {
        console.error('Error in connection callback:', error);
      }
    });
  }

  // ==========================================
  // ORDER TRACKING METHODS
  // ==========================================

  /**
   * Subscribe to specific order updates
   */
  subscribeToOrder(orderId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe_order', orderId);
      console.log(`📦 Subscribed to order updates: ${orderId}`);
    }
  }

  /**
   * Unsubscribe from specific order updates
   */
  unsubscribeFromOrder(orderId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe_order', orderId);
      console.log(`📦 Unsubscribed from order updates: ${orderId}`);
    }
  }

  /**
   * Send order status update (for vendor app)
   */
  updateOrderStatus(orderId: string, status: OrderStatus, data?: any): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('update_order_status', {
        order_id: orderId,
        status: status,
        timestamp: new Date().toISOString(),
        data: data,
      });
      console.log(`📦 Order status update sent: ${orderId} -> ${status}`);
    }
  }

  /**
   * Send notification to user
   */
  sendNotification(notification: Omit<OrderNotification, 'id' | 'timestamp' | 'read'>): void {
    if (this.socket && this.isConnected) {
      const fullNotification: OrderNotification = {
        ...notification,
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        read: false,
      };
      
      this.socket.emit('send_notification', fullNotification);
      console.log(`🔔 Notification sent: ${fullNotification.title}`);
    }
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Get connection status
   */
  isConnectedToServer(): boolean {
    return this.isConnected;
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string | null {
    return this.userId;
  }

  /**
   * Manually reconnect
   */
  reconnect(): void {
    if (this.socket) {
      this.reconnectAttempts = 0;
      this.socket.connect();
    }
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.userId = null;
      console.log('🔌 Real-time order service disconnected');
    }
  }

  /**
   * Clear all callbacks
   */
  clearAllCallbacks(): void {
    this.orderUpdateCallbacks = [];
    this.notificationCallbacks = [];
    this.connectionCallbacks = [];
  }

  /**
   * Get service status
   */
  getStatus(): {
    connected: boolean;
    userId: string | null;
    reconnectAttempts: number;
    callbackCounts: {
      orderUpdates: number;
      notifications: number;
      connections: number;
    };
  } {
    return {
      connected: this.isConnected,
      userId: this.userId,
      reconnectAttempts: this.reconnectAttempts,
      callbackCounts: {
        orderUpdates: this.orderUpdateCallbacks.length,
        notifications: this.notificationCallbacks.length,
        connections: this.connectionCallbacks.length,
      },
    };
  }
}

// Export singleton instance
export const realTimeOrderService = new RealTimeOrderService();
export default realTimeOrderService;
