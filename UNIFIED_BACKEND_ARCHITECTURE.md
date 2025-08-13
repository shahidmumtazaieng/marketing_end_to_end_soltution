# 🏗️ UNIFIED BACKEND ARCHITECTURE

## 📱 DUAL APP SYSTEM ANALYSIS

Based on thorough analysis of the vendor app code, I understand the complete architecture:

### **🎯 TWO-APP ECOSYSTEM**
1. **ADMIN APP** (Main System) - Data scraper, calling agents, vendor selection, conversations
2. **VENDOR APP** (Mobile) - Service providers using Android/iOS to manage orders

### **🗄️ SHARED DATABASE ARCHITECTURE**
- **Single Database** serves both applications
- **Role-Based Access Control** (Admin vs Vendor roles)
- **Real-time Synchronization** between systems

---

## 📊 VENDOR APP CODE ANALYSIS

### **🔍 Key Findings from Vendor App:**

#### **📱 App Structure (React Native/Web)**
```typescript
// Navigation Structure
Layout.js → Main navigation with:
- Dashboard (Home with statistics)
- Orders (Order management)
- Notifications (New order alerts)
- Settings (Profile & preferences)

// Page URLs
createPageUrl('Dashboard')
createPageUrl('Orders') 
createPageUrl('OrderProgress') + '?id=' + order_id
createPageUrl('Notifications')
createPageUrl('Settings')
```

#### **🗄️ Data Entities (Base44 SDK)**
```typescript
// Order Entity (vendors app code/Entities/Order.db)
Order {
  order_id: string,
  customer_name: string,
  customer_phone: string,
  customer_address: string,
  service_type: "plumbing" | "electrical" | "cleaning" | "repairs" | "maintenance" | "other",
  status: "new" | "accepted" | "on_way" | "processing" | "completed" | "cancelled",
  priority: "low" | "medium" | "high" | "urgent",
  description: string,
  before_image_url: string,
  after_image_url: string,
  dealing_price: number,
  invoice: {
    final_price: number,
    service_name: string,
    service_details: string,
    primary_contact: string,
    secondary_contact: string,
    invoice_url: string
  },
  scheduled_date: datetime,
  vendor_id: string
}

// Referral Entity (vendors app code/Entities/Referral.db)
Referral {
  referral_code: string,
  is_valid: boolean,
  used_by: string,
  created_by: string,
  usage_limit: number,
  used_count: number,
  expires_at: datetime
}
```

#### **👤 User Profile Structure (Settings.txs.txt)**
```typescript
User {
  full_name: string,
  email: string,
  phone: string,
  referral_id: string,
  
  // Service Area Configuration
  service_area: {
    latitude: number,
    longitude: number,
    radius: number // in km
  },
  
  // Notification Preferences
  notification_preferences: {
    new_orders: boolean,
    order_updates: boolean,
    whatsapp_integration: boolean,
    push_notifications: boolean,
    email_notifications: boolean
  },
  
  // App Preferences
  preferences: {
    language: "en" | "hi" | "es",
    theme: "light" | "dark"
  }
}
```

#### **📱 Vendor App Functionality**

##### **Dashboard Page (Dashboard.txs.txt):**
```typescript
// Statistics Display
- Welcome message with vendor name
- Order statistics (New, In Progress, Completed, Total)
- Recent orders list with quick actions
- Quick action buttons (Update Service Area, Contact Support, Analytics)
- Account status indicator

// API Calls
Order.list('-created_date', 20)  // Get recent orders
User.me()                        // Get vendor profile
```

##### **Orders Page (Orders.tsx.txt):**
```typescript
// Order Management
- Complete order list with search/filter
- Order cards with full details
- Accept/Decline actions for new orders
- Progress management for active orders
- WhatsApp integration for customer contact

// API Calls
Order.list('-created_date')      // Get all orders
Order.update(id, {status})       // Update order status
Navigation to OrderProgress page
```

