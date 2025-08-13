/**
 * Conversation Cache Service
 * Real-time conversation caching in local storage during active calls
 * For both ElevenLabs calling agent and AI cloned voice calling system
 */

export interface ConversationTurn {
  id: string;
  timestamp: string;
  speaker: 'ai' | 'customer' | 'system';
  content: string;
  audio_url?: string;
  confidence?: number;
  intent?: string;
  entities?: Record<string, any>;
  duration?: number;
}

export interface CallMetadata {
  call_id: string;
  customer_id?: string;
  phone_number: string;
  call_type: 'elevenlabs_agent' | 'ai_cloned_voice';
  started_at: string;
  ended_at?: string;
  duration?: number;
  status: 'active' | 'completed' | 'failed' | 'cancelled';
  
  // Business information extracted during conversation
  business_name?: string;
  contact_name?: string;
  owner_name?: string;
  location?: string;
  industry?: string;
  email?: string;
  website?: string;
  
  // Call configuration
  voice_config?: any;
  script_template?: string;
  knowledge_base_id?: string;
  
  // Performance metrics
  quality_score?: number;
  sentiment_score?: number;
  engagement_level?: number;
}

export interface CachedConversation {
  metadata: CallMetadata;
  turns: ConversationTurn[];
  extracted_data: Record<string, any>;
  last_updated: string;
  sync_status: 'pending' | 'synced' | 'failed';
}

export class ConversationCacheService {
  private static instance: ConversationCacheService;
  private readonly CACHE_PREFIX = 'call_conversation_';
  private readonly MAX_CACHE_SIZE = 50; // Maximum number of conversations to cache
  private readonly SYNC_INTERVAL = 30000; // 30 seconds
  
  private syncTimer?: NodeJS.Timeout;
  private activeCallIds: Set<string> = new Set();

  static getInstance(): ConversationCacheService {
    if (!ConversationCacheService.instance) {
      ConversationCacheService.instance = new ConversationCacheService();
    }
    return ConversationCacheService.instance;
  }

  /**
   * Start caching a new conversation
   */
  startConversation(metadata: CallMetadata): void {
    try {
      const conversation: CachedConversation = {
        metadata,
        turns: [],
        extracted_data: {},
        last_updated: new Date().toISOString(),
        sync_status: 'pending'
      };

      this.saveToCache(metadata.call_id, conversation);
      this.activeCallIds.add(metadata.call_id);
      
      // Start periodic sync if not already running
      this.startPeriodicSync();
      
      console.log(`📞 Started caching conversation for call ${metadata.call_id}`);
    } catch (error) {
      console.error('Failed to start conversation caching:', error);
    }
  }

  /**
   * Add a conversation turn to cache
   */
  addConversationTurn(callId: string, turn: ConversationTurn): void {
    try {
      const conversation = this.getFromCache(callId);
      if (!conversation) {
        console.warn(`No cached conversation found for call ${callId}`);
        return;
      }

      conversation.turns.push(turn);
      conversation.last_updated = new Date().toISOString();
      conversation.sync_status = 'pending';

      // Extract business information from the turn
      this.extractBusinessInfo(conversation, turn);

      this.saveToCache(callId, conversation);
      
      console.log(`💬 Added turn to conversation ${callId}:`, turn.speaker, turn.content.substring(0, 50));
    } catch (error) {
      console.error('Failed to add conversation turn:', error);
    }
  }

  /**
   * Update call metadata
   */
  updateCallMetadata(callId: string, updates: Partial<CallMetadata>): void {
    try {
      const conversation = this.getFromCache(callId);
      if (!conversation) {
        console.warn(`No cached conversation found for call ${callId}`);
        return;
      }

      conversation.metadata = { ...conversation.metadata, ...updates };
      conversation.last_updated = new Date().toISOString();
      conversation.sync_status = 'pending';

      this.saveToCache(callId, conversation);
      
      console.log(`📝 Updated metadata for call ${callId}:`, updates);
    } catch (error) {
      console.error('Failed to update call metadata:', error);
    }
  }

