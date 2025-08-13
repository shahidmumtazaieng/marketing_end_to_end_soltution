/**
 * Calling System Integration Service
 * Handles automatic conversation processing from both ElevenLabs and Cloned Voice systems
 * Provides unified interface for conversation data ingestion
 */

import { realTimeConversationProcessor } from './realTimeConversationProcessor';

export interface CallingSystemWebhook {
  system: 'elevenlabs' | 'cloned_voice';
  event_type: 'call_started' | 'call_ended' | 'call_failed' | 'conversation_updated';
  timestamp: string;
  data: any;
  signature?: string;
  user_id?: string;
}

export interface ProcessingConfig {
  auto_process_on_call_end: boolean;
  skip_vendor_selection: boolean;
  enable_real_time_updates: boolean;
  webhook_retry_attempts: number;
  processing_timeout_ms: number;
}

export class CallingSystemIntegration {
  private static instance: CallingSystemIntegration;
  private processingQueue: Map<string, any> = new Map();
  private webhookSecrets: Map<string, string> = new Map();

  static getInstance(): CallingSystemIntegration {
    if (!CallingSystemIntegration.instance) {
      CallingSystemIntegration.instance = new CallingSystemIntegration();
    }
    return CallingSystemIntegration.instance;
  }

  /**
   * Handle webhook from ElevenLabs calling system
   */
  async handleElevenLabsWebhook(
    webhookData: any,
    signature: string,
    userId: string
  ): Promise<{
    success: boolean;
    conversation_id?: string;
    processing_result?: any;
    error?: string;
  }> {
    try {
      console.log(`📞 ElevenLabs webhook received for user ${userId}:`, webhookData.event_type);

      // Verify webhook signature
      if (!this.verifyWebhookSignature(webhookData, signature, 'elevenlabs', userId)) {
        console.error('❌ Invalid ElevenLabs webhook signature');
        return { success: false, error: 'Invalid webhook signature' };
      }

      // Process based on event type
      switch (webhookData.event_type) {
        case 'call_started':
          return await this.handleCallStarted(webhookData, 'elevenlabs', userId);
        
        case 'call_ended':
          return await this.handleCallEnded(webhookData, 'elevenlabs', userId);
        
        case 'call_failed':
          return await this.handleCallFailed(webhookData, 'elevenlabs', userId);
        
        case 'conversation_updated':
          return await this.handleConversationUpdated(webhookData, 'elevenlabs', userId);
        
        default:
          console.log(`ℹ️ Unhandled ElevenLabs event type: ${webhookData.event_type}`);
          return { success: true }; // Acknowledge but don't process
      }

    } catch (error) {
      console.error('ElevenLabs webhook error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Webhook processing failed' 
      };
    }
  }

  /**
   * Handle webhook from Cloned Voice calling system
   */
  async handleClonedVoiceWebhook(
    webhookData: any,
    signature: string,
    userId: string
  ): Promise<{
    success: boolean;
    conversation_id?: string;
    processing_result?: any;
    error?: string;
  }> {
    try {
      console.log(`🎙️ Cloned Voice webhook received for user ${userId}:`, webhookData.event_type);

      // Verify webhook signature
      if (!this.verifyWebhookSignature(webhookData, signature, 'cloned_voice', userId)) {
        console.error('❌ Invalid Cloned Voice webhook signature');
        return { success: false, error: 'Invalid webhook signature' };
      }

      // Process based on event type
      switch (webhookData.event_type) {
        case 'session_started':
          return await this.handleCallStarted(webhookData, 'cloned_voice', userId);
        
        case 'session_ended':
          return await this.handleCallEnded(webhookData, 'cloned_voice', userId);
        
        case 'session_failed':
          return await this.handleCallFailed(webhookData, 'cloned_voice', userId);
        
        case 'conversation_update':
          return await this.handleConversationUpdated(webhookData, 'cloned_voice', userId);
        
        default:
          console.log(`ℹ️ Unhandled Cloned Voice event type: ${webhookData.event_type}`);
          return { success: true }; // Acknowledge but don't process
      }

    } catch (error) {
      console.error('Cloned Voice webhook error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Webhook processing failed' 
      };
    }
  }

