/**
 * Advanced Conversation Analyzer for Vendor Selection System
 * Handles both ElevenLabs and Cloned Voice calling systems
 * Provides real-time conversation analysis and trigger detection
 */

export interface ConversationTurn {
  id: string;
  speaker: 'agent' | 'customer';
  content: string;
  timestamp: string;
  duration?: number;
  confidence?: number;
  sentiment?: number;
  intent?: string;
  entities?: ExtractedEntity[];
}

export interface ExtractedEntity {
  type: 'person' | 'location' | 'organization' | 'phone' | 'email' | 'date' | 'time' | 'service' | 'urgency';
  value: string;
  confidence: number;
  start_position: number;
  end_position: number;
}

export interface ConversationSummary {
  conversation_id: string;
  call_id: string;
  user_id: string;
  calling_system: 'elevenlabs' | 'cloned_voice';
  
  // Call Metadata
  call_metadata: {
    phone_number: string;
    call_type: 'inbound' | 'outbound';
    started_at: string;
    ended_at: string;
    duration_seconds: number;
    call_status: 'completed' | 'failed' | 'abandoned' | 'busy' | 'no_answer';
    recording_url?: string;
  };

  // Conversation Analysis
  conversation_analysis: {
    total_turns: number;
    customer_turns: number;
    agent_turns: number;
    avg_turn_length: number;
    conversation_flow_quality: number; // 0-1
    interruptions_count: number;
    silence_periods: number;
  };

  // Advanced Analytics
  sentiment_analysis: {
    overall_sentiment: 'positive' | 'neutral' | 'negative';
    sentiment_score: number; // -1 to 1
    sentiment_progression: number[]; // sentiment over time
    emotional_peaks: Array<{
      timestamp: string;
      emotion: string;
      intensity: number;
    }>;
  };

  // Intent & Topic Analysis
  intent_analysis: {
    primary_intent: 'interested' | 'not_interested' | 'callback' | 'information' | 'complaint' | 'converted';
    intent_confidence: number;
    intent_progression: Array<{
      timestamp: string;
      intent: string;
      confidence: number;
    }>;
    topics_discussed: string[];
    keywords_mentioned: string[];
  };

  // Business Data Extraction
  extracted_business_data: {
    customer_name?: string;
    company_name?: string;
    contact_phone?: string;
    contact_email?: string;
    location?: {
      address?: string;
      city?: string;
      state?: string;
      zip_code?: string;
      coordinates?: { lat: number; lng: number };
    };
    service_type?: string;
    service_details?: string;
    budget_range?: string;
    timeline?: string;
    urgency_level?: 'low' | 'medium' | 'high' | 'emergency';
    special_requirements?: string[];
  };

  // Conversation Quality Metrics
  quality_metrics: {
    lead_score: number; // 0-100
    engagement_level: number; // 0-1
    information_completeness: number; // 0-1
    next_action_clarity: number; // 0-1
    conversion_probability: number; // 0-1
  };

  // Trigger Detection Results
  trigger_detection: {
    triggers_detected: Array<{
      trigger_id: string;
      trigger_name: string;
      confidence_score: number;
      triggered_at: string;
      trigger_reason: string;
      required_conditions_met: boolean;
    }>;
    vendor_selection_triggered: boolean;
    vendor_selection_result?: {
      vendors_selected: number;
      vendor_ids: string[];
      actions_taken: {
        customer_email_sent: boolean;
        vendors_notified: boolean;
        order_created: boolean;
      };
      order_id?: string;
    };
  };

  // Processing Metadata
  processing_metadata: {
    processed_at: string;
    processing_time_ms: number;
    ai_model_used: string;
    analysis_version: string;
    data_sources: string[];
  };
}

export interface ConversationDetails {
  conversation_id: string;
  turns: ConversationTurn[];
  summary: ConversationSummary;
  raw_transcript?: string;
  audio_analysis?: {
    speech_rate: number;
    pause_patterns: number[];
    voice_stress_indicators: number[];
    background_noise_level: number;
  };
}

export class AdvancedConversationAnalyzer {
  private static instance: AdvancedConversationAnalyzer;

  static getInstance(): AdvancedConversationAnalyzer {
    if (!AdvancedConversationAnalyzer.instance) {
      AdvancedConversationAnalyzer.instance = new AdvancedConversationAnalyzer();
    }
    return AdvancedConversationAnalyzer.instance;
  }

