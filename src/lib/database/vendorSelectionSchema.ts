/**
 * Database Schema for Vendor Selection System
 * Shared database between main app and vendor app with role-based access
 */

export interface TriggerPointsData {
  id: string;                          // Primary key
  trigger_id: string;                  // Unique trigger identifier
  trigger_name: string;                // e.g., "Cleaning Service Request", "Location Visit"
  
  // Business Information
  business_name: string;               // Customer/business name
  location: string;                    // Full address
  work_needed: string;                 // Description of work required
  service_type: string;                // Type of service (cleaning, plumbing, etc.)
  
  // Vendor Selection Results
  selected_vendors: string[];          // Array of selected vendor IDs
  vendor_count: number;                // Number of vendors selected
  primary_vendor_id?: string;          // Primary assigned vendor
  
  // Pricing Information
  estimated_value: number;             // Estimated order value
  price_package: string;               // Price package tier
  
  // Order Relationship
  conversation_id: string;             // Related conversation ID
  order_id: string;                    // Related order ID
  user_id: string;                     // System user ID (business owner)
  
  // Status and Tracking
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  triggered_at: string;                // ISO timestamp
  completed_at?: string;               // ISO timestamp
  
  // Role-based Metadata
  created_by_role: 'agent' | 'system'; // Agent creates trigger data
  created_at: string;                  // ISO timestamp
  updated_at: string;                  // ISO timestamp
  
  // Additional Data
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customer_phone?: string;             // Customer contact
  customer_email?: string;             // Customer contact
  special_requirements?: string[];     // Any special needs
  
  // Performance Tracking
  response_time?: number;              // Time to first vendor response (minutes)
  completion_time?: number;            // Time to order completion (hours)
  customer_satisfaction?: number;      // Rating 1-5
}

export interface OrderData {
  id: string;                          // Primary key
  order_id: string;                    // Unique order identifier
  
  // Customer Information
  customer_name: string;               // Customer name
  customer_phone: string;              // Customer phone
  customer_email?: string;             // Customer email
  customer_address: string;            // Service address
  
  // Service Details
  service_type: string;                // Type of service
  description: string;                 // Detailed description
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_value: number;             // Estimated cost
  
  // Order Status (shared between systems)
  status: 'new' | 'accepted' | 'on_way' | 'processing' | 'completed' | 'cancelled';
  
  // Vendor Assignment
  assigned_vendors: string[];          // All assigned vendor IDs
  primary_vendor_id?: string;          // Primary vendor
  accepted_by_vendor_id?: string;      // Vendor who accepted
  
  // Progress Tracking (vendor app updates these)
  before_image_url?: string;           // Before service image
  after_image_url?: string;            // After service image
  dealing_price?: number;              // Price negotiated at location
  vendor_notes?: string;               // Vendor's notes
  
  // Invoice Information (vendor app creates this)
  invoice?: {
    final_price: number;
    service_name: string;
    service_details: string;
    primary_contact: string;
    secondary_contact: string;
    invoice_url: string;
  };
  
  // Scheduling
  scheduled_date: string;              // ISO timestamp
  started_at?: string;                 // When vendor started
  completed_at?: string;               // When service completed
  
  // Location Data
  customer_location: {
    latitude: number;
    longitude: number;
  };
  
  // Relationship Data
  conversation_id: string;             // Related conversation
  trigger_point_id: string;            // Related trigger point
  user_id: string;                     // System user (business owner)
  
  // Role-based Metadata
  created_by_role: 'agent' | 'vendor' | 'system';
  updated_by_role: 'agent' | 'vendor' | 'system';
  created_at: string;                  // ISO timestamp
  updated_at: string;                  // ISO timestamp
  
  // Notifications Tracking
  notifications_sent: {
    customer_email: boolean;
    customer_sms: boolean;
    vendor_emails: boolean;
    vendor_push: boolean;
  };
  
  // Performance Metrics
  metrics: {
    selection_time_ms: number;         // Time to select vendors
    first_response_time?: number;      // Time to first vendor response
    completion_time?: number;          // Total time to completion
    customer_rating?: number;          // Customer satisfaction
    vendor_rating?: number;            // Vendor performance rating
  };
}

export interface VendorData {
  id: string;                          // Primary key (vendor ID)
  name: string;                        // Vendor name
  contact: string;                     // Primary contact email
  phone?: string;                      // Vendor phone
  status: 'Verified' | 'Pending' | 'Blocked';
  avatar?: string;                     // Profile image URL
  
  // Performance Metrics (vendor app updates these)
  orders: {
    total: number;                     // Total orders received
    completed: number;                 // Successfully completed
    pending: number;                   // Currently in progress
    canceled: number;                  // Cancelled/declined
  };
  
