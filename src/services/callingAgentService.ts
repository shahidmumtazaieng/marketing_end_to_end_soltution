/**
 * Calling Agent Service
 * Handles communication with the Node.js backend for calling agent operations
 * Integrates with ElevenLabs, Twilio, and Python AI services
 */

export interface CallSession {
  id: string;
  phoneNumber: string;
  status: 'idle' | 'dialing' | 'ringing' | 'connected' | 'ended';
  startTime?: Date;
  duration: number;
  scamRisk: 'low' | 'medium' | 'high' | 'critical';
  sentiment: 'positive' | 'neutral' | 'negative';
  transcript: Array<{
    timestamp: Date;
    speaker: 'agent' | 'customer';
    text: string;
    confidence: number;
  }>;
}

export interface AgentConfiguration {
  name: string;
  description?: string;
  voice_id: string;
  model_id: string;
  language: string;
  llm_model: string;
  system_prompt: string;
  temperature: number;
  max_tokens: number;
  voice_settings: {
    stability: number;
    similarity_boost: number;
    style: number;
    use_speaker_boost: boolean;
  };
  behavior_config: {
    conversation_style: string;
    scam_detection_enabled: boolean;
    max_call_duration: number;
    auto_end_on_silence: boolean;
  };
}

export interface CallStatistics {
  totalCalls: number;
  activeCalls: number;
  successRate: number;
  avgDuration: number;
  scamsDetected: number;
}

export interface ScamAnalysis {
  isScam: boolean;
  confidence: number;
  scamProbability: number;
  scamType: string;
  riskLevel: string;
  recommendations: string[];
  processingTime: number;
}

export interface VoiceAnalysis {
  emotion: string;
  stressLevel: string;
  speechRate: string;
  confidence: number;
}

export class CallingAgentService {
  private baseUrl: string;
  private wsUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    this.wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000';
  }

  /**
   * Get available ElevenLabs voices
   */
  async getVoices(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/calling/voices`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch voices');
      }
      
      return data.voices;
    } catch (error) {
      console.error('Failed to get voices:', error);
      throw error;
    }
  }

  /**
   * Get available ElevenLabs models
   */
  async getModels(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/calling/models`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch models');
      }
      
      return data.models;
    } catch (error) {
      console.error('Failed to get models:', error);
      throw error;
    }
  }

  /**
   * Create a new calling agent
   */
  async createAgent(config: AgentConfiguration): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/calling/agents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create agent');
      }
      
      return data.agent;
    } catch (error) {
      console.error('Failed to create agent:', error);
      throw error;
    }
  }

  /**
   * Start a new call
   */
  async startCall(phoneNumber: string, agentId?: string): Promise<CallSession> {
    try {
      const response = await fetch(`${this.baseUrl}/api/calling/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          agent_id: agentId,
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to start call');
      }
      
      return {
        id: data.call_id,
        phoneNumber,
        status: 'dialing',
        startTime: new Date(),
        duration: 0,
        scamRisk: 'low',
        sentiment: 'neutral',
        transcript: [],
      };
    } catch (error) {
      console.error('Failed to start call:', error);
      throw error;
    }
  }

  /**
   * End an active call
   */
  async endCall(callId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/calling/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          call_id: callId,
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to end call');
      }
    } catch (error) {
      console.error('Failed to end call:', error);
      throw error;
    }
  }

  /**
   * Analyze text for scam indicators
   */
  async analyzeForScam(text: string, conversationId?: string): Promise<ScamAnalysis> {
    try {
      const response = await fetch(`${this.baseUrl}/api/calling/analyze-scam`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          conversation_id: conversationId,
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze for scam');
      }
      
      return data.analysis;
    } catch (error) {
      console.error('Failed to analyze for scam:', error);
      throw error;
    }
  }

  /**
   * Analyze voice/audio data
   */
  async analyzeVoice(audioData: Blob, sessionId?: string): Promise<VoiceAnalysis> {
    try {
      const formData = new FormData();
      formData.append('audio', audioData);
      if (sessionId) {
        formData.append('session_id', sessionId);
      }

      const response = await fetch(`${this.baseUrl}/api/calling/analyze-voice`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze voice');
      }
      
      return data.analysis;
    } catch (error) {
      console.error('Failed to analyze voice:', error);
      throw error;
    }
  }

  /**
   * Get call statistics
   */
  async getCallStatistics(): Promise<CallStatistics> {
    try {
      const response = await fetch(`${this.baseUrl}/api/calling/statistics`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch statistics');
      }
      
      return data.statistics;
    } catch (error) {
      console.error('Failed to get call statistics:', error);
      // Return mock data for demo
      return {
        totalCalls: 247,
        activeCalls: 3,
        successRate: 85.2,
        avgDuration: 245,
        scamsDetected: 12,
      };
    }
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/calling/health`);
      const data = await response.json();
      
      return data;
    } catch (error) {
      console.error('Failed to get health status:', error);
      throw error;
    }
  }

  /**
   * Create WebSocket connection for real-time updates
   */
  createWebSocketConnection(onMessage: (data: any) => void): WebSocket {
    const ws = new WebSocket(`${this.wsUrl}/calling-agent`);
    
    ws.onopen = () => {
      console.log('🔗 WebSocket connected for calling agent updates');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('🔌 WebSocket connection closed');
    };
    
    return ws;
  }

  /**
   * Upload voice sample for cloning
   */
  async uploadVoiceSample(file: File, name: string): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('voice_sample', file);
      formData.append('name', name);

      const response = await fetch(`${this.baseUrl}/api/calling/voice-clone`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to upload voice sample');
      }
      
      return data;
    } catch (error) {
      console.error('Failed to upload voice sample:', error);
      throw error;
    }
  }
}
