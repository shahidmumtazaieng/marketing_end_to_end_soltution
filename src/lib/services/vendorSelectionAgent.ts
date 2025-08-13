/**
 * Vendor Selection Agent Service
 * Analyzes conversations and triggers vendor selection based on configured trigger points
 */

import { ConversationAnalysis, ExtractedBusinessData } from './conversationAnalyzer';

export interface TriggerPoint {
  id: string;
  name: string;
  type: 'appointment_booking' | 'quotation_sending' | 'order_booking' | 'location_visit' | 'service_inquiry' | 'custom';
  description: string;
  instructions: string;
  keywords: string[];
  conditions: {
    customer_name_required: boolean;
    location_required: boolean;
    contact_details_required: boolean;
    service_type_required: boolean;
    budget_mentioned: boolean;
    timeline_mentioned: boolean;
  };
  actions: {
    send_customer_email: boolean;
    notify_vendors: boolean;
    create_order: boolean;
    priority_level: number;
  };
  vendor_selection_criteria: {
    location_radius: number;
    min_rating: number;
    max_vendors_to_notify: number;
    prefer_available: boolean;
    work_type_match: boolean;
  };
  is_active: boolean;
}

export interface VendorSelectionResult {
  triggered: boolean;
  trigger_point?: TriggerPoint;
  selected_vendors: SelectedVendor[];
  customer_data: ExtractedBusinessData;
  actions_taken: {
    customer_email_sent: boolean;
    vendors_notified: boolean;
    order_created: boolean;
  };
  order_id?: string;
  confidence_score: number;
  trigger_reason: string;
}

export interface SelectedVendor {
  vendor_id: string;
  vendor_name: string;
  rating: number;
  distance: number;
  availability_status: 'available' | 'busy' | 'offline';
  work_types: string[];
  contact_info: {
    phone: string;
    email: string;
  };
  selection_score: number;
  selection_reason: string;
}

export interface ConversationContext {
  conversation_id: string;
  call_id: string;
  user_id: string;
  conversation_turns: any[];
  extracted_data: ExtractedBusinessData;
  analysis: ConversationAnalysis;
  call_metadata: {
    phone_number: string;
    call_type: string;
    started_at: string;
    ended_at?: string;
    duration?: number;
  };
}

export class VendorSelectionAgentService {
  private static instance: VendorSelectionAgentService;

  static getInstance(): VendorSelectionAgentService {
    if (!VendorSelectionAgentService.instance) {
      VendorSelectionAgentService.instance = new VendorSelectionAgentService();
    }
    return VendorSelectionAgentService.instance;
  }

  /**
   * Main entry point: Analyze conversation and trigger vendor selection if criteria met
   */
  async processConversation(context: ConversationContext): Promise<VendorSelectionResult> {
    try {
      console.log(`🧠 Processing conversation ${context.conversation_id} for vendor selection`);

      // Get user's active trigger points
      const triggerPoints = await this.getUserTriggerPoints(context.user_id);
      
      if (triggerPoints.length === 0) {
        console.log('No active trigger points found for user');
        return {
          triggered: false,
          selected_vendors: [],
          customer_data: context.extracted_data,
          actions_taken: {
            customer_email_sent: false,
            vendors_notified: false,
            order_created: false
          },
          confidence_score: 0,
          trigger_reason: 'No active trigger points configured'
        };
      }

      // Check each trigger point for matches
      for (const triggerPoint of triggerPoints) {
        const triggerResult = await this.evaluateTriggerPoint(triggerPoint, context);
        
        if (triggerResult.triggered) {
          console.log(`✅ Trigger point "${triggerPoint.name}" activated with confidence ${triggerResult.confidence_score}`);
          
          // Select vendors based on criteria
          const selectedVendors = await this.selectVendors(triggerPoint, context);
          
          // Execute actions
          const actionsResult = await this.executeActions(triggerPoint, context, selectedVendors);
          
          return {
            triggered: true,
            trigger_point: triggerPoint,
            selected_vendors: selectedVendors,
            customer_data: context.extracted_data,
            actions_taken: actionsResult,
            order_id: actionsResult.order_created ? `order_${Date.now()}` : undefined,
            confidence_score: triggerResult.confidence_score,
            trigger_reason: triggerResult.reason
          };
        }
      }

      console.log('No trigger points matched for this conversation');
      return {
        triggered: false,
        selected_vendors: [],
        customer_data: context.extracted_data,
        actions_taken: {
          customer_email_sent: false,
          vendors_notified: false,
          order_created: false
        },
        confidence_score: 0,
        trigger_reason: 'No trigger point criteria met'
      };

    } catch (error) {
      console.error('Vendor selection processing error:', error);
      throw error;
    }
  }

  /**
   * Evaluate if a trigger point should be activated based on conversation
   */
  private async evaluateTriggerPoint(
    triggerPoint: TriggerPoint, 
    context: ConversationContext
  ): Promise<{ triggered: boolean; confidence_score: number; reason: string }> {
    try {
      let confidenceScore = 0;
      const reasons: string[] = [];

      // Check keyword matches
      const keywordScore = this.evaluateKeywords(triggerPoint.keywords, context);
      confidenceScore += keywordScore * 0.3; // 30% weight
      if (keywordScore > 0.5) {
        reasons.push(`Keywords matched (${(keywordScore * 100).toFixed(0)}%)`);
      }

      // Check required conditions
      const conditionsScore = this.evaluateConditions(triggerPoint.conditions, context);
      confidenceScore += conditionsScore * 0.4; // 40% weight
      if (conditionsScore > 0.7) {
        reasons.push(`Required conditions met (${(conditionsScore * 100).toFixed(0)}%)`);
      }

      // Check conversation intent and sentiment
      const intentScore = this.evaluateIntent(triggerPoint.type, context.analysis);
      confidenceScore += intentScore * 0.3; // 30% weight
      if (intentScore > 0.6) {
        reasons.push(`Intent alignment (${(intentScore * 100).toFixed(0)}%)`);
      }

      // Trigger threshold is 0.7 (70% confidence)
      const triggered = confidenceScore >= 0.7;

      return {
        triggered,
        confidence_score: confidenceScore,
        reason: triggered ? reasons.join(', ') : 'Confidence score below threshold'
      };

    } catch (error) {
      console.error('Trigger point evaluation error:', error);
      return { triggered: false, confidence_score: 0, reason: 'Evaluation failed' };
    }
  }

  /**
   * Evaluate keyword matches in conversation
   */
  private evaluateKeywords(keywords: string[], context: ConversationContext): number {
    const conversationText = context.conversation_turns
      .filter(turn => turn.speaker === 'customer')
      .map(turn => turn.content.toLowerCase())
      .join(' ');

    let matchedKeywords = 0;
    for (const keyword of keywords) {
      if (conversationText.includes(keyword.toLowerCase())) {
        matchedKeywords++;
      }
    }

    return keywords.length > 0 ? matchedKeywords / keywords.length : 0;
  }

  /**
   * Evaluate if required conditions are met
   */
  private evaluateConditions(conditions: any, context: ConversationContext): number {
    let metConditions = 0;
    let totalConditions = 0;

    // Check customer name required
    if (conditions.customer_name_required) {
      totalConditions++;
      if (context.extracted_data.contact_name) {
        metConditions++;
      }
    }

    // Check location required
    if (conditions.location_required) {
      totalConditions++;
      if (context.extracted_data.location) {
        metConditions++;
      }
    }

    // Check contact details required
    if (conditions.contact_details_required) {
      totalConditions++;
      if (context.extracted_data.email || context.call_metadata.phone_number) {
        metConditions++;
      }
    }

    // Check service type required
    if (conditions.service_type_required) {
      totalConditions++;
      if (context.extracted_data.industry || context.analysis.topics_discussed.length > 0) {
        metConditions++;
      }
    }

    // Check budget mentioned
    if (conditions.budget_mentioned) {
      totalConditions++;
      if (context.extracted_data.budget_range) {
        metConditions++;
      }
    }

    // Check timeline mentioned
    if (conditions.timeline_mentioned) {
      totalConditions++;
      if (context.extracted_data.timeline) {
        metConditions++;
      }
    }

    return totalConditions > 0 ? metConditions / totalConditions : 1;
  }

