/**
 * Unified Database Schema
 * Single database serving both Admin App and Vendor App
 * Based on vendor app code analysis and Base44 SDK patterns
 */

// ===== CORE ENTITIES (Based on vendor app Entities/) =====

export interface User {
  id: string;                          // Primary key
  role: 'admin' | 'vendor';            // User role
  
  // Basic profile (both admin and vendor)
  full_name: string;
  email: string;
  phone: string;
  
  // Vendor-specific fields (from Settings.txs.txt)
  referral_id?: string;
  
  // Service area configuration (vendor app manages)
  service_area?: {
    latitude: number;
    longitude: number;
    radius: number;                    // in km (as per vendor app)
  };
  
  // Notification preferences (vendor app manages)
  notification_preferences?: {
    new_orders: boolean;
    order_updates: boolean;
    whatsapp_integration: boolean;
    push_notifications: boolean;
    email_notifications: boolean;
  };
  
  // App preferences (vendor app manages)
  preferences?: {
    language: 'en' | 'hi' | 'es';      // Multi-language support
    theme: 'light' | 'dark';
  };
  
  // Performance metrics (system calculates)
  orders_stats?: {
    total: number;
    completed: number;
    pending: number;
    canceled: number;
  };
  
  // Vendor status and availability
  status: 'active' | 'pending' | 'blocked';
  is_online?: boolean;
  last_seen?: string;
  
  // Services offered (vendor app manages)
  services?: string[];               // ['plumbing', 'electrical', 'cleaning']
  
  // Device tokens for push notifications
  device_tokens?: string[];
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by_role: 'admin' | 'vendor' | 'system';
  updated_by_role: 'admin' | 'vendor' | 'system';
}

// Order entity (exactly matching vendors app code/Entities/Order.db)
export interface Order {
  id: string;                          // Database primary key
  order_id: string;                    // Unique order identifier (as per vendor app)
  
  // Customer information (admin app creates)
  customer_name: string;               // Required field
  customer_phone: string;              // Required field
  customer_address: string;
  customer_email?: string;
  
  // Service details (admin app creates)
  service_type: 'plumbing' | 'electrical' | 'cleaning' | 'repairs' | 'maintenance' | 'other';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Order status (vendor app updates)
  status: 'new' | 'accepted' | 'on_way' | 'processing' | 'completed' | 'cancelled';
  
  // Vendor assignment (admin app assigns, vendor app accepts)
  vendor_id?: string;                  // Assigned vendor ID
  assigned_vendors?: string[];         // All potential vendors
  
  // Progress tracking (vendor app updates these)
  before_image_url?: string;
  after_image_url?: string;
  dealing_price?: number;              // Price negotiated at location
  
  // Invoice information (vendor app creates)
  invoice?: {
    final_price: number;
    service_name: string;
    service_details: string;
    primary_contact: string;
    secondary_contact: string;
    invoice_url: string;
  };
  
  // Scheduling
  scheduled_date?: string;             // ISO datetime
  created_date: string;                // ISO datetime (as per vendor app)
  
  // Admin app relationships
  conversation_id?: string;            // Link to conversation
  trigger_point_id?: string;           // Link to trigger point
  user_id: string;                     // Admin user who owns this system
  
  // Location data
  customer_location?: {
    latitude: number;
    longitude: number;
  };
  
  // Estimated value
  estimated_value?: number;
  
  // Role-based metadata
  created_by_role: 'admin' | 'vendor' | 'system';
  updated_by_role: 'admin' | 'vendor' | 'system';
  created_at: string;
  updated_at: string;
  
  // Notifications tracking
  notifications_sent?: {
    customer_email: boolean;
    customer_sms: boolean;
    vendor_emails: boolean;
    vendor_push: boolean;
  };
}