  // Service Information (vendor app manages this)
  services: string[];                  // Array of service types
  
  // Location Data (vendor app sets this)
  location: {
    latitude: number;
    longitude: number;
  };
  
  // Service Area (vendor app configures this)
  service_area: {
    latitude: number;
    longitude: number;
    radius: number;                    // Service radius in miles
  };
  
  // Availability (vendor app updates this)
  activeOrders: number;                // Current workload
  maxCapacity: number;                 // Maximum concurrent orders
  isOnline: boolean;                   // Current online status
  lastSeen: string;                    // Last activity timestamp
  
  // Performance Data
  averageResponseTime: number;         // Average response time in minutes
  rating: number;                      // Overall rating 0-5
  memberSince: string;                 // Registration date
  
  // Notification Preferences (vendor app sets this)
  notification_preferences: {
    push_notifications: boolean;
    email_notifications: boolean;
    whatsapp_integration: boolean;
  };
  
  // Role-based Metadata
  created_by_role: 'vendor' | 'admin'; // Vendor creates their own profile
  updated_by_role: 'vendor' | 'system' | 'admin';
  created_at: string;
  updated_at: string;
  
  // System Integration
  user_id: string;                     // Related system user
  device_tokens: string[];             // Push notification tokens
}

export interface VendorResponseData {
  id: string;                          // Primary key
  vendor_id: string;                   // Vendor who responded
  order_id: string;                    // Related order
  
  // Response Details
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
  timestamp: string;                   // When response was made
  response_time_minutes?: number;      // Time from notification to response
  
  // Role-based Metadata
  created_by_role: 'vendor';           // Vendor creates responses
  created_at: string;
  updated_at: string;
}

/**
 * Database Access Patterns by Role
 */

export interface RoleBasedAccess {
  // AGENT ROLE (Main System)
  agent: {
    // Can create and read trigger points
    trigger_points: ['CREATE', 'READ', 'UPDATE'];
    
    // Can create orders and read all order data
    orders: ['CREATE', 'READ', 'UPDATE'];
    
    // Can read vendor data for selection
    vendors: ['READ'];
    
    // Cannot modify vendor responses directly
    vendor_responses: ['READ'];
  };
  
  // VENDOR ROLE (Mobile App)
  vendor: {
    // Cannot access trigger points
    trigger_points: [];
    
    // Can read assigned orders and update status/progress
    orders: ['READ', 'UPDATE'];
    
    // Can update their own vendor profile
    vendors: ['READ', 'UPDATE']; // Only their own record
    
    // Can create and update their own responses
    vendor_responses: ['CREATE', 'READ', 'UPDATE']; // Only their own
  };
  
  // SYSTEM ROLE (Automated processes)
  system: {
    // Can read trigger points for analytics
    trigger_points: ['READ'];
    
    // Can update order metrics and status
    orders: ['READ', 'UPDATE'];
    
    // Can update vendor performance metrics
    vendors: ['READ', 'UPDATE'];
    
    // Can read all responses for analytics
    vendor_responses: ['READ'];
  };
}

/**
 * Example Database Queries
 */

export const DatabaseQueries = {
  // Agent creates trigger point
  createTriggerPoint: `
    INSERT INTO trigger_points (
      trigger_id, trigger_name, business_name, location, work_needed,
      service_type, selected_vendors, vendor_count, estimated_value,
      price_package, conversation_id, order_id, user_id, status,
      triggered_at, created_by_role, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'agent', NOW())
  `,
  
  // Agent creates order
  createOrder: `
    INSERT INTO orders (
      order_id, customer_name, customer_phone, customer_address,
      service_type, description, priority, estimated_value, status,
      assigned_vendors, conversation_id, trigger_point_id, user_id,
      scheduled_date, customer_location, created_by_role, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?, ?, ?, ?, 'agent', NOW())
  `,
  
  // Vendor updates order status
  vendorUpdateOrder: `
    UPDATE orders SET 
      status = ?, dealing_price = ?, before_image_url = ?, after_image_url = ?,
      vendor_notes = ?, updated_by_role = 'vendor', updated_at = NOW()
    WHERE order_id = ? AND (primary_vendor_id = ? OR ? = ANY(assigned_vendors))
  `,
  
  // Get vendors by service type for selection
  getVendorsByService: `
    SELECT * FROM vendors 
    WHERE status = 'Verified' 
    AND ? = ANY(services) 
    AND isOnline = true 
    AND activeOrders < maxCapacity
    ORDER BY rating DESC, averageResponseTime ASC
  `
};