  /**
   * Evaluate intent alignment with trigger type
   */
  private evaluateIntent(triggerType: string, analysis: ConversationAnalysis): number {
    const intentMap: Record<string, string[]> = {
      'appointment_booking': ['interested', 'callback'],
      'quotation_sending': ['interested', 'neutral'],
      'order_booking': ['interested', 'converted'],
      'location_visit': ['interested', 'callback'],
      'service_inquiry': ['interested', 'neutral']
    };

    const expectedIntents = intentMap[triggerType] || [];
    const actualIntent = analysis.intent;

    if (expectedIntents.includes(actualIntent)) {
      // Boost score based on sentiment and engagement
      let score = 0.7; // Base score for intent match
      score += analysis.sentiment_score * 0.2; // Sentiment boost
      score += analysis.engagement_level * 0.1; // Engagement boost
      return Math.min(1, score);
    }

    return 0.2; // Low score for intent mismatch
  }

  /**
   * Select vendors based on trigger point criteria and customer location
   */
  private async selectVendors(
    triggerPoint: TriggerPoint, 
    context: ConversationContext
  ): Promise<SelectedVendor[]> {
    try {
      console.log(`🎯 Selecting vendors for trigger point: ${triggerPoint.name}`);

      // Get available vendors for the user
      const availableVendors = await this.getAvailableVendors(
        context.user_id,
        triggerPoint.vendor_selection_criteria
      );

      if (availableVendors.length === 0) {
        console.log('No available vendors found');
        return [];
      }

      // Filter vendors based on location
      const locationFilteredVendors = await this.filterVendorsByLocation(
        availableVendors,
        context.extracted_data.location,
        triggerPoint.vendor_selection_criteria.location_radius
      );

      // Filter by rating
      const ratingFilteredVendors = locationFilteredVendors.filter(
        vendor => vendor.rating >= triggerPoint.vendor_selection_criteria.min_rating
      );

      // Filter by work type if required
      let workTypeFilteredVendors = ratingFilteredVendors;
      if (triggerPoint.vendor_selection_criteria.work_type_match && context.extracted_data.industry) {
        workTypeFilteredVendors = ratingFilteredVendors.filter(
          vendor => vendor.work_types.includes(context.extracted_data.industry!)
        );
      }

      // Prefer available vendors if specified
      if (triggerPoint.vendor_selection_criteria.prefer_available) {
        const availableFirst = workTypeFilteredVendors.filter(v => v.availability_status === 'available');
        const others = workTypeFilteredVendors.filter(v => v.availability_status !== 'available');
        workTypeFilteredVendors = [...availableFirst, ...others];
      }

      // Calculate selection scores and sort
      const scoredVendors = workTypeFilteredVendors.map(vendor => ({
        ...vendor,
        selection_score: this.calculateVendorScore(vendor, triggerPoint, context),
        selection_reason: this.getSelectionReason(vendor, triggerPoint)
      }));

      // Sort by selection score and take top vendors
      const sortedVendors = scoredVendors.sort((a, b) => b.selection_score - a.selection_score);
      const selectedVendors = sortedVendors.slice(0, triggerPoint.vendor_selection_criteria.max_vendors_to_notify);

      console.log(`Selected ${selectedVendors.length} vendors:`, selectedVendors.map(v => v.vendor_name));

      return selectedVendors;

    } catch (error) {
      console.error('Vendor selection error:', error);
      return [];
    }
  }

  /**
   * Calculate vendor selection score
   */
  private calculateVendorScore(vendor: any, triggerPoint: TriggerPoint, context: ConversationContext): number {
    let score = 0;

    // Rating score (40% weight)
    score += (vendor.rating / 5) * 0.4;

    // Distance score (30% weight) - closer is better
    const maxDistance = triggerPoint.vendor_selection_criteria.location_radius;
    const distanceScore = Math.max(0, (maxDistance - vendor.distance) / maxDistance);
    score += distanceScore * 0.3;

    // Availability score (20% weight)
    const availabilityScore = vendor.availability_status === 'available' ? 1 : 
                             vendor.availability_status === 'busy' ? 0.5 : 0.2;
    score += availabilityScore * 0.2;

    // Work type match score (10% weight)
    const workTypeScore = context.extracted_data.industry && 
                         vendor.work_types.includes(context.extracted_data.industry) ? 1 : 0.5;
    score += workTypeScore * 0.1;

    return Math.min(1, score);
  }

  /**
   * Get selection reason for vendor
   */
  private getSelectionReason(vendor: any, triggerPoint: TriggerPoint): string {
    const reasons: string[] = [];

    if (vendor.rating >= 4.5) reasons.push('High rating');
    if (vendor.distance <= 5) reasons.push('Close proximity');
    if (vendor.availability_status === 'available') reasons.push('Currently available');

    return reasons.length > 0 ? reasons.join(', ') : 'Meets criteria';
  }

  /**
   * Execute actions based on trigger point configuration
   */
  private async executeActions(
    triggerPoint: TriggerPoint,
    context: ConversationContext,
    selectedVendors: SelectedVendor[]
  ): Promise<{ customer_email_sent: boolean; vendors_notified: boolean; order_created: boolean }> {
    const results = {
      customer_email_sent: false,
      vendors_notified: false,
      order_created: false
    };

    try {
      // Send customer confirmation email
      if (triggerPoint.actions.send_customer_email) {
        results.customer_email_sent = await this.sendCustomerEmail(context, triggerPoint);
      }

      // Notify selected vendors
      if (triggerPoint.actions.notify_vendors && selectedVendors.length > 0) {
        results.vendors_notified = await this.notifyVendors(selectedVendors, context, triggerPoint);
      }

      // Create order record
      if (triggerPoint.actions.create_order) {
        results.order_created = await this.createOrder(context, triggerPoint, selectedVendors);
      }

      console.log('Actions executed:', results);
      return results;

    } catch (error) {
      console.error('Action execution error:', error);
      return results;
    }
  }

  /**
   * Send confirmation email to customer
   */
  private async sendCustomerEmail(context: ConversationContext, triggerPoint: TriggerPoint): Promise<boolean> {
    try {
      console.log(`📧 Sending customer email for ${context.extracted_data.contact_name}`);

      // Get email template
      const template = await this.getEmailTemplate(context.user_id, 'customer_confirmation');
      
      // Replace template variables
      const emailContent = this.replaceTemplateVariables(template, {
        customer_name: context.extracted_data.contact_name || 'Valued Customer',
        service_type: context.extracted_data.industry || 'our services',
        location: context.extracted_data.location || 'your location',
        business_name: 'Your Service Provider'
      });

      // Send email (mock implementation)
      const emailSent = await this.sendEmail({
        to: context.extracted_data.email || '',
        subject: `Service Request Confirmation - ${triggerPoint.name}`,
        content: emailContent
      });

      return emailSent;

    } catch (error) {
      console.error('Customer email error:', error);
      return false;
    }
  }

  /**
   * Notify selected vendors about new order
   */
  private async notifyVendors(
    vendors: SelectedVendor[],
    context: ConversationContext,
    triggerPoint: TriggerPoint
  ): Promise<boolean> {
    try {
      console.log(`🔔 Notifying ${vendors.length} vendors`);

      // Get vendor notification template
      const template = await this.getEmailTemplate(context.user_id, 'vendor_notification');

      let allNotificationsSent = true;

      for (const vendor of vendors) {
        // Replace template variables
        const notificationContent = this.replaceTemplateVariables(template, {
          vendor_name: vendor.vendor_name,
          customer_name: context.extracted_data.contact_name || 'Customer',
          service_type: context.extracted_data.industry || 'Service',
          location: context.extracted_data.location || 'Location TBD',
          priority: triggerPoint.actions.priority_level.toString()
        });

        // Send notification to vendor
        const notificationSent = await this.sendVendorNotification({
          vendor_id: vendor.vendor_id,
          email: vendor.contact_info.email,
          phone: vendor.contact_info.phone,
          subject: `New Service Request - Priority ${triggerPoint.actions.priority_level}`,
          content: notificationContent,
          push_notification: true
        });

        if (!notificationSent) {
          allNotificationsSent = false;
        }
      }

      return allNotificationsSent;

    } catch (error) {
      console.error('Vendor notification error:', error);
      return false;
    }
  }