  /**
   * Main entry point: Analyze conversation from either calling system
   */
  async analyzeConversation(
    conversationData: any,
    callingSystem: 'elevenlabs' | 'cloned_voice',
    userId: string
  ): Promise<ConversationDetails> {
    try {
      console.log(`🧠 Analyzing conversation from ${callingSystem} system`);

      // Normalize conversation data from different calling systems
      const normalizedData = await this.normalizeConversationData(conversationData, callingSystem);

      // Extract conversation turns
      const turns = await this.extractConversationTurns(normalizedData, callingSystem);

      // Perform advanced analysis
      const summary = await this.generateConversationSummary(turns, normalizedData, callingSystem, userId);

      // Create conversation details object
      const conversationDetails: ConversationDetails = {
        conversation_id: normalizedData.conversation_id,
        turns,
        summary,
        raw_transcript: normalizedData.raw_transcript,
        audio_analysis: normalizedData.audio_analysis
      };

      console.log(`✅ Conversation analysis complete:`, {
        conversation_id: conversationDetails.conversation_id,
        turns_count: turns.length,
        primary_intent: summary.intent_analysis.primary_intent,
        lead_score: summary.quality_metrics.lead_score,
        triggers_detected: summary.trigger_detection.triggers_detected.length
      });

      return conversationDetails;

    } catch (error) {
      console.error('Conversation analysis error:', error);
      throw error;
    }
  }

  /**
   * Normalize conversation data from different calling systems
   */
  private async normalizeConversationData(data: any, callingSystem: 'elevenlabs' | 'cloned_voice'): Promise<any> {
    try {
      if (callingSystem === 'elevenlabs') {
        return this.normalizeElevenLabsData(data);
      } else if (callingSystem === 'cloned_voice') {
        return this.normalizeClonedVoiceData(data);
      } else {
        throw new Error(`Unsupported calling system: ${callingSystem}`);
      }
    } catch (error) {
      console.error('Data normalization error:', error);
      throw error;
    }
  }

  /**
   * Normalize ElevenLabs conversation data
   */
  private normalizeElevenLabsData(data: any): any {
    return {
      conversation_id: data.conversation_id || `conv_${Date.now()}`,
      call_id: data.call_id || data.conversation_id,
      phone_number: data.phone_number || '',
      call_type: data.call_type || 'inbound',
      started_at: data.started_at || new Date().toISOString(),
      ended_at: data.ended_at || new Date().toISOString(),
      duration_seconds: data.duration_seconds || 0,
      call_status: data.call_status || 'completed',
      recording_url: data.recording_url,
      
      // ElevenLabs specific conversation structure
      conversation_turns: data.conversation_turns || data.turns || [],
      transcript: data.transcript || '',
      raw_transcript: data.raw_transcript || data.transcript || '',
      
      // ElevenLabs audio analysis
      audio_analysis: {
        speech_rate: data.audio_analysis?.speech_rate || 150,
        pause_patterns: data.audio_analysis?.pause_patterns || [],
        voice_stress_indicators: data.audio_analysis?.voice_stress_indicators || [],
        background_noise_level: data.audio_analysis?.background_noise_level || 0.1
      }
    };
  }

  /**
   * Normalize Cloned Voice conversation data
   */
  private normalizeClonedVoiceData(data: any): any {
    return {
      conversation_id: data.session_id || data.conversation_id || `conv_${Date.now()}`,
      call_id: data.call_id || data.session_id,
      phone_number: data.caller_number || data.phone_number || '',
      call_type: data.call_direction || data.call_type || 'inbound',
      started_at: data.call_start_time || data.started_at || new Date().toISOString(),
      ended_at: data.call_end_time || data.ended_at || new Date().toISOString(),
      duration_seconds: data.call_duration || data.duration_seconds || 0,
      call_status: data.call_status || 'completed',
      recording_url: data.recording_path || data.recording_url,
      
      // Cloned Voice specific conversation structure
      conversation_turns: data.conversation_log || data.messages || data.turns || [],
      transcript: data.full_transcript || data.transcript || '',
      raw_transcript: data.raw_transcript || data.full_transcript || '',
      
      // Cloned Voice audio analysis
      audio_analysis: {
        speech_rate: data.speech_metrics?.rate || 150,
        pause_patterns: data.speech_metrics?.pauses || [],
        voice_stress_indicators: data.voice_analysis?.stress_levels || [],
        background_noise_level: data.audio_quality?.noise_level || 0.1
      }
    };
  }

