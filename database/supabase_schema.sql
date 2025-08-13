-- =====================================================
-- ENTERPRISE SAAS PLATFORM DATABASE SCHEMA
-- Complete integration for marketing_end_to_end_solution
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =====================================================
-- UNIQUE VENDOR IDS TABLE (For vendor registration system)
-- =====================================================
CREATE TABLE unique_vendor_ids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unique_id VARCHAR(20) UNIQUE NOT NULL, -- Format: VND-XXXXXX
    user_id UUID NOT NULL, -- Admin user who generated this ID

    -- Usage tracking
    is_used BOOLEAN DEFAULT false,
    used_by_vendor_id UUID, -- References user_profiles(id) when used
    used_at TIMESTAMP WITH TIME ZONE,

    -- Expiry
    expires_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- USER PROFILES TABLE (Shared between admin and vendors)
-- =====================================================
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'vendor', 'customer')),

    -- Vendor-specific fields
    unique_vendor_id VARCHAR(20), -- Links to unique_vendor_ids.unique_id
    user_id UUID, -- Admin user who owns this vendor (for role='vendor')
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'blocked')),
    services TEXT[], -- Array of services offered
    service_area JSONB, -- {latitude, longitude, radius}
    working_hours JSONB, -- Weekly schedule
    is_online BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_seen TIMESTAMP WITH TIME ZONE,

    -- Registration info
    registered_via_app BOOLEAN DEFAULT false,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID, -- Admin user who verified this vendor

    -- Performance metrics
    orders_stats JSONB DEFAULT '{"total": 0, "completed": 0, "pending": 0, "canceled": 0, "rating": 0}',

    -- Device information
    device_tokens TEXT[], -- FCM tokens for push notifications

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ORDERS TABLE (Complete order lifecycle)
-- =====================================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id VARCHAR(50) UNIQUE NOT NULL, -- Human-readable ID like ORD001
    
    -- Business information (from vendor selection agent)
    business_name VARCHAR(255) NOT NULL,
    
    -- Customer information
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    customer_address TEXT NOT NULL,
    customer_location JSONB, -- {latitude, longitude}
    
    -- Service details
    service_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Vendor assignment
    vendor_id UUID REFERENCES user_profiles(id),
    assigned_vendors TEXT[], -- Array of vendor IDs initially selected
    
    -- Pricing
    estimated_value DECIMAL(10,2) DEFAULT 0,
    dealing_price DECIMAL(10,2), -- Final negotiated price
    price_package VARCHAR(100), -- Package type if applicable
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'pending', 'accepted', 'on_way', 'processing', 'completed', 'cancelled', 'declined')),
    
    -- Images
    before_image_url TEXT,
    after_image_url TEXT,
    
    -- Invoice data
    invoice JSONB, -- Complete invoice information
    
    -- Integration references
    conversation_id VARCHAR(100), -- Link to conversation data
    trigger_point_id VARCHAR(100), -- Link to trigger point
    user_id UUID NOT NULL, -- Admin user who created this
    
    -- Scheduling
    scheduled_date TIMESTAMP WITH TIME ZONE,
    
    -- Timeline tracking
    assigned_at TIMESTAMP WITH TIME ZONE,
    on_way_at TIMESTAMP WITH TIME ZONE,
    processing_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_by_role VARCHAR(20) DEFAULT 'admin' CHECK (created_by_role IN ('admin', 'agent', 'vendor')),
    updated_by_role VARCHAR(20) DEFAULT 'admin' CHECK (updated_by_role IN ('admin', 'agent', 'vendor')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CONVERSATIONS TABLE (Calling agent data)
-- =====================================================
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    
    -- Calling system information
    calling_system VARCHAR(50) NOT NULL, -- 'elevenlabs', 'twilio', etc.
    
    -- Conversation data
    conversation_data JSONB NOT NULL, -- Complete conversation transcript
    analysis_result JSONB, -- AI analysis results
    
    -- Trigger detection
    triggers_detected TEXT[], -- Array of detected triggers
    vendor_selection_triggered BOOLEAN DEFAULT false,
    vendor_selection_result JSONB, -- Vendor selection results
    
    -- Performance metrics
    processing_time_ms INTEGER DEFAULT 0,
    cache_status VARCHAR(20) DEFAULT 'miss',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TRIGGER POINTS TABLE (Vendor selection agent data)
-- =====================================================
CREATE TABLE trigger_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trigger_id VARCHAR(100) UNIQUE NOT NULL,
    trigger_name VARCHAR(255) NOT NULL,
    
    -- Business and location data
    business_name VARCHAR(255) NOT NULL,
    location TEXT NOT NULL,
    work_needed TEXT NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    
    -- Vendor selection results
    selected_vendors TEXT[] NOT NULL, -- Array of vendor IDs
    vendor_count INTEGER NOT NULL,
    
    -- Pricing information
    estimated_value DECIMAL(10,2) DEFAULT 0,
    price_package VARCHAR(100),
    
    -- Integration references
    conversation_id VARCHAR(100),
    order_id VARCHAR(50),
    user_id UUID NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    
    -- Metadata
    created_by_role VARCHAR(20) DEFAULT 'agent' CHECK (created_by_role IN ('admin', 'agent')),
    
    -- Timestamps
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- VENDOR NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE vendor_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES user_profiles(id),
    
    -- Notification content
    type VARCHAR(50) NOT NULL, -- 'new_order', 'order_assigned', 'order_update', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Related data
    order_id VARCHAR(50),
    trigger_point_id VARCHAR(100),
    data JSONB, -- Additional notification data
    
    -- Status
    read BOOLEAN DEFAULT false,
    delivered BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- VENDOR AUTHORIZATION STATUS TABLE
-- =====================================================
CREATE TABLE vendor_authorization_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES user_profiles(id),
    user_id UUID NOT NULL REFERENCES user_profiles(id), -- Admin who owns this vendor

    -- Authorization status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'suspended')),

    -- Blocking information
    blocked_at TIMESTAMP WITH TIME ZONE,
    blocked_by UUID REFERENCES user_profiles(id),
    blocked_reason TEXT,

    -- Reactivation information
    reactivated_at TIMESTAMP WITH TIME ZONE,
    reactivated_by UUID REFERENCES user_profiles(id),

    -- Access controls
    notification_blocked BOOLEAN DEFAULT false,
    order_assignment_blocked BOOLEAN DEFAULT false,

    -- Tracking
    last_status_change TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(vendor_id)
);