  /**
   * Create order record in database
   */
  private async createOrder(
    context: ConversationContext,
    triggerPoint: TriggerPoint,
    selectedVendors: SelectedVendor[]
  ): Promise<boolean> {
    try {
      console.log(`📝 Creating order for conversation ${context.conversation_id}`);

      const orderData = {
        conversation_id: context.conversation_id,
        user_id: context.user_id,
        trigger_point_id: triggerPoint.id,
        customer_data: context.extracted_data,
        selected_vendors: selectedVendors.map(v => v.vendor_id),
        priority_level: triggerPoint.actions.priority_level,
        status: 'pending_vendor_response',
        created_at: new Date().toISOString()
      };

      // Save order to database (mock implementation)
      const orderCreated = await this.saveOrder(orderData);

      return orderCreated;

    } catch (error) {
      console.error('Order creation error:', error);
      return false;
    }
  }

  // Mock implementations for external services
  private async getUserTriggerPoints(userId: string): Promise<TriggerPoint[]> {
    // Mock implementation - replace with actual API call
    return [];
  }

  private async getAvailableVendors(userId: string, criteria: any): Promise<any[]> {
    // Mock implementation - replace with actual vendor API
    return [];
  }

  private async filterVendorsByLocation(vendors: any[], location?: string, radius?: number): Promise<any[]> {
    // Mock implementation - replace with geolocation filtering
    return vendors;
  }

  private async getEmailTemplate(userId: string, templateType: string): Promise<string> {
    // Mock implementation - replace with actual template retrieval
    return 'Default template content';
  }

  private replaceTemplateVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }

  private async sendEmail(emailData: any): Promise<boolean> {
    // Mock implementation - replace with actual email service
    console.log('Email sent:', emailData.to, emailData.subject);
    return true;
  }

  private async sendVendorNotification(notificationData: any): Promise<boolean> {
    // Mock implementation - replace with actual notification service
    console.log('Vendor notification sent:', notificationData.vendor_id);
    return true;
  }

  private async saveOrder(orderData: any): Promise<boolean> {
    // Mock implementation - replace with actual database save
    console.log('Order saved:', orderData);
    return true;
  }
}

// Export singleton instance
export const vendorSelectionAgent = VendorSelectionAgentService.getInstance();

/**
 * Complete Vendor Selection Algorithm Implementation
 * Integrates with conversation analysis and mobile app
 */

export interface VendorProfile {
  id: string;
  name: string;
  contact: string;
  status: 'Verified' | 'Pending' | 'Blocked';
  avatar: string;
  memberSince: string;

  // Performance Metrics
  orders: {
    total: number;
    completed: number;
    pending: number;
    canceled: number;
  };

  // Service Information
  services: string[];

  // Location Data
  location: {
    latitude: number;
    longitude: number;
  };

  // Service Area Configuration
  service_area: {
    latitude: number;
    longitude: number;
    radius: number; // in miles
  };

  // Availability & Performance
  activeOrders: number;
  maxCapacity: number;
  averageResponseTime: number; // in minutes
  rating: number; // 0-5 stars

  // Notification Preferences
  notification_preferences: {
    push_notifications: boolean;
    email_notifications: boolean;
    whatsapp_integration: boolean;
  };

  // Real-time Status
  isOnline: boolean;
  lastSeen: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
}

export interface VendorSelectionResult {
  success: boolean;
  triggered: boolean;
  processing_time_ms: number;

  // Selection Results
  selected_vendors: SelectedVendor[];
  total_vendors_evaluated: number;
  selection_criteria_met: boolean;

  // Actions Taken
  actions_taken: {
    customer_email_sent: boolean;
    vendors_notified: boolean;
    order_created: boolean;
    push_notifications_sent: boolean;
  };

  // Order Information
  order_id?: string;
  order_details?: {
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    service_type: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    description: string;
    estimated_value: number;
  };

  // Performance Metrics
  selection_metrics: {
    algorithm_version: string;
    selection_confidence: number;
    distance_factor: number;
    availability_factor: number;
    performance_factor: number;
    response_time_factor: number;
  };

  error?: string;
}

export interface VendorSelectionCriteria {
  service_type: string;
  customer_location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  max_distance: number; // in miles
  min_rating: number;
  max_response_time: number; // in minutes
  require_availability: boolean;
  preferred_vendors?: string[]; // vendor IDs
  excluded_vendors?: string[]; // vendor IDs
}

export class CompleteVendorSelectionAgent {
  private static instance: CompleteVendorSelectionAgent;

  static getInstance(): CompleteVendorSelectionAgent {
    if (!CompleteVendorSelectionAgent.instance) {
      CompleteVendorSelectionAgent.instance = new CompleteVendorSelectionAgent();
    }
    return CompleteVendorSelectionAgent.instance;
  }