// Referral entity (exactly matching vendors app code/Entities/Referral.db)
export interface Referral {
  id: string;                          // Database primary key
  referral_code: string;               // Unique referral code (required)
  is_valid: boolean;                   // Default: true
  used_by?: string;                    // User ID who used this code
  created_by: string;                  // User ID who created this referral
  usage_limit: number;                 // Default: 1
  used_count: number;                  // Default: 0
  expires_at?: string;                 // ISO datetime
  created_at: string;
  updated_at: string;
}

// ===== ADMIN APP SPECIFIC ENTITIES =====

export interface Conversation {
  id: string;
  conversation_id: string;             // Unique conversation identifier
  user_id: string;                     // Admin user ID
  calling_system: 'elevenlabs' | 'cloned_voice';
  
  // Conversation data
  conversation_data: any;              // Raw conversation data
  analysis_result: any;                // Processed analysis
  
  // Trigger detection results
  triggers_detected: any[];
  vendor_selection_triggered: boolean;
  vendor_selection_result?: any;
  
  // Performance metrics
  processing_time_ms: number;
  cache_status: 'hit' | 'miss' | 'updated';
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface TriggerPoint {
  id: string;
  trigger_id: string;                  // Unique trigger identifier
  trigger_name: string;                // e.g., "Cleaning Service Request"
  
  // Business information (extracted from conversation)
  business_name: string;
  location: string;
  work_needed: string;
  service_type: string;
  
  // Vendor selection results
  selected_vendors: string[];          // Array of vendor IDs
  vendor_count: number;
  
  // Pricing information
  estimated_value: number;
  price_package: string;
  
  // Relationships
  conversation_id: string;
  order_id: string;
  user_id: string;                     // Admin user ID
  
  // Status and timing
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  triggered_at: string;
  completed_at?: string;
  
  // Performance tracking
  response_time?: number;              // Minutes to first vendor response
  completion_time?: number;            // Hours to order completion
  customer_satisfaction?: number;      // Rating 1-5
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by_role: 'admin' | 'system';
}

export interface APIConfiguration {
  id: string;
  user_id: string;                     // Admin user ID
  service_type: 'openai' | 'gemini' | 'claude' | 'grok' | 'twilio' | 'elevenlabs' | 'serpapi';
  api_key: string;                     // Encrypted
  configuration: any;                  // Service-specific config
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ===== VENDOR APP SPECIFIC ENTITIES =====

export interface VendorResponse {
  id: string;
  vendor_id: string;                   // Vendor who responded
  order_id: string;                    // Related order
  
  // Response details
  action: 'accept' | 'decline' | 'status_update' | 'image_upload' | 'complete';
  response_data: {
    status?: 'accepted' | 'on_way' | 'processing' | 'completed' | 'cancelled';
    dealing_price?: number;
    before_image_url?: string;
    after_image_url?: string;
    notes?: string;
    estimated_completion?: string;
  };
  