-- =====================================================
-- BLOCKED VENDORS TABLE (Separate list for blocked vendors)
-- =====================================================
CREATE TABLE blocked_vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES user_profiles(id),
    vendor_name VARCHAR(255) NOT NULL,
    vendor_email VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL REFERENCES user_profiles(id), -- Admin who owns this vendor

    -- Blocking information
    blocked_at TIMESTAMP WITH TIME ZONE NOT NULL,
    blocked_by UUID NOT NULL REFERENCES user_profiles(id),
    blocked_reason TEXT NOT NULL,

    -- Vendor data snapshot
    services TEXT[],
    orders_stats JSONB,
    vendor_data JSONB, -- Complete vendor data for restoration

    -- Reactivation control
    can_reactivate BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(vendor_id)
);

-- =====================================================
-- BUSINESS INFORMATION TABLE (For billing settings)
-- =====================================================
CREATE TABLE business_information (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id),

    -- Business details
    business_name VARCHAR(255) NOT NULL,
    business_address TEXT NOT NULL,
    business_phone VARCHAR(20) NOT NULL,
    business_email VARCHAR(255) NOT NULL,
    business_website VARCHAR(255),
    tax_id VARCHAR(50),
    logo_url TEXT,

    -- Payment details
    payment_terms TEXT DEFAULT 'Payment due within 15 days',
    payment_methods TEXT[] DEFAULT ARRAY['Cash', 'Card'],
    bank_details JSONB, -- {bank_name, account_number, routing_number}

    -- Invoice settings
    invoice_template VARCHAR(20) DEFAULT 'modern' CHECK (invoice_template IN ('modern', 'classic', 'vibrant')),
    invoice_prefix VARCHAR(10) DEFAULT 'INV-',
    invoice_counter INTEGER DEFAULT 1,
    currency_symbol VARCHAR(5) DEFAULT '$',

    -- Service details
    service_details TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id)
);

-- =====================================================
-- INVOICES TABLE (Generated invoices)
-- =====================================================
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    order_id VARCHAR(50) NOT NULL REFERENCES orders(order_id),
    user_id UUID NOT NULL REFERENCES user_profiles(id),
    vendor_id UUID NOT NULL REFERENCES user_profiles(id),

    -- Business information snapshot
    business_info JSONB NOT NULL,

    -- Customer information
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20) NOT NULL,
    customer_address TEXT NOT NULL,

    -- Service information
    service_type VARCHAR(100) NOT NULL,
    service_description TEXT NOT NULL,
    work_completed_date TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Pricing
    estimated_price DECIMAL(10,2) NOT NULL,
    final_price DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,

    -- Images
    before_images TEXT[],
    after_images TEXT[],

    -- Invoice details
    invoice_date TIMESTAMP WITH TIME ZONE NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),

    -- Generated files
    pdf_url TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- VENDOR PERFORMANCE METRICS TABLE