  /**
   * End conversation and prepare for final sync
   */
  endConversation(callId: string, finalMetadata?: Partial<CallMetadata>): CachedConversation | null {
    try {
      const conversation = this.getFromCache(callId);
      if (!conversation) {
        console.warn(`No cached conversation found for call ${callId}`);
        return null;
      }

      // Update final metadata
      if (finalMetadata) {
        conversation.metadata = { ...conversation.metadata, ...finalMetadata };
      }

      conversation.metadata.ended_at = new Date().toISOString();
      conversation.metadata.status = 'completed';
      conversation.last_updated = new Date().toISOString();
      conversation.sync_status = 'pending';

      // Calculate call duration
      if (conversation.metadata.started_at) {
        const startTime = new Date(conversation.metadata.started_at).getTime();
        const endTime = new Date().getTime();
        conversation.metadata.duration = Math.floor((endTime - startTime) / 1000);
      }

      this.saveToCache(callId, conversation);
      this.activeCallIds.delete(callId);

      console.log(`🏁 Ended conversation caching for call ${callId}`);
      
      // Trigger immediate sync for completed call
      this.syncConversation(callId);

      // Trigger vendor selection agent processing
      this.triggerVendorSelection(callId, conversation);

      return conversation;
    } catch (error) {
      console.error('Failed to end conversation caching:', error);
      return null;
    }
  }

  /**
   * Get cached conversation
   */
  getConversation(callId: string): CachedConversation | null {
    return this.getFromCache(callId);
  }

  /**
   * Get all cached conversations
   */
  getAllCachedConversations(): CachedConversation[] {
    try {
      const conversations: CachedConversation[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.CACHE_PREFIX)) {
          const conversation = this.getFromCache(key.replace(this.CACHE_PREFIX, ''));
          if (conversation) {
            conversations.push(conversation);
          }
        }
      }