  /**
   * Extract and standardize conversation turns
   */
  private async extractConversationTurns(normalizedData: any, callingSystem: string): Promise<ConversationTurn[]> {
    try {
      const turns: ConversationTurn[] = [];
      const rawTurns = normalizedData.conversation_turns || [];

      for (let i = 0; i < rawTurns.length; i++) {
        const rawTurn = rawTurns[i];
        
        const turn: ConversationTurn = {
          id: `turn_${i + 1}`,
          speaker: this.determineSpeaker(rawTurn, callingSystem),
          content: this.extractTurnContent(rawTurn, callingSystem),
          timestamp: this.extractTurnTimestamp(rawTurn, callingSystem),
          duration: this.extractTurnDuration(rawTurn, callingSystem),
          confidence: this.extractTurnConfidence(rawTurn, callingSystem),
          sentiment: await this.analyzeTurnSentiment(this.extractTurnContent(rawTurn, callingSystem)),
          intent: await this.analyzeTurnIntent(this.extractTurnContent(rawTurn, callingSystem)),
          entities: await this.extractTurnEntities(this.extractTurnContent(rawTurn, callingSystem))
        };

        turns.push(turn);
      }

      return turns;

    } catch (error) {
      console.error('Turn extraction error:', error);
      return [];
    }
  }

  /**
   * Determine speaker from turn data
   */
  private determineSpeaker(turn: any, callingSystem: string): 'agent' | 'customer' {
    if (callingSystem === 'elevenlabs') {
      return turn.speaker === 'agent' || turn.role === 'assistant' ? 'agent' : 'customer';
    } else if (callingSystem === 'cloned_voice') {
      return turn.sender === 'ai' || turn.type === 'ai_response' ? 'agent' : 'customer';
    }
    return 'customer'; // Default to customer
  }

  /**
   * Extract turn content
   */
  private extractTurnContent(turn: any, callingSystem: string): string {
    if (callingSystem === 'elevenlabs') {
      return turn.content || turn.message || turn.text || '';
    } else if (callingSystem === 'cloned_voice') {
      return turn.message || turn.content || turn.transcript || '';
    }
    return '';
  }

  /**
   * Extract turn timestamp
   */
  private extractTurnTimestamp(turn: any, callingSystem: string): string {
    if (callingSystem === 'elevenlabs') {
      return turn.timestamp || turn.time || new Date().toISOString();
    } else if (callingSystem === 'cloned_voice') {
      return turn.timestamp || turn.time || turn.created_at || new Date().toISOString();
    }
    return new Date().toISOString();
  }

  /**
   * Extract turn duration
   */
  private extractTurnDuration(turn: any, callingSystem: string): number | undefined {
    if (callingSystem === 'elevenlabs') {
      return turn.duration || turn.duration_ms;
    } else if (callingSystem === 'cloned_voice') {
      return turn.duration || turn.speech_duration;
    }
    return undefined;
  }

  /**
   * Extract turn confidence
   */
  private extractTurnConfidence(turn: any, callingSystem: string): number | undefined {
    if (callingSystem === 'elevenlabs') {
      return turn.confidence || turn.transcription_confidence;
    } else if (callingSystem === 'cloned_voice') {
      return turn.confidence || turn.recognition_confidence;
    }
    return undefined;
  }

  /**
   * Analyze turn sentiment using AI
   */
  private async analyzeTurnSentiment(content: string): Promise<number | undefined> {
    try {
      // Simple sentiment analysis - in production, use advanced AI models
      const positiveWords = ['good', 'great', 'excellent', 'yes', 'interested', 'perfect', 'sounds good'];
      const negativeWords = ['no', 'not interested', 'bad', 'terrible', 'never', 'stop calling'];
      
      const words = content.toLowerCase().split(' ');
      let score = 0;
      
      words.forEach(word => {
        if (positiveWords.includes(word)) score += 0.1;
        if (negativeWords.includes(word)) score -= 0.1;
      });
      
      return Math.max(-1, Math.min(1, score));
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return undefined;
    }
  }

  /**
   * Analyze turn intent
   */
  private async analyzeTurnIntent(content: string): Promise<string | undefined> {
    try {
      const intentKeywords = {
        'interested': ['interested', 'tell me more', 'sounds good', 'yes'],
        'not_interested': ['not interested', 'no thanks', 'remove me', 'stop calling'],
        'callback': ['call back', 'call later', 'busy now', 'not a good time'],
        'information': ['how much', 'what do you', 'tell me about', 'more information'],
        'complaint': ['complaint', 'problem', 'issue', 'unhappy'],
        'converted': ['yes', 'book it', 'schedule', 'go ahead', 'proceed']
      };

      const lowerContent = content.toLowerCase();
      
      for (const [intent, keywords] of Object.entries(intentKeywords)) {
        if (keywords.some(keyword => lowerContent.includes(keyword))) {
          return intent;
        }
      }
      
      return 'neutral';
    } catch (error) {
      console.error('Intent analysis error:', error);
      return undefined;
    }
  }