-- =====================================================
CREATE TABLE vendor_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES user_profiles(id),

    -- Performance data
    metric_date DATE NOT NULL,
    orders_received INTEGER DEFAULT 0,
    orders_accepted INTEGER DEFAULT 0,
    orders_completed INTEGER DEFAULT 0,
    orders_cancelled INTEGER DEFAULT 0,

    -- Response times (in minutes)
    avg_response_time DECIMAL(10,2) DEFAULT 0,
    avg_completion_time DECIMAL(10,2) DEFAULT 0,

    -- Financial metrics
    total_earnings DECIMAL(10,2) DEFAULT 0,
    avg_order_value DECIMAL(10,2) DEFAULT 0,

    -- Customer satisfaction
    avg_rating DECIMAL(3,2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(vendor_id, metric_date)
);

-- =====================================================
-- FUNCTIONS FOR INVOICE COUNTER
-- =====================================================
CREATE OR REPLACE FUNCTION increment_invoice_counter()
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT invoice_counter + 1);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Add foreign key constraints
ALTER TABLE unique_vendor_ids
ADD CONSTRAINT fk_unique_vendor_ids_user_id
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE unique_vendor_ids
ADD CONSTRAINT fk_unique_vendor_ids_used_by_vendor
FOREIGN KEY (used_by_vendor_id) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE user_profiles
ADD CONSTRAINT fk_user_profiles_user_id
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE user_profiles
ADD CONSTRAINT fk_user_profiles_verified_by
FOREIGN KEY (verified_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Unique vendor IDs indexes
CREATE INDEX idx_unique_vendor_ids_unique_id ON unique_vendor_ids(unique_id);
CREATE INDEX idx_unique_vendor_ids_user_id ON unique_vendor_ids(user_id);
CREATE INDEX idx_unique_vendor_ids_is_used ON unique_vendor_ids(is_used);
CREATE INDEX idx_unique_vendor_ids_expires_at ON unique_vendor_ids(expires_at);

-- Orders table indexes
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_vendor_id ON orders(vendor_id);
CREATE INDEX idx_orders_customer_name ON orders(customer_name);
CREATE INDEX idx_orders_service_type ON orders(service_type);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_order_id ON orders(order_id);

-- User profiles indexes
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_is_online ON user_profiles(is_online);
CREATE INDEX idx_user_profiles_unique_vendor_id ON user_profiles(unique_vendor_id);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_status ON user_profiles(status);

-- Conversations indexes
CREATE INDEX idx_conversations_conversation_id ON conversations(conversation_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);

-- Trigger points indexes
CREATE INDEX idx_trigger_points_trigger_id ON trigger_points(trigger_id);
CREATE INDEX idx_trigger_points_service_type ON trigger_points(service_type);
CREATE INDEX idx_trigger_points_status ON trigger_points(status);

-- Vendor notifications indexes
CREATE INDEX idx_vendor_notifications_vendor_id ON vendor_notifications(vendor_id);
CREATE INDEX idx_vendor_notifications_read ON vendor_notifications(read);
CREATE INDEX idx_vendor_notifications_type ON vendor_notifications(type);

-- Vendor authorization status indexes
CREATE INDEX idx_vendor_authorization_status_vendor_id ON vendor_authorization_status(vendor_id);
CREATE INDEX idx_vendor_authorization_status_user_id ON vendor_authorization_status(user_id);
CREATE INDEX idx_vendor_authorization_status_status ON vendor_authorization_status(status);
CREATE INDEX idx_vendor_authorization_status_blocked_at ON vendor_authorization_status(blocked_at);

-- Blocked vendors indexes
CREATE INDEX idx_blocked_vendors_vendor_id ON blocked_vendors(vendor_id);
CREATE INDEX idx_blocked_vendors_user_id ON blocked_vendors(user_id);
CREATE INDEX idx_blocked_vendors_blocked_at ON blocked_vendors(blocked_at);
CREATE INDEX idx_blocked_vendors_blocked_by ON blocked_vendors(blocked_by);

-- Business information indexes
CREATE INDEX idx_business_information_user_id ON business_information(user_id);

-- Invoices indexes
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_order_id ON invoices(order_id);
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_vendor_id ON invoices(vendor_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE unique_vendor_ids ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trigger_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_authorization_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Unique vendor IDs policies
CREATE POLICY "Users can view their own unique vendor IDs" ON unique_vendor_ids
    FOR SELECT USING (user_id = auth.uid() OR auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin'));

CREATE POLICY "Users can create unique vendor IDs" ON unique_vendor_ids
    FOR INSERT WITH CHECK (user_id = auth.uid() OR auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin'));

CREATE POLICY "Users can update their own unique vendor IDs" ON unique_vendor_ids
    FOR UPDATE USING (user_id = auth.uid() OR auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin'));

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Orders policies
CREATE POLICY "Vendors can view their assigned orders" ON orders
    FOR SELECT USING (vendor_id = auth.uid() OR auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin'));

CREATE POLICY "Vendors can update their assigned orders" ON orders
    FOR UPDATE USING (vendor_id = auth.uid());

-- Vendor notifications policies
CREATE POLICY "Vendors can view their notifications" ON vendor_notifications
    FOR SELECT USING (vendor_id = auth.uid());

CREATE POLICY "Vendors can update their notifications" ON vendor_notifications
    FOR UPDATE USING (vendor_id = auth.uid());

-- Vendor authorization status policies
CREATE POLICY "Users can view their vendors' authorization status" ON vendor_authorization_status
    FOR SELECT USING (user_id = auth.uid() OR auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin'));

CREATE POLICY "Users can manage their vendors' authorization status" ON vendor_authorization_status
    FOR ALL USING (user_id = auth.uid() OR auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin'));

-- Blocked vendors policies
CREATE POLICY "Users can view their blocked vendors" ON blocked_vendors
    FOR SELECT USING (user_id = auth.uid() OR auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin'));

CREATE POLICY "Users can manage their blocked vendors" ON blocked_vendors
    FOR ALL USING (user_id = auth.uid() OR auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin'));

-- Business information policies
CREATE POLICY "Users can view their business information" ON business_information
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their business information" ON business_information
    FOR ALL USING (user_id = auth.uid());

-- Invoices policies
CREATE POLICY "Users can view their invoices" ON invoices
    FOR SELECT USING (user_id = auth.uid() OR vendor_id = auth.uid());

CREATE POLICY "Users can create invoices" ON invoices
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their invoices" ON invoices
    FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trigger_points_updated_at BEFORE UPDATE ON trigger_points FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendor_performance_metrics_updated_at BEFORE UPDATE ON vendor_performance_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample admin user
INSERT INTO user_profiles (id, email, full_name, role) VALUES 
('00000000-0000-0000-0000-000000000001', 'admin@example.com', 'System Admin', 'admin');

-- Insert sample unique vendor IDs
INSERT INTO unique_vendor_ids (id, unique_id, user_id, is_used, expires_at) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'VND-ABC123', '00000000-0000-0000-0000-000000000001', true, '2025-12-31 23:59:59+00'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'VND-DEF456', '00000000-0000-0000-0000-000000000001', true, '2025-12-31 23:59:59+00'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'VND-GHI789', '00000000-0000-0000-0000-000000000001', true, '2025-12-31 23:59:59+00'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'VND-JKL012', '00000000-0000-0000-0000-000000000001', false, '2025-12-31 23:59:59+00'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'VND-MNO345', '00000000-0000-0000-0000-000000000001', false, '2025-12-31 23:59:59+00');

-- Insert sample vendors
INSERT INTO user_profiles (id, email, full_name, phone, role, unique_vendor_id, user_id, status, services, service_area, is_online, is_active, registered_via_app, verified_at, verified_by) VALUES
('11111111-1111-1111-1111-111111111111', 'john.doe@example.com', 'John Doe', '+1-555-0101', 'vendor', 'VND-ABC123', '00000000-0000-0000-0000-000000000001', 'verified',
 ARRAY['AC Repair', 'HVAC Service'],
 '{"latitude": 40.7128, "longitude": -74.0060, "radius": 25}', true, true, true, NOW(), '00000000-0000-0000-0000-000000000001'),
('22222222-2222-2222-2222-222222222222', 'jane.smith@example.com', 'Jane Smith', '+1-555-0102', 'vendor', 'VND-DEF456', '00000000-0000-0000-0000-000000000001', 'verified',
 ARRAY['Electrical Work', 'Wiring'],
 '{"latitude": 40.7589, "longitude": -73.9851, "radius": 20}', true, true, true, NOW(), '00000000-0000-0000-0000-000000000001'),
('33333333-3333-3333-3333-333333333333', 'mike.wilson@example.com', 'Mike Wilson', '+1-555-0103', 'vendor', 'VND-GHI789', '00000000-0000-0000-0000-000000000001', 'pending',
 ARRAY['Plumbing', 'Pipe Repair'],
 '{"latitude": 40.6782, "longitude": -73.9442, "radius": 30}', false, true, true, NULL, NULL);

-- Update unique vendor IDs to mark them as used
UPDATE unique_vendor_ids SET is_used = true, used_by_vendor_id = '11111111-1111-1111-1111-111111111111', used_at = NOW() WHERE unique_id = 'VND-ABC123';
UPDATE unique_vendor_ids SET is_used = true, used_by_vendor_id = '22222222-2222-2222-2222-222222222222', used_at = NOW() WHERE unique_id = 'VND-DEF456';
UPDATE unique_vendor_ids SET is_used = true, used_by_vendor_id = '33333333-3333-3333-3333-333333333333', used_at = NOW() WHERE unique_id = 'VND-GHI789';

-- =====================================================
-- REAL-TIME SUBSCRIPTIONS SETUP
-- =====================================================

-- Enable real-time for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE vendor_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
