/**
 * React Hook for Real-Time Order Tracking
 * Provides real-time order updates and notifications
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import realTimeOrderService, { 
  RealTimeOrderUpdate, 
  OrderNotification, 
  OrderStatus 
} from '@/lib/services/realTimeOrderService';

export interface UseRealTimeOrdersOptions {
  userId: string;
  autoConnect?: boolean;
  subscribeToOrders?: string[]; // Specific order IDs to subscribe to
}

export interface UseRealTimeOrdersReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  
  // Order updates
  orderUpdates: RealTimeOrderUpdate[];
  latestUpdate: RealTimeOrderUpdate | null;
  
  // Notifications
  notifications: OrderNotification[];
  unreadCount: number;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  reconnect: () => void;
  subscribeToOrder: (orderId: string) => void;
  unsubscribeFromOrder: (orderId: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, data?: any) => void;
  markNotificationAsRead: (notificationId: string) => void;
  clearAllNotifications: () => void;
  
  // Status
  getServiceStatus: () => any;
}

export function useRealTimeOrders(options: UseRealTimeOrdersOptions): UseRealTimeOrdersReturn {
  const { userId, autoConnect = true, subscribeToOrders = [] } = options;
  
  // State management
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [orderUpdates, setOrderUpdates] = useState<RealTimeOrderUpdate[]>([]);
  const [latestUpdate, setLatestUpdate] = useState<RealTimeOrderUpdate | null>(null);
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  
  // Refs for cleanup
  const unsubscribeFunctions = useRef<(() => void)[]>([]);
  const subscribedOrders = useRef<Set<string>>(new Set());

  // ==========================================
  // CONNECTION MANAGEMENT
  // ==========================================

  const connect = useCallback(async () => {
    try {
      setIsConnecting(true);
      setConnectionError(null);
      
      await realTimeOrderService.initialize(userId);
      
      // Setup event listeners
      const orderUpdateUnsubscribe = realTimeOrderService.onOrderUpdate((update) => {
        setOrderUpdates(prev => [update, ...prev.slice(0, 49)]); // Keep last 50 updates
        setLatestUpdate(update);
        
        // Create notification for important updates
        if (['completed', 'cancelled', 'assigned'].includes(update.status)) {
          const notification: OrderNotification = {
            id: `order_${update.order_id}_${Date.now()}`,
            type: 'order_update',
            title: `Order ${update.status.charAt(0).toUpperCase() + update.status.slice(1)}`,
            message: update.message,
            order_id: update.order_id,
            timestamp: update.timestamp,
            read: false,
            data: update.data,
          };
          
          setNotifications(prev => [notification, ...prev]);
        }
      });

      const notificationUnsubscribe = realTimeOrderService.onNotification((notification) => {
        setNotifications(prev => [notification, ...prev]);
      });

      const connectionUnsubscribe = realTimeOrderService.onConnectionChange((connected) => {
        setIsConnected(connected);
        if (!connected) {
          setConnectionError('Connection lost. Attempting to reconnect...');
        } else {
          setConnectionError(null);
        }
      });

      // Store unsubscribe functions
      unsubscribeFunctions.current = [
        orderUpdateUnsubscribe,
        notificationUnsubscribe,
        connectionUnsubscribe,
      ];

      // Subscribe to specific orders if provided
      subscribeToOrders.forEach(orderId => {
        subscribeToOrder(orderId);
      });

      console.log('✅ Real-time orders hook connected');
    } catch (error) {
      console.error('❌ Failed to connect real-time orders:', error);
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  }, [userId, subscribeToOrders]);

  const disconnect = useCallback(() => {
    // Clean up subscriptions
    unsubscribeFunctions.current.forEach(unsubscribe => unsubscribe());
    unsubscribeFunctions.current = [];
    
    // Clear subscribed orders
    subscribedOrders.current.clear();
    
    // Disconnect service
    realTimeOrderService.disconnect();
    
    // Reset state
    setIsConnected(false);
    setIsConnecting(false);
    setConnectionError(null);
    
    console.log('🔌 Real-time orders hook disconnected');
  }, []);

  const reconnect = useCallback(() => {
    realTimeOrderService.reconnect();
  }, []);

  // ==========================================
  // ORDER SUBSCRIPTION MANAGEMENT
  // ==========================================

  const subscribeToOrder = useCallback((orderId: string) => {
    if (!subscribedOrders.current.has(orderId)) {
      realTimeOrderService.subscribeToOrder(orderId);
      subscribedOrders.current.add(orderId);
      console.log(`📦 Subscribed to order: ${orderId}`);
    }
  }, []);

  const unsubscribeFromOrder = useCallback((orderId: string) => {
    if (subscribedOrders.current.has(orderId)) {
      realTimeOrderService.unsubscribeFromOrder(orderId);
      subscribedOrders.current.delete(orderId);
      console.log(`📦 Unsubscribed from order: ${orderId}`);
    }
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus, data?: any) => {
    realTimeOrderService.updateOrderStatus(orderId, status, data);
  }, []);

  // ==========================================
  // NOTIFICATION MANAGEMENT
  // ==========================================

  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // ==========================================
  // LIFECYCLE MANAGEMENT
  // ==========================================

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && userId) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [userId, autoConnect, connect, disconnect]);

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  const getServiceStatus = useCallback(() => {
    return realTimeOrderService.getStatus();
  }, []);

  // ==========================================
  // RETURN HOOK INTERFACE
  // ==========================================

  return {
    // Connection state
    isConnected,
    isConnecting,
    connectionError,
    
    // Order updates
    orderUpdates,
    latestUpdate,
    
    // Notifications
    notifications,
    unreadCount,
    
    // Actions
    connect,
    disconnect,
    reconnect,
    subscribeToOrder,
    unsubscribeFromOrder,
    updateOrderStatus,
    markNotificationAsRead,
    clearAllNotifications,
    
    // Status
    getServiceStatus,
  };
}

// ==========================================
// ADDITIONAL HOOKS
// ==========================================

/**
 * Hook for tracking a specific order in real-time
 */
export function useRealTimeOrder(orderId: string, userId: string) {
  const {
    isConnected,
    orderUpdates,
    latestUpdate,
    subscribeToOrder,
    unsubscribeFromOrder,
    updateOrderStatus,
  } = useRealTimeOrders({ userId, subscribeToOrders: [orderId] });

  // Filter updates for this specific order
  const orderSpecificUpdates = orderUpdates.filter(update => update.order_id === orderId);
  const latestOrderUpdate = orderSpecificUpdates[0] || null;

  useEffect(() => {
    if (isConnected) {
      subscribeToOrder(orderId);
    }

    return () => {
      unsubscribeFromOrder(orderId);
    };
  }, [orderId, isConnected, subscribeToOrder, unsubscribeFromOrder]);

  return {
    isConnected,
    orderUpdates: orderSpecificUpdates,
    latestUpdate: latestOrderUpdate,
    updateOrderStatus: (status: OrderStatus, data?: any) => updateOrderStatus(orderId, status, data),
  };
}

/**
 * Hook for real-time notifications only
 */
export function useRealTimeNotifications(userId: string) {
  const {
    isConnected,
    notifications,
    unreadCount,
    markNotificationAsRead,
    clearAllNotifications,
  } = useRealTimeOrders({ userId });

  return {
    isConnected,
    notifications,
    unreadCount,
    markNotificationAsRead,
    clearAllNotifications,
  };
}