  /**
   * Manual conversation processing trigger
   */
  async processConversationManually(
    conversationData: any,
    callingSystem: 'elevenlabs' | 'cloned_voice',
    userId: string,
    options: {
      forceReprocess?: boolean;
      skipVendorSelection?: boolean;
      priority?: 'low' | 'normal' | 'high';
    } = {}
  ): Promise<any> {
    try {
      console.log(`🔧 Manual conversation processing triggered for ${callingSystem} system`);

      // Add to processing queue if high priority
      if (options.priority === 'high') {
        await this.addToProcessingQueue(conversationData, callingSystem, userId, options);
      }

      // Process conversation
      const result = await realTimeConversationProcessor.processConversation(
        conversationData,
        callingSystem,
        userId,
        {
          forceReprocess: options.forceReprocess || false,
          skipVendorSelection: options.skipVendorSelection || false,
          skipCache: false
        }
      );

      return result;

    } catch (error) {
      console.error('Manual conversation processing error:', error);
      throw error;
    }
  }

  /**
   * Get processing configuration for user
   */
  async getProcessingConfig(userId: string): Promise<ProcessingConfig> {
    try {
      // In production, fetch from database
      /*
      const config = await db.processing_configs.findUnique({
        where: { user_id: userId }
      });
      return config || getDefaultConfig();
      */

      // Default configuration
      return {
        auto_process_on_call_end: true,
        skip_vendor_selection: false,
        enable_real_time_updates: true,
        webhook_retry_attempts: 3,
        processing_timeout_ms: 30000
      };

    } catch (error) {
      console.error('Get processing config error:', error);
      return {
        auto_process_on_call_end: true,
        skip_vendor_selection: false,
        enable_real_time_updates: false,
        webhook_retry_attempts: 1,
        processing_timeout_ms: 15000
      };
    }
  }

  /**
   * Update processing configuration
   */
  async updateProcessingConfig(userId: string, config: Partial<ProcessingConfig>): Promise<boolean> {
    try {
      console.log(`⚙️ Updating processing config for user ${userId}:`, config);

      // In production, save to database
      /*
      await db.processing_configs.upsert({
        where: { user_id: userId },
        update: config,
        create: { user_id: userId, ...config }
      });
      */

      return true;

    } catch (error) {
      console.error('Update processing config error:', error);
      return false;
    }
  }

  // Private helper methods

  /**
   * Handle call started event
   */
  private async handleCallStarted(
    webhookData: any,
    callingSystem: 'elevenlabs' | 'cloned_voice',
    userId: string
  ): Promise<any> {
    try {
      const conversationId = this.extractConversationId(webhookData, callingSystem);
      console.log(`📞 Call started: ${conversationId} (${callingSystem})`);

      // Initialize conversation tracking
      await this.initializeConversationTracking(conversationId, callingSystem, userId, webhookData);

      return { 
        success: true, 
        conversation_id: conversationId,
        message: 'Call started tracking initialized'
      };

    } catch (error) {
      console.error('Handle call started error:', error);
      return { success: false, error: 'Failed to initialize call tracking' };
    }
  }

