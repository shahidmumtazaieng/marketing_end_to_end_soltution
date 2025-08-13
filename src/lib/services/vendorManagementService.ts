/**
 * Enhanced Vendor Management Service with Unique ID System
 * Manages vendor registration, verification, and unique ID generation
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your_supabase_url_here';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_supabase_service_key_here';

export interface VendorProfile {
  id: string;
  unique_vendor_id: string; // The special ID for vendor registration
  user_id: string; // Admin user who owns this vendor
  full_name: string;
  email: string;
  phone: string;
  avatar_url?: string;
  status: 'pending' | 'verified' | 'blocked';
  
  // Services and location
  services: string[];
  service_area: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  
  // Performance metrics
  orders_stats: {
    total: number;
    completed: number;
    pending: number;
    canceled: number;
    rating: number;
  };
  
  // Availability
  is_online: boolean;
  is_active: boolean;
  last_seen: string;
  
  // Registration info
  registered_via_app: boolean;
  registration_date: string;
  verified_at?: string;
  verified_by?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface UniqueVendorId {
  id: string;
  unique_id: string; // The actual unique ID (like VND-ABC123)
  user_id: string; // Admin user who generated this ID
  is_used: boolean;
  used_by_vendor_id?: string;
  used_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

class VendorManagementService {
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
      const { data, error } = await this.supabase.from('user_profiles').select('count').limit(1);
      if (error) throw error;
      
      this.isInitialized = true;
      console.log('✅ Vendor Management Service initialized');
    } catch (error) {
      console.error('❌ Vendor Management Service initialization failed:', error);
      throw error;
    }
  }

  // ==========================================
  // UNIQUE ID MANAGEMENT
  // ==========================================

  /**
   * Generate a unique vendor ID for user
   */
  async generateUniqueVendorId(userId: string): Promise<UniqueVendorId> {
    try {
      // Generate unique ID with format: VND-XXXXXX
      const uniqueId = `VND-${nanoid(6).toUpperCase()}`;
      
      // Check if ID already exists (very unlikely but safety check)
      const { data: existing } = await this.supabase
        .from('unique_vendor_ids')
        .select('id')
        .eq('unique_id', uniqueId)
        .single();

      if (existing) {
        // Recursively generate new ID if collision
        return this.generateUniqueVendorId(userId);
      }

      // Create unique ID record
      const uniqueVendorId: Omit<UniqueVendorId, 'id'> = {
        unique_id: uniqueId,
        user_id: userId,
        is_used: false,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year expiry
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await this.supabase
        .from('unique_vendor_ids')
        .insert(uniqueVendorId)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Generated unique vendor ID: ${uniqueId} for user: ${userId}`);
      return data;
    } catch (error) {
      console.error('Error generating unique vendor ID:', error);
      throw error;
    }
  }

  /**
   * Validate unique vendor ID
   */
  async validateUniqueVendorId(uniqueId: string): Promise<{
    valid: boolean;
    message: string;
    data?: UniqueVendorId;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('unique_vendor_ids')
        .select('*')
        .eq('unique_id', uniqueId)
        .single();

      if (error || !data) {
        return {
          valid: false,
          message: 'Invalid unique vendor ID. Please check the ID and try again.',
        };
      }

      if (data.is_used) {
        return {
          valid: false,
          message: 'This unique vendor ID has already been used for registration.',
        };
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return {
          valid: false,
          message: 'This unique vendor ID has expired. Please contact your admin for a new ID.',
        };
      }

      return {
        valid: true,
        message: 'Valid unique vendor ID.',
        data,
      };
    } catch (error) {
      console.error('Error validating unique vendor ID:', error);
      return {
        valid: false,
        message: 'Error validating unique vendor ID. Please try again.',
      };
    }
  }

  /**
   * Mark unique vendor ID as used
   */
  async markUniqueVendorIdAsUsed(uniqueId: string, vendorId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('unique_vendor_ids')
        .update({
          is_used: true,
          used_by_vendor_id: vendorId,
          used_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('unique_id', uniqueId);

      if (error) throw error;

      console.log(`✅ Marked unique vendor ID ${uniqueId} as used by vendor ${vendorId}`);
    } catch (error) {
      console.error('Error marking unique vendor ID as used:', error);
      throw error;
    }
  }

  // ==========================================
  // VENDOR MANAGEMENT
  // ==========================================

  /**
   * Get all vendors for a user
   */
  async getUserVendors(userId: string): Promise<VendorProfile[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'vendor')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching user vendors:', error);
      throw error;
    }
  }

  /**
   * Get vendor by unique ID
   */
  async getVendorByUniqueId(uniqueId: string): Promise<VendorProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('unique_vendor_id', uniqueId)
        .eq('role', 'vendor')
        .single();

      if (error) return null;
      return data;
    } catch (error) {
      console.error('Error fetching vendor by unique ID:', error);
      return null;
    }
  }

  /**
   * Register vendor via mobile app
   */
  async registerVendorViaApp(vendorData: {
    unique_vendor_id: string;
    full_name: string;
    email: string;
    phone: string;
    services: string[];
    service_area: {
      latitude: number;
      longitude: number;
      radius: number;
    };
  }): Promise<VendorProfile> {
    try {
      // Validate unique vendor ID
      const validation = await this.validateUniqueVendorId(vendorData.unique_vendor_id);
      if (!validation.valid) {
        throw new Error(validation.message);
      }

      // Get the unique ID data to find the user_id
      const uniqueIdData = validation.data!;

      // Create vendor profile
      const vendorProfile: Omit<VendorProfile, 'id'> = {
        unique_vendor_id: vendorData.unique_vendor_id,
        user_id: uniqueIdData.user_id,
        full_name: vendorData.full_name,
        email: vendorData.email,
        phone: vendorData.phone,
        status: 'pending',
        services: vendorData.services,
        service_area: vendorData.service_area,
        orders_stats: {
          total: 0,
          completed: 0,
          pending: 0,
          canceled: 0,
          rating: 0,
        },
        is_online: false,
        is_active: true,
        last_seen: new Date().toISOString(),
        registered_via_app: true,
        registration_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Insert vendor profile
      const { data, error } = await this.supabase
        .from('user_profiles')
        .insert({
          ...vendorProfile,
          role: 'vendor',
        })
        .select()
        .single();

      if (error) throw error;

      // Mark unique ID as used
      await this.markUniqueVendorIdAsUsed(vendorData.unique_vendor_id, data.id);

      console.log(`✅ Vendor registered via app: ${vendorData.full_name} with ID: ${vendorData.unique_vendor_id}`);
      return data;
    } catch (error) {
      console.error('Error registering vendor via app:', error);
      throw error;
    }
  }

  /**
   * Update vendor status (verify, block, etc.)
   */
  async updateVendorStatus(
    vendorId: string,
    status: 'pending' | 'verified' | 'blocked',
    verifiedBy?: string
  ): Promise<VendorProfile> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'verified') {
        updateData.verified_at = new Date().toISOString();
        updateData.verified_by = verifiedBy;
      }

      const { data, error } = await this.supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', vendorId)
        .eq('role', 'vendor')
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Vendor ${vendorId} status updated to: ${status}`);
      return data;
    } catch (error) {
      console.error('Error updating vendor status:', error);
      throw error;
    }
  }

  /**
   * Get user's unique vendor IDs
   */
  async getUserUniqueVendorIds(userId: string): Promise<UniqueVendorId[]> {
    try {
      const { data, error } = await this.supabase
        .from('unique_vendor_ids')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching user unique vendor IDs:', error);
      throw error;
    }
  }

  /**
   * Delete vendor (admin only)
   */
  async deleteVendor(vendorId: string, userId: string): Promise<void> {
    try {
      // Verify vendor belongs to user
      const { data: vendor, error: fetchError } = await this.supabase
        .from('user_profiles')
        .select('user_id, unique_vendor_id')
        .eq('id', vendorId)
        .eq('role', 'vendor')
        .single();

      if (fetchError || !vendor) {
        throw new Error('Vendor not found');
      }

      if (vendor.user_id !== userId) {
        throw new Error('Unauthorized: Vendor does not belong to this user');
      }

      // Delete vendor profile
      const { error: deleteError } = await this.supabase
        .from('user_profiles')
        .delete()
        .eq('id', vendorId);

      if (deleteError) throw deleteError;

      // Mark unique ID as unused (allow reuse)
      if (vendor.unique_vendor_id) {
        await this.supabase
          .from('unique_vendor_ids')
          .update({
            is_used: false,
            used_by_vendor_id: null,
            used_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('unique_id', vendor.unique_vendor_id);
      }

      console.log(`✅ Vendor ${vendorId} deleted successfully`);
    } catch (error) {
      console.error('Error deleting vendor:', error);
      throw error;
    }
  }
}

export const vendorManagementService = new VendorManagementService();
export default vendorManagementService;
