/**
 * Enhanced Vendor Authorization Service
 * Manages vendor blocking/activation and authorization status
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import vendorManagementService from './vendorManagementService';

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your_supabase_url_here';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_supabase_service_key_here';

export interface VendorAuthorizationStatus {
  vendor_id: string;
  user_id: string; // Admin who owns this vendor
  status: 'active' | 'blocked' | 'suspended';
  blocked_at?: string;
  blocked_by?: string;
  blocked_reason?: string;
  reactivated_at?: string;
  reactivated_by?: string;
  notification_blocked: boolean;
  order_assignment_blocked: boolean;
  last_status_change: string;
}

export interface BlockedVendor {
  id: string;
  vendor_id: string;
  vendor_name: string;
  vendor_email: string;
  user_id: string;
  blocked_at: string;
  blocked_by: string;
  blocked_reason: string;
  services: string[];
  orders_stats: any;
  can_reactivate: boolean;
}

class VendorAuthorizationService {
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
      const { data, error } = await this.supabase.from('vendor_authorization_status').select('count').limit(1);
      if (error && !error.message.includes('does not exist')) throw error;
      
      this.isInitialized = true;
      console.log('✅ Vendor Authorization Service initialized');
    } catch (error) {
      console.error('❌ Vendor Authorization Service initialization failed:', error);
      throw error;
    }
  }

  // ==========================================
  // VENDOR BLOCKING/ACTIVATION
  // ==========================================

  /**
   * Block vendor and move to blocked vendors list
   */
  async blockVendor(
    vendorId: string, 
    blockedBy: string, 
    reason: string = 'Administrative action'
  ): Promise<void> {
    try {
      // Start transaction-like operations
      
      // 1. Update vendor status to blocked
      const { error: updateError } = await this.supabase
        .from('user_profiles')
        .update({
          status: 'blocked',
          is_active: false,
          is_online: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vendorId)
        .eq('role', 'vendor');

      if (updateError) throw updateError;

      // 2. Create/update authorization status record
      const authStatus: Omit<VendorAuthorizationStatus, 'vendor_id'> = {
        user_id: '', // Will be filled from vendor data
        status: 'blocked',
        blocked_at: new Date().toISOString(),
        blocked_by: blockedBy,
        blocked_reason: reason,
        notification_blocked: true,
        order_assignment_blocked: true,
        last_status_change: new Date().toISOString(),
      };

      // Get vendor data to find user_id
      const { data: vendor, error: vendorError } = await this.supabase
        .from('user_profiles')
        .select('user_id')
        .eq('id', vendorId)
        .single();

      if (vendorError) throw vendorError;

      authStatus.user_id = vendor.user_id;

      // Upsert authorization status
      const { error: authError } = await this.supabase
        .from('vendor_authorization_status')
        .upsert({
          vendor_id: vendorId,
          ...authStatus,
        });

      if (authError) throw authError;

      // 3. Move vendor to blocked vendors table
      await this.moveVendorToBlockedList(vendorId, blockedBy, reason);

      // 4. Cancel all pending orders for this vendor
      await this.cancelPendingOrders(vendorId, 'Vendor blocked by admin');

      // 5. Send notification to vendor app (if connected)
      await this.notifyVendorStatusChange(vendorId, 'blocked', reason);

      console.log(`✅ Vendor ${vendorId} blocked successfully`);
    } catch (error) {
      console.error('Error blocking vendor:', error);
      throw error;
    }
  }

  /**
   * Reactivate blocked vendor
   */
  async reactivateVendor(
    vendorId: string, 
    reactivatedBy: string
  ): Promise<void> {
    try {
      // 1. Update vendor status to verified/active
      const { error: updateError } = await this.supabase
        .from('user_profiles')
        .update({
          status: 'verified',
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vendorId)
        .eq('role', 'vendor');

      if (updateError) throw updateError;

      // 2. Update authorization status
      const { error: authError } = await this.supabase
        .from('vendor_authorization_status')
        .update({
          status: 'active',
          reactivated_at: new Date().toISOString(),
          reactivated_by: reactivatedBy,
          notification_blocked: false,
          order_assignment_blocked: false,
          last_status_change: new Date().toISOString(),
        })
        .eq('vendor_id', vendorId);

      if (authError) throw authError;

      // 3. Remove from blocked vendors table
      await this.removeVendorFromBlockedList(vendorId);

      // 4. Send reactivation notification to vendor app
      await this.notifyVendorStatusChange(vendorId, 'active', 'Your account has been reactivated');

      console.log(`✅ Vendor ${vendorId} reactivated successfully`);
    } catch (error) {
      console.error('Error reactivating vendor:', error);
      throw error;
    }
  }

  /**
   * Move vendor to blocked vendors list
   */
  private async moveVendorToBlockedList(
    vendorId: string, 
    blockedBy: string, 
    reason: string
  ): Promise<void> {
    try {
      // Get vendor details
      const { data: vendor, error: vendorError } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', vendorId)
        .single();

      if (vendorError) throw vendorError;

      // Insert into blocked vendors table
      const blockedVendorData = {
        vendor_id: vendorId,
        vendor_name: vendor.full_name,
        vendor_email: vendor.email,
        user_id: vendor.user_id,
        blocked_at: new Date().toISOString(),
        blocked_by: blockedBy,
        blocked_reason: reason,
        services: vendor.services,
        orders_stats: vendor.orders_stats,
        can_reactivate: true,
        vendor_data: vendor, // Store complete vendor data for restoration
      };

      const { error: insertError } = await this.supabase
        .from('blocked_vendors')
        .insert(blockedVendorData);

      if (insertError) throw insertError;

      console.log(`✅ Vendor ${vendorId} moved to blocked list`);
    } catch (error) {
      console.error('Error moving vendor to blocked list:', error);
      throw error;
    }
  }

  /**
   * Remove vendor from blocked vendors list
   */
  private async removeVendorFromBlockedList(vendorId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('blocked_vendors')
        .delete()
        .eq('vendor_id', vendorId);

      if (error) throw error;

      console.log(`✅ Vendor ${vendorId} removed from blocked list`);
    } catch (error) {
      console.error('Error removing vendor from blocked list:', error);
      throw error;
    }
  }

  // ==========================================
  // VENDOR SELECTION AGENT INTEGRATION
  // ==========================================

  /**
   * Get active vendors for vendor selection agent
   * Only returns vendors that are not blocked
   */
  async getActiveVendorsForSelection(
    serviceType: string,
    customerLocation: { latitude: number; longitude: number },
    userId?: string
  ): Promise<any[]> {
    try {
      let query = this.supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'vendor')
        .eq('status', 'verified')
        .eq('is_active', true)
        .contains('services', [serviceType]);

      // If userId provided, only get vendors for that user
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: vendors, error } = await query;
      if (error) throw error;

      // Filter out blocked vendors
      const activeVendors = vendors?.filter(vendor => {
        // Check if vendor is not in blocked status
        return vendor.status !== 'blocked';
      }) || [];

      // Calculate distances and sort by intelligent criteria
      const vendorsWithDistance = activeVendors.map(vendor => {
        const distance = this.calculateDistance(
          customerLocation.latitude,
          customerLocation.longitude,
          vendor.service_area.latitude,
          vendor.service_area.longitude
        );

        return {
          ...vendor,
          distance_km: distance,
          in_service_area: distance <= (vendor.service_area.radius || 25),
        };
      });

      // Filter vendors within service area
      const availableVendors = vendorsWithDistance.filter(v => v.in_service_area);

      // Apply intelligent selection algorithm
      return this.applyIntelligentVendorSelection(availableVendors);
    } catch (error) {
      console.error('Error getting active vendors for selection:', error);
      throw error;
    }
  }

  /**
   * Intelligent vendor selection algorithm
   * Balances performance, location, and opportunity for new vendors
   */
  private applyIntelligentVendorSelection(vendors: any[]): any[] {
    if (vendors.length === 0) return [];

    // Sort vendors by multiple criteria
    const sortedVendors = vendors.sort((a, b) => {
      // 1. Distance (closer is better)
      const distanceScore = a.distance_km - b.distance_km;
      
      // 2. Performance score (completion rate + rating)
      const aPerformance = this.calculatePerformanceScore(a.orders_stats);
      const bPerformance = this.calculatePerformanceScore(b.orders_stats);
      const performanceScore = bPerformance - aPerformance;
      
      // 3. Opportunity score (favor newer/less busy vendors occasionally)
      const aOpportunity = this.calculateOpportunityScore(a.orders_stats);
      const bOpportunity = this.calculateOpportunityScore(b.orders_stats);
      const opportunityScore = bOpportunity - aOpportunity;
      
      // 4. Online status (online vendors get priority)
      const onlineScore = (b.is_online ? 1 : 0) - (a.is_online ? 1 : 0);

      // Weighted scoring system
      const totalScore = 
        (distanceScore * 0.3) +      // 30% distance
        (performanceScore * 0.4) +   // 40% performance
        (opportunityScore * 0.2) +   // 20% opportunity
        (onlineScore * 0.1);         // 10% online status

      return totalScore;
    });

    // Apply randomization for opportunity (10% chance to shuffle top vendors)
    if (Math.random() < 0.1 && sortedVendors.length > 1) {
      // Shuffle top 3 vendors to give opportunity to newer vendors
      const topVendors = sortedVendors.slice(0, Math.min(3, sortedVendors.length));
      const remainingVendors = sortedVendors.slice(3);
      
      // Fisher-Yates shuffle for top vendors
      for (let i = topVendors.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [topVendors[i], topVendors[j]] = [topVendors[j], topVendors[i]];
      }
      
      return [...topVendors, ...remainingVendors];
    }

    return sortedVendors;
  }

  /**
   * Calculate performance score based on vendor stats
   */
  private calculatePerformanceScore(stats: any): number {
    if (!stats || stats.total === 0) return 0;

    const completionRate = stats.completed / stats.total;
    const rating = stats.rating || 0;
    const cancelRate = stats.canceled / stats.total;

    // Performance score (0-100)
    return (completionRate * 50) + (rating * 10) - (cancelRate * 20);
  }

  /**
   * Calculate opportunity score (favor newer/less busy vendors)
   */
  private calculateOpportunityScore(stats: any): number {
    if (!stats) return 100; // New vendors get high opportunity score

    const totalOrders = stats.total || 0;
    const pendingOrders = stats.pending || 0;

    // Higher score for vendors with fewer total orders or less pending work
    const newVendorBonus = totalOrders < 10 ? 50 : 0;
    const availabilityBonus = pendingOrders < 3 ? 30 : 0;

    return newVendorBonus + availabilityBonus;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
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

  // ==========================================
  // NOTIFICATION MANAGEMENT
  // ==========================================

  /**
   * Cancel pending orders for blocked vendor
   */
  private async cancelPendingOrders(vendorId: string, reason: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('vendor_id', vendorId)
        .in('status', ['accepted', 'on_way', 'processing']);

      if (error) throw error;

      console.log(`✅ Cancelled pending orders for vendor ${vendorId}`);
    } catch (error) {
      console.error('Error cancelling pending orders:', error);
    }
  }

  /**
   * Notify vendor app about status change
   */
  private async notifyVendorStatusChange(
    vendorId: string, 
    status: 'blocked' | 'active', 
    message: string
  ): Promise<void> {
    try {
      // Create notification record
      const notification = {
        vendor_id: vendorId,
        type: status === 'blocked' ? 'account_blocked' : 'account_reactivated',
        title: status === 'blocked' ? 'Account Blocked' : 'Account Reactivated',
        message: message,
        data: {
          status: status,
          timestamp: new Date().toISOString(),
        },
        read: false,
        delivered: false,
      };

      const { error } = await this.supabase
        .from('vendor_notifications')
        .insert(notification);

      if (error) throw error;

      console.log(`✅ Notification sent to vendor ${vendorId}: ${status}`);
    } catch (error) {
      console.error('Error sending vendor notification:', error);
    }
  }

  // ==========================================
  // BLOCKED VENDORS MANAGEMENT
  // ==========================================

  /**
   * Get blocked vendors for a user
   */
  async getBlockedVendors(userId: string): Promise<BlockedVendor[]> {
    try {
      const { data, error } = await this.supabase
        .from('blocked_vendors')
        .select('*')
        .eq('user_id', userId)
        .order('blocked_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching blocked vendors:', error);
      throw error;
    }
  }

  /**
   * Check if vendor is authorized for order assignment
   */
  async isVendorAuthorizedForOrders(vendorId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('vendor_authorization_status')
        .select('order_assignment_blocked')
        .eq('vendor_id', vendorId)
        .single();

      if (error) return true; // If no record, assume authorized

      return !data.order_assignment_blocked;
    } catch (error) {
      console.error('Error checking vendor authorization:', error);
      return false; // Err on the side of caution
    }
  }
}

export const vendorAuthorizationService = new VendorAuthorizationService();
export default vendorAuthorizationService;
