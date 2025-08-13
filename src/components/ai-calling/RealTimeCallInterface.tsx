"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Play,
  Pause,
  Square,
  MessageCircle,
  Brain,
  Zap,
  Clock,
  User,
  Bot,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

import { aiCallingAgentAPI, CallSession, ConversationMessage, getCallStatusColor, getCallStatusIcon } from '@/lib/api/ai-calling-agent';

interface RealTimeCallInterfaceProps {
  callId: string;
  onCallEnd?: () => void;
}

export default function RealTimeCallInterface({ callId, onCallEnd }: RealTimeCallInterfaceProps) {
  // State management
  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load call session and setup WebSocket
  useEffect(() => {
    loadCallSession();
    setupWebSocket();
    
    return () => {
      cleanup();
    };
  }, [callId]);

  // Auto-scroll to latest message
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update call duration
  useEffect(() => {
    if (callSession?.status === 'in_progress' && callSession.started_at) {
      durationIntervalRef.current = setInterval(() => {
        const startTime = new Date(callSession.started_at!).getTime();
        const now = new Date().getTime();
        setCallDuration(Math.floor((now - startTime) / 1000));
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [callSession?.status, callSession?.started_at]);

  const loadCallSession = async () => {
    try {
      setLoading(true);
      const result = await aiCallingAgentAPI.getCallSession(callId);
      
      if (result.success) {
        setCallSession(result.data);
        setMessages(result.data.conversation_context.messages || []);
        
        // Set initial recording state based on call status
        setIsRecording(['connected', 'in_progress'].includes(result.data.status));
      } else {
        setError(result.error || 'Failed to load call session');
      }
    } catch (err) {
      setError('Failed to load call session');
      console.error('Load call session error:', err);
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = () => {
    try {
      wsRef.current = aiCallingAgentAPI.createWebSocketConnection(
        callId,
        handleWebSocketMessage,
        handleWebSocketError
      );
    } catch (err) {
      console.error('WebSocket setup error:', err);
      setError('Failed to establish real-time connection');
    }
  };

  const handleWebSocketMessage = (data: any) => {
    try {
      switch (data.type) {
        case 'call_status':
          handleCallStatusUpdate(data.data);
          break;
        case 'transcription':
          handleTranscriptionUpdate(data.data);
          break;
        case 'ai_response':
          handleAIResponse(data.data);
          break;
        case 'conversation_update':
          handleConversationUpdate(data.data);
          break;
        case 'error':
          setError(data.data.message);
          break;
        default:
          console.log('Unknown WebSocket message type:', data.type);
      }
    } catch (err) {
      console.error('WebSocket message handling error:', err);
    }
  };

  const handleWebSocketError = (error: Event) => {
    console.error('WebSocket error:', error);
    setIsConnected(false);
    setError('Real-time connection lost. Attempting to reconnect...');
    
    // Attempt to reconnect after 3 seconds
    setTimeout(() => {
      setupWebSocket();
    }, 3000);
  };

  const handleCallStatusUpdate = (statusData: any) => {
    if (callSession) {
      setCallSession({
        ...callSession,
        status: statusData.status,
        duration: statusData.duration || callSession.duration
      });
      
      // Update recording state based on status
      setIsRecording(['connected', 'in_progress'].includes(statusData.status));
      
      // Handle call completion
      if (['completed', 'failed', 'cancelled'].includes(statusData.status)) {
        setIsRecording(false);
        if (onCallEnd) {
          onCallEnd();
        }
      }
    }
  };

  const handleTranscriptionUpdate = (transcriptionData: any) => {
    if (transcriptionData.is_final) {
      // Add customer message to conversation
      const customerMessage: ConversationMessage = {
        role: 'user',
        content: transcriptionData.text,
        timestamp: new Date().toISOString(),
        confidence: transcriptionData.confidence,
        entities: {}
      };
      
      setMessages(prev => [...prev, customerMessage]);
      setCurrentTranscript('');
    } else {
      // Update current transcript (interim results)
      setCurrentTranscript(transcriptionData.text);
    }
  };

  const handleAIResponse = (responseData: any) => {
    // Add AI response to conversation
    const aiMessage: ConversationMessage = {
      role: 'assistant',
      content: responseData.response_text,
      timestamp: new Date().toISOString(),
      intent: responseData.intent,
      entities: responseData.entities || {}
    };
    
    setMessages(prev => [...prev, aiMessage]);
  };

  const handleConversationUpdate = (conversationData: any) => {
    if (callSession) {
      setCallSession({
        ...callSession,
        conversation_context: {
          ...callSession.conversation_context,
          current_intent: conversationData.current_intent,
          conversation_state: conversationData.conversation_state,
          extracted_entities: conversationData.extracted_entities
        }
      });
    }
  };

  const handleEndCall = async () => {
    try {
      const result = await aiCallingAgentAPI.endCall(callId);
      if (result.success) {
        setIsRecording(false);
        if (onCallEnd) {
          onCallEnd();
        }
      } else {
        setError(result.error || 'Failed to end call');
      }
    } catch (err) {
      setError('Failed to end call');
      console.error('End call error:', err);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // In a real implementation, this would control the microphone
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const cleanup = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getMessageIcon = (role: string) => {
    switch (role) {
      case 'user': return <User className="h-4 w-4" />;
      case 'assistant': return <Bot className="h-4 w-4" />;
      case 'system': return <Brain className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading call interface...</p>
        </div>
      </div>
    );
  }

  if (!callSession) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Call session not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Call Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{getCallStatusIcon(callSession.status)}</div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {callSession.phone_number}
                  <Badge variant="outline" className={getCallStatusColor(callSession.status)}>
                    {callSession.status.replace('_', ' ')}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Call ID: {callSession.id.slice(0, 8)}... • Duration: {formatDuration(callDuration)}
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Connection Status */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs text-gray-600">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              {/* Call Controls */}
              {callSession.status === 'in_progress' && (
                <>
                  <Button
                    onClick={toggleMute}
                    variant={isMuted ? "destructive" : "outline"}
                    size="sm"
                  >
                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    onClick={handleEndCall}
                    variant="destructive"
                    size="sm"
                  >
                    <PhoneOff className="h-4 w-4 mr-2" />
                    End Call
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation Flow */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Live Conversation
              </CardTitle>
              <CardDescription>Real-time AI conversation transcript</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${
                        message.role === 'assistant' ? 'justify-start' : 'justify-end'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'assistant'
                            ? 'bg-blue-50 border border-blue-200'
                            : message.role === 'user'
                            ? 'bg-gray-50 border border-gray-200'
                            : 'bg-yellow-50 border border-yellow-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {getMessageIcon(message.role)}
                          <span className="text-xs font-medium capitalize">
                            {message.role === 'assistant' ? 'AI Agent' : 
                             message.role === 'user' ? 'Customer' : 'System'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                        
                        {/* Message Metadata */}
                        {(message.confidence || message.intent) && (
                          <div className="mt-2 flex gap-2">
                            {message.confidence && (
                              <Badge variant="secondary" className="text-xs">
                                {Math.round(message.confidence * 100)}% confidence
                              </Badge>
                            )}
                            {message.intent && (
                              <Badge variant="outline" className="text-xs">
                                {message.intent}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Current Transcript (Interim) */}
                  {currentTranscript && (
                    <div className="flex justify-end">
                      <div className="max-w-[80%] rounded-lg p-3 bg-gray-100 border border-gray-300 opacity-70">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4" />
                          <span className="text-xs font-medium">Customer (typing...)</span>
                        </div>
                        <p className="text-sm italic">{currentTranscript}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Recording Indicator */}
                  {isRecording && (
                    <div className="flex justify-center">
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                        <span>Recording conversation...</span>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Call Information Panel */}
        <div className="space-y-6">
          {/* Conversation State */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Conversation State</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Current State</span>
                <Badge variant="secondary">
                  {callSession.conversation_context.conversation_state}
                </Badge>
              </div>
              
              {callSession.conversation_context.current_intent && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Intent</span>
                  <Badge variant="outline">
                    {callSession.conversation_context.current_intent}
                  </Badge>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">RAG Enabled</span>
                <Badge variant={callSession.conversation_context.rag_enabled ? "default" : "secondary"}>
                  {callSession.conversation_context.rag_enabled ? "Yes" : "No"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Voice Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Voice Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Voice Type</span>
                <span className="text-sm font-medium">{callSession.voice_config.voice_type}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Language</span>
                <span className="text-sm font-medium">{callSession.voice_config.language}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Stability</span>
                  <span>{Math.round(callSession.voice_config.stability * 100)}%</span>
                </div>
                <Progress value={callSession.voice_config.stability * 100} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Similarity</span>
                  <span>{Math.round(callSession.voice_config.similarity_boost * 100)}%</span>
                </div>
                <Progress value={callSession.voice_config.similarity_boost * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Call Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Call Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Duration</span>
                <span className="text-sm font-medium">{formatDuration(callDuration)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Messages</span>
                <span className="text-sm font-medium">{messages.length}</span>
              </div>
              
              {callSession.quality_score && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Quality Score</span>
                  <span className="text-sm font-medium">
                    {Math.round(callSession.quality_score * 100)}%
                  </span>
                </div>
              )}
              
              {callSession.cost && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Cost</span>
                  <span className="text-sm font-medium">${callSession.cost.toFixed(3)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
