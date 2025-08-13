/**
 * Conversation Analyzer Service
 * AI-powered extraction of business details and conversation analysis
 * For both ElevenLabs calling agent and AI cloned voice calling system
 */

import { ConversationTurn, CallMetadata } from './conversationCache';

export interface ExtractedBusinessData {
  business_name?: string;
  contact_name?: string;
  owner_name?: string;
  location?: string;
  industry?: string;
  email?: string;
  website?: string;
  phone_number?: string;
  company_size?: string;
  annual_revenue?: string;
  decision_maker?: boolean;
  pain_points?: string[];
  interests?: string[];
  budget_range?: string;
  timeline?: string;
}

export interface ConversationAnalysis {
  summary: string;
  key_points: string[];
  sentiment_score: number; // -1 to 1
  engagement_level: number; // 0 to 1
  intent: string;
  outcome: string;
  objections: string[];
  positive_signals: string[];
  negative_signals: string[];
  next_action: string;
  lead_score: number; // 0 to 100
  conversion_probability: number; // 0 to 1
  topics_discussed: string[];
  questions_asked: string[];
  follow_up_needed: boolean;
  priority_level: number; // 1 to 5
}

export interface ConversationMetrics {
  total_turns: number;
  customer_talk_time: number; // seconds
  ai_talk_time: number; // seconds
  avg_response_time: number; // seconds
  interruptions_count: number;
  questions_count: number;
  objections_count: number;
  positive_responses: number;
  negative_responses: number;
  conversation_flow_score: number; // 0 to 1
}

export class ConversationAnalyzerService {
  private static instance: ConversationAnalyzerService;

  static getInstance(): ConversationAnalyzerService {
    if (!ConversationAnalyzerService.instance) {
      ConversationAnalyzerService.instance = new ConversationAnalyzerService();
    }
    return ConversationAnalyzerService.instance;
  }

  /**
   * Analyze complete conversation and extract all data
   */
  async analyzeConversation(
    turns: ConversationTurn[],
    metadata: CallMetadata
  ): Promise<{
    extracted_data: ExtractedBusinessData;
    analysis: ConversationAnalysis;
    metrics: ConversationMetrics;
  }> {
    try {
      console.log(`🔍 Analyzing conversation with ${turns.length} turns`);

      // Extract business data from conversation
      const extracted_data = await this.extractBusinessData(turns);
      
      // Analyze conversation content and sentiment
      const analysis = await this.analyzeConversationContent(turns, metadata);
      
      // Calculate conversation metrics
      const metrics = this.calculateConversationMetrics(turns);

      console.log('✅ Conversation analysis complete:', {
        business_name: extracted_data.business_name,
        sentiment: analysis.sentiment_score,
        lead_score: analysis.lead_score
      });

      return {
        extracted_data,
        analysis,
        metrics
      };
    } catch (error) {
      console.error('Failed to analyze conversation:', error);
      throw error;
    }
  }

  /**
   * Extract business data from conversation turns
   */
  async extractBusinessData(turns: ConversationTurn[]): Promise<ExtractedBusinessData> {
    const extracted: ExtractedBusinessData = {};
    
    // Combine all customer speech for analysis
    const customerText = turns
      .filter(turn => turn.speaker === 'customer')
      .map(turn => turn.content)
      .join(' ');

    // Extract business name
    extracted.business_name = this.extractBusinessName(customerText);
    
    // Extract contact information
    extracted.contact_name = this.extractContactName(customerText);
    extracted.owner_name = this.extractOwnerName(customerText);
    
    // Extract location
    extracted.location = this.extractLocation(customerText);
    
    // Extract industry
    extracted.industry = this.extractIndustry(customerText);
    
    // Extract contact details
    extracted.email = this.extractEmail(customerText);
    extracted.website = this.extractWebsite(customerText);
    extracted.phone_number = this.extractPhoneNumber(customerText);
    
    // Extract business details
    extracted.company_size = this.extractCompanySize(customerText);
    extracted.annual_revenue = this.extractRevenue(customerText);
    extracted.decision_maker = this.isDecisionMaker(customerText);
    
    // Extract pain points and interests
    extracted.pain_points = this.extractPainPoints(customerText);
    extracted.interests = this.extractInterests(customerText);
    
    // Extract budget and timeline
    extracted.budget_range = this.extractBudget(customerText);
    extracted.timeline = this.extractTimeline(customerText);

    return extracted;
  }

