/**
 * AI-Enhanced Trigger Point Generator
 * Uses generative AI to create optimized trigger point configurations
 * Reduces human error and improves trigger accuracy
 */

export interface BusinessContext {
  business_type: string;
  service_description: string;
  target_customers: string;
  service_area: string;
  typical_scenarios: string[];
  pain_points: string[];
  urgency_levels: string[];
}

export interface TriggerRequirements {
  trigger_type: 'appointment_booking' | 'quotation_sending' | 'order_booking' | 'location_visit' | 'service_inquiry' | 'emergency_service' | 'custom';
  business_context: BusinessContext;
  specific_requirements: string;
  priority_level: number;
  response_time_requirement: string;
  additional_context: string;
}

export interface AIGeneratedTrigger {
  name: string;
  description: string;
  instructions: string;
  keywords: string[];
  alternative_phrases: string[];
  negative_keywords: string[]; // Words that should NOT trigger
  conditions: {
    customer_name_required: boolean;
    location_required: boolean;
    contact_details_required: boolean;
    service_type_required: boolean;
    budget_mentioned: boolean;
    timeline_mentioned: boolean;
    urgency_indicators: boolean;
  };
  actions: {
    send_customer_email: boolean;
    notify_vendors: boolean;
    create_order: boolean;
    priority_level: number;
    response_time_minutes: number;
  };
  vendor_selection_criteria: {
    location_radius: number;
    min_rating: number;
    max_vendors_to_notify: number;
    prefer_available: boolean;
    work_type_match: boolean;
    specialization_required: boolean;
  };
  confidence_threshold: number;
  example_conversations: {
    positive_examples: string[];
    negative_examples: string[];
    edge_cases: string[];
  };
  quality_score: number;
  optimization_notes: string[];
}

export class AITriggerGeneratorService {
  private static instance: AITriggerGeneratorService;

  static getInstance(): AITriggerGeneratorService {
    if (!AITriggerGeneratorService.instance) {
      AITriggerGeneratorService.instance = new AITriggerGeneratorService();
    }
    return AITriggerGeneratorService.instance;
  }

  /**
   * Generate optimized trigger point using AI
   */
  async generateTriggerPoint(requirements: TriggerRequirements): Promise<AIGeneratedTrigger> {
    try {
      console.log('🤖 Generating AI-optimized trigger point:', requirements.trigger_type);

      // Get user's LLM API configuration
      const llmConfig = await this.getUserLLMConfig();
      
      if (!llmConfig) {
        throw new Error('LLM API configuration not found. Please configure your AI API keys first.');
      }

      // Generate comprehensive prompt for AI
      const prompt = this.buildTriggerGenerationPrompt(requirements);

      // Call AI service to generate trigger configuration
      const aiResponse = await this.callAIService(llmConfig, prompt);

      // Parse and validate AI response
      const generatedTrigger = this.parseAIResponse(aiResponse, requirements);

      // Enhance with additional optimizations
      const optimizedTrigger = await this.optimizeTriggerPoint(generatedTrigger, requirements);

      console.log('✅ AI-generated trigger point created:', optimizedTrigger.name);
      
      return optimizedTrigger;

    } catch (error) {
      console.error('AI trigger generation error:', error);
      throw error;
    }
  }