##### **OrderProgress Page (OrderProgress.txs.txt):**
```typescript
// Step-by-step Order Completion
- Progress tracking with visual indicators
- Image upload for before/after photos
- Price negotiation and dealing price entry
- Invoice generation and sharing
- WhatsApp customer communication

// API Calls
Order.list() then filter by order_id  // Get specific order
Order.update(id, data)                 // Update order progress
Image upload handling
Invoice generation (Cloud Function simulation)
```

##### **Notifications Page (Notifications.txs.txt):**
```typescript
// Real-time Order Notifications
- New order notifications with accept/decline
- Order details preview
- Automatic navigation to OrderProgress on accept

// API Calls
Order.list() then filter status='new'  // Get new orders only
Order.update(id, {status})             // Accept/decline orders
```

##### **Settings Page (Settings.txs.txt):**
```typescript
// Profile and Preferences Management
- Profile information editing
- Service area configuration (lat/lng/radius)
- Notification preferences
- Language and theme settings
- Account management and logout

// API Calls
User.me()                              // Get current user data
User.updateMyUserData(formData)        // Update profile
```

---

## 🏗️ UNIFIED BACKEND ARCHITECTURE

### **🎯 SYSTEM OVERVIEW**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ADMIN APP     │    │  SHARED DATABASE │    │   VENDOR APP    │
│                 │    │                  │    │                 │
│ • Data Scraper  │◄──►│ • Orders         │◄──►│ • Order Mgmt    │
│ • Calling Agent │    │ • Users/Vendors  │    │ • Progress Track│
│ • ElevenLabs    │    │ • Conversations  │    │ • Notifications │
│ • Cloned Voice  │    │ • Trigger Points │    │ • Settings      │
│ • Vendor Select │    │ • Referrals      │    │ • Profile Mgmt  │
│ • Conversations │    │ • API Configs    │    │ • Invoice Gen   │
│ • API Configs   │    │                  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
      (Admin Role)           (Shared DB)           (Vendor Role)
```

### **🗄️ UNIFIED DATABASE SCHEMA**

#### **Core Tables:**
```sql
-- Users/Vendors Table (Shared)
users {
  id: string (PK),
  role: 'admin' | 'vendor',
  full_name: string,
  email: string,
  phone: string,
  referral_id: string,
  
  -- Vendor-specific fields
  service_area: jsonb {
    latitude: number,
    longitude: number,
    radius: number
  },
  notification_preferences: jsonb {
    new_orders: boolean,
    order_updates: boolean,
    whatsapp_integration: boolean,
    push_notifications: boolean,
    email_notifications: boolean
  },
  preferences: jsonb {
    language: string,
    theme: string
  },
  
  -- Performance metrics
  orders_stats: jsonb {
    total: number,
    completed: number,
    pending: number,
    canceled: number
  },
  
  -- Status and metadata
  status: 'active' | 'pending' | 'blocked',
  created_at: timestamp,
  updated_at: timestamp,
  last_seen: timestamp
}

-- Orders Table (Shared between Admin and Vendor apps)
orders {
  id: string (PK),
  order_id: string (Unique),
  
  -- Customer information
  customer_name: string,
  customer_phone: string,
  customer_address: string,
  
  -- Service details
  service_type: enum('plumbing', 'electrical', 'cleaning', 'repairs', 'maintenance', 'other'),
  description: text,
  priority: enum('low', 'medium', 'high', 'urgent'),
  
  -- Order status and assignment
  status: enum('new', 'accepted', 'on_way', 'processing', 'completed', 'cancelled'),
  vendor_id: string (FK to users),
  assigned_vendors: jsonb, -- Array of vendor IDs
  
  -- Progress tracking (vendor app updates)
  before_image_url: string,
  after_image_url: string,
  dealing_price: decimal,
  
  -- Invoice data (vendor app generates)
  invoice: jsonb {
    final_price: number,
    service_name: string,
    service_details: string,
    primary_contact: string,
    secondary_contact: string,
    invoice_url: string
  },
  
  -- Scheduling
  scheduled_date: timestamp,
  created_date: timestamp,
  
  -- Admin app relationships
  conversation_id: string,
  trigger_point_id: string,
  user_id: string, -- Admin user who owns this system
  
  -- Role-based metadata
  created_by_role: enum('admin', 'vendor', 'system'),
  updated_by_role: enum('admin', 'vendor', 'system'),
  created_at: timestamp,
  updated_at: timestamp
}