      return conversations.sort((a, b) => 
        new Date(b.metadata.started_at).getTime() - new Date(a.metadata.started_at).getTime()
      );
    } catch (error) {
      console.error('Failed to get all cached conversations:', error);
      return [];
    }
  }

  /**
   * Clear conversation from cache
   */
  clearConversation(callId: string): void {
    try {
      localStorage.removeItem(this.CACHE_PREFIX + callId);
      this.activeCallIds.delete(callId);
      console.log(`🗑️ Cleared conversation cache for call ${callId}`);
    } catch (error) {
      console.error('Failed to clear conversation cache:', error);
    }
  }

  /**
   * Trigger vendor selection agent processing
   */
  async triggerVendorSelection(callId: string, conversation: CachedConversation): Promise<void> {
    try {
      console.log(`🧠 Triggering vendor selection for conversation ${callId}`);

      // Only process completed conversations
      if (conversation.metadata.status !== 'completed') {
        console.log('Skipping vendor selection - conversation not completed');
        return;
      }

      // Prepare conversation data for vendor selection agent
      const conversationData = {
        turns: conversation.turns,
        extracted_data: conversation.extracted_data,
        analysis: {
          // Mock analysis data - in production this would come from conversation analyzer
          intent: 'interested',
          sentiment_score: 0.7,
          engagement_level: 0.8,
          topics_discussed: ['service', 'appointment'],
          lead_score: 75
        },
        metadata: conversation.metadata
      };

      // Call vendor selection API
      const response = await fetch('/api/vendor-selection/process-conversation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversation_id: callId,
          call_id: callId,
          conversation_data: conversationData
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Vendor selection processing result:`, result);
      } else {
        console.error('❌ Vendor selection processing failed:', response.statusText);
      }

    } catch (error) {
      console.error('Failed to trigger vendor selection:', error);
      // Don't throw error - vendor selection is optional
    }
  }

  /**
   * Sync conversation to database
   */
  async syncConversation(callId: string): Promise<boolean> {
    try {
      const conversation = this.getFromCache(callId);
      if (!conversation) {
        return false;
      }

      // Send to backend API
      const response = await fetch('/api/call-tracking/conversations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          call_id: callId,
          conversation_data: conversation
        })
      });

      if (response.ok) {
        conversation.sync_status = 'synced';
        this.saveToCache(callId, conversation);
        console.log(`✅ Synced conversation ${callId} to database`);
        return true;
      } else {
        conversation.sync_status = 'failed';
        this.saveToCache(callId, conversation);
        console.error(`❌ Failed to sync conversation ${callId}:`, response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Failed to sync conversation:', error);
      return false;
    }
  }

  /**
   * Sync all pending conversations
   */
  async syncAllPending(): Promise<void> {
    const conversations = this.getAllCachedConversations();
    const pending = conversations.filter(c => c.sync_status === 'pending');

    console.log(`🔄 Syncing ${pending.length} pending conversations`);

    for (const conversation of pending) {
      await this.syncConversation(conversation.metadata.call_id);
      // Add small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Start periodic sync for active conversations
   */
  private startPeriodicSync(): void {
    if (this.syncTimer) {
      return; // Already running
    }

    this.syncTimer = setInterval(async () => {
      if (this.activeCallIds.size === 0) {
        // No active calls, stop periodic sync
        this.stopPeriodicSync();
        return;
      }

      await this.syncAllPending();
    }, this.SYNC_INTERVAL);

    console.log('🔄 Started periodic conversation sync');
  }

  /**
   * Stop periodic sync
   */
  private stopPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
      console.log('⏹️ Stopped periodic conversation sync');
    }
  }

  /**
   * Extract business information from conversation turn
   */
  private extractBusinessInfo(conversation: CachedConversation, turn: ConversationTurn): void {
    try {
      const content = turn.content.toLowerCase();
      
      // Extract business name patterns
      const businessPatterns = [
        /(?:my company is|we are|this is|i'm from|i work at|i represent)\s+([^,.!?]+)/i,
        /(?:company name is|business name is|we're called)\s+([^,.!?]+)/i
      ];

      // Extract contact name patterns
      const namePatterns = [
        /(?:my name is|i'm|this is|i am)\s+([a-z]+(?:\s+[a-z]+)?)/i,
        /(?:speaking with|talking to)\s+([a-z]+(?:\s+[a-z]+)?)/i
      ];

      // Extract location patterns
      const locationPatterns = [
        /(?:located in|based in|we're in|from)\s+([^,.!?]+)/i,
        /(?:our office is in|headquarters in)\s+([^,.!?]+)/i
      ];

      // Extract email patterns
      const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;

      // Extract website patterns
      const websitePattern = /((?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/;

      // Apply extractions
      for (const pattern of businessPatterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
          conversation.extracted_data.business_name = match[1].trim();
          conversation.metadata.business_name = match[1].trim();
        }
      }

      for (const pattern of namePatterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
          conversation.extracted_data.contact_name = match[1].trim();
          conversation.metadata.contact_name = match[1].trim();
        }
      }

      for (const pattern of locationPatterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
          conversation.extracted_data.location = match[1].trim();
          conversation.metadata.location = match[1].trim();
        }
      }

      const emailMatch = content.match(emailPattern);
      if (emailMatch && emailMatch[1]) {
        conversation.extracted_data.email = emailMatch[1];
        conversation.metadata.email = emailMatch[1];
      }

      const websiteMatch = content.match(websitePattern);
      if (websiteMatch && websiteMatch[1]) {
        conversation.extracted_data.website = websiteMatch[1];
        conversation.metadata.website = websiteMatch[1];
      }

    } catch (error) {
      console.error('Failed to extract business info:', error);
    }
  }

  /**
   * Save conversation to local storage
   */
  private saveToCache(callId: string, conversation: CachedConversation): void {
    try {
      localStorage.setItem(
        this.CACHE_PREFIX + callId,
        JSON.stringify(conversation)
      );
    } catch (error) {
      console.error('Failed to save conversation to cache:', error);
      // Handle storage quota exceeded
      this.cleanupOldConversations();
    }
  }

  /**
   * Get conversation from local storage
   */
  private getFromCache(callId: string): CachedConversation | null {
    try {
      const data = localStorage.getItem(this.CACHE_PREFIX + callId);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get conversation from cache:', error);
      return null;
    }
  }

  /**
   * Cleanup old conversations to free storage space
   */
  private cleanupOldConversations(): void {
    try {
      const conversations = this.getAllCachedConversations();
      
      // Keep only synced conversations and recent ones
      const toKeep = conversations
        .filter(c => c.sync_status === 'synced' || this.activeCallIds.has(c.metadata.call_id))
        .slice(0, this.MAX_CACHE_SIZE);

      // Clear all conversations
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      }

      // Restore kept conversations
      for (const conversation of toKeep) {
        this.saveToCache(conversation.metadata.call_id, conversation);
      }

      console.log(`🧹 Cleaned up conversation cache, kept ${toKeep.length} conversations`);
    } catch (error) {
      console.error('Failed to cleanup old conversations:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    total_conversations: number;
    active_calls: number;
    pending_sync: number;
    failed_sync: number;
    storage_used: number;
  } {
    try {
      const conversations = this.getAllCachedConversations();
      
      return {
        total_conversations: conversations.length,
        active_calls: this.activeCallIds.size,
        pending_sync: conversations.filter(c => c.sync_status === 'pending').length,
        failed_sync: conversations.filter(c => c.sync_status === 'failed').length,
        storage_used: this.getStorageUsage()
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        total_conversations: 0,
        active_calls: 0,
        pending_sync: 0,
        failed_sync: 0,
        storage_used: 0
      };
    }
  }

  /**
   * Get storage usage in bytes
   */
  private getStorageUsage(): number {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.CACHE_PREFIX)) {
        const value = localStorage.getItem(key);
        total += (key.length + (value?.length || 0)) * 2; // UTF-16 encoding
      }
    }
    return total;
  }
}

// Export singleton instance
export const conversationCache = ConversationCacheService.getInstance();