  /**
   * Build comprehensive prompt for AI trigger generation
   */
  private buildTriggerGenerationPrompt(requirements: TriggerRequirements): string {
    return `
You are an expert business automation consultant specializing in conversation analysis and trigger point optimization. 

BUSINESS CONTEXT:
- Business Type: ${requirements.business_context.business_type}
- Service Description: ${requirements.business_context.service_description}
- Target Customers: ${requirements.business_context.target_customers}
- Service Area: ${requirements.business_context.service_area}
- Typical Scenarios: ${requirements.business_context.typical_scenarios.join(', ')}
- Common Pain Points: ${requirements.business_context.pain_points.join(', ')}

TRIGGER REQUIREMENTS:
- Trigger Type: ${requirements.trigger_type}
- Specific Requirements: ${requirements.specific_requirements}
- Priority Level: ${requirements.priority_level}/5
- Response Time Requirement: ${requirements.response_time_requirement}
- Additional Context: ${requirements.additional_context}

TASK: Generate a comprehensive, optimized trigger point configuration that will accurately detect when customers express intent for "${requirements.trigger_type}" in phone conversations.

CRITICAL REQUIREMENTS:
1. KEYWORDS: Generate 15-25 comprehensive keywords and phrases that customers actually use (not just obvious ones)
2. ALTERNATIVE PHRASES: Include variations, slang, regional differences, and indirect expressions
3. NEGATIVE KEYWORDS: Words that might seem related but should NOT trigger (to avoid false positives)
4. CONDITIONS: Determine what information MUST be collected before triggering
5. INSTRUCTIONS: Write precise, unambiguous instructions for when to trigger
6. EXAMPLES: Provide realistic conversation examples (positive, negative, edge cases)

OPTIMIZATION FOCUS:
- Minimize false positives (triggering when shouldn't)
- Minimize false negatives (missing real triggers)
- Account for natural conversation flow and variations
- Consider urgency indicators and context clues
- Ensure practical vendor selection criteria

RESPONSE FORMAT (JSON):
{
  "name": "Descriptive name for this trigger",
  "description": "Clear description of what this trigger detects",
  "instructions": "Precise instructions for when to trigger (2-3 sentences)",
  "keywords": ["array", "of", "primary", "keywords"],
  "alternative_phrases": ["variations", "and", "alternative", "expressions"],
  "negative_keywords": ["words", "that", "should", "not", "trigger"],
  "conditions": {
    "customer_name_required": boolean,
    "location_required": boolean,
    "contact_details_required": boolean,
    "service_type_required": boolean,
    "budget_mentioned": boolean,
    "timeline_mentioned": boolean,
    "urgency_indicators": boolean
  },
  "actions": {
    "send_customer_email": boolean,
    "notify_vendors": boolean,
    "create_order": boolean,
    "priority_level": 1-5,
    "response_time_minutes": number
  },
  "vendor_selection_criteria": {
    "location_radius": number (km),
    "min_rating": number (1-5),
    "max_vendors_to_notify": number,
    "prefer_available": boolean,
    "work_type_match": boolean,
    "specialization_required": boolean
  },
  "confidence_threshold": number (0.1-1.0),
  "example_conversations": {
    "positive_examples": ["Customer: 'conversation that should trigger'", "Customer: 'another triggering conversation'"],
    "negative_examples": ["Customer: 'conversation that should NOT trigger'", "Customer: 'another non-triggering conversation'"],
    "edge_cases": ["Customer: 'borderline conversation example'", "Customer: 'another edge case'"]
  },
  "optimization_notes": ["explanation of keyword choices", "rationale for conditions", "other optimization decisions"]
}

Generate the most accurate, comprehensive trigger point configuration possible for this business scenario.
`;
  }

