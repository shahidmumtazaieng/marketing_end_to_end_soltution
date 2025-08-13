/**
 * Intelligent Vendor Selection Service
 * Advanced vendor matching algorithm with performance, location, and opportunity balancing
 */

import vendorAuthorizationService from './vendorAuthorizationService';
import databaseService from './databaseService';

export interface VendorSelectionCriteria {
  serviceType: string;
  customerLocation: {
    latitude: number;
    longitude: number;
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedValue: number;
  userId: string; // Admin user ID to filter vendors
  maxVendors?: number; // Maximum number of vendors to select
  preferNewVendors?: boolean; // Give preference to newer vendors
}

export interface SelectedVendor {
  vendor_id: string;
  vendor_name: string;
  vendor_email: string;
  vendor_phone: string;
  services: string[];
  distance_km: number;
  performance_score: number;
  opportunity_score: number;
  selection_reason: string;
  estimated_response_time: number; // in minutes
  is_online: boolean;
  orders_stats: any;
}

export interface VendorSelectionResult {
  selected_vendors: SelectedVendor[];
  total_available_vendors: number;
  selection_criteria: VendorSelectionCriteria;
  selection_algorithm: string;
  selection_timestamp: string;
  fallback_vendors: SelectedVendor[]; // Backup vendors if primary ones decline
}

class IntelligentVendorSelectionService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      await vendorAuthorizationService.initialize();
      await databaseService.initialize();
      