  /**
   * Analyze conversation content for insights
   */
  async analyzeConversationContent(
    turns: ConversationTurn[],
    metadata: CallMetadata
  ): Promise<ConversationAnalysis> {
    const fullConversation = turns.map(turn => 
      `${turn.speaker.toUpperCase()}: ${turn.content}`
    ).join('\n');

    // Use AI to analyze conversation (simplified version)
    // In production, this would call OpenAI/Claude API
    const analysis = await this.performAIAnalysis(fullConversation);

    return {
      summary: this.generateSummary(turns),
      key_points: this.extractKeyPoints(turns),
      sentiment_score: this.calculateSentiment(turns),
      engagement_level: this.calculateEngagement(turns),
      intent: this.determineIntent(turns),
      outcome: this.determineOutcome(turns),
      objections: this.extractObjections(turns),
      positive_signals: this.extractPositiveSignals(turns),
      negative_signals: this.extractNegativeSignals(turns),
      next_action: this.determineNextAction(turns),
      lead_score: this.calculateLeadScore(turns),
      conversion_probability: this.calculateConversionProbability(turns),
      topics_discussed: this.extractTopics(turns),
      questions_asked: this.extractQuestions(turns),
      follow_up_needed: this.needsFollowUp(turns),
      priority_level: this.calculatePriority(turns)
    };
  }

  /**
   * Calculate conversation metrics
   */
  calculateConversationMetrics(turns: ConversationTurn[]): ConversationMetrics {
    const customerTurns = turns.filter(turn => turn.speaker === 'customer');
    const aiTurns = turns.filter(turn => turn.speaker === 'ai');

    return {
      total_turns: turns.length,
      customer_talk_time: this.calculateTalkTime(customerTurns),
      ai_talk_time: this.calculateTalkTime(aiTurns),
      avg_response_time: this.calculateAvgResponseTime(turns),
      interruptions_count: this.countInterruptions(turns),
      questions_count: this.countQuestions(turns),
      objections_count: this.countObjections(turns),
      positive_responses: this.countPositiveResponses(turns),
      negative_responses: this.countNegativeResponses(turns),
      conversation_flow_score: this.calculateFlowScore(turns)
    };
  }