  // Timing
  timestamp: string;
  response_time_minutes?: number;      // Time from notification to response
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface VendorNotification {
  id: string;
  vendor_id: string;
  notification_type: 'new_order' | 'order_update' | 'order_cancelled' | 'system_message';
  title: string;
  body: string;
  data: any;                           // Notification payload
  
  // Delivery tracking
  sent_at: string;
  delivered_at?: string;
  read_at?: string;
  action_taken?: string;
  
  // Status
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'expired';
  expires_at?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// ===== DATABASE ACCESS PATTERNS =====

export interface DatabaseOperations {
  // Admin role operations
  admin: {
    // Conversations
    createConversation: (data: Partial<Conversation>) => Promise<Conversation>;
    getConversations: (userId: string, filters?: any) => Promise<Conversation[]>;
    updateConversation: (id: string, data: Partial<Conversation>) => Promise<Conversation>;
    
    // Trigger points
    createTriggerPoint: (data: Partial<TriggerPoint>) => Promise<TriggerPoint>;
    getTriggerPoints: (userId: string, filters?: any) => Promise<TriggerPoint[]>;
    updateTriggerPoint: (id: string, data: Partial<TriggerPoint>) => Promise<TriggerPoint>;
    
    // Orders (create only, vendors update)
    createOrder: (data: Partial<Order>) => Promise<Order>;
    getOrders: (userId: string, filters?: any) => Promise<Order[]>;
    getOrderById: (orderId: string) => Promise<Order | null>;
    
    // Vendors (read only for selection)
    getVendors: (userId: string, filters?: any) => Promise<User[]>;
    getVendorById: (vendorId: string) => Promise<User | null>;
    
    // API configurations
    createAPIConfig: (data: Partial<APIConfiguration>) => Promise<APIConfiguration>;
    getAPIConfigs: (userId: string) => Promise<APIConfiguration[]>;
    updateAPIConfig: (id: string, data: Partial<APIConfiguration>) => Promise<APIConfiguration>;
  };
  
  // Vendor role operations
  vendor: {
    // Orders (assigned to them only)
    getMyOrders: (vendorId: string, filters?: any) => Promise<Order[]>;
    updateOrderStatus: (orderId: string, vendorId: string, data: Partial<Order>) => Promise<Order>;
    
    // Profile management
    getMyProfile: (vendorId: string) => Promise<User>;
    updateMyProfile: (vendorId: string, data: Partial<User>) => Promise<User>;
    
    // Responses
    createResponse: (data: Partial<VendorResponse>) => Promise<VendorResponse>;
    getMyResponses: (vendorId: string, orderId?: string) => Promise<VendorResponse[]>;
    
    // Referrals
    createReferral: (data: Partial<Referral>) => Promise<Referral>;
    getMyReferrals: (vendorId: string) => Promise<Referral[]>;
    useReferral: (referralCode: string, userId: string) => Promise<boolean>;
    
    // Notifications
    getMyNotifications: (vendorId: string) => Promise<VendorNotification[]>;
    markNotificationRead: (notificationId: string, vendorId: string) => Promise<void>;
  };
  
  // System operations (automated processes)
  system: {
    // Performance metrics
    updateVendorStats: (vendorId: string, stats: any) => Promise<void>;
    updateOrderMetrics: (orderId: string, metrics: any) => Promise<void>;
    
    // Notifications
    createNotification: (data: Partial<VendorNotification>) => Promise<VendorNotification>;
    
    // Cleanup operations
    cleanupExpiredNotifications: () => Promise<void>;
    cleanupExpiredReferrals: () => Promise<void>;
  };
}

// ===== ROLE-BASED ACCESS CONTROL =====

export const RolePermissions = {
  admin: {
    conversations: ['CREATE', 'READ', 'UPDATE'],
    trigger_points: ['CREATE', 'READ', 'UPDATE'],
    orders: ['CREATE', 'READ'],                    // Cannot update vendor progress
    users: ['READ'],                               // Can read vendor data for selection
    api_configurations: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    vendor_responses: ['READ'],                    // Read-only access
    referrals: [],                                 // No access
    vendor_notifications: []                       // No access
  },
  
  vendor: {
    conversations: [],                             // No access
    trigger_points: [],                            // No access
    orders: ['READ', 'UPDATE'],                    // Only assigned orders
    users: ['READ', 'UPDATE'],                     // Only own profile
    api_configurations: [],                        // No access
    vendor_responses: ['CREATE', 'READ', 'UPDATE'], // Own responses only
    referrals: ['CREATE', 'READ', 'UPDATE'],       // Own referrals only
    vendor_notifications: ['READ', 'UPDATE']       // Own notifications only
  },
  
  system: {
    conversations: ['READ', 'UPDATE'],             // Analytics and metrics
    trigger_points: ['READ', 'UPDATE'],            // Performance tracking
    orders: ['READ', 'UPDATE'],                    // Metrics and status
    users: ['READ', 'UPDATE'],                     // Performance stats
    api_configurations: ['READ'],                  // System monitoring
    vendor_responses: ['READ'],                    // Analytics
    referrals: ['READ', 'UPDATE'],                 // Cleanup expired
    vendor_notifications: ['CREATE', 'READ', 'UPDATE', 'DELETE'] // Notification management
  }
} as const;