  /**
   * Handle call ended event - trigger full processing
   */
  private async handleCallEnded(
    webhookData: any,
    callingSystem: 'elevenlabs' | 'cloned_voice',
    userId: string
  ): Promise<any> {
    try {
      const conversationId = this.extractConversationId(webhookData, callingSystem);
      console.log(`📞 Call ended: ${conversationId} (${callingSystem}) - triggering processing`);

      // Get processing configuration
      const config = await this.getProcessingConfig(userId);

      if (!config.auto_process_on_call_end) {
        console.log('Auto-processing disabled for user');
        return { 
          success: true, 
          conversation_id: conversationId,
          message: 'Call ended but auto-processing disabled'
        };
      }

      // Extract conversation data from webhook
      const conversationData = this.extractConversationData(webhookData, callingSystem);

      // Process conversation
      const processingResult = await realTimeConversationProcessor.processConversation(
        conversationData,
        callingSystem,
        userId,
        {
          forceReprocess: false,
          skipVendorSelection: config.skip_vendor_selection,
          skipCache: false
        }
      );

      return {
        success: true,
        conversation_id: conversationId,
        processing_result: {
          processing_time_ms: processingResult.processing_time_ms,
          triggers_detected: processingResult.analysis_result?.summary?.trigger_detection?.triggers_detected?.length || 0,
          vendor_selection_triggered: processingResult.vendor_selection_result?.triggered || false,
          lead_score: processingResult.analysis_result?.summary?.quality_metrics?.lead_score || 0
        }
      };

    } catch (error) {
      console.error('Handle call ended error:', error);
      return { 
        success: false, 
        error: 'Failed to process ended call',
        conversation_id: this.extractConversationId(webhookData, callingSystem)
      };
    }
  }

  /**
   * Handle call failed event
   */
  private async handleCallFailed(
    webhookData: any,
    callingSystem: 'elevenlabs' | 'cloned_voice',
    userId: string
  ): Promise<any> {
    try {
      const conversationId = this.extractConversationId(webhookData, callingSystem);
      console.log(`❌ Call failed: ${conversationId} (${callingSystem})`);

      // Log call failure
      await this.logCallFailure(conversationId, callingSystem, userId, webhookData);

      return { 
        success: true, 
        conversation_id: conversationId,
        message: 'Call failure logged'
      };

    } catch (error) {
      console.error('Handle call failed error:', error);
      return { success: false, error: 'Failed to log call failure' };
    }
  }

  /**
   * Handle conversation updated event (real-time updates)
   */
  private async handleConversationUpdated(
    webhookData: any,
    callingSystem: 'elevenlabs' | 'cloned_voice',
    userId: string
  ): Promise<any> {
    try {
      const conversationId = this.extractConversationId(webhookData, callingSystem);
      console.log(`🔄 Conversation updated: ${conversationId} (${callingSystem})`);

      // Get processing configuration
      const config = await this.getProcessingConfig(userId);

      if (!config.enable_real_time_updates) {
        return { 
          success: true, 
          conversation_id: conversationId,
          message: 'Real-time updates disabled'
        };
      }

      // Update conversation cache with new data
      await this.updateConversationCache(conversationId, webhookData, callingSystem);

      return { 
        success: true, 
        conversation_id: conversationId,
        message: 'Conversation cache updated'
      };

    } catch (error) {
      console.error('Handle conversation updated error:', error);
      return { success: false, error: 'Failed to update conversation' };
    }
  }

