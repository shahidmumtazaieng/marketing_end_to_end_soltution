/**
 * Real-time Conversation Processing System
 * Handles conversation data from both calling systems with efficient caching
 * Provides real-time access for vendor selection and performance tracking
 */

import { ConversationDetails, ConversationSummary, advancedConversationAnalyzer } from './advancedConversationAnalyzer';
import { completeVendorSelectionAgent } from './vendorSelectionAgent';

export interface ConversationCacheEntry {
  conversation_id: string;
  user_id: string;
  calling_system: 'elevenlabs' | 'cloned_voice';
  status: 'active' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  expires_at: string;
  
  // Cached data
  conversation_details?: ConversationDetails;
  summary?: ConversationSummary;
  vendor_selection_result?: any;
  
  // Performance tracking
  processing_metrics: {
    analysis_time_ms: number;
    vendor_selection_time_ms: number;
    total_processing_time_ms: number;
    cache_hits: number;
    database_writes: number;
  };
}

export interface ProcessingResult {
  success: boolean;
  conversation_id: string;
  processing_time_ms: number;
  analysis_result: ConversationDetails;
  vendor_selection_result?: any;
  cache_status: 'hit' | 'miss' | 'updated';
  database_status: 'saved' | 'failed' | 'skipped';
  error?: string;
}

export interface ConversationFilter {
  user_id?: string;
  calling_system?: 'elevenlabs' | 'cloned_voice';
  date_from?: string;
  date_to?: string;
  status?: 'active' | 'completed' | 'failed';
  has_triggers?: boolean;
  lead_score_min?: number;
  lead_score_max?: number;
  search_query?: string;
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'updated_at' | 'lead_score' | 'duration';
  sort_order?: 'asc' | 'desc';
}

export class RealTimeConversationProcessor {
  private static instance: RealTimeConversationProcessor;
  private redisClient: any; // Redis client for caching
  private isRedisConnected: boolean = false;

  static getInstance(): RealTimeConversationProcessor {
    if (!RealTimeConversationProcessor.instance) {
      RealTimeConversationProcessor.instance = new RealTimeConversationProcessor();
    }
    return RealTimeConversationProcessor.instance;
  }

  constructor() {
    this.initializeRedis();
  }

  /**
   * Initialize Redis connection for caching
   */
  private async initializeRedis(): Promise<void> {
    try {
      // In production, use actual Redis client
      // For now, use in-memory cache simulation
      this.redisClient = new Map();
      this.isRedisConnected = true;
      console.log('✅ Redis cache initialized (simulated)');
    } catch (error) {
      console.error('❌ Redis initialization failed:', error);
      this.isRedisConnected = false;
    }
  }

