"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Phone, 
  PhoneCall, 
  User, 
  Brain, 
  Mic, 
  Settings, 
  Play,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';

import { aiCallingAgentAPI, Customer, CustomerCreate, VoiceConfig, CallInitiate, CallSession } from '@/lib/api/ai-calling-agent';
import RealTimeCallInterface from './RealTimeCallInterface';

interface CustomerAICallingPanelProps {
  customerId?: string;
  onCustomerUpdate?: (customer: Customer) => void;
}

export default function CustomerAICallingPanel({ customerId, onCustomerUpdate }: CustomerAICallingPanelProps) {
  // State management
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isEditing, setIsEditing] = useState(!customerId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [callHistory, setCallHistory] = useState<CallSession[]>([]);
  
  // Form state
  const [formData, setFormData] = useState<CustomerCreate>({
    name: '',
    phone_number: '',
    email: '',
    company: '',
    industry: '',
    notes: '',
    timezone: 'America/New_York',
    preferred_language: 'en-US',
    do_not_call: false,
    tags: []
  });

  // AI Calling state
  const [callScript, setCallScript] = useState('');
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>({
    voice_type: 'elevenlabs',
    voice_id: 'default',
    voice_name: 'Professional Voice',
    language: 'en-US',
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.0,
    use_speaker_boost: true,
    speed: 1.0,
    pitch: 1.0
  });
  const [ragEnabled, setRagEnabled] = useState(true);
  const [knowledgeBaseId, setKnowledgeBaseId] = useState<string>('');
  const [initiatingCall, setInitiatingCall] = useState(false);

  // Load customer data
  useEffect(() => {
    if (customerId) {
      loadCustomer();
      loadCallHistory();
    }
  }, [customerId]);

  const loadCustomer = async () => {
    if (!customerId) return;
    
    try {
      setLoading(true);
      const result = await aiCallingAgentAPI.getCustomer(customerId);
      
      if (result.success) {
        setCustomer(result.data);
        setFormData({
          name: result.data.name,
          phone_number: result.data.phone_number,
          email: result.data.email || '',
          company: result.data.company || '',
          industry: result.data.industry || '',
          notes: result.data.notes || '',
          timezone: result.data.timezone || 'America/New_York',
          preferred_language: result.data.preferred_language,
          do_not_call: result.data.do_not_call,
          tags: result.data.tags
        });
        
        // Update voice config language to match customer preference
        setVoiceConfig(prev => ({
          ...prev,
          language: result.data.preferred_language
        }));
      } else {
        setError(result.error || 'Failed to load customer');
      }
    } catch (err) {
      setError('Failed to load customer');
      console.error('Load customer error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCallHistory = async () => {
    if (!customerId) return;
    
    try {
      // This would be implemented in the API
      // const result = await aiCallingAgentAPI.getCustomerCallHistory(customerId);
      // For now, we'll use mock data
      setCallHistory([]);
    } catch (err) {
      console.error('Load call history error:', err);
    }
  };

  const handleSaveCustomer = async () => {
    try {
      setLoading(true);
      
      if (customerId) {
        // Update existing customer
        // const result = await aiCallingAgentAPI.updateCustomer(customerId, formData);
        // For now, we'll simulate success
        const updatedCustomer = { ...customer!, ...formData };
        setCustomer(updatedCustomer);
        if (onCustomerUpdate) {
          onCustomerUpdate(updatedCustomer);
        }
      } else {
        // Create new customer
        const result = await aiCallingAgentAPI.createCustomer(formData);
        if (result.success) {
          setCustomer(result.data);
          if (onCustomerUpdate) {
            onCustomerUpdate(result.data);
          }
        } else {
          setError(result.error || 'Failed to create customer');
          return;
        }
      }
      
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError('Failed to save customer');
      console.error('Save customer error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateCall = async () => {
    if (!customer || !callScript.trim()) {
      setError('Customer and call script are required');
      return;
    }

    try {
      setInitiatingCall(true);
      
      const callData: CallInitiate = {
        customer_id: customer.id,
        script: callScript,
        voice_config: voiceConfig,
        knowledge_base_id: knowledgeBaseId || undefined,
        rag_enabled: ragEnabled,
        max_duration: 1800, // 30 minutes
        retry_attempts: 3
      };

      const result = await aiCallingAgentAPI.initiateCall(callData);
      
      if (result.success) {
        // Poll for call session creation
        setTimeout(async () => {
          const sessionResult = await aiCallingAgentAPI.getCallSession(result.data.call_id);
          if (sessionResult.success) {
            setActiveCall(sessionResult.data);
          }
        }, 2000);
        
        setError(null);
      } else {
        setError(result.error || 'Failed to initiate call');
      }
    } catch (err) {
      setError('Failed to initiate call');
      console.error('Initiate call error:', err);
    } finally {
      setInitiatingCall(false);
    }
  };

  const handleCallEnd = () => {
    setActiveCall(null);
    loadCallHistory(); // Refresh call history
  };

  const handleFormChange = (field: keyof CustomerCreate, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVoiceConfigChange = (field: keyof VoiceConfig, value: any) => {
    setVoiceConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // If there's an active call, show the real-time interface
  if (activeCall) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Active AI Call</h2>
          <Button 
            onClick={() => setActiveCall(null)} 
            variant="outline"
          >
            Back to Customer
          </Button>
        </div>
        
        <RealTimeCallInterface 
          callId={activeCall.id} 
          onCallEnd={handleCallEnd}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6" />
            {customer ? customer.name : 'New Customer'}
          </h2>
          <p className="text-gray-600">
            {customer ? 'Manage customer and AI calling settings' : 'Create new customer for AI calling'}
          </p>
        </div>
        
        {customer && !isEditing && (
          <div className="flex items-center gap-2">
            <Badge variant={customer.do_not_call ? "destructive" : "default"}>
              {customer.do_not_call ? 'Do Not Call' : 'Available'}
            </Badge>
            <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="customer" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="customer">Customer Info</TabsTrigger>
          <TabsTrigger value="ai-calling">AI Calling</TabsTrigger>
          <TabsTrigger value="history">Call History</TabsTrigger>
        </TabsList>

        {/* Customer Information Tab */}
        <TabsContent value="customer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>Basic customer details and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter customer name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone_number}
                    onChange={(e) => handleFormChange('phone_number', e.target.value)}
                    disabled={!isEditing}
                    placeholder="+1234567890"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    disabled={!isEditing}
                    placeholder="customer@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => handleFormChange('company', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Company name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => handleFormChange('industry', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Industry type"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language">Preferred Language</Label>
                  <Select
                    value={formData.preferred_language}
                    onValueChange={(value) => handleFormChange('preferred_language', value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="en-GB">English (UK)</SelectItem>
                      <SelectItem value="es-ES">Spanish (Spain)</SelectItem>
                      <SelectItem value="es-MX">Spanish (Mexico)</SelectItem>
                      <SelectItem value="fr-FR">French</SelectItem>
                      <SelectItem value="de-DE">German</SelectItem>
                      <SelectItem value="it-IT">Italian</SelectItem>
                      <SelectItem value="pt-BR">Portuguese (Brazil)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Additional notes about the customer"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="do-not-call"
                  checked={formData.do_not_call}
                  onCheckedChange={(checked) => handleFormChange('do_not_call', checked)}
                  disabled={!isEditing}
                />
                <Label htmlFor="do-not-call">Do Not Call</Label>
              </div>
              
              {isEditing && (
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveCustomer} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {customerId ? 'Update Customer' : 'Create Customer'}
                  </Button>
                  <Button 
                    onClick={() => setIsEditing(false)} 
                    variant="outline"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Calling Tab */}
        <TabsContent value="ai-calling" className="space-y-6">
          {!customer ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please save customer information first before configuring AI calling.
              </AlertDescription>
            </Alert>
          ) : customer.do_not_call ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This customer is on the Do Not Call list. AI calling is disabled.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Call Script */}
              <Card>
                <CardHeader>
                  <CardTitle>Call Script</CardTitle>
                  <CardDescription>AI conversation template and guidelines</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="script">Call Script Template</Label>
                    <Textarea
                      id="script"
                      value={callScript}
                      onChange={(e) => setCallScript(e.target.value)}
                      placeholder="Enter your call script template. The AI will use this as a guide for the conversation..."
                      rows={6}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Voice Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Voice Configuration</CardTitle>
                  <CardDescription>AI voice settings for this customer</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Voice Type</Label>
                      <Select
                        value={voiceConfig.voice_type}
                        onValueChange={(value) => handleVoiceConfigChange('voice_type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                          <SelectItem value="cloned">Cloned Voice</SelectItem>
                          <SelectItem value="google">Google TTS</SelectItem>
                          <SelectItem value="azure">Azure TTS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Voice ID</Label>
                      <Input
                        value={voiceConfig.voice_id}
                        onChange={(e) => handleVoiceConfigChange('voice_id', e.target.value)}
                        placeholder="Voice identifier"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Stability ({Math.round(voiceConfig.stability * 100)}%)</Label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={voiceConfig.stability}
                        onChange={(e) => handleVoiceConfigChange('stability', parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Similarity ({Math.round(voiceConfig.similarity_boost * 100)}%)</Label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={voiceConfig.similarity_boost}
                        onChange={(e) => handleVoiceConfigChange('similarity_boost', parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={voiceConfig.use_speaker_boost}
                      onCheckedChange={(checked) => handleVoiceConfigChange('use_speaker_boost', checked)}
                    />
                    <Label>Use Speaker Boost</Label>
                  </div>
                </CardContent>
              </Card>

              {/* AI Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>AI Settings</CardTitle>
                  <CardDescription>Knowledge base and conversation settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={ragEnabled}
                      onCheckedChange={setRagEnabled}
                    />
                    <Label>Enable RAG (Knowledge Base)</Label>
                  </div>
                  
                  {ragEnabled && (
                    <div className="space-y-2">
                      <Label>Knowledge Base ID</Label>
                      <Input
                        value={knowledgeBaseId}
                        onChange={(e) => setKnowledgeBaseId(e.target.value)}
                        placeholder="Enter knowledge base ID"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Initiate Call */}
              <Card>
                <CardHeader>
                  <CardTitle>Start AI Call</CardTitle>
                  <CardDescription>Initiate real-time AI conversation</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={handleInitiateCall}
                    disabled={initiatingCall || !callScript.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {initiatingCall ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <PhoneCall className="h-4 w-4 mr-2" />
                    )}
                    {initiatingCall ? 'Initiating Call...' : 'Start AI Call'}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Call History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Call History</CardTitle>
              <CardDescription>Previous AI conversations with this customer</CardDescription>
            </CardHeader>
            <CardContent>
              {callHistory.length > 0 ? (
                <div className="space-y-4">
                  {callHistory.map((call) => (
                    <div key={call.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{call.status}</Badge>
                          <span className="text-sm text-gray-600">
                            {new Date(call.created_at).toLocaleString()}
                          </span>
                        </div>
                        <span className="text-sm font-medium">
                          {call.duration ? `${call.duration}s` : 'N/A'}
                        </span>
                      </div>
                      
                      {call.outcome && (
                        <div className="text-sm text-gray-600">
                          Outcome: {call.outcome}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No call history available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