  /**
   * Verify webhook signature
   */
  private verifyWebhookSignature(
    data: any,
    signature: string,
    callingSystem: 'elevenlabs' | 'cloned_voice',
    userId: string
  ): boolean {
    try {
      // In production, implement actual signature verification
      // const secret = this.webhookSecrets.get(`${callingSystem}_${userId}`);
      // return crypto.verify(data, signature, secret);
      
      return true; // Simplified for development
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }

  /**
   * Extract conversation ID from webhook data
   */
  private extractConversationId(webhookData: any, callingSystem: string): string {
    if (callingSystem === 'elevenlabs') {
      return webhookData.conversation_id || webhookData.call_id || `elevenlabs_${Date.now()}`;
    } else if (callingSystem === 'cloned_voice') {
      return webhookData.session_id || webhookData.conversation_id || `cloned_voice_${Date.now()}`;
    }
    return `unknown_${Date.now()}`;
  }

  /**
   * Extract conversation data from webhook
   */
  private extractConversationData(webhookData: any, callingSystem: string): any {
    if (callingSystem === 'elevenlabs') {
      return {
        conversation_id: webhookData.conversation_id,
        call_id: webhookData.call_id,
        phone_number: webhookData.phone_number,
        call_type: webhookData.call_type,
        started_at: webhookData.started_at,
        ended_at: webhookData.ended_at,
        duration_seconds: webhookData.duration_seconds,
        call_status: webhookData.call_status,
        recording_url: webhookData.recording_url,
        conversation_turns: webhookData.conversation_turns || webhookData.turns,
        transcript: webhookData.transcript
      };
    } else if (callingSystem === 'cloned_voice') {
      return {
        session_id: webhookData.session_id,
        conversation_id: webhookData.conversation_id,
        caller_number: webhookData.caller_number,
        call_direction: webhookData.call_direction,
        call_start_time: webhookData.call_start_time,
        call_end_time: webhookData.call_end_time,
        call_duration: webhookData.call_duration,
        call_status: webhookData.call_status,
        recording_path: webhookData.recording_path,
        conversation_log: webhookData.conversation_log,
        full_transcript: webhookData.full_transcript
      };
    }
    return webhookData;
  }

  /**
   * Initialize conversation tracking
   */
  private async initializeConversationTracking(
    conversationId: string,
    callingSystem: string,
    userId: string,
    webhookData: any
  ): Promise<void> {
    try {
      // Initialize tracking in cache/database
      console.log(`🎯 Initializing tracking for conversation ${conversationId}`);
      
      // In production, create initial conversation record
      /*
      await db.conversations.create({
        data: {
          conversation_id: conversationId,
          user_id: userId,
          calling_system: callingSystem,
          status: 'active',
          started_at: new Date(),
          metadata: webhookData
        }
      });
      */

    } catch (error) {
      console.error('Initialize conversation tracking error:', error);
    }
  }

  /**
   * Log call failure
   */
  private async logCallFailure(
    conversationId: string,
    callingSystem: string,
    userId: string,
    webhookData: any
  ): Promise<void> {
    try {
      console.log(`📝 Logging call failure for ${conversationId}`);
      
      // In production, log to database
      /*
      await db.call_failures.create({
        data: {
          conversation_id: conversationId,
          user_id: userId,
          calling_system: callingSystem,
          failure_reason: webhookData.failure_reason,
          error_code: webhookData.error_code,
          metadata: webhookData,
          created_at: new Date()
        }
      });
      */

    } catch (error) {
      console.error('Log call failure error:', error);
    }
  }

  /**
   * Update conversation cache
   */
  private async updateConversationCache(
    conversationId: string,
    webhookData: any,
    callingSystem: string
  ): Promise<void> {
    try {
      // Update real-time conversation data in cache
      console.log(`💾 Updating cache for conversation ${conversationId}`);
      
      // Implementation would update Redis cache with new conversation data

    } catch (error) {
      console.error('Update conversation cache error:', error);
    }
  }

  /**
   * Add conversation to processing queue
   */
  private async addToProcessingQueue(
    conversationData: any,
    callingSystem: string,
    userId: string,
    options: any
  ): Promise<void> {
    try {
      const queueEntry = {
        conversation_data: conversationData,
        calling_system: callingSystem,
        user_id: userId,
        options: options,
        queued_at: new Date().toISOString(),
        priority: options.priority || 'normal'
      };

      const conversationId = this.extractConversationId(conversationData, callingSystem);
      this.processingQueue.set(conversationId, queueEntry);

      console.log(`📋 Added conversation ${conversationId} to processing queue`);

    } catch (error) {
      console.error('Add to processing queue error:', error);
    }
  }
}

// Export singleton instance
export const callingSystemIntegration = CallingSystemIntegration.getInstance();