      this.isInitialized = true;
      console.log('✅ Intelligent Vendor Selection Service initialized');
    } catch (error) {
      console.error('❌ Intelligent Vendor Selection Service initialization failed:', error);
      throw error;
    }
  }

  // ==========================================
  // MAIN VENDOR SELECTION ALGORITHM
  // ==========================================

  /**
   * Select best vendors for a service request using intelligent algorithm
   */
  async selectVendorsForOrder(criteria: VendorSelectionCriteria): Promise<VendorSelectionResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log(`🔍 Starting intelligent vendor selection for ${criteria.serviceType}`);

      // 1. Get all active vendors for this service type and user
      const availableVendors = await vendorAuthorizationService.getActiveVendorsForSelection(
        criteria.serviceType,
        criteria.customerLocation,
        criteria.userId
      );

      console.log(`📊 Found ${availableVendors.length} available vendors`);

      if (availableVendors.length === 0) {
        return {
          selected_vendors: [],
          total_available_vendors: 0,
          selection_criteria: criteria,
          selection_algorithm: 'intelligent_v1',
          selection_timestamp: new Date().toISOString(),
          fallback_vendors: [],
        };
      }

      // 2. Apply intelligent scoring and ranking
      const scoredVendors = await this.scoreAndRankVendors(availableVendors, criteria);

      // 3. Select primary vendors
      const maxVendors = criteria.maxVendors || this.getOptimalVendorCount(criteria.priority);
      const selectedVendors = scoredVendors.slice(0, maxVendors);

      // 4. Select fallback vendors
      const fallbackVendors = scoredVendors.slice(maxVendors, maxVendors + 2);

      // 5. Log selection details
      this.logVendorSelection(criteria, selectedVendors, availableVendors.length);

      return {
        selected_vendors: selectedVendors,
        total_available_vendors: availableVendors.length,
        selection_criteria: criteria,
        selection_algorithm: 'intelligent_v1',
        selection_timestamp: new Date().toISOString(),
        fallback_vendors: fallbackVendors,
      };
    } catch (error) {
      console.error('Error in intelligent vendor selection:', error);
      throw error;
    }
  }

  // ==========================================
  // VENDOR SCORING AND RANKING
  // ==========================================

  /**
   * Score and rank vendors using multiple criteria
   */
  private async scoreAndRankVendors(
    vendors: any[], 
    criteria: VendorSelectionCriteria
  ): Promise<SelectedVendor[]> {
    const scoredVendors = await Promise.all(
      vendors.map(async (vendor) => {
        // Calculate individual scores
        const performanceScore = this.calculatePerformanceScore(vendor.orders_stats);
        const locationScore = this.calculateLocationScore(vendor.distance_km);
        const availabilityScore = this.calculateAvailabilityScore(vendor);
        const opportunityScore = this.calculateOpportunityScore(vendor.orders_stats, criteria.preferNewVendors);
        const priorityScore = this.calculatePriorityScore(vendor, criteria.priority);

        // Calculate weighted total score
        const totalScore = this.calculateWeightedScore({
          performance: performanceScore,
          location: locationScore,
          availability: availabilityScore,
          opportunity: opportunityScore,
          priority: priorityScore,
        }, criteria);

        // Determine selection reason
        const selectionReason = this.determineSelectionReason({
          performance: performanceScore,
          location: locationScore,
          availability: availabilityScore,
          opportunity: opportunityScore,
        });

        // Estimate response time
        const estimatedResponseTime = this.estimateResponseTime(vendor, criteria.priority);

        return {
          vendor_id: vendor.id,
          vendor_name: vendor.full_name,
          vendor_email: vendor.email,
          vendor_phone: vendor.phone,
          services: vendor.services,
          distance_km: vendor.distance_km,
          performance_score: performanceScore,
          opportunity_score: opportunityScore,
          total_score: totalScore,
          selection_reason: selectionReason,
          estimated_response_time: estimatedResponseTime,
          is_online: vendor.is_online,
          orders_stats: vendor.orders_stats,
        };
      })
    );

    // Sort by total score (highest first)
    return scoredVendors.sort((a, b) => b.total_score - a.total_score);
  }

  /**
   * Calculate performance score (0-100)
   */
  private calculatePerformanceScore(stats: any): number {
    if (!stats || stats.total === 0) return 50; // Neutral score for new vendors

    const completionRate = stats.completed / stats.total;
    const rating = stats.rating || 0;
    const cancelRate = stats.canceled / stats.total;
    const responseTime = stats.avg_response_time || 60; // Default 60 minutes

    // Performance components
    const completionScore = completionRate * 40; // 40 points max
    const ratingScore = (rating / 5) * 30; // 30 points max
    const cancelPenalty = cancelRate * 20; // 20 points penalty
    const responseBonus = Math.max(0, (120 - responseTime) / 120) * 10; // 10 points max

    return Math.max(0, Math.min(100, completionScore + ratingScore - cancelPenalty + responseBonus));
  }

  /**
   * Calculate location score based on distance (0-100)
   */
  private calculateLocationScore(distanceKm: number): number {
    // Closer vendors get higher scores
    if (distanceKm <= 5) return 100;
    if (distanceKm <= 10) return 80;
    if (distanceKm <= 15) return 60;
    if (distanceKm <= 20) return 40;
    if (distanceKm <= 25) return 20;
    return 10;
  }

  /**
   * Calculate availability score (0-100)
   */
  private calculateAvailabilityScore(vendor: any): number {
    let score = 0;

    // Online status
    if (vendor.is_online) score += 50;

    // Current workload
    const pendingOrders = vendor.orders_stats?.pending || 0;
    if (pendingOrders === 0) score += 30;
    else if (pendingOrders <= 2) score += 20;
    else if (pendingOrders <= 5) score += 10;

    // Recent activity
    const lastSeen = new Date(vendor.last_seen || 0);
    const hoursSinceLastSeen = (Date.now() - lastSeen.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastSeen <= 1) score += 20;
    else if (hoursSinceLastSeen <= 6) score += 10;
    else if (hoursSinceLastSeen <= 24) score += 5;

    return Math.min(100, score);
  }

  /**
   * Calculate opportunity score for new/underutilized vendors (0-100)
   */
  private calculateOpportunityScore(stats: any, preferNewVendors: boolean = false): number {
    if (!stats) return 100; // New vendors get maximum opportunity

    const totalOrders = stats.total || 0;
    const recentOrders = stats.recent_orders || 0;

    let score = 0;

    // New vendor bonus
    if (totalOrders === 0) score += 60;
    else if (totalOrders <= 5) score += 40;
    else if (totalOrders <= 15) score += 20;

    // Low recent activity bonus
    if (recentOrders <= 1) score += 30;
    else if (recentOrders <= 3) score += 20;
    else if (recentOrders <= 5) score += 10;

    // Apply preference multiplier
    if (preferNewVendors && totalOrders <= 10) {
      score *= 1.5;
    }

    return Math.min(100, score);
  }

  /**
   * Calculate priority-based score adjustments (0-100)
   */
  private calculatePriorityScore(vendor: any, priority: string): number {
    let score = 50; // Base score

    switch (priority) {
      case 'urgent':
        // Prioritize online, experienced vendors
        if (vendor.is_online) score += 30;
        if (vendor.orders_stats?.total > 10) score += 20;
        break;
      
      case 'high':
        // Balance experience and availability
        if (vendor.is_online) score += 20;
        if (vendor.orders_stats?.total > 5) score += 15;
        break;
      
      case 'medium':
        // Balanced approach
        if (vendor.is_online) score += 10;
        score += 10; // Neutral bonus
        break;
      
      case 'low':
        // Good opportunity for new vendors
        if (vendor.orders_stats?.total <= 5) score += 20;
        break;
    }

    return Math.min(100, score);
  }

  /**
   * Calculate weighted total score
   */
  private calculateWeightedScore(
    scores: {
      performance: number;
      location: number;
      availability: number;
      opportunity: number;
      priority: number;
    },
    criteria: VendorSelectionCriteria
  ): number {
    // Dynamic weights based on criteria
    let weights = {
      performance: 0.3,
      location: 0.25,
      availability: 0.2,
      opportunity: 0.15,
      priority: 0.1,
    };

    // Adjust weights based on priority
    if (criteria.priority === 'urgent') {
      weights.availability = 0.35;
      weights.performance = 0.35;
      weights.location = 0.2;
      weights.opportunity = 0.05;
      weights.priority = 0.05;
    } else if (criteria.preferNewVendors) {
      weights.opportunity = 0.3;
      weights.performance = 0.2;
    }

    return (
      scores.performance * weights.performance +
      scores.location * weights.location +
      scores.availability * weights.availability +
      scores.opportunity * weights.opportunity +
      scores.priority * weights.priority
    );
  }

  /**
   * Determine selection reason based on scores
   */
  private determineSelectionReason(scores: {
    performance: number;
    location: number;
    availability: number;
    opportunity: number;
  }): string {
    const maxScore = Math.max(...Object.values(scores));
    
    if (scores.performance === maxScore && scores.performance > 80) {
      return 'High performance and reliability';
    } else if (scores.location === maxScore && scores.location > 80) {
      return 'Closest to customer location';
    } else if (scores.availability === maxScore && scores.availability > 80) {
      return 'Currently available and online';
    } else if (scores.opportunity === maxScore && scores.opportunity > 80) {
      return 'Opportunity for new vendor';
    } else {
      return 'Balanced selection criteria';
    }
  }

  /**
   * Estimate response time based on vendor data and priority
   */
  private estimateResponseTime(vendor: any, priority: string): number {
    let baseTime = vendor.orders_stats?.avg_response_time || 60; // Default 60 minutes

    // Adjust based on priority
    const priorityMultipliers = {
      urgent: 0.5,
      high: 0.7,
      medium: 1.0,
      low: 1.3,
    };

    // Adjust based on availability
    if (vendor.is_online) baseTime *= 0.6;
    if (vendor.orders_stats?.pending > 3) baseTime *= 1.5;

    return Math.round(baseTime * priorityMultipliers[priority]);
  }

  /**
   * Get optimal number of vendors to select based on priority
   */
  private getOptimalVendorCount(priority: string): number {
    switch (priority) {
      case 'urgent': return 1; // Single best vendor
      case 'high': return 2;   // Top 2 vendors
      case 'medium': return 3; // Top 3 vendors
      case 'low': return 3;    // Top 3 vendors with opportunity
      default: return 2;
    }
  }

  /**
   * Log vendor selection for analytics
   */
  private logVendorSelection(
    criteria: VendorSelectionCriteria,
    selectedVendors: SelectedVendor[],
    totalAvailable: number
  ): void {
    console.log(`🎯 Vendor Selection Results:`);
    console.log(`   Service: ${criteria.serviceType}`);
    console.log(`   Priority: ${criteria.priority}`);
    console.log(`   Available: ${totalAvailable} vendors`);
    console.log(`   Selected: ${selectedVendors.length} vendors`);
    
    selectedVendors.forEach((vendor, index) => {
      console.log(`   ${index + 1}. ${vendor.vendor_name} (${vendor.distance_km.toFixed(1)}km) - ${vendor.selection_reason}`);
    });
  }

  // ==========================================
  // VENDOR SELECTION ANALYTICS
  // ==========================================

  /**
   * Get vendor selection analytics for admin
   */
  async getVendorSelectionAnalytics(userId: string, days: number = 30): Promise<any> {
    try {
      // This would typically query a vendor_selection_logs table
      // For now, return basic analytics structure
      return {
        total_selections: 0,
        avg_vendors_per_selection: 0,
        selection_success_rate: 0,
        top_selection_reasons: [],
        vendor_utilization: [],
        performance_trends: [],
      };
    } catch (error) {
      console.error('Error getting vendor selection analytics:', error);
      throw error;
    }
  }
}

export const intelligentVendorSelectionService = new IntelligentVendorSelectionService();
export default intelligentVendorSelectionService;