  /**
   * Main entry point: Process conversation from either calling system
   */
  async processConversation(
    conversationData: any,
    callingSystem: 'elevenlabs' | 'cloned_voice',
    userId: string,
    options: {
      forceReprocess?: boolean;
      skipVendorSelection?: boolean;
      skipCache?: boolean;
    } = {}
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🚀 Processing conversation from ${callingSystem} system for user ${userId}`);

      // Generate conversation ID
      const conversationId = this.generateConversationId(conversationData, callingSystem);

      // Check cache first (unless forced reprocess or skip cache)
      if (!options.forceReprocess && !options.skipCache) {
        const cachedResult = await this.getCachedConversation(conversationId);
        if (cachedResult && cachedResult.status === 'completed') {
          console.log(`⚡ Cache hit for conversation ${conversationId}`);
          
          // Update cache metrics
          await this.updateCacheMetrics(conversationId, 'cache_hit');
          
          return {
            success: true,
            conversation_id: conversationId,
            processing_time_ms: Date.now() - startTime,
            analysis_result: cachedResult.conversation_details!,
            vendor_selection_result: cachedResult.vendor_selection_result,
            cache_status: 'hit',
            database_status: 'skipped'
          };
        }
      }

      // Create cache entry for active processing
      await this.createCacheEntry(conversationId, userId, callingSystem);

      // Perform advanced conversation analysis
      const analysisStartTime = Date.now();
      const analysisResult = await advancedConversationAnalyzer.analyzeConversation(
        conversationData,
        callingSystem,
        userId
      );
      const analysisTime = Date.now() - analysisStartTime;

      // Perform vendor selection (unless skipped)
      let vendorSelectionResult;
      let vendorSelectionTime = 0;
      
      if (!options.skipVendorSelection) {
        const vendorStartTime = Date.now();
        vendorSelectionResult = await this.performVendorSelection(analysisResult, userId);
        vendorSelectionTime = Date.now() - vendorStartTime;
      }

      const totalProcessingTime = Date.now() - startTime;

      // Update cache with results
      await this.updateCacheEntry(conversationId, {
        conversation_details: analysisResult,
        vendor_selection_result: vendorSelectionResult,
        status: 'completed',
        processing_metrics: {
          analysis_time_ms: analysisTime,
          vendor_selection_time_ms: vendorSelectionTime,
          total_processing_time_ms: totalProcessingTime,
          cache_hits: 0,
          database_writes: 1
        }
      });

      // Save to database asynchronously
      const databaseStatus = await this.saveToDatabase(analysisResult, vendorSelectionResult);

      console.log(`✅ Conversation processing complete:`, {
        conversation_id: conversationId,
        analysis_time_ms: analysisTime,
        vendor_selection_time_ms: vendorSelectionTime,
        total_time_ms: totalProcessingTime,
        triggers_detected: analysisResult.summary.trigger_detection.triggers_detected.length,
        vendor_selection_triggered: analysisResult.summary.trigger_detection.vendor_selection_triggered
      });

      return {
        success: true,
        conversation_id: conversationId,
        processing_time_ms: totalProcessingTime,
        analysis_result: analysisResult,
        vendor_selection_result: vendorSelectionResult,
        cache_status: 'updated',
        database_status: databaseStatus
      };

    } catch (error) {
      console.error('❌ Conversation processing error:', error);
      
      return {
        success: false,
        conversation_id: 'unknown',
        processing_time_ms: Date.now() - startTime,
        analysis_result: {} as ConversationDetails,
        cache_status: 'miss',
        database_status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get conversation from cache or database
   */
  async getConversation(conversationId: string, useCache: boolean = true): Promise<ConversationDetails | null> {
    try {
      // Try cache first
      if (useCache && this.isRedisConnected) {
        const cached = await this.getCachedConversation(conversationId);
        if (cached?.conversation_details) {
          await this.updateCacheMetrics(conversationId, 'cache_hit');
          return cached.conversation_details;
        }
      }

      // Fallback to database
      const dbResult = await this.getFromDatabase(conversationId);
      
      // Cache the result if found
      if (dbResult && useCache) {
        await this.cacheConversation(conversationId, dbResult);
      }

      return dbResult;

    } catch (error) {
      console.error('Get conversation error:', error);
      return null;
    }
  }

  /**
   * Search and filter conversations with pagination
   */
  async searchConversations(filter: ConversationFilter): Promise<{
    conversations: ConversationSummary[];
    total_count: number;
    page: number;
    limit: number;
    total_pages: number;
    processing_stats: {
      cache_hits: number;
      database_queries: number;
      avg_processing_time_ms: number;
    };
  }> {
    try {
      console.log('🔍 Searching conversations with filter:', filter);

      // Set defaults
      const page = filter.page || 1;
      const limit = filter.limit || 20;
      const offset = (page - 1) * limit;

      // Build database query
      const query = this.buildSearchQuery(filter);
      
      // Execute search
      const searchResult = await this.executeSearch(query, offset, limit);

      // Get processing stats
      const processingStats = await this.getProcessingStats(filter);

      return {
        conversations: searchResult.conversations,
        total_count: searchResult.total_count,
        page,
        limit,
        total_pages: Math.ceil(searchResult.total_count / limit),
        processing_stats: processingStats
      };

    } catch (error) {
      console.error('Search conversations error:', error);
      return {
        conversations: [],
        total_count: 0,
        page: 1,
        limit: 20,
        total_pages: 0,
        processing_stats: {
          cache_hits: 0,
          database_queries: 0,
          avg_processing_time_ms: 0
        }
      };
    }
  }

  /**
   * Export conversations data
   */
  async exportConversations(
    filter: ConversationFilter,
    format: 'csv' | 'json' | 'excel' = 'csv'
  ): Promise<{
    success: boolean;
    download_url?: string;
    file_size?: number;
    record_count?: number;
    error?: string;
  }> {
    try {
      console.log(`📊 Exporting conversations in ${format} format`);

      // Get all conversations matching filter (no pagination for export)
      const exportFilter = { ...filter, limit: 10000 }; // Max export limit
      const searchResult = await this.searchConversations(exportFilter);

      // Generate export file
      const exportData = await this.generateExportFile(searchResult.conversations, format);

      // Save export file and return download URL
      const downloadUrl = await this.saveExportFile(exportData, format);

      return {
        success: true,
        download_url: downloadUrl,
        file_size: exportData.length,
        record_count: searchResult.conversations.length
      };

    } catch (error) {
      console.error('Export conversations error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      };
    }
  }

  /**
   * Get real-time processing statistics
   */
  async getProcessingStatistics(userId: string, timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<{
    total_conversations: number;
    successful_processing: number;
    failed_processing: number;
    avg_processing_time_ms: number;
    cache_hit_rate: number;
    vendor_selection_rate: number;
    top_calling_systems: Array<{ system: string; count: number; percentage: number }>;
    processing_timeline: Array<{ timestamp: string; count: number; avg_time_ms: number }>;
    trigger_detection_stats: Array<{ trigger_name: string; count: number; success_rate: number }>;
  }> {
    try {
      // Calculate time range
      const endTime = new Date();
      const startTime = new Date();
      
      switch (timeRange) {
        case '1h': startTime.setHours(startTime.getHours() - 1); break;
        case '24h': startTime.setDate(startTime.getDate() - 1); break;
        case '7d': startTime.setDate(startTime.getDate() - 7); break;
        case '30d': startTime.setDate(startTime.getDate() - 30); break;
      }

      // Get statistics from cache and database
      const stats = await this.calculateProcessingStatistics(userId, startTime, endTime);

      return stats;

    } catch (error) {
      console.error('Get processing statistics error:', error);
      return {
        total_conversations: 0,
        successful_processing: 0,
        failed_processing: 0,
        avg_processing_time_ms: 0,
        cache_hit_rate: 0,
        vendor_selection_rate: 0,
        top_calling_systems: [],
        processing_timeline: [],
        trigger_detection_stats: []
      };
    }
  }

  // Private helper methods

  private generateConversationId(data: any, callingSystem: string): string {
    return data.conversation_id || 
           data.call_id || 
           data.session_id || 
           `${callingSystem}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getCachedConversation(conversationId: string): Promise<ConversationCacheEntry | null> {
    if (!this.isRedisConnected) return null;
    
    try {
      // Simulated Redis get
      const cached = this.redisClient.get(`conversation:${conversationId}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  private async createCacheEntry(conversationId: string, userId: string, callingSystem: string): Promise<void> {
    if (!this.isRedisConnected) return;

    try {
      const cacheEntry: ConversationCacheEntry = {
        conversation_id: conversationId,
        user_id: userId,
        calling_system: callingSystem,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        processing_metrics: {
          analysis_time_ms: 0,
          vendor_selection_time_ms: 0,
          total_processing_time_ms: 0,
          cache_hits: 0,
          database_writes: 0
        }
      };

      // Simulated Redis set with expiration
      this.redisClient.set(`conversation:${conversationId}`, JSON.stringify(cacheEntry));
    } catch (error) {
      console.error('Cache create error:', error);
    }
  }

  private async updateCacheEntry(conversationId: string, updates: Partial<ConversationCacheEntry>): Promise<void> {
    if (!this.isRedisConnected) return;

    try {
      const existing = await this.getCachedConversation(conversationId);
      if (existing) {
        const updated = {
          ...existing,
          ...updates,
          updated_at: new Date().toISOString()
        };
        this.redisClient.set(`conversation:${conversationId}`, JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Cache update error:', error);
    }
  }

  private async updateCacheMetrics(conversationId: string, metric: 'cache_hit' | 'database_write'): Promise<void> {
    if (!this.isRedisConnected) return;

    try {
      const existing = await this.getCachedConversation(conversationId);
      if (existing) {
        if (metric === 'cache_hit') {
          existing.processing_metrics.cache_hits++;
        } else if (metric === 'database_write') {
          existing.processing_metrics.database_writes++;
        }
        await this.updateCacheEntry(conversationId, existing);
      }
    } catch (error) {
      console.error('Cache metrics update error:', error);
    }
  }

  private async cacheConversation(conversationId: string, conversationDetails: ConversationDetails): Promise<void> {
    if (!this.isRedisConnected) return;

    try {
      const cacheEntry: ConversationCacheEntry = {
        conversation_id: conversationId,
        user_id: conversationDetails.summary.user_id,
        calling_system: conversationDetails.summary.calling_system,
        status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        conversation_details: conversationDetails,
        processing_metrics: {
          analysis_time_ms: conversationDetails.summary.processing_metadata.processing_time_ms,
          vendor_selection_time_ms: 0,
          total_processing_time_ms: conversationDetails.summary.processing_metadata.processing_time_ms,
          cache_hits: 0,
          database_writes: 1
        }
      };

      this.redisClient.set(`conversation:${conversationId}`, JSON.stringify(cacheEntry));
    } catch (error) {
      console.error('Cache conversation error:', error);
    }
  }

  private async performVendorSelection(analysisResult: ConversationDetails, userId: string): Promise<any> {
    try {
      // Convert analysis result to vendor selection context
      const context = {
        conversation_id: analysisResult.conversation_id,
        call_id: analysisResult.summary.call_id,
        user_id: userId,
        conversation_turns: analysisResult.turns,
        extracted_data: analysisResult.summary.extracted_business_data,
        analysis: {
          intent: analysisResult.summary.intent_analysis.primary_intent,
          sentiment_score: analysisResult.summary.sentiment_analysis.sentiment_score,
          engagement_level: analysisResult.summary.quality_metrics.engagement_level,
          topics_discussed: analysisResult.summary.intent_analysis.topics_discussed,
          lead_score: analysisResult.summary.quality_metrics.lead_score
        },
        call_metadata: analysisResult.summary.call_metadata
      };

      // Process through complete vendor selection agent
      const vendorResult = await completeVendorSelectionAgent.processConversationForVendorSelection(context);

      return vendorResult;

    } catch (error) {
      console.error('Vendor selection error:', error);
      return null;
    }
  }

  private async saveToDatabase(analysisResult: ConversationDetails, vendorResult?: any): Promise<'saved' | 'failed'> {
    try {
      console.log(`💾 Saving conversation ${analysisResult.conversation_id} to database`);

      // In production, save to actual database
      /*
      await db.conversations.create({
        data: {
          conversation_id: analysisResult.conversation_id,
          user_id: analysisResult.summary.user_id,
          calling_system: analysisResult.summary.calling_system,
          conversation_data: analysisResult,
          vendor_selection_result: vendorResult,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      */

      return 'saved';
    } catch (error) {
      console.error('Database save error:', error);
      return 'failed';
    }
  }

  private async getFromDatabase(conversationId: string): Promise<ConversationDetails | null> {
    try {
      // In production, query actual database
      /*
      const result = await db.conversations.findUnique({
        where: { conversation_id: conversationId }
      });
      return result?.conversation_data as ConversationDetails;
      */

      return null; // Simulated
    } catch (error) {
      console.error('Database get error:', error);
      return null;
    }
  }

  private buildSearchQuery(filter: ConversationFilter): any {
    // Build database query based on filter
    return {
      where: {
        user_id: filter.user_id,
        calling_system: filter.calling_system,
        created_at: {
          gte: filter.date_from ? new Date(filter.date_from) : undefined,
          lte: filter.date_to ? new Date(filter.date_to) : undefined
        }
      },
      orderBy: {
        [filter.sort_by || 'created_at']: filter.sort_order || 'desc'
      }
    };
  }

  private async executeSearch(query: any, offset: number, limit: number): Promise<{
    conversations: ConversationSummary[];
    total_count: number;
  }> {
    // Mock search results
    return {
      conversations: [],
      total_count: 0
    };
  }

  private async getProcessingStats(filter: ConversationFilter): Promise<any> {
    return {
      cache_hits: 0,
      database_queries: 0,
      avg_processing_time_ms: 0
    };
  }

  private async generateExportFile(conversations: ConversationSummary[], format: string): Promise<string> {
    // Generate export file content
    if (format === 'csv') {
      return this.generateCSV(conversations);
    } else if (format === 'json') {
      return JSON.stringify(conversations, null, 2);
    }
    return '';
  }

  private generateCSV(conversations: ConversationSummary[]): string {
    const headers = [
      'Conversation ID', 'Call ID', 'Calling System', 'Phone Number', 'Duration',
      'Primary Intent', 'Sentiment', 'Lead Score', 'Customer Name', 'Location',
      'Service Type', 'Triggers Detected', 'Vendor Selection', 'Created At'
    ];

    const rows = conversations.map(conv => [
      conv.conversation_id,
      conv.call_id,
      conv.calling_system,
      conv.call_metadata.phone_number,
      conv.call_metadata.duration_seconds,
      conv.intent_analysis.primary_intent,
      conv.sentiment_analysis.overall_sentiment,
      conv.quality_metrics.lead_score,
      conv.extracted_business_data.customer_name || '',
      conv.extracted_business_data.location?.address || '',
      conv.extracted_business_data.service_type || '',
      conv.trigger_detection.triggers_detected.length,
      conv.trigger_detection.vendor_selection_triggered ? 'Yes' : 'No',
      conv.call_metadata.started_at
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private async saveExportFile(data: string, format: string): Promise<string> {
    // Save export file and return download URL
    const filename = `conversations_export_${Date.now()}.${format}`;
    // In production, save to cloud storage and return URL
    return `/api/exports/${filename}`;
  }

  private async calculateProcessingStatistics(userId: string, startTime: Date, endTime: Date): Promise<any> {
    // Calculate comprehensive processing statistics
    return {
      total_conversations: 0,
      successful_processing: 0,
      failed_processing: 0,
      avg_processing_time_ms: 0,
      cache_hit_rate: 0,
      vendor_selection_rate: 0,
      top_calling_systems: [],
      processing_timeline: [],
      trigger_detection_stats: []
    };
  }
}

// Export singleton instance
export const realTimeConversationProcessor = RealTimeConversationProcessor.getInstance();