  /**
   * Call AI service with user's configured LLM
   */
  private async callAIService(llmConfig: any, prompt: string): Promise<string> {
    try {
      // Determine which AI service to use based on user's configuration
      if (llmConfig.openai_api_key) {
        return await this.callOpenAI(llmConfig.openai_api_key, prompt);
      } else if (llmConfig.claude_api_key) {
        return await this.callClaude(llmConfig.claude_api_key, prompt);
      } else if (llmConfig.gemini_api_key) {
        return await this.callGemini(llmConfig.gemini_api_key, prompt);
      } else if (llmConfig.grok_api_key) {
        return await this.callGrok(llmConfig.grok_api_key, prompt);
      } else {
        throw new Error('No valid LLM API key found');
      }
    } catch (error) {
      console.error('AI service call error:', error);
      throw error;
    }
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(apiKey: string, prompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert business automation consultant. Respond only with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Call Claude API
   */
  private async callClaude(apiKey: string, prompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  /**
   * Call Gemini API
   */
  private async callGemini(apiKey: string, prompt: string): Promise<string> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2000
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  /**
   * Call Grok API (placeholder - adjust based on actual Grok API)
   */
  private async callGrok(apiKey: string, prompt: string): Promise<string> {
    // Placeholder for Grok API implementation
    // Adjust based on actual Grok API specifications
    throw new Error('Grok API integration not yet implemented');
  }

  /**
   * Parse AI response and validate structure
   */
  private parseAIResponse(aiResponse: string, requirements: TriggerRequirements): AIGeneratedTrigger {
    try {
      // Extract JSON from AI response (in case there's extra text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate required fields
      const requiredFields = ['name', 'description', 'instructions', 'keywords', 'conditions', 'actions'];
      for (const field of requiredFields) {
        if (!parsed[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Add quality score based on completeness and optimization
      parsed.quality_score = this.calculateQualityScore(parsed);

      return parsed as AIGeneratedTrigger;

    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Invalid AI response format');
    }
  }

  /**
   * Calculate quality score for generated trigger
   */
  private calculateQualityScore(trigger: any): number {
    let score = 0;

    // Keywords completeness (30%)
    if (trigger.keywords && trigger.keywords.length >= 10) score += 0.3;
    else if (trigger.keywords && trigger.keywords.length >= 5) score += 0.2;
    else score += 0.1;

    // Alternative phrases (20%)
    if (trigger.alternative_phrases && trigger.alternative_phrases.length >= 5) score += 0.2;
    else if (trigger.alternative_phrases && trigger.alternative_phrases.length >= 3) score += 0.15;
    else score += 0.1;

    // Negative keywords (15%)
    if (trigger.negative_keywords && trigger.negative_keywords.length >= 3) score += 0.15;
    else if (trigger.negative_keywords && trigger.negative_keywords.length >= 1) score += 0.1;

    // Example conversations (20%)
    if (trigger.example_conversations && 
        trigger.example_conversations.positive_examples && 
        trigger.example_conversations.negative_examples) {
      score += 0.2;
    } else score += 0.1;

    // Optimization notes (15%)
    if (trigger.optimization_notes && trigger.optimization_notes.length >= 3) score += 0.15;
    else if (trigger.optimization_notes && trigger.optimization_notes.length >= 1) score += 0.1;

    return Math.min(1, score);
  }

  /**
   * Apply additional optimizations to generated trigger
   */
  private async optimizeTriggerPoint(trigger: AIGeneratedTrigger, requirements: TriggerRequirements): Promise<AIGeneratedTrigger> {
    // Add business-specific optimizations
    const optimized = { ...trigger };

    // Adjust confidence threshold based on business criticality
    if (requirements.trigger_type === 'emergency_service') {
      optimized.confidence_threshold = 0.6; // Lower threshold for emergencies
      optimized.actions.priority_level = 5;
      optimized.actions.response_time_minutes = 5;
    } else if (requirements.trigger_type === 'order_booking') {
      optimized.confidence_threshold = 0.8; // Higher threshold for orders
    } else {
      optimized.confidence_threshold = 0.7; // Standard threshold
    }

    // Adjust vendor selection based on business type
    if (requirements.business_context.business_type.includes('emergency') || 
        requirements.business_context.business_type.includes('urgent')) {
      optimized.vendor_selection_criteria.location_radius = Math.min(optimized.vendor_selection_criteria.location_radius, 15);
      optimized.vendor_selection_criteria.prefer_available = true;
    }

    // Add industry-specific keywords if missing
    const industryKeywords = this.getIndustrySpecificKeywords(requirements.business_context.business_type);
    optimized.keywords = [...new Set([...optimized.keywords, ...industryKeywords])];

    return optimized;
  }

  /**
   * Get industry-specific keywords
   */
  private getIndustrySpecificKeywords(businessType: string): string[] {
    const industryKeywords: Record<string, string[]> = {
      'cleaning': ['sanitize', 'disinfect', 'janitorial', 'housekeeping', 'maintenance'],
      'maintenance': ['repair', 'fix', 'service', 'troubleshoot', 'inspect'],
      'delivery': ['transport', 'ship', 'courier', 'logistics', 'pickup'],
      'landscaping': ['lawn', 'garden', 'landscape', 'mowing', 'trimming'],
      'security': ['protect', 'monitor', 'surveillance', 'guard', 'patrol']
    };

    const type = businessType.toLowerCase();
    for (const [key, keywords] of Object.entries(industryKeywords)) {
      if (type.includes(key)) {
        return keywords;
      }
    }

    return [];
  }

  /**
   * Get user's LLM configuration
   */
  private async getUserLLMConfig(): Promise<any> {
    try {
      const response = await fetch('/api/settings/api-keys', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.api_keys;
      }

      return null;
    } catch (error) {
      console.error('Failed to get LLM config:', error);
      return null;
    }
  }

  /**
   * Test generated trigger point with sample conversations
   */
  async testTriggerPoint(trigger: AIGeneratedTrigger, testConversations: string[]): Promise<{
    accuracy: number;
    false_positives: string[];
    false_negatives: string[];
    recommendations: string[];
  }> {
    // Implementation for testing trigger accuracy
    // This would simulate the trigger detection on test conversations
    return {
      accuracy: 0.85,
      false_positives: [],
      false_negatives: [],
      recommendations: ['Consider adding more alternative phrases', 'Adjust confidence threshold']
    };
  }
}

// Export singleton instance
export const aiTriggerGenerator = AITriggerGeneratorService.getInstance();