  /**
   * Main entry point: Process conversation and perform vendor selection
   */
  async processConversationForVendorSelection(
    conversationContext: ConversationContext
  ): Promise<VendorSelectionResult> {
    const startTime = Date.now();

    try {
      console.log(`🎯 Processing conversation ${conversationContext.conversation_id} for vendor selection`);

      // Extract selection criteria from conversation
      const selectionCriteria = await this.extractSelectionCriteria(conversationContext);

      if (!selectionCriteria) {
        return {
          success: true,
          triggered: false,
          processing_time_ms: Date.now() - startTime,
          selected_vendors: [],
          total_vendors_evaluated: 0,
          selection_criteria_met: false,
          actions_taken: {
            customer_email_sent: false,
            vendors_notified: false,
            order_created: false,
            push_notifications_sent: false
          },
          selection_metrics: {
            algorithm_version: 'v1.0.0',
            selection_confidence: 0,
            distance_factor: 0,
            availability_factor: 0,
            performance_factor: 0,
            response_time_factor: 0
          }
        };
      }

      // Get available vendors
      const availableVendors = await this.getAvailableVendorsComplete(
        conversationContext.user_id,
        selectionCriteria
      );

      if (availableVendors.length === 0) {
        console.log('❌ No available vendors found for criteria');
        return {
          success: true,
          triggered: true,
          processing_time_ms: Date.now() - startTime,
          selected_vendors: [],
          total_vendors_evaluated: 0,
          selection_criteria_met: false,
          actions_taken: {
            customer_email_sent: false,
            vendors_notified: false,
            order_created: false,
            push_notifications_sent: false
          },
          selection_metrics: {
            algorithm_version: 'v1.0.0',
            selection_confidence: 0,
            distance_factor: 0,
            availability_factor: 0,
            performance_factor: 0,
            response_time_factor: 0
          },
          error: 'No available vendors found'
        };
      }

      // Run intelligent vendor selection algorithm
      const selectionResult = await this.runIntelligentVendorSelection(
        availableVendors,
        selectionCriteria,
        conversationContext
      );

      if (selectionResult.selected_vendors.length === 0) {
        console.log('❌ No vendors selected by algorithm');
        return {
          success: true,
          triggered: true,
          processing_time_ms: Date.now() - startTime,
          selected_vendors: [],
          total_vendors_evaluated: availableVendors.length,
          selection_criteria_met: false,
          actions_taken: {
            customer_email_sent: false,
            vendors_notified: false,
            order_created: false,
            push_notifications_sent: false
          },
          selection_metrics: selectionResult.selection_metrics,
          error: 'No vendors met selection criteria'
        };
      }

      // Execute automated actions
      const actionsResult = await this.executeCompleteAutomatedActions(
        selectionResult.selected_vendors,
        selectionCriteria,
        conversationContext
      );

      console.log(`✅ Vendor selection complete:`, {
        conversation_id: conversationContext.conversation_id,
        vendors_selected: selectionResult.selected_vendors.length,
        order_created: actionsResult.order_created,
        processing_time_ms: Date.now() - startTime
      });

      return {
        success: true,
        triggered: true,
        processing_time_ms: Date.now() - startTime,
        selected_vendors: selectionResult.selected_vendors,
        total_vendors_evaluated: availableVendors.length,
        selection_criteria_met: true,
        actions_taken: actionsResult,
        order_id: actionsResult.order_id,
        order_details: actionsResult.order_details,
        selection_metrics: selectionResult.selection_metrics
      };

    } catch (error) {
      console.error('Vendor selection processing error:', error);
      return {
        success: false,
        triggered: true,
        processing_time_ms: Date.now() - startTime,
        selected_vendors: [],
        total_vendors_evaluated: 0,
        selection_criteria_met: false,
        actions_taken: {
          customer_email_sent: false,
          vendors_notified: false,
          order_created: false,
          push_notifications_sent: false
        },
        selection_metrics: {
          algorithm_version: 'v1.0.0',
          selection_confidence: 0,
          distance_factor: 0,
          availability_factor: 0,
          performance_factor: 0,
          response_time_factor: 0
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Extract vendor selection criteria from conversation context
   */
  private async extractSelectionCriteria(
    context: ConversationContext
  ): Promise<VendorSelectionCriteria | null> {
    try {
      const extractedData = context.extracted_data;

      // Check if we have minimum required data
      if (!extractedData.service_type) {
        console.log('❌ No service type identified in conversation');
        return null;
      }

      // Extract or estimate customer location
      let customerLocation;
      if (extractedData.location?.address) {
        // Try to geocode the address
        customerLocation = await this.geocodeAddress(extractedData.location.address);
      }

      if (!customerLocation) {
        console.log('❌ No customer location available');
        return null;
      }

      // Determine priority based on conversation analysis
      const priority = this.determinePriority(context);

      // Get user's vendor selection settings
      const userSettings = await this.getUserVendorSettings(context.user_id);

      return {
        service_type: extractedData.service_type,
        customer_location: {
          latitude: customerLocation.latitude,
          longitude: customerLocation.longitude,
          address: extractedData.location?.address || 'Address not specified'
        },
        priority: priority,
        max_distance: userSettings.default_location_radius || 15,
        min_rating: userSettings.min_vendor_rating || 4.0,
        max_response_time: userSettings.max_response_time || 30,
        require_availability: true
      };

    } catch (error) {
      console.error('Extract selection criteria error:', error);
      return null;
    }
  }

  /**
   * Get available vendors based on criteria
   */
  private async getAvailableVendorsComplete(
    userId: string,
    criteria: VendorSelectionCriteria
  ): Promise<VendorProfile[]> {
    try {
      // In production, fetch from database
      /*
      const vendors = await db.vendors.findMany({
        where: {
          user_id: userId,
          status: 'Verified',
          services: { has: criteria.service_type },
          rating: { gte: criteria.min_rating }
        }
      });
      */

      // Mock vendor data based on our analysis
      const mockVendors: VendorProfile[] = [
        {
          id: 'VEND001',
          name: 'John Doe',
          contact: 'john.d@example.com',
          status: 'Verified',
          avatar: 'https://placehold.co/100x100.png',
          memberSince: '2023-01-15',
          orders: { total: 120, completed: 115, pending: 2, canceled: 3 },
          services: ['AC Repair', 'Plumbing', 'Maintenance'],
          location: { latitude: 40.7128, longitude: -74.0060 },
          service_area: { latitude: 40.7128, longitude: -74.0060, radius: 20 },
          activeOrders: 1,
          maxCapacity: 5,
          averageResponseTime: 15,
          rating: 4.8,
          notification_preferences: {
            push_notifications: true,
            email_notifications: true,
            whatsapp_integration: true
          },
          isOnline: true,
          lastSeen: new Date().toISOString()
        },
        {
          id: 'VEND002',
          name: 'Jane Smith',
          contact: 'jane.s@example.com',
          status: 'Verified',
          avatar: 'https://placehold.co/100x100.png',
          memberSince: '2024-06-20',
          orders: { total: 50, completed: 45, pending: 5, canceled: 0 },
          services: ['Electrical', 'Maintenance', 'Repairs'],
          location: { latitude: 34.0522, longitude: -118.2437 },
          service_area: { latitude: 34.0522, longitude: -118.2437, radius: 15 },
          activeOrders: 3,
          maxCapacity: 4,
          averageResponseTime: 25,
          rating: 4.6,
          notification_preferences: {
            push_notifications: true,
            email_notifications: false,
            whatsapp_integration: true
          },
          isOnline: true,
          lastSeen: new Date().toISOString()
        },
        {
          id: 'VEND003',
          name: 'CleanCo',
          contact: 'contact@cleanco.com',
          status: 'Verified',
          avatar: 'https://placehold.co/100x100.png',
          memberSince: '2022-08-10',
          orders: { total: 250, completed: 240, pending: 1, canceled: 9 },
          services: ['Cleaning', 'Maintenance'],
          location: { latitude: 41.8781, longitude: -87.6298 },
          service_area: { latitude: 41.8781, longitude: -87.6298, radius: 25 },
          activeOrders: 0,
          maxCapacity: 8,
          averageResponseTime: 10,
          rating: 4.9,
          notification_preferences: {
            push_notifications: true,
            email_notifications: true,
            whatsapp_integration: false
          },
          isOnline: true,
          lastSeen: new Date().toISOString()
        }
      ];

      // Filter vendors based on criteria with EXACT service type matching
      const filteredVendors = mockVendors.filter(vendor => {
        // EXACT Service type match - if conversation is about cleaning, only select cleaning vendors
        const serviceMatch = this.isExactServiceMatch(vendor.services, criteria.service_type);

        if (!serviceMatch) {
          console.log(`❌ Vendor ${vendor.id} excluded: Service mismatch. Vendor services: [${vendor.services.join(', ')}], Required: ${criteria.service_type}`);
          return false;
        }

        // Distance check
        const distance = this.calculateDistance(
          criteria.customer_location.latitude,
          criteria.customer_location.longitude,
          vendor.service_area.latitude,
          vendor.service_area.longitude
        );

        const withinServiceArea = distance <= vendor.service_area.radius;
        const withinMaxDistance = distance <= criteria.max_distance;

        if (!withinServiceArea || !withinMaxDistance) {
          console.log(`❌ Vendor ${vendor.id} excluded: Distance ${distance.toFixed(1)} miles (max: ${criteria.max_distance})`);
          return false;
        }

        // Availability check
        const isAvailable = vendor.activeOrders < vendor.maxCapacity;
        if (!isAvailable) {
          console.log(`❌ Vendor ${vendor.id} excluded: No availability (${vendor.activeOrders}/${vendor.maxCapacity} orders)`);
          return false;
        }

        // Rating check
        const meetsRating = vendor.rating >= criteria.min_rating;
        if (!meetsRating) {
          console.log(`❌ Vendor ${vendor.id} excluded: Rating ${vendor.rating} below minimum ${criteria.min_rating}`);
          return false;
        }

        // Response time check
        const meetsResponseTime = vendor.averageResponseTime <= criteria.max_response_time;
        if (!meetsResponseTime) {
          console.log(`❌ Vendor ${vendor.id} excluded: Response time ${vendor.averageResponseTime}min above maximum ${criteria.max_response_time}min`);
          return false;
        }

        // Online status check
        if (!vendor.isOnline) {
          console.log(`❌ Vendor ${vendor.id} excluded: Currently offline`);
          return false;
        }

        console.log(`✅ Vendor ${vendor.id} (${vendor.name}) qualified for ${criteria.service_type} service`);
        return true;
      });

      console.log(`📊 Vendor filtering results:`, {
        total_vendors: mockVendors.length,
        filtered_vendors: filteredVendors.length,
        service_type: criteria.service_type,
        max_distance: criteria.max_distance
      });

      return filteredVendors;

    } catch (error) {
      console.error('Get available vendors error:', error);
      return [];
    }
  }

  /**
   * Run intelligent vendor selection algorithm with multi-factor scoring
   */
  private async runIntelligentVendorSelection(
    vendors: VendorProfile[],
    criteria: VendorSelectionCriteria,
    context: ConversationContext
  ): Promise<{
    selected_vendors: SelectedVendor[];
    selection_metrics: any;
  }> {
    try {
      console.log(`🧠 Running intelligent vendor selection for ${vendors.length} vendors`);

      const scoredVendors = [];

      for (const vendor of vendors) {
        const score = await this.calculateVendorScore(vendor, criteria, context);

        if (score.total_score >= 0.6) { // Minimum threshold
          scoredVendors.push({
            vendor,
            score,
            selected_at: new Date().toISOString()
          });
        }
      }

      // Sort by total score (highest first)
      scoredVendors.sort((a, b) => b.score.total_score - a.score.total_score);

      // Select top vendors (max 3 for most cases, 1 for urgent)
      const maxVendors = criteria.priority === 'urgent' ? 1 : 3;
      const selectedVendors = scoredVendors.slice(0, maxVendors);

      // Convert to SelectedVendor format
      const result = selectedVendors.map(sv => ({
        vendor_id: sv.vendor.id,
        vendor_name: sv.vendor.name,
        vendor_contact: sv.vendor.contact,
        selection_score: sv.score.total_score,
        distance_miles: sv.score.distance,
        estimated_response_time: sv.vendor.averageResponseTime,
        selection_reason: this.generateSelectionReason(sv.score),
        notification_methods: this.getNotificationMethods(sv.vendor),
        selected_at: sv.selected_at
      }));

      // Calculate overall selection metrics
      const selectionMetrics = {
        algorithm_version: 'v1.0.0',
        selection_confidence: selectedVendors.length > 0 ? selectedVendors[0].score.total_score : 0,
        distance_factor: selectedVendors.length > 0 ? selectedVendors[0].score.distance_score : 0,
        availability_factor: selectedVendors.length > 0 ? selectedVendors[0].score.availability_score : 0,
        performance_factor: selectedVendors.length > 0 ? selectedVendors[0].score.performance_score : 0,
        response_time_factor: selectedVendors.length > 0 ? selectedVendors[0].score.response_time_score : 0
      };

      console.log(`✅ Vendor selection complete:`, {
        vendors_evaluated: vendors.length,
        vendors_scored: scoredVendors.length,
        vendors_selected: result.length,
        top_score: selectedVendors.length > 0 ? selectedVendors[0].score.total_score : 0
      });

      return {
        selected_vendors: result,
        selection_metrics: selectionMetrics
      };

    } catch (error) {
      console.error('Intelligent vendor selection error:', error);
      return {
        selected_vendors: [],
        selection_metrics: {
          algorithm_version: 'v1.0.0',
          selection_confidence: 0,
          distance_factor: 0,
          availability_factor: 0,
          performance_factor: 0,
          response_time_factor: 0
        }
      };
    }
  }

  /**
   * Calculate comprehensive vendor score using multiple factors
   */
  private async calculateVendorScore(
    vendor: VendorProfile,
    criteria: VendorSelectionCriteria,
    context: ConversationContext
  ): Promise<{
    total_score: number;
    distance_score: number;
    availability_score: number;
    performance_score: number;
    response_time_score: number;
    priority_bonus: number;
    distance: number;
    breakdown: Record<string, number>;
  }> {
    try {
      // 1. Distance Score (25% weight)
      const distance = this.calculateDistance(
        criteria.customer_location.latitude,
        criteria.customer_location.longitude,
        vendor.service_area.latitude,
        vendor.service_area.longitude
      );

      const distanceScore = Math.max(0, 1 - (distance / criteria.max_distance));

      // 2. Availability Score (20% weight)
      const workloadRatio = vendor.activeOrders / vendor.maxCapacity;
      const availabilityScore = Math.max(0, 1 - workloadRatio);

      // 3. Performance Score (25% weight)
      const completionRate = vendor.orders.total > 0 ? vendor.orders.completed / vendor.orders.total : 0;
      const cancellationRate = vendor.orders.total > 0 ? vendor.orders.canceled / vendor.orders.total : 0;
      const ratingScore = vendor.rating / 5.0;

      const performanceScore = (completionRate * 0.4) + (ratingScore * 0.4) + ((1 - cancellationRate) * 0.2);

      // 4. Response Time Score (15% weight)
      const responseTimeScore = Math.max(0, 1 - (vendor.averageResponseTime / criteria.max_response_time));

      // 5. Experience Score (10% weight)
      const membershipMonths = this.calculateMembershipMonths(vendor.memberSince);
      const experienceScore = Math.min(1, membershipMonths / 24); // Max score at 2 years

      // 6. Priority Bonus (5% weight)
      let priorityBonus = 0;
      if (criteria.priority === 'urgent' && vendor.averageResponseTime <= 15) {
        priorityBonus = 0.2; // 20% bonus for fast response on urgent orders
      } else if (criteria.priority === 'high' && vendor.averageResponseTime <= 20) {
        priorityBonus = 0.1; // 10% bonus for fast response on high priority
      }

      // Calculate weighted total score
      const totalScore =
        (distanceScore * 0.25) +
        (availabilityScore * 0.20) +
        (performanceScore * 0.25) +
        (responseTimeScore * 0.15) +
        (experienceScore * 0.10) +
        (priorityBonus * 0.05);

      return {
        total_score: Math.min(1, totalScore),
        distance_score: distanceScore,
        availability_score: availabilityScore,
        performance_score: performanceScore,
        response_time_score: responseTimeScore,
        priority_bonus: priorityBonus,
        distance: distance,
        breakdown: {
          distance: distanceScore * 0.25,
          availability: availabilityScore * 0.20,
          performance: performanceScore * 0.25,
          response_time: responseTimeScore * 0.15,
          experience: experienceScore * 0.10,
          priority_bonus: priorityBonus * 0.05
        }
      };

    } catch (error) {
      console.error('Calculate vendor score error:', error);
      return {
        total_score: 0,
        distance_score: 0,
        availability_score: 0,
        performance_score: 0,
        response_time_score: 0,
        priority_bonus: 0,
        distance: 999,
        breakdown: {}
      };
    }
  }

  /**
   * Execute complete automated actions system
   */
  private async executeCompleteAutomatedActions(
    selectedVendors: SelectedVendor[],
    criteria: VendorSelectionCriteria,
    context: ConversationContext
  ): Promise<{
    customer_email_sent: boolean;
    vendors_notified: boolean;
    order_created: boolean;
    push_notifications_sent: boolean;
    order_id?: string;
    order_details?: any;
  }> {
    try {
      console.log(`🚀 Executing automated actions for ${selectedVendors.length} selected vendors`);

      // 1. Create order first
      const orderResult = await this.createCompleteOrder(selectedVendors, criteria, context);

      if (!orderResult.success) {
        throw new Error('Failed to create order');
      }

      // 2. Send customer confirmation email
      const customerEmailSent = await this.sendCustomerConfirmationEmail(
        context,
        criteria,
        selectedVendors,
        orderResult.order_id
      );

      // 3. Notify selected vendors
      const vendorsNotified = await this.notifySelectedVendors(
        selectedVendors,
        criteria,
        context,
        orderResult.order_id
      );

      // 4. Send push notifications to vendor mobile apps
      const pushNotificationsSent = await this.sendVendorPushNotifications(
        selectedVendors,
        criteria,
        context,
        orderResult.order_id
      );

      console.log(`✅ Automated actions complete:`, {
        order_id: orderResult.order_id,
        customer_email_sent: customerEmailSent,
        vendors_notified: vendorsNotified,
        push_notifications_sent: pushNotificationsSent
      });

      return {
        customer_email_sent: customerEmailSent,
        vendors_notified: vendorsNotified,
        order_created: orderResult.success,
        push_notifications_sent: pushNotificationsSent,
        order_id: orderResult.order_id,
        order_details: orderResult.order_details
      };

    } catch (error) {
      console.error('Execute automated actions error:', error);
      return {
        customer_email_sent: false,
        vendors_notified: false,
        order_created: false,
        push_notifications_sent: false
      };
    }
  }

  /**
   * Create complete order with vendor assignment
   */
  private async createCompleteOrder(
    selectedVendors: SelectedVendor[],
    criteria: VendorSelectionCriteria,
    context: ConversationContext
  ): Promise<{
    success: boolean;
    order_id?: string;
    order_details?: any;
  }> {
    try {
      const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

      const orderDetails = {
        order_id: orderId,
        customer_name: context.extracted_data.customer_name || 'Customer',
        customer_phone: context.extracted_data.contact_phone || '',
        customer_address: criteria.customer_location.address,
        service_type: criteria.service_type,
        status: 'new',
        priority: criteria.priority,
        description: this.generateOrderDescription(context, criteria),
        estimated_value: this.estimateOrderValue(criteria.service_type, criteria.priority),

        // Vendor assignment
        assigned_vendors: selectedVendors.map(v => v.vendor_id),
        primary_vendor_id: selectedVendors[0]?.vendor_id,

        // Metadata
        conversation_id: context.conversation_id,
        user_id: context.user_id,
        created_at: new Date().toISOString(),
        scheduled_date: this.calculateScheduledDate(criteria.priority),

        // Location data
        customer_location: {
          latitude: criteria.customer_location.latitude,
          longitude: criteria.customer_location.longitude
        }
      };

      // Save order to database
      const orderSaved = await this.saveCompleteOrder(orderDetails);

      if (orderSaved) {
        console.log(`📝 Order created successfully: ${orderId}`);
        return {
          success: true,
          order_id: orderId,
          order_details: orderDetails
        };
      } else {
        throw new Error('Failed to save order to database');
      }

    } catch (error) {
      console.error('Create complete order error:', error);
      return { success: false };
    }
  }

  /**
   * Send customer confirmation email AND SMS
   */
  private async sendCustomerConfirmationEmail(
    context: ConversationContext,
    criteria: VendorSelectionCriteria,
    selectedVendors: SelectedVendor[],
    orderId: string
  ): Promise<boolean> {
    try {
      let emailSent = false;
      let smsSent = false;

      // Send Email if available
      if (context.extracted_data.contact_email) {
        const emailTemplate = await this.getCustomerEmailTemplate(context.user_id);

        const emailContent = this.replaceTemplateVariables(emailTemplate, {
          customer_name: context.extracted_data.customer_name || 'Valued Customer',
          service_type: criteria.service_type,
          location: criteria.customer_location.address,
          priority: criteria.priority,
          order_id: orderId,
          vendors_count: selectedVendors.length.toString(),
          estimated_response_time: selectedVendors[0]?.estimated_response_time?.toString() || '30',
          company_name: 'VendorSync'
        });

        emailSent = await this.sendEmail({
          to: context.extracted_data.contact_email,
          subject: `Service Request Confirmed - Order #${orderId}`,
          content: emailContent,
          order_id: orderId
        });
      }

      // Send SMS if phone available
      if (context.extracted_data.contact_phone) {
        const smsTemplate = await this.getCustomerSMSTemplate(context.user_id);

        const smsContent = this.replaceTemplateVariables(smsTemplate, {
          customer_name: context.extracted_data.customer_name || 'Customer',
          service_type: criteria.service_type,
          order_id: orderId,
          vendors_count: selectedVendors.length.toString(),
          estimated_response_time: selectedVendors[0]?.estimated_response_time?.toString() || '30',
          company_name: 'VendorSync'
        });

        smsSent = await this.sendSMS({
          to: context.extracted_data.contact_phone,
          message: smsContent,
          order_id: orderId
        });
      }

      console.log(`📧📱 Customer notifications:`, {
        email_sent: emailSent,
        sms_sent: smsSent,
        order_id: orderId
      });

      return emailSent || smsSent; // Success if either method works

    } catch (error) {
      console.error('Send customer confirmation error:', error);
      return false;
    }
  }

  /**
   * Notify selected vendors via email
   */
  private async notifySelectedVendors(
    selectedVendors: SelectedVendor[],
    criteria: VendorSelectionCriteria,
    context: ConversationContext,
    orderId: string
  ): Promise<boolean> {
    try {
      const vendorEmailTemplate = await this.getVendorEmailTemplate(context.user_id);
      let allNotificationsSent = true;

      for (const vendor of selectedVendors) {
        try {
          const emailContent = this.replaceTemplateVariables(vendorEmailTemplate, {
            vendor_name: vendor.vendor_name,
            customer_name: context.extracted_data.customer_name || 'Customer',
            service_type: criteria.service_type,
            location: criteria.customer_location.address,
            priority: criteria.priority,
            order_id: orderId,
            customer_phone: context.extracted_data.contact_phone || '',
            estimated_value: this.estimateOrderValue(criteria.service_type, criteria.priority).toString(),
            response_deadline: this.calculateResponseDeadline(criteria.priority)
          });

          const emailSent = await this.sendEmail({
            to: vendor.vendor_contact,
            subject: `New Service Request - Order #${orderId}`,
            content: emailContent,
            vendor_id: vendor.vendor_id,
            order_id: orderId
          });

          if (!emailSent) {
            allNotificationsSent = false;
            console.error(`❌ Failed to send email to vendor ${vendor.vendor_id}`);
          }

        } catch (vendorError) {
          console.error(`❌ Error notifying vendor ${vendor.vendor_id}:`, vendorError);
          allNotificationsSent = false;
        }
      }

      return allNotificationsSent;

    } catch (error) {
      console.error('Notify selected vendors error:', error);
      return false;
    }
  }

  /**
   * Send push notifications to vendor mobile apps
   */
  private async sendVendorPushNotifications(
    selectedVendors: SelectedVendor[],
    criteria: VendorSelectionCriteria,
    context: ConversationContext,
    orderId: string
  ): Promise<boolean> {
    try {
      console.log(`📱 Sending push notifications to ${selectedVendors.length} vendors`);

      let allNotificationsSent = true;

      for (const vendor of selectedVendors) {
        try {
          // Get vendor's push notification preferences
          const vendorProfile = await this.getVendorProfile(vendor.vendor_id);

          if (!vendorProfile?.notification_preferences?.push_notifications) {
            console.log(`⚠️ Push notifications disabled for vendor ${vendor.vendor_id}`);
            continue;
          }

          const pushNotification = {
            vendor_id: vendor.vendor_id,
            title: `New Service Request`,
            body: `${criteria.service_type} service needed at ${criteria.customer_location.address}`,
            data: {
              order_id: orderId,
              service_type: criteria.service_type,
              priority: criteria.priority,
              customer_name: context.extracted_data.customer_name || 'Customer',
              customer_phone: context.extracted_data.contact_phone || '',
              location: criteria.customer_location.address,
              estimated_value: this.estimateOrderValue(criteria.service_type, criteria.priority),
              response_deadline: this.calculateResponseDeadline(criteria.priority),
              action_required: 'accept_or_decline'
            },
            action_buttons: [
              { id: 'accept', title: 'Accept Order', action: 'accept_order' },
              { id: 'decline', title: 'Decline', action: 'decline_order' },
              { id: 'view', title: 'View Details', action: 'view_order' }
            ]
          };

          const notificationSent = await this.sendPushNotification(pushNotification);

          if (!notificationSent) {
            allNotificationsSent = false;
            console.error(`❌ Failed to send push notification to vendor ${vendor.vendor_id}`);
          } else {
            console.log(`✅ Push notification sent to vendor ${vendor.vendor_id}`);
          }

        } catch (vendorError) {
          console.error(`❌ Error sending push notification to vendor ${vendor.vendor_id}:`, vendorError);
          allNotificationsSent = false;
        }
      }

      return allNotificationsSent;

    } catch (error) {
      console.error('Send vendor push notifications error:', error);
      return false;
    }
  }

  // Helper Methods

  /**
   * Calculate distance between two coordinates
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth's radius in miles
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

  /**
   * Geocode address to coordinates
   */
  private async geocodeAddress(address: string): Promise<{latitude: number; longitude: number} | null> {
    try {
      // In production, use actual geocoding service (Google Maps, etc.)
      // For now, return mock coordinates
      const mockCoordinates = {
        latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
        longitude: -74.0060 + (Math.random() - 0.5) * 0.1
      };

      console.log(`📍 Geocoded address "${address}" to:`, mockCoordinates);
      return mockCoordinates;

    } catch (error) {
      console.error('Geocode address error:', error);
      return null;
    }
  }

  /**
   * Determine priority from conversation context
   */
  private determinePriority(context: ConversationContext): 'low' | 'medium' | 'high' | 'urgent' {
    const urgencyLevel = context.extracted_data.urgency_level;

    if (urgencyLevel === 'emergency') return 'urgent';
    if (urgencyLevel === 'high') return 'high';
    if (urgencyLevel === 'medium') return 'medium';

    // Check conversation for urgency indicators
    const conversationText = context.conversation_turns
      .map(turn => turn.content.toLowerCase())
      .join(' ');

    if (conversationText.includes('emergency') || conversationText.includes('urgent')) {
      return 'urgent';
    }
    if (conversationText.includes('asap') || conversationText.includes('immediately')) {
      return 'high';
    }
    if (conversationText.includes('soon') || conversationText.includes('today')) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Get user vendor settings
   */
  private async getUserVendorSettings(userId: string): Promise<any> {
    try {
      // In production, fetch from database
      /*
      const settings = await db.user_vendor_settings.findUnique({
        where: { user_id: userId }
      });
      return settings || getDefaultSettings();
      */

      // Default settings
      return {
        default_location_radius: 15,
        min_vendor_rating: 4.0,
        max_response_time: 30,
        auto_assign_vendors: true,
        max_vendors_per_order: 3
      };

    } catch (error) {
      console.error('Get user vendor settings error:', error);
      return {
        default_location_radius: 15,
        min_vendor_rating: 4.0,
        max_response_time: 30,
        auto_assign_vendors: true,
        max_vendors_per_order: 3
      };
    }
  }

  /**
   * Calculate membership months
   */
  private calculateMembershipMonths(memberSince: string): number {
    const memberDate = new Date(memberSince);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - memberDate.getTime());
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    return diffMonths;
  }

  /**
   * Generate selection reason
   */
  private generateSelectionReason(score: any): string {
    const reasons = [];

    if (score.distance_score > 0.8) reasons.push('Close proximity');
    if (score.availability_score > 0.8) reasons.push('High availability');
    if (score.performance_score > 0.8) reasons.push('Excellent performance');
    if (score.response_time_score > 0.8) reasons.push('Fast response time');
    if (score.priority_bonus > 0) reasons.push('Priority service capability');

    return reasons.length > 0 ? reasons.join(', ') : 'Meets all criteria';
  }

  /**
   * Get notification methods for vendor
   */
  private getNotificationMethods(vendor: VendorProfile): string[] {
    const methods = [];

    if (vendor.notification_preferences.push_notifications) methods.push('push');
    if (vendor.notification_preferences.email_notifications) methods.push('email');
    if (vendor.notification_preferences.whatsapp_integration) methods.push('whatsapp');

    return methods;
  }

  /**
   * Generate order description from conversation context
   */
  private generateOrderDescription(context: ConversationContext, criteria: VendorSelectionCriteria): string {
    const extractedData = context.extracted_data;

    let description = `${criteria.service_type} service requested`;

    if (extractedData.service_details) {
      description += ` - ${extractedData.service_details}`;
    }

    if (extractedData.special_requirements && extractedData.special_requirements.length > 0) {
      description += `. Special requirements: ${extractedData.special_requirements.join(', ')}`;
    }

    if (extractedData.timeline) {
      description += `. Timeline: ${extractedData.timeline}`;
    }

    return description;
  }

  /**
   * Estimate order value based on service type and priority
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
   * Calculate scheduled date based on priority
   */
  private calculateScheduledDate(priority: string): string {
    const now = new Date();

    switch (priority) {
      case 'urgent':
        // Within 2 hours
        now.setHours(now.getHours() + 2);
        break;
      case 'high':
        // Within 24 hours
        now.setDate(now.getDate() + 1);
        break;
      case 'medium':
        // Within 3 days
        now.setDate(now.getDate() + 3);
        break;
      default:
        // Within 1 week
        now.setDate(now.getDate() + 7);
        break;
    }

    return now.toISOString();
  }

  /**
   * Calculate response deadline for vendors
   */
  private calculateResponseDeadline(priority: string): string {
    const now = new Date();

    switch (priority) {
      case 'urgent':
        // 15 minutes to respond
        now.setMinutes(now.getMinutes() + 15);
        break;
      case 'high':
        // 1 hour to respond
        now.setHours(now.getHours() + 1);
        break;
      case 'medium':
        // 4 hours to respond
        now.setHours(now.getHours() + 4);
        break;
      default:
        // 24 hours to respond
        now.setDate(now.getDate() + 1);
        break;
    }

    return now.toISOString();
  }

  /**
   * Save complete order to database with trigger points data
   */
  private async saveCompleteOrder(orderDetails: any): Promise<boolean> {
    try {
      console.log(`💾 Saving order to database:`, orderDetails.order_id);

      // Save main order data (agent role)
      const orderSaved = await this.saveOrderData(orderDetails);

      // Save trigger points data (agent role)
      const triggerDataSaved = await this.saveTriggerPointsData(orderDetails);

      // Update vendor data (vendor role will update their own data)
      const vendorDataUpdated = await this.updateVendorOrderCounts(orderDetails.assigned_vendors);

      console.log(`💾 Database operations:`, {
        order_saved: orderSaved,
        trigger_data_saved: triggerDataSaved,
        vendor_data_updated: vendorDataUpdated
      });

      return orderSaved && triggerDataSaved;

    } catch (error) {
      console.error('Save complete order error:', error);
      return false;
    }
  }

  /**
   * Save order data to database (Agent role)
   */
  private async saveOrderData(orderDetails: any): Promise<boolean> {
    try {
      // In production, save to shared database with agent role
      /*
      await db.orders.create({
        data: {
          order_id: orderDetails.order_id,
          customer_name: orderDetails.customer_name,
          customer_phone: orderDetails.customer_phone,
          customer_address: orderDetails.customer_address,
          service_type: orderDetails.service_type,
          description: orderDetails.description,
          status: orderDetails.status,
          priority: orderDetails.priority,
          estimated_value: orderDetails.estimated_value,
          assigned_vendors: orderDetails.assigned_vendors,
          primary_vendor_id: orderDetails.primary_vendor_id,
          conversation_id: orderDetails.conversation_id,
          user_id: orderDetails.user_id,
          created_at: orderDetails.created_at,
          scheduled_date: orderDetails.scheduled_date,
          customer_location: orderDetails.customer_location,
          created_by_role: 'agent', // Agent role creates orders
          created_by_system: 'conversation_analysis'
        }
      });
      */

      console.log(`📝 Order data saved by agent role: ${orderDetails.order_id}`);
      return true;

    } catch (error) {
      console.error('Save order data error:', error);
      return false;
    }
  }

  /**
   * Save trigger points data to database (Agent role)
   */
  private async saveTriggerPointsData(orderDetails: any): Promise<boolean> {
    try {
      // Extract trigger points data from order
      const triggerData = {
        trigger_id: `trigger_${orderDetails.order_id}`,
        trigger_name: this.determineTriggerName(orderDetails.service_type),
        business_name: orderDetails.customer_name,
        location: orderDetails.customer_address,
        work_needed: orderDetails.description,
        service_type: orderDetails.service_type,
        selected_vendors: orderDetails.assigned_vendors,
        vendor_count: orderDetails.assigned_vendors.length,
        priority: orderDetails.priority,
        estimated_value: orderDetails.estimated_value,
        price_package: this.determinePricePackage(orderDetails.service_type, orderDetails.priority, orderDetails.estimated_value),
        conversation_id: orderDetails.conversation_id,
        order_id: orderDetails.order_id,
        user_id: orderDetails.user_id,
        triggered_at: orderDetails.created_at,
        created_by_role: 'agent', // Agent role creates trigger data
        status: 'active'
      };

      // In production, save to trigger_points table
      /*
      await db.trigger_points.create({
        data: triggerData
      });
      */

      console.log(`🎯 Trigger points data saved:`, {
        trigger_name: triggerData.trigger_name,
        business_name: triggerData.business_name,
        service_type: triggerData.service_type,
        selected_vendors: triggerData.selected_vendors.length,
        price_package: triggerData.price_package
      });

      return true;

    } catch (error) {
      console.error('Save trigger points data error:', error);
      return false;
    }
  }

  /**
   * Update vendor order counts (Vendor role will update their own data)
   */
  private async updateVendorOrderCounts(vendorIds: string[]): Promise<boolean> {
    try {
      // In production, vendors will update their own data when they accept orders
      // This is just to increment pending order counts
      /*
      for (const vendorId of vendorIds) {
        await db.vendors.update({
          where: { id: vendorId },
          data: {
            orders: {
              update: {
                pending: { increment: 1 }
              }
            },
            updated_by_role: 'system', // System updates pending counts
            updated_at: new Date()
          }
        });
      }
      */

      console.log(`📊 Vendor order counts updated for ${vendorIds.length} vendors`);
      return true;

    } catch (error) {
      console.error('Update vendor order counts error:', error);
      return false;
    }
  }

  /**
   * Get vendor profile by ID
   */
  private async getVendorProfile(vendorId: string): Promise<VendorProfile | null> {
    try {
      // In production, fetch from database
      /*
      const vendor = await db.vendors.findUnique({
        where: { id: vendorId }
      });
      return vendor;
      */

      // Mock vendor profile
      return {
        id: vendorId,
        name: 'Mock Vendor',
        contact: 'vendor@example.com',
        status: 'Verified',
        avatar: '',
        memberSince: '2023-01-01',
        orders: { total: 100, completed: 95, pending: 2, canceled: 3 },
        services: ['General'],
        location: { latitude: 40.7128, longitude: -74.0060 },
        service_area: { latitude: 40.7128, longitude: -74.0060, radius: 15 },
        activeOrders: 1,
        maxCapacity: 5,
        averageResponseTime: 20,
        rating: 4.5,
        notification_preferences: {
          push_notifications: true,
          email_notifications: true,
          whatsapp_integration: false
        },
        isOnline: true,
        lastSeen: new Date().toISOString()
      };

    } catch (error) {
      console.error('Get vendor profile error:', error);
      return null;
    }
  }

  /**
   * Get customer email template
   */
  private async getCustomerEmailTemplate(userId: string): Promise<string> {
    try {
      // In production, fetch from database or template service
      return `
Dear {{customer_name}},

Thank you for your service request! We have successfully received your request for {{service_type}} service at {{location}}.

Order Details:
- Order ID: {{order_id}}
- Service Type: {{service_type}}
- Priority: {{priority}}
- Location: {{location}}

We have notified {{vendors_count}} qualified vendors in your area. You can expect to hear from a vendor within {{estimated_response_time}} minutes.

Best regards,
{{company_name}} Team
      `.trim();

    } catch (error) {
      console.error('Get customer email template error:', error);
      return 'Thank you for your service request. We will contact you soon.';
    }
  }

  /**
   * Get vendor email template
   */
  private async getVendorEmailTemplate(userId: string): Promise<string> {
    try {
      // In production, fetch from database or template service
      return `
Dear {{vendor_name}},

You have received a new service request!

Order Details:
- Order ID: {{order_id}}
- Customer: {{customer_name}}
- Phone: {{customer_phone}}
- Service Type: {{service_type}}
- Location: {{location}}
- Priority: {{priority}}
- Estimated Value: ${{estimated_value}}

Please respond by {{response_deadline}} to accept or decline this order.

To manage this order, please check your mobile app or contact support.

Best regards,
VendorSync Team
      `.trim();

    } catch (error) {
      console.error('Get vendor email template error:', error);
      return 'New service request available. Please check your mobile app.';
    }
  }

  /**
   * Replace template variables
   */
  private replaceTemplateVariables(template: string, variables: Record<string, string>): string {
    let result = template;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    });

    return result;
  }

  /**
   * Send email
   */
  private async sendEmail(emailData: {
    to: string;
    subject: string;
    content: string;
    vendor_id?: string;
    order_id?: string;
  }): Promise<boolean> {
    try {
      console.log(`📧 Sending email to ${emailData.to}:`, emailData.subject);

      // In production, use actual email service (SendGrid, AWS SES, etc.)
      /*
      await emailService.send({
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.content
      });
      */

      // Simulate successful email send
      return true;

    } catch (error) {
      console.error('Send email error:', error);
      return false;
    }
  }

  /**
   * Send push notification to vendor mobile app
   */
  private async sendPushNotification(notification: any): Promise<boolean> {
    try {
      console.log(`📱 Sending push notification to vendor ${notification.vendor_id}`);

      // In production, use actual push notification service (Firebase, OneSignal, etc.)
      /*
      await pushNotificationService.send({
        user_id: notification.vendor_id,
        title: notification.title,
        body: notification.body,
        data: notification.data
      });
      */

      // Simulate successful push notification
      return true;

    } catch (error) {
      console.error('Send push notification error:', error);
      return false;
    }
  }

  /**
   * Send SMS to customer using third-party SMS service
   */
  private async sendSMS(smsData: {
    to: string;
    message: string;
    order_id?: string;
  }): Promise<boolean> {
    try {
      console.log(`📱 Sending SMS to ${smsData.to}`);

      // In production, use third-party SMS service (Twilio, AWS SNS, etc.)
      /*
      const twilioClient = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

      await twilioClient.messages.create({
        body: smsData.message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: smsData.to
      });
      */

      // Alternative SMS services:
      /*
      // AWS SNS
      await sns.publish({
        PhoneNumber: smsData.to,
        Message: smsData.message
      }).promise();

      // TextMagic
      await textmagic.Messages.send({
        text: smsData.message,
        phones: smsData.to
      });

      // Nexmo/Vonage
      await nexmo.message.sendSms(
        process.env.NEXMO_FROM_NUMBER,
        smsData.to,
        smsData.message
      );
      */

      console.log(`✅ SMS sent successfully to ${smsData.to}`);
      return true;

    } catch (error) {
      console.error('Send SMS error:', error);
      return false;
    }
  }

  /**
   * Get customer SMS template
   */
  private async getCustomerSMSTemplate(userId: string): Promise<string> {
    try {
      // In production, fetch from database or template service
      return `Hi {{customer_name}}! Your {{service_type}} service request (Order #{{order_id}}) has been confirmed. {{vendors_count}} qualified vendors have been notified. Expect contact within {{estimated_response_time}} minutes. - {{company_name}}`;

    } catch (error) {
      console.error('Get customer SMS template error:', error);
      return 'Your service request has been confirmed. Vendors have been notified and will contact you soon.';
    }
  }

  /**
   * Check exact service type match
   */
  private isExactServiceMatch(vendorServices: string[], requiredService: string): boolean {
    const normalizedRequired = requiredService.toLowerCase().trim();

    // Define service type mappings for exact matching
    const serviceTypeMap: Record<string, string[]> = {
      'cleaning': ['cleaning', 'house cleaning', 'office cleaning', 'deep cleaning'],
      'plumbing': ['plumbing', 'plumber', 'pipe repair', 'drain cleaning'],
      'electrical': ['electrical', 'electrician', 'wiring', 'electrical repair'],
      'maintenance': ['maintenance', 'general maintenance', 'property maintenance'],
      'repairs': ['repairs', 'general repairs', 'home repairs'],
      'landscaping': ['landscaping', 'lawn care', 'gardening', 'yard work'],
      'security': ['security', 'security systems', 'alarm systems'],
      'ac repair': ['ac repair', 'hvac', 'air conditioning', 'heating'],
      'delivery': ['delivery', 'courier', 'shipping', 'transport']
    };

    // Find matching service category
    let matchingCategory: string | null = null;
    for (const [category, variations] of Object.entries(serviceTypeMap)) {
      if (variations.some(variation => normalizedRequired.includes(variation) || variation.includes(normalizedRequired))) {
        matchingCategory = category;
        break;
      }
    }

    if (!matchingCategory) {
      // If no category found, do direct string matching
      return vendorServices.some(service =>
        service.toLowerCase().includes(normalizedRequired) ||
        normalizedRequired.includes(service.toLowerCase())
      );
    }

    // Check if vendor provides services in the matching category
    const categoryVariations = serviceTypeMap[matchingCategory];
    return vendorServices.some(vendorService =>
      categoryVariations.some(variation =>
        vendorService.toLowerCase().includes(variation) ||
        variation.includes(vendorService.toLowerCase())
      )
    );
  }

  /**
   * Determine trigger name based on service type
   */
  private determineTriggerName(serviceType: string): string {
    const triggerNames: Record<string, string> = {
      'cleaning': 'Cleaning Service Request',
      'plumbing': 'Plumbing Service Request',
      'electrical': 'Electrical Service Request',
      'maintenance': 'Maintenance Service Request',
      'repairs': 'Repair Service Request',
      'landscaping': 'Landscaping Service Request',
      'security': 'Security Service Request',
      'ac repair': 'AC Repair Service Request',
      'delivery': 'Delivery Service Request'
    };

    return triggerNames[serviceType.toLowerCase()] || 'General Service Request';
  }

  /**
   * Determine price package based on service type, priority, and estimated value
   */
  private determinePricePackage(serviceType: string, priority: string, estimatedValue: number): string {
    // Define price packages based on service type and value
    const pricePackages: Record<string, Record<string, string>> = {
      'cleaning': {
        'basic': 'Basic Cleaning Package ($100-200)',
        'standard': 'Standard Cleaning Package ($200-350)',
        'premium': 'Premium Cleaning Package ($350+)'
      },
      'plumbing': {
        'basic': 'Basic Plumbing Service ($150-250)',
        'standard': 'Standard Plumbing Service ($250-400)',
        'premium': 'Premium Plumbing Service ($400+)'
      },
      'electrical': {
        'basic': 'Basic Electrical Service ($200-300)',
        'standard': 'Standard Electrical Service ($300-500)',
        'premium': 'Premium Electrical Service ($500+)'
      }
    };

    const servicePackages = pricePackages[serviceType.toLowerCase()];
    if (!servicePackages) {
      return `${serviceType} Service Package ($${estimatedValue})`;
    }

    // Determine package tier based on estimated value
    if (estimatedValue <= 200) {
      return servicePackages.basic;
    } else if (estimatedValue <= 400) {
      return servicePackages.standard;
    } else {
      return servicePackages.premium;
    }
  }
}

// Export complete vendor selection agent
export const completeVendorSelectionAgent = CompleteVendorSelectionAgent.getInstance();