  // Business data extraction methods
  private extractBusinessName(text: string): string | undefined {
    const patterns = [
      /(?:my company is|we are|this is|i'm from|i work at|i represent)\s+([^,.!?]+)/i,
      /(?:company name is|business name is|we're called)\s+([^,.!?]+)/i,
      /(?:i'm with|i work for)\s+([^,.!?]+)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return undefined;
  }

  private extractContactName(text: string): string | undefined {
    const patterns = [
      /(?:my name is|i'm|this is|i am)\s+([a-z]+(?:\s+[a-z]+)?)/i,
      /(?:speaking with|talking to)\s+([a-z]+(?:\s+[a-z]+)?)/i,
      /(?:you can call me|call me)\s+([a-z]+)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return undefined;
  }

  private extractOwnerName(text: string): string | undefined {
    const patterns = [
      /(?:owner is|owned by|founder is)\s+([a-z]+(?:\s+[a-z]+)?)/i,
      /(?:ceo is|president is|director is)\s+([a-z]+(?:\s+[a-z]+)?)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return undefined;
  }

  private extractLocation(text: string): string | undefined {
    const patterns = [
      /(?:located in|based in|we're in|from)\s+([^,.!?]+)/i,
      /(?:our office is in|headquarters in)\s+([^,.!?]+)/i,
      /(?:we operate in|serving)\s+([^,.!?]+)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return undefined;
  }

  private extractIndustry(text: string): string | undefined {
    const industries = [
      'technology', 'healthcare', 'finance', 'retail', 'manufacturing',
      'construction', 'real estate', 'education', 'hospitality', 'automotive',
      'consulting', 'marketing', 'legal', 'insurance', 'logistics'
    ];

    const lowerText = text.toLowerCase();
    for (const industry of industries) {
      if (lowerText.includes(industry)) {
        return industry;
      }
    }
    return undefined;
  }

  private extractEmail(text: string): string | undefined {
    const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    const match = text.match(emailPattern);
    return match ? match[1] : undefined;
  }

  private extractWebsite(text: string): string | undefined {
    const websitePattern = /((?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/;
    const match = text.match(websitePattern);
    return match ? match[1] : undefined;
  }

  private extractPhoneNumber(text: string): string | undefined {
    const phonePattern = /(\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/;
    const match = text.match(phonePattern);
    return match ? match[1] : undefined;
  }

  private extractCompanySize(text: string): string | undefined {
    const patterns = [
      /(?:we have|we're)\s+(\d+)\s+(?:employees|people|staff)/i,
      /(?:company of|team of)\s+(\d+)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const size = parseInt(match[1]);
        if (size < 10) return 'small';
        if (size < 50) return 'medium';
        if (size < 200) return 'large';
        return 'enterprise';
      }
    }
    return undefined;
  }

  private extractRevenue(text: string): string | undefined {
    const patterns = [
      /(?:revenue of|making|earning)\s+\$?(\d+(?:k|m|million|thousand))/i,
      /(?:annual revenue|yearly revenue)\s+\$?(\d+(?:k|m|million|thousand))/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return undefined;
  }

  private isDecisionMaker(text: string): boolean {
    const decisionMakerTerms = [
      'owner', 'ceo', 'president', 'director', 'manager', 'founder',
      'i make the decisions', 'i decide', 'i choose', 'i handle'
    ];

    const lowerText = text.toLowerCase();
    return decisionMakerTerms.some(term => lowerText.includes(term));
  }

  private extractPainPoints(text: string): string[] {
    const painPointPatterns = [
      /(?:problem with|issue with|struggling with|difficulty with)\s+([^,.!?]+)/gi,
      /(?:we need|we're looking for|we want)\s+([^,.!?]+)/gi
    ];

    const painPoints: string[] = [];
    for (const pattern of painPointPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          painPoints.push(match[1].trim());
        }
      }
    }
    return painPoints;
  }

  private extractInterests(text: string): string[] {
    const interestPatterns = [
      /(?:interested in|looking for|want to know about)\s+([^,.!?]+)/gi,
      /(?:tell me about|more about)\s+([^,.!?]+)/gi
    ];

    const interests: string[] = [];
    for (const pattern of interestPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          interests.push(match[1].trim());
        }
      }
    }
    return interests;
  }

  private extractBudget(text: string): string | undefined {
    const budgetPatterns = [
      /(?:budget is|budget of|spending)\s+\$?(\d+(?:k|m|thousand|million)?)/i,
      /(?:can afford|willing to spend)\s+\$?(\d+(?:k|m|thousand|million)?)/i
    ];

    for (const pattern of budgetPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return undefined;
  }

  private extractTimeline(text: string): string | undefined {
    const timelinePatterns = [
      /(?:need it by|deadline is|timeline is)\s+([^,.!?]+)/i,
      /(?:in the next|within)\s+(\d+\s+(?:days|weeks|months))/i
    ];

    for (const pattern of timelinePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return undefined;
  }

  // Analysis methods (simplified implementations)
  private async performAIAnalysis(conversation: string): Promise<any> {
    // In production, this would call OpenAI/Claude API for advanced analysis
    // For now, return a mock analysis
    return {
      summary: 'AI analysis would be performed here',
      insights: []
    };
  }

  private generateSummary(turns: ConversationTurn[]): string {
    // Generate a concise summary of the conversation
    const customerContent = turns
      .filter(turn => turn.speaker === 'customer')
      .map(turn => turn.content)
      .join(' ');
    
    return customerContent.length > 200 
      ? customerContent.substring(0, 200) + '...'
      : customerContent;
  }

  private extractKeyPoints(turns: ConversationTurn[]): string[] {
    // Extract key points from the conversation
    const keyPoints: string[] = [];
    
    turns.forEach(turn => {
      if (turn.speaker === 'customer' && turn.content.length > 50) {
        keyPoints.push(turn.content);
      }
    });
    
    return keyPoints.slice(0, 5); // Top 5 key points
  }

  private calculateSentiment(turns: ConversationTurn[]): number {
    // Simple sentiment analysis (in production, use proper NLP)
    const positiveWords = ['yes', 'good', 'great', 'interested', 'perfect', 'excellent'];
    const negativeWords = ['no', 'bad', 'not interested', 'busy', 'expensive'];
    
    let score = 0;
    const customerText = turns
      .filter(turn => turn.speaker === 'customer')
      .map(turn => turn.content.toLowerCase())
      .join(' ');
    
    positiveWords.forEach(word => {
      if (customerText.includes(word)) score += 0.1;
    });
    
    negativeWords.forEach(word => {
      if (customerText.includes(word)) score -= 0.1;
    });
    
    return Math.max(-1, Math.min(1, score));
  }

  private calculateEngagement(turns: ConversationTurn[]): number {
    const customerTurns = turns.filter(turn => turn.speaker === 'customer');
    const avgLength = customerTurns.reduce((sum, turn) => sum + turn.content.length, 0) / customerTurns.length;
    
    // Higher engagement for longer responses
    return Math.min(1, avgLength / 100);
  }

  private determineIntent(turns: ConversationTurn[]): string {
    const customerText = turns
      .filter(turn => turn.speaker === 'customer')
      .map(turn => turn.content.toLowerCase())
      .join(' ');
    
    if (customerText.includes('interested') || customerText.includes('tell me more')) {
      return 'interested';
    } else if (customerText.includes('not interested') || customerText.includes('busy')) {
      return 'not_interested';
    } else if (customerText.includes('call back') || customerText.includes('later')) {
      return 'callback';
    }
    
    return 'neutral';
  }

  private determineOutcome(turns: ConversationTurn[]): string {
    const intent = this.determineIntent(turns);
    
    switch (intent) {
      case 'interested': return 'qualified_lead';
      case 'not_interested': return 'not_qualified';
      case 'callback': return 'follow_up_scheduled';
      default: return 'information_gathered';
    }
  }

  private extractObjections(turns: ConversationTurn[]): string[] {
    const objectionPatterns = [
      /(?:but|however|although)\s+([^,.!?]+)/gi,
      /(?:i don't|we don't|not sure)\s+([^,.!?]+)/gi
    ];
    
    const objections: string[] = [];
    const customerText = turns
      .filter(turn => turn.speaker === 'customer')
      .map(turn => turn.content)
      .join(' ');
    
    for (const pattern of objectionPatterns) {
      const matches = customerText.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          objections.push(match[1].trim());
        }
      }
    }
    
    return objections;
  }

  private extractPositiveSignals(turns: ConversationTurn[]): string[] {
    const positivePatterns = [
      /(?:sounds good|that's great|perfect|excellent)/gi,
      /(?:yes|sure|absolutely|definitely)/gi
    ];
    
    const signals: string[] = [];
    const customerText = turns
      .filter(turn => turn.speaker === 'customer')
      .map(turn => turn.content)
      .join(' ');
    
    for (const pattern of positivePatterns) {
      const matches = customerText.matchAll(pattern);
      for (const match of matches) {
        signals.push(match[0]);
      }
    }
    
    return signals;
  }

  private extractNegativeSignals(turns: ConversationTurn[]): string[] {
    const negativePatterns = [
      /(?:not interested|too expensive|too busy)/gi,
      /(?:no thanks|not now|maybe later)/gi
    ];
    
    const signals: string[] = [];
    const customerText = turns
      .filter(turn => turn.speaker === 'customer')
      .map(turn => turn.content)
      .join(' ');
    
    for (const pattern of negativePatterns) {
      const matches = customerText.matchAll(pattern);
      for (const match of matches) {
        signals.push(match[0]);
      }
    }
    
    return signals;
  }

  private determineNextAction(turns: ConversationTurn[]): string {
    const intent = this.determineIntent(turns);
    
    switch (intent) {
      case 'interested': return 'schedule_demo';
      case 'not_interested': return 'add_to_nurture_campaign';
      case 'callback': return 'schedule_follow_up';
      default: return 'send_information';
    }
  }

  private calculateLeadScore(turns: ConversationTurn[]): number {
    let score = 50; // Base score
    
    const sentiment = this.calculateSentiment(turns);
    const engagement = this.calculateEngagement(turns);
    
    score += sentiment * 30; // Sentiment impact
    score += engagement * 20; // Engagement impact
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateConversionProbability(turns: ConversationTurn[]): number {
    const leadScore = this.calculateLeadScore(turns);
    return leadScore / 100;
  }

  private extractTopics(turns: ConversationTurn[]): string[] {
    // Extract main topics discussed
    const topics = ['pricing', 'features', 'timeline', 'support', 'integration'];
    const discussedTopics: string[] = [];
    
    const allText = turns.map(turn => turn.content.toLowerCase()).join(' ');
    
    topics.forEach(topic => {
      if (allText.includes(topic)) {
        discussedTopics.push(topic);
      }
    });
    
    return discussedTopics;
  }

  private extractQuestions(turns: ConversationTurn[]): string[] {
    return turns
      .filter(turn => turn.speaker === 'customer' && turn.content.includes('?'))
      .map(turn => turn.content)
      .slice(0, 5); // Top 5 questions
  }

  private needsFollowUp(turns: ConversationTurn[]): boolean {
    const customerText = turns
      .filter(turn => turn.speaker === 'customer')
      .map(turn => turn.content.toLowerCase())
      .join(' ');
    
    return customerText.includes('call back') || 
           customerText.includes('follow up') || 
           customerText.includes('think about it');
  }

  private calculatePriority(turns: ConversationTurn[]): number {
    const leadScore = this.calculateLeadScore(turns);
    
    if (leadScore >= 80) return 5; // High priority
    if (leadScore >= 60) return 4;
    if (leadScore >= 40) return 3; // Medium priority
    if (leadScore >= 20) return 2;
    return 1; // Low priority
  }

  // Metrics calculation methods
  private calculateTalkTime(turns: ConversationTurn[]): number {
    return turns.reduce((total, turn) => {
      // Estimate talk time based on content length (rough approximation)
      const wordsPerMinute = 150;
      const words = turn.content.split(' ').length;
      return total + (words / wordsPerMinute) * 60;
    }, 0);
  }

  private calculateAvgResponseTime(turns: ConversationTurn[]): number {
    let totalResponseTime = 0;
    let responseCount = 0;
    
    for (let i = 1; i < turns.length; i++) {
      const currentTurn = turns[i];
      const previousTurn = turns[i - 1];
      
      if (currentTurn.speaker !== previousTurn.speaker) {
        const responseTime = new Date(currentTurn.timestamp).getTime() - 
                           new Date(previousTurn.timestamp).getTime();
        totalResponseTime += responseTime;
        responseCount++;
      }
    }
    
    return responseCount > 0 ? totalResponseTime / responseCount / 1000 : 0; // Convert to seconds
  }

  private countInterruptions(turns: ConversationTurn[]): number {
    let interruptions = 0;
    
    for (let i = 1; i < turns.length; i++) {
      const currentTurn = turns[i];
      const previousTurn = turns[i - 1];
      
      // Check if speaker changed quickly (potential interruption)
      if (currentTurn.speaker !== previousTurn.speaker) {
        const timeDiff = new Date(currentTurn.timestamp).getTime() - 
                        new Date(previousTurn.timestamp).getTime();
        
        if (timeDiff < 1000) { // Less than 1 second
          interruptions++;
        }
      }
    }
    
    return interruptions;
  }

  private countQuestions(turns: ConversationTurn[]): number {
    return turns.filter(turn => turn.content.includes('?')).length;
  }

  private countObjections(turns: ConversationTurn[]): number {
    const objectionWords = ['but', 'however', 'although', 'not sure', 'expensive'];
    
    return turns
      .filter(turn => turn.speaker === 'customer')
      .reduce((count, turn) => {
        const lowerContent = turn.content.toLowerCase();
        return count + objectionWords.filter(word => lowerContent.includes(word)).length;
      }, 0);
  }

  private countPositiveResponses(turns: ConversationTurn[]): number {
    const positiveWords = ['yes', 'good', 'great', 'perfect', 'excellent', 'interested'];
    
    return turns
      .filter(turn => turn.speaker === 'customer')
      .reduce((count, turn) => {
        const lowerContent = turn.content.toLowerCase();
        return count + positiveWords.filter(word => lowerContent.includes(word)).length;
      }, 0);
  }

  private countNegativeResponses(turns: ConversationTurn[]): number {
    const negativeWords = ['no', 'not interested', 'busy', 'expensive', 'not now'];
    
    return turns
      .filter(turn => turn.speaker === 'customer')
      .reduce((count, turn) => {
        const lowerContent = turn.content.toLowerCase();
        return count + negativeWords.filter(word => lowerContent.includes(word)).length;
      }, 0);
  }

  private calculateFlowScore(turns: ConversationTurn[]): number {
    // Calculate how well the conversation flowed
    let flowScore = 1.0;
    
    // Penalize for too many interruptions
    const interruptions = this.countInterruptions(turns);
    flowScore -= (interruptions * 0.1);
    
    // Reward for balanced conversation
    const customerTurns = turns.filter(turn => turn.speaker === 'customer').length;
    const aiTurns = turns.filter(turn => turn.speaker === 'ai').length;
    const balance = Math.min(customerTurns, aiTurns) / Math.max(customerTurns, aiTurns);
    flowScore += (balance * 0.2);
    
    return Math.max(0, Math.min(1, flowScore));
  }
}

// Export singleton instance
export const conversationAnalyzer = ConversationAnalyzerService.getInstance();