-- Conversations Table (Admin app)
conversations {
  id: string (PK),
  conversation_id: string (Unique),
  user_id: string (FK to users),
  calling_system: enum('elevenlabs', 'cloned_voice'),
  
  -- Conversation data
  conversation_data: jsonb,
  analysis_result: jsonb,
  
  -- Trigger detection
  triggers_detected: jsonb,
  vendor_selection_triggered: boolean,
  
  -- Performance metrics
  processing_time_ms: integer,
  created_at: timestamp,
  updated_at: timestamp
}

-- Trigger Points Table (Admin app creates, stores business details)
trigger_points {
  id: string (PK),
  trigger_id: string (Unique),
  trigger_name: string, -- e.g., "Cleaning Service Request"
  
  -- Business information extracted from conversation
  business_name: string,
  location: string,
  work_needed: text,
  service_type: string,
  
  -- Vendor selection results
  selected_vendors: jsonb, -- Array of vendor IDs
  vendor_count: integer,
  
  -- Pricing information
  estimated_value: decimal,
  price_package: string,
  
  -- Relationships
  conversation_id: string (FK),
  order_id: string (FK),
  user_id: string (FK),
  
  -- Status
  status: enum('active', 'completed', 'cancelled'),
  triggered_at: timestamp,
  created_at: timestamp
}

-- Referrals Table (Vendor app)
referrals {
  id: string (PK),
  referral_code: string (Unique),
  is_valid: boolean,
  used_by: string (FK to users),
  created_by: string (FK to users),
  usage_limit: integer,
  used_count: integer,
  expires_at: timestamp,
  created_at: timestamp
}

-- API Configurations Table (Admin app)
api_configurations {
  id: string (PK),
  user_id: string (FK to users),
  service_type: enum('openai', 'gemini', 'claude', 'grok', 'twilio', 'elevenlabs'),
  api_key: string (encrypted),
  configuration: jsonb,
  is_active: boolean,
  created_at: timestamp,
  updated_at: timestamp
}
```

---

## 🔄 ROLE-BASED ACCESS PATTERNS

### **👨‍💼 ADMIN ROLE (Main System)**
```typescript
// Can CREATE/READ/UPDATE:
✅ conversations (all operations)
✅ trigger_points (create from conversations)
✅ orders (create from vendor selection)
✅ api_configurations (manage API keys)
✅ users (read vendor data for selection)

// Cannot directly modify:
❌ vendor order progress (before_image_url, after_image_url, dealing_price)
❌ vendor profiles (service_area, notification_preferences)
❌ vendor responses and status updates
```

### **🔧 VENDOR ROLE (Mobile App)**
```typescript
// Can READ/UPDATE:
✅ orders (assigned to them only)
✅ their own user profile
✅ referrals (their own codes)

// Can CREATE:
✅ order progress updates
✅ invoice data
✅ referral codes

// Cannot access:
❌ conversations
❌ trigger_points
❌ api_configurations
❌ other vendors' data
❌ admin system data
```

---

## 🚀 BACKEND SERVICES ARCHITECTURE

### **📡 API Layer Structure**
```
/api/
├── admin/                    # Admin app endpoints
│   ├── conversations/
│   ├── vendor-selection/
│   ├── trigger-points/
│   ├── api-configs/
│   └── analytics/
├── vendor/                   # Vendor app endpoints
│   ├── orders/
│   ├── profile/
│   ├── notifications/
│   └── referrals/
├── shared/                   # Shared endpoints
│   ├── auth/
│   ├── users/
│   └── webhooks/
└── integrations/            # External service integrations
    ├── elevenlabs/
    ├── twilio/
    ├── serpapi/
    └── push-notifications/
```

This unified architecture ensures:
- **Single Database** for both apps
- **Role-Based Security** 
- **Real-time Synchronization**
- **Scalable Service Architecture**
- **Perfect Integration** with existing vendor app

**Ready to implement the complete backend system based on this architecture!** 🚀