  /**
   * Extract entities from turn content
   */
  private async extractTurnEntities(content: string): Promise<ExtractedEntity[]> {
    try {
      const entities: ExtractedEntity[] = [];
      
      // Simple entity extraction - in production, use NLP models
      const patterns = {
        phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
        email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        location: /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b/gi
      };

      Object.entries(patterns).forEach(([type, pattern]) => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          entities.push({
            type: type as any,
            value: match[0],
            confidence: 0.8,
            start_position: match.index,
            end_position: match.index + match[0].length
          });
        }
      });

      return entities;
    } catch (error) {
      console.error('Entity extraction error:', error);
      return [];
    }
  }

  /**
   * Generate comprehensive conversation summary
   */
  private async generateConversationSummary(
    turns: ConversationTurn[],
    normalizedData: any,
    callingSystem: 'elevenlabs' | 'cloned_voice',
    userId: string
  ): Promise<ConversationSummary> {
    try {
      const startTime = Date.now();

      // Basic conversation analysis
      const customerTurns = turns.filter(t => t.speaker === 'customer');
      const agentTurns = turns.filter(t => t.speaker === 'agent');

      // Sentiment analysis
      const sentiments = turns.map(t => t.sentiment).filter(s => s !== undefined) as number[];
      const avgSentiment = sentiments.length > 0 ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length : 0;

      // Intent analysis
      const intents = turns.map(t => t.intent).filter(i => i !== undefined);
      const primaryIntent = this.determinePrimaryIntent(intents);

      // Extract business data
      const extractedData = await this.extractBusinessData(turns);

      // Calculate quality metrics
      const qualityMetrics = this.calculateQualityMetrics(turns, extractedData);

      // Detect triggers (will be implemented in next step)
      const triggerDetection = await this.detectTriggers(turns, extractedData, userId);

      const summary: ConversationSummary = {
        conversation_id: normalizedData.conversation_id,
        call_id: normalizedData.call_id,
        user_id: userId,
        calling_system: callingSystem,

        call_metadata: {
          phone_number: normalizedData.phone_number,
          call_type: normalizedData.call_type,
          started_at: normalizedData.started_at,
          ended_at: normalizedData.ended_at,
          duration_seconds: normalizedData.duration_seconds,
          call_status: normalizedData.call_status,
          recording_url: normalizedData.recording_url
        },

        conversation_analysis: {
          total_turns: turns.length,
          customer_turns: customerTurns.length,
          agent_turns: agentTurns.length,
          avg_turn_length: turns.reduce((sum, t) => sum + t.content.length, 0) / turns.length,
          conversation_flow_quality: this.calculateFlowQuality(turns),
          interruptions_count: this.countInterruptions(turns),
          silence_periods: this.countSilencePeriods(turns)
        },

        sentiment_analysis: {
          overall_sentiment: avgSentiment > 0.1 ? 'positive' : avgSentiment < -0.1 ? 'negative' : 'neutral',
          sentiment_score: avgSentiment,
          sentiment_progression: sentiments,
          emotional_peaks: this.findEmotionalPeaks(turns)
        },

        intent_analysis: {
          primary_intent: primaryIntent,
          intent_confidence: this.calculateIntentConfidence(intents, primaryIntent),
          intent_progression: this.getIntentProgression(turns),
          topics_discussed: this.extractTopics(turns),
          keywords_mentioned: this.extractKeywords(turns)
        },

        extracted_business_data: extractedData,
        quality_metrics: qualityMetrics,
        trigger_detection: triggerDetection,

        processing_metadata: {
          processed_at: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime,
          ai_model_used: 'advanced_analyzer_v1',
          analysis_version: '1.0.0',
          data_sources: [callingSystem, 'nlp_analysis', 'entity_extraction']
        }
      };

      return summary;

    } catch (error) {
      console.error('Summary generation error:', error);
      throw error;
    }
  }

  // Helper methods for analysis calculations
  private determinePrimaryIntent(intents: string[]): any {
    if (intents.length === 0) return 'neutral';
    
    const intentCounts = intents.reduce((acc, intent) => {
      acc[intent] = (acc[intent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(intentCounts).reduce((a, b) => intentCounts[a[0]] > intentCounts[b[0]] ? a : b)[0];
  }

  private calculateFlowQuality(turns: ConversationTurn[]): number {
    // Simple flow quality calculation
    return Math.min(1, turns.length / 10); // Better quality with more turns
  }

  private countInterruptions(turns: ConversationTurn[]): number {
    // Count speaker changes as potential interruptions
    let interruptions = 0;
    for (let i = 1; i < turns.length; i++) {
      if (turns[i].speaker === turns[i-1].speaker) {
        interruptions++;
      }
    }
    return interruptions;
  }

  private countSilencePeriods(turns: ConversationTurn[]): number {
    // Simple silence detection based on turn gaps
    return Math.floor(turns.length / 5); // Estimate
  }

  private findEmotionalPeaks(turns: ConversationTurn[]): any[] {
    return turns
      .filter(t => t.sentiment && Math.abs(t.sentiment) > 0.5)
      .map(t => ({
        timestamp: t.timestamp,
        emotion: t.sentiment! > 0 ? 'positive' : 'negative',
        intensity: Math.abs(t.sentiment!)
      }));
  }

  private calculateIntentConfidence(intents: string[], primaryIntent: string): number {
    if (intents.length === 0) return 0;
    const primaryCount = intents.filter(i => i === primaryIntent).length;
    return primaryCount / intents.length;
  }

  private getIntentProgression(turns: ConversationTurn[]): any[] {
    return turns
      .filter(t => t.intent)
      .map(t => ({
        timestamp: t.timestamp,
        intent: t.intent!,
        confidence: 0.8 // Default confidence
      }));
  }

  private extractTopics(turns: ConversationTurn[]): string[] {
    const allContent = turns.map(t => t.content).join(' ').toLowerCase();
    const topics = ['cleaning', 'maintenance', 'delivery', 'landscaping', 'security', 'pricing', 'schedule'];
    return topics.filter(topic => allContent.includes(topic));
  }

  private extractKeywords(turns: ConversationTurn[]): string[] {
    const allContent = turns.map(t => t.content).join(' ').toLowerCase();
    const keywords = allContent.split(' ')
      .filter(word => word.length > 3)
      .slice(0, 20); // Top 20 keywords
    return [...new Set(keywords)];
  }

  private async extractBusinessData(turns: ConversationTurn[]): Promise<any> {
    const allEntities = turns.flatMap(t => t.entities || []);
    
    return {
      customer_name: this.findEntityValue(allEntities, 'person'),
      contact_phone: this.findEntityValue(allEntities, 'phone'),
      contact_email: this.findEntityValue(allEntities, 'email'),
      location: {
        address: this.findEntityValue(allEntities, 'location')
      },
      service_type: this.extractServiceType(turns),
      urgency_level: this.extractUrgencyLevel(turns)
    };
  }

  private findEntityValue(entities: ExtractedEntity[], type: string): string | undefined {
    const entity = entities.find(e => e.type === type);
    return entity?.value;
  }

  private extractServiceType(turns: ConversationTurn[]): string | undefined {
    const content = turns.map(t => t.content).join(' ').toLowerCase();
    const services = ['cleaning', 'maintenance', 'delivery', 'landscaping', 'security'];
    return services.find(service => content.includes(service));
  }

  private extractUrgencyLevel(turns: ConversationTurn[]): any {
    const content = turns.map(t => t.content).join(' ').toLowerCase();
    if (content.includes('emergency') || content.includes('urgent')) return 'emergency';
    if (content.includes('asap') || content.includes('immediately')) return 'high';
    if (content.includes('soon') || content.includes('quickly')) return 'medium';
    return 'low';
  }

  private calculateQualityMetrics(turns: ConversationTurn[], extractedData: any): any {
    const hasName = !!extractedData.customer_name;
    const hasContact = !!(extractedData.contact_phone || extractedData.contact_email);
    const hasLocation = !!extractedData.location?.address;
    const hasService = !!extractedData.service_type;

    const completeness = [hasName, hasContact, hasLocation, hasService].filter(Boolean).length / 4;
    const engagement = Math.min(1, turns.filter(t => t.speaker === 'customer').length / 5);

    return {
      lead_score: Math.round((completeness + engagement) * 50),
      engagement_level: engagement,
      information_completeness: completeness,
      next_action_clarity: hasContact && hasLocation ? 1 : 0.5,
      conversion_probability: completeness * engagement
    };
  }

  private async detectTriggers(turns: ConversationTurn[], extractedData: any, userId: string): Promise<any> {
    try {
      console.log(`🎯 Detecting triggers for user ${userId}`);

      // Get user's active trigger points
      const triggerPoints = await this.getUserTriggerPoints(userId);

      if (triggerPoints.length === 0) {
        console.log('No active trigger points found');
        return {
          triggers_detected: [],
          vendor_selection_triggered: false
        };
      }

      const triggersDetected = [];
      let vendorSelectionTriggered = false;

      // Evaluate each trigger point
      for (const triggerPoint of triggerPoints) {
        const evaluation = await this.evaluateTriggerPoint(triggerPoint, turns, extractedData);

        if (evaluation.triggered) {
          triggersDetected.push({
            trigger_id: triggerPoint.id,
            trigger_name: triggerPoint.name,
            confidence_score: evaluation.confidence_score,
            triggered_at: new Date().toISOString(),
            trigger_reason: evaluation.reason,
            required_conditions_met: evaluation.conditions_met
          });

          vendorSelectionTriggered = true;
          console.log(`✅ Trigger activated: ${triggerPoint.name} (${(evaluation.confidence_score * 100).toFixed(0)}%)`);
        }
      }

      return {
        triggers_detected: triggersDetected,
        vendor_selection_triggered: vendorSelectionTriggered
      };

    } catch (error) {
      console.error('Trigger detection error:', error);
      return {
        triggers_detected: [],
        vendor_selection_triggered: false
      };
    }
  }

  /**
   * Get user's active trigger points
   */
  private async getUserTriggerPoints(userId: string): Promise<any[]> {
    try {
      // In production, fetch from database
      /*
      const triggerPoints = await db.vendor_trigger_points.findMany({
        where: {
          user_id: userId,
          is_active: true
        }
      });
      return triggerPoints;
      */

      // Mock trigger points for testing
      return [
        {
          id: 'trigger_location_visit',
          name: 'Location Visit Request',
          type: 'location_visit',
          keywords: ['come service', 'visit', 'come over', 'at our location', 'send someone', 'come out', 'on-site'],
          alternative_phrases: ['come clean', 'service our property', 'visit our facility'],
          negative_keywords: ['maybe', 'thinking about', 'planning', 'future'],
          conditions: {
            customer_name_required: true,
            location_required: true,
            contact_details_required: true,
            service_type_required: true,
            timeline_mentioned: true
          },
          confidence_threshold: 0.7,
          is_active: true
        },
        {
          id: 'trigger_emergency_service',
          name: 'Emergency Service Request',
          type: 'emergency_service',
          keywords: ['emergency', 'urgent', 'immediate', 'asap', 'right now', 'crisis'],
          alternative_phrases: ['need help now', 'can\'t wait', 'disaster'],
          negative_keywords: ['maybe later', 'next week', 'planning'],
          conditions: {
            customer_name_required: true,
            location_required: true,
            contact_details_required: true,
            urgency_indicators: true
          },
          confidence_threshold: 0.6,
          is_active: true
        }
      ];

    } catch (error) {
      console.error('Get trigger points error:', error);
      return [];
    }
  }

  /**
   * Evaluate trigger point against conversation
   */
  private async evaluateTriggerPoint(triggerPoint: any, turns: ConversationTurn[], extractedData: any): Promise<{
    triggered: boolean;
    confidence_score: number;
    reason: string;
    conditions_met: boolean;
  }> {
    try {
      let confidenceScore = 0;
      const reasons: string[] = [];

      // Get conversation text
      const conversationText = turns
        .filter(turn => turn.speaker === 'customer')
        .map(turn => turn.content.toLowerCase())
        .join(' ');

      // 1. Keyword matching (40% weight)
      const keywordScore = this.evaluateKeywords(triggerPoint.keywords, conversationText);
      confidenceScore += keywordScore * 0.4;
      if (keywordScore > 0.3) {
        reasons.push(`Keywords matched (${(keywordScore * 100).toFixed(0)}%)`);
      }

      // 2. Alternative phrases (20% weight)
      const altPhraseScore = this.evaluateKeywords(triggerPoint.alternative_phrases || [], conversationText);
      confidenceScore += altPhraseScore * 0.2;
      if (altPhraseScore > 0.3) {
        reasons.push(`Alternative phrases matched (${(altPhraseScore * 100).toFixed(0)}%)`);
      }

      // 3. Negative keyword check (penalty)
      const negativeScore = this.evaluateKeywords(triggerPoint.negative_keywords || [], conversationText);
      if (negativeScore > 0) {
        confidenceScore -= negativeScore * 0.3;
        reasons.push(`Negative keywords detected (-${(negativeScore * 30).toFixed(0)}%)`);
      }

      // 4. Required conditions (30% weight)
      const conditionsResult = this.evaluateConditions(triggerPoint.conditions, extractedData, turns);
      confidenceScore += conditionsResult.score * 0.3;
      if (conditionsResult.score > 0.5) {
        reasons.push(`Required conditions met (${(conditionsResult.score * 100).toFixed(0)}%)`);
      }

      // 5. Context and intent alignment (10% weight)
      const contextScore = this.evaluateContext(triggerPoint.type, turns, extractedData);
      confidenceScore += contextScore * 0.1;
      if (contextScore > 0.5) {
        reasons.push(`Context alignment (${(contextScore * 100).toFixed(0)}%)`);
      }

      // Ensure confidence score is between 0 and 1
      confidenceScore = Math.max(0, Math.min(1, confidenceScore));

      // Check if trigger threshold is met
      const triggered = confidenceScore >= (triggerPoint.confidence_threshold || 0.7);

      return {
        triggered,
        confidence_score: confidenceScore,
        reason: triggered ? reasons.join(', ') : `Confidence ${(confidenceScore * 100).toFixed(0)}% below threshold ${((triggerPoint.confidence_threshold || 0.7) * 100).toFixed(0)}%`,
        conditions_met: conditionsResult.score > 0.7
      };

    } catch (error) {
      console.error('Trigger evaluation error:', error);
      return {
        triggered: false,
        confidence_score: 0,
        reason: 'Evaluation failed',
        conditions_met: false
      };
    }
  }

  /**
   * Evaluate keyword matches
   */
  private evaluateKeywords(keywords: string[], conversationText: string): number {
    if (!keywords || keywords.length === 0) return 0;

    let matchedKeywords = 0;
    for (const keyword of keywords) {
      if (conversationText.includes(keyword.toLowerCase())) {
        matchedKeywords++;
      }
    }

    return matchedKeywords / keywords.length;
  }

  /**
   * Evaluate required conditions
   */
  private evaluateConditions(conditions: any, extractedData: any, turns: ConversationTurn[]): {
    score: number;
    details: Record<string, boolean>;
  } {
    const conditionResults: Record<string, boolean> = {};
    let metConditions = 0;
    let totalConditions = 0;

    // Check customer name required
    if (conditions.customer_name_required) {
      totalConditions++;
      const hasName = !!(extractedData.customer_name || this.findNameInConversation(turns));
      conditionResults.customer_name = hasName;
      if (hasName) metConditions++;
    }

    // Check location required
    if (conditions.location_required) {
      totalConditions++;
      const hasLocation = !!(extractedData.location?.address || this.findLocationInConversation(turns));
      conditionResults.location = hasLocation;
      if (hasLocation) metConditions++;
    }

    // Check contact details required
    if (conditions.contact_details_required) {
      totalConditions++;
      const hasContact = !!(extractedData.contact_phone || extractedData.contact_email || this.findContactInConversation(turns));
      conditionResults.contact_details = hasContact;
      if (hasContact) metConditions++;
    }

    // Check service type required
    if (conditions.service_type_required) {
      totalConditions++;
      const hasService = !!(extractedData.service_type || this.findServiceTypeInConversation(turns));
      conditionResults.service_type = hasService;
      if (hasService) metConditions++;
    }

    // Check timeline mentioned
    if (conditions.timeline_mentioned) {
      totalConditions++;
      const hasTimeline = !!(extractedData.timeline || this.findTimelineInConversation(turns));
      conditionResults.timeline = hasTimeline;
      if (hasTimeline) metConditions++;
    }

    // Check urgency indicators
    if (conditions.urgency_indicators) {
      totalConditions++;
      const hasUrgency = extractedData.urgency_level === 'emergency' || extractedData.urgency_level === 'high';
      conditionResults.urgency = hasUrgency;
      if (hasUrgency) metConditions++;
    }

    const score = totalConditions > 0 ? metConditions / totalConditions : 1;

    return { score, details: conditionResults };
  }

  /**
   * Evaluate context and intent alignment
   */
  private evaluateContext(triggerType: string, turns: ConversationTurn[], extractedData: any): number {
    const conversationText = turns.map(t => t.content.toLowerCase()).join(' ');

    switch (triggerType) {
      case 'location_visit':
        return this.evaluateLocationVisitContext(conversationText, extractedData);
      case 'emergency_service':
        return this.evaluateEmergencyContext(conversationText, extractedData);
      case 'quotation_sending':
        return this.evaluateQuotationContext(conversationText, extractedData);
      case 'order_booking':
        return this.evaluateOrderContext(conversationText, extractedData);
      default:
        return 0.5; // Neutral score for unknown types
    }
  }

  private evaluateLocationVisitContext(conversationText: string, extractedData: any): number {
    let score = 0;

    // Check for location visit indicators
    const visitIndicators = ['come', 'visit', 'send someone', 'at our', 'on-site', 'location'];
    const hasVisitIndicators = visitIndicators.some(indicator => conversationText.includes(indicator));
    if (hasVisitIndicators) score += 0.4;

    // Check for service request
    const serviceIndicators = ['service', 'clean', 'fix', 'repair', 'maintain', 'install'];
    const hasServiceIndicators = serviceIndicators.some(indicator => conversationText.includes(indicator));
    if (hasServiceIndicators) score += 0.3;

    // Check for location mention
    if (extractedData.location?.address) score += 0.3;

    return Math.min(1, score);
  }

  private evaluateEmergencyContext(conversationText: string, extractedData: any): number {
    let score = 0;

    // Check for urgency indicators
    const urgencyIndicators = ['emergency', 'urgent', 'immediate', 'asap', 'right now', 'crisis'];
    const urgencyCount = urgencyIndicators.filter(indicator => conversationText.includes(indicator)).length;
    score += Math.min(0.6, urgencyCount * 0.2);

    // Check for problem indicators
    const problemIndicators = ['broken', 'not working', 'failed', 'leak', 'flood', 'accident'];
    const hasProblem = problemIndicators.some(indicator => conversationText.includes(indicator));
    if (hasProblem) score += 0.4;

    return Math.min(1, score);
  }

  private evaluateQuotationContext(conversationText: string, extractedData: any): number {
    let score = 0;

    // Check for pricing indicators
    const pricingIndicators = ['price', 'cost', 'quote', 'estimate', 'how much', 'pricing'];
    const hasPricing = pricingIndicators.some(indicator => conversationText.includes(indicator));
    if (hasPricing) score += 0.6;

    // Check for service inquiry
    const inquiryIndicators = ['what do you', 'tell me about', 'information about'];
    const hasInquiry = inquiryIndicators.some(indicator => conversationText.includes(indicator));
    if (hasInquiry) score += 0.4;

    return Math.min(1, score);
  }

  private evaluateOrderContext(conversationText: string, extractedData: any): number {
    let score = 0;

    // Check for confirmation indicators
    const confirmationIndicators = ['yes', 'book', 'schedule', 'go ahead', 'proceed', 'confirm'];
    const hasConfirmation = confirmationIndicators.some(indicator => conversationText.includes(indicator));
    if (hasConfirmation) score += 0.5;

    // Check for commitment indicators
    const commitmentIndicators = ['when can you', 'let\'s do it', 'sounds good', 'perfect'];
    const hasCommitment = commitmentIndicators.some(indicator => conversationText.includes(indicator));
    if (hasCommitment) score += 0.5;

    return Math.min(1, score);
  }

  // Helper methods for finding information in conversation
  private findNameInConversation(turns: ConversationTurn[]): string | null {
    const namePatterns = [
      /my name is ([A-Za-z\s]+)/i,
      /i'm ([A-Za-z\s]+)/i,
      /this is ([A-Za-z\s]+)/i
    ];

    for (const turn of turns) {
      if (turn.speaker === 'customer') {
        for (const pattern of namePatterns) {
          const match = turn.content.match(pattern);
          if (match) return match[1].trim();
        }
      }
    }
    return null;
  }

  private findLocationInConversation(turns: ConversationTurn[]): string | null {
    const locationPatterns = [
      /at (\d+[^,]+)/i,
      /our office at ([^,]+)/i,
      /located at ([^,]+)/i,
      /address is ([^,]+)/i
    ];

    for (const turn of turns) {
      if (turn.speaker === 'customer') {
        for (const pattern of locationPatterns) {
          const match = turn.content.match(pattern);
          if (match) return match[1].trim();
        }
      }
    }
    return null;
  }

  private findContactInConversation(turns: ConversationTurn[]): string | null {
    const contactPatterns = [
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
    ];

    for (const turn of turns) {
      if (turn.speaker === 'customer') {
        for (const pattern of contactPatterns) {
          const match = turn.content.match(pattern);
          if (match) return match[0];
        }
      }
    }
    return null;
  }

  private findServiceTypeInConversation(turns: ConversationTurn[]): string | null {
    const serviceTypes = ['cleaning', 'maintenance', 'delivery', 'landscaping', 'security', 'repair'];
    const conversationText = turns.map(t => t.content.toLowerCase()).join(' ');

    return serviceTypes.find(service => conversationText.includes(service)) || null;
  }

  private findTimelineInConversation(turns: ConversationTurn[]): string | null {
    const timelinePatterns = [
      /today/i,
      /tomorrow/i,
      /next week/i,
      /this week/i,
      /monday|tuesday|wednesday|thursday|friday|saturday|sunday/i,
      /\d{1,2}\/\d{1,2}/,
      /in \d+ days?/i
    ];

    for (const turn of turns) {
      if (turn.speaker === 'customer') {
        for (const pattern of timelinePatterns) {
          const match = turn.content.match(pattern);
          if (match) return match[0];
        }
      }
    }
    return null;
  }
}

// Export singleton instance
export const advancedConversationAnalyzer = AdvancedConversationAnalyzer.getInstance();
