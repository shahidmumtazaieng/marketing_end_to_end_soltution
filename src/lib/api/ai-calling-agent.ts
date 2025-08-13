/**
 * AI Calling Agent API Integration
 * Complete API layer for real-time conversational AI calling system
 */

import { ApiResponse, ApiError } from './types';

// Base configuration
const AI_CALLING_AGENT_BASE_URL = process.env.NEXT_PUBLIC_AI_CALLING_AGENT_URL || 'http://localhost:8004';

// Types for AI Calling Agent
export interface Customer {
  id: string;
  name: string;
  phone_number: string;
  email?: string;
  company?: string;
  industry?: string;
  notes?: string;
  timezone?: string;
  preferred_language: string;
  do_not_call: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  last_called?: string;
  call_count: number;
  successful_calls: number;
}

export interface CustomerCreate {
  name: string;
  phone_number: string;
  email?: string;
  company?: string;
  industry?: string;
  notes?: string;
  timezone?: string;
  preferred_language?: string;
  do_not_call?: boolean;
  tags?: string[];
}

export interface VoiceConfig {
  voice_type: 'elevenlabs' | 'cloned' | 'google' | 'azure';
  voice_id: string;
  voice_name?: string;
  language: string;
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
  speed: number;
  pitch: number;
}

export interface CallInitiate {
  customer_id: string;
  script: string;
  voice_config: VoiceConfig;
  knowledge_base_id?: string;
  rag_enabled: boolean;
  scheduled_time?: string;
  max_duration?: number;
  retry_attempts?: number;
}

export interface CallSession {
  id: string;
  customer_id: string;
  phone_number: string;
  status: 'pending' | 'dialing' | 'ringing' | 'connected' | 'in_progress' | 'completed' | 'failed' | 'no_answer' | 'busy' | 'cancelled';
  voice_config: VoiceConfig;
  conversation_context: ConversationContext;
  created_at: string;
  started_at?: string;
  ended_at?: string;
  duration?: number;
  twilio_call_sid?: string;
  recording_url?: string;
  outcome?: string;
  error_message?: string;
  cost?: number;
  quality_score?: number;
}

export interface ConversationContext {
  customer_id: string;
  call_id: string;
  messages: ConversationMessage[];
  current_intent?: string;
  extracted_entities: Record<string, any>;
  conversation_state: string;
  knowledge_base_id?: string;
  rag_enabled: boolean;
  script_template?: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  audio_url?: string;
  duration?: number;
  confidence?: number;
  intent?: string;
  entities: Record<string, any>;
}

export interface CallAnalytics {
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  average_duration: number;
  success_rate: number;
  total_cost: number;
  scam_detection_rate: number;
  top_outcomes: Array<{ outcome: string; count: number }>;
  hourly_distribution: Record<string, number>;
  daily_distribution: Record<string, number>;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  user_id: string;
  is_active: boolean;
}

export interface SystemHealth {
  status: string;
  service: string;
  version: string;
  services: Record<string, any>;
  timestamp: string;
}

// API Client Class
export class AICallingAgentAPI {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(apiKey?: string) {
    this.baseUrl = AI_CALLING_AGENT_BASE_URL;
    this.headers = {
      'Content-Type': 'application/json',
      ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
    };
  }

  // Health Check
  async healthCheck(): Promise<ApiResponse<SystemHealth>> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new ApiError(`Health check failed: ${response.statusText}`, response.status);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Health check error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Health check failed' 
      };
    }
  }

  // Customer Management
  async createCustomer(customerData: CustomerCreate): Promise<ApiResponse<Customer>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/customers`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.detail || 'Failed to create customer', response.status);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Create customer error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create customer' 
      };
    }
  }

  async getCustomers(skip = 0, limit = 100): Promise<ApiResponse<Customer[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/customers?skip=${skip}&limit=${limit}`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new ApiError(`Failed to get customers: ${response.statusText}`, response.status);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Get customers error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get customers' 
      };
    }
  }

  async getCustomer(customerId: string): Promise<ApiResponse<Customer>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/customers/${customerId}`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new ApiError(`Failed to get customer: ${response.statusText}`, response.status);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Get customer error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get customer' 
      };
    }
  }

  // Call Management
  async initiateCall(callData: CallInitiate): Promise<ApiResponse<{ call_id: string; status: string; message: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/calls/initiate`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(callData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.detail || 'Failed to initiate call', response.status);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Initiate call error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to initiate call' 
      };
    }
  }

  async getCallSession(callId: string): Promise<ApiResponse<CallSession>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/calls/sessions/${callId}`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new ApiError(`Failed to get call session: ${response.statusText}`, response.status);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Get call session error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get call session' 
      };
    }
  }

  async getActiveSessions(): Promise<ApiResponse<CallSession[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/calls/sessions`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new ApiError(`Failed to get active sessions: ${response.statusText}`, response.status);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Get active sessions error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get active sessions' 
      };
    }
  }

  async endCall(callId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/calls/end/${callId}`, {
        method: 'POST',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new ApiError(`Failed to end call: ${response.statusText}`, response.status);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('End call error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to end call' 
      };
    }
  }

  // Analytics
  async getCallAnalytics(startDate?: string, endDate?: string): Promise<ApiResponse<CallAnalytics>> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await fetch(`${this.baseUrl}/api/analytics/calls?${params}`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new ApiError(`Failed to get analytics: ${response.statusText}`, response.status);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Get analytics error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get analytics' 
      };
    }
  }

  // WebSocket Connection for Real-time Updates
  createWebSocketConnection(callId: string, onMessage: (data: any) => void, onError?: (error: Event) => void): WebSocket {
    const wsUrl = this.baseUrl.replace('http', 'ws') + `/ws/calls/${callId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log(`WebSocket connected for call ${callId}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (onError) onError(error);
    };

    ws.onclose = () => {
      console.log(`WebSocket disconnected for call ${callId}`);
    };

    return ws;
  }
}

// Default API instance
export const aiCallingAgentAPI = new AICallingAgentAPI();

// Utility functions
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Add country code if not present
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  return phone;
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

export const getCallStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    'pending': 'text-yellow-600',
    'dialing': 'text-blue-600',
    'ringing': 'text-blue-500',
    'connected': 'text-green-600',
    'in_progress': 'text-green-500',
    'completed': 'text-gray-600',
    'failed': 'text-red-600',
    'no_answer': 'text-orange-600',
    'busy': 'text-orange-500',
    'cancelled': 'text-gray-500'
  };
  
  return statusColors[status] || 'text-gray-600';
};

export const getCallStatusIcon = (status: string): string => {
  const statusIcons: Record<string, string> = {
    'pending': '⏳',
    'dialing': '📞',
    'ringing': '📳',
    'connected': '🔗',
    'in_progress': '🗣️',
    'completed': '✅',
    'failed': '❌',
    'no_answer': '📵',
    'busy': '🔴',
    'cancelled': '⏹️'
  };
  
  return statusIcons[status] || '📞';
};
