
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Phone,
  PhoneCall,
  Clock,
  Users,
  TrendingUp,
  AlertTriangle,
  Play,
  Pause,
  Square,
  Settings,
  Shield,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Activity,
  Brain,
  Zap,
  Eye,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CallListContact {
  id: string;
  name: string;
  phone: string;
  business_name?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'called' | 'completed' | 'failed';
}

interface CallSession {
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

export default function AgentOperationsPage() {
  const [currentCall, setCurrentCall] = useState<CallSession | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [realTimeAnalysis, setRealTimeAnalysis] = useState<any>(null);
  const [scamAlerts, setScamAlerts] = useState<any[]>([]);
  const [callStats, setCallStats] = useState({
    totalCalls: 0,
    activeCalls: 0,
    successRate: 85.2,
    avgDuration: 245,
    scamsDetected: 12
  });

  // Call List Management
  const [selectedCallList, setSelectedCallList] = useState<string | null>(null);
  const [callListContacts, setCallListContacts] = useState<CallListContact[]>([]);
  const [currentContactIndex, setCurrentContactIndex] = useState(0);
  const [campaignActive, setCampaignActive] = useState(false);

  // Voice Cloning Integration
  const [clonedVoices, setClonedVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<any>(null);
  const [voiceType, setVoiceType] = useState<'elevenlabs' | 'cloned'>('elevenlabs');

  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection for real-time updates
    initializeWebSocket();

    // Check for call list ID in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const listId = urlParams.get('listId');
    if (listId) {
      loadCallList(listId);
    }

    // Load cloned voices
    loadClonedVoices();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const loadCallList = async (listId: string) => {
    try {
      // Mock call list data - replace with actual API call
      const mockContacts: CallListContact[] = [
        {
          id: '1',
          name: 'ABC HVAC Services',
          phone: '+1-555-0123',
          business_name: 'ABC HVAC Services',
          priority: 'high',
          status: 'pending'
        },
        {
          id: '2',
          name: 'Downtown Plumbing',
          phone: '+1-555-0124',
          business_name: 'Downtown Plumbing Co.',
          priority: 'medium',
          status: 'pending'
        },
        {
          id: '3',
          name: 'Elite Electrical',
          phone: '+1-555-0125',
          business_name: 'Elite Electrical Services',
          priority: 'high',
          status: 'pending'
        }
      ];

      setCallListContacts(mockContacts);
      setSelectedCallList(listId);
      setCurrentContactIndex(0);

      toast({
        title: "Call List Loaded",
        description: `Loaded ${mockContacts.length} contacts for calling campaign`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load call list",
        variant: "destructive"
      });
    }
  };

  const loadClonedVoices = async () => {
    try {
      const userId = 'user_123'; // Replace with actual user ID
      const response = await fetch(`/api/voice-cloning?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        const readyVoices = data.voices.filter((v: any) => v.status === 'ready');
        setClonedVoices(readyVoices);

        if (readyVoices.length > 0) {
          setSelectedVoice(readyVoices[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load cloned voices:', error);
    }
  };

  const initializeWebSocket = () => {
    // Simulate WebSocket connection
    console.log('🔗 WebSocket connected for real-time calling agent updates');
  };

  const handleStartCall = async () => {
    let phoneNumber = '+1-555-0123'; // Default
    let contactName = 'Test Contact';

    // Use contact from call list if available
    if (callListContacts.length > 0 && currentContactIndex < callListContacts.length) {
      const contact = callListContacts[currentContactIndex];
      phoneNumber = contact.phone;
      contactName = contact.name;

      // Update contact status
      setCallListContacts(prev =>
        prev.map((c, index) =>
          index === currentContactIndex
            ? { ...c, status: 'called' }
            : c
        )
      );
    }

    setIsCallActive(true);
    setCampaignActive(true);

    const newCall: CallSession = {
      id: `call_${Date.now()}`,
      phoneNumber,
      status: 'dialing',
      startTime: new Date(),
      duration: 0,
      scamRisk: 'low',
      sentiment: 'neutral',
      transcript: []
    };
    setCurrentCall(newCall);

    toast({
      title: "📞 Call Started",
      description: `Calling ${contactName} at ${phoneNumber}`,
    });

    // Simulate call progression
    setTimeout(() => {
      setCurrentCall(prev => prev ? {...prev, status: 'connected'} : null);
      setIsRecording(true);
    }, 3000);
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    setIsRecording(false);
    setCurrentCall(prev => prev ? {...prev, status: 'ended'} : null);

    // Update contact status to completed
    if (callListContacts.length > 0 && currentContactIndex < callListContacts.length) {
      setCallListContacts(prev =>
        prev.map((c, index) =>
          index === currentContactIndex
            ? { ...c, status: 'completed' }
            : c
        )
      );

      // Move to next contact
      if (currentContactIndex < callListContacts.length - 1) {
        setCurrentContactIndex(prev => prev + 1);
        toast({
          title: "📞 Call Completed",
          description: `Moving to next contact (${currentContactIndex + 2}/${callListContacts.length})`,
        });
      } else {
        setCampaignActive(false);
        toast({
          title: "🎉 Campaign Completed",
          description: "All contacts in the call list have been processed",
        });
      }
    } else {
      toast({
        title: "📞 Call Ended",
        description: "Call completed successfully",
      });
    }
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Calling Agent Operations</h1>
          <p className="text-muted-foreground">
            AI-Powered Calling with Real-time Scam Detection & ElevenLabs Voice
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isCallActive ? "destructive" : "secondary"} className="px-3 py-1">
            <Activity className="h-3 w-3 mr-1" />
            {isCallActive ? 'LIVE' : 'IDLE'}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/calling-agent/configure'}>
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Real-time Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{callStats.totalCalls}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Calls</CardTitle>
            <PhoneCall className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{callStats.activeCalls}</div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{callStats.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(callStats.avgDuration / 60)}m {callStats.avgDuration % 60}s</div>
            <p className="text-xs text-muted-foreground">
              Per call average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scams Detected</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{callStats.scamsDetected}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Call Controls & Status */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PhoneCall className="h-5 w-5" />
                Call Controls
              </CardTitle>
              <CardDescription>
                Manage your AI calling agent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Call List Status */}
              {selectedCallList && callListContacts.length > 0 && (
                <div className="p-4 border rounded-lg bg-blue-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Call Campaign</span>
                    <Badge variant={campaignActive ? "default" : "secondary"}>
                      {campaignActive ? 'Active' : 'Ready'}
                    </Badge>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">
                      Contact {currentContactIndex + 1} of {callListContacts.length}
                    </div>
                    {callListContacts[currentContactIndex] && (
                      <div className="text-muted-foreground">
                        Next: {callListContacts[currentContactIndex].name}
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <Progress
                      value={(currentContactIndex / callListContacts.length) * 100}
                      className="h-2"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                    <span>Progress</span>
                    <span>{Math.round((currentContactIndex / callListContacts.length) * 100)}%</span>
                  </div>
                </div>
              )}

              {/* Voice Selection */}
              <div className="p-4 border rounded-lg bg-blue-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">AI Voice</span>
                  <Badge variant="secondary">
                    {voiceType === 'cloned' ? 'Cloned Voice' : 'ElevenLabs'}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Button
                      variant={voiceType === 'elevenlabs' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setVoiceType('elevenlabs')}
                      className="flex-1"
                    >
                      ElevenLabs
                    </Button>
                    <Button
                      variant={voiceType === 'cloned' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setVoiceType('cloned')}
                      className="flex-1"
                      disabled={clonedVoices.length === 0}
                    >
                      Cloned Voice
                    </Button>
                  </div>

                  {voiceType === 'cloned' && clonedVoices.length > 0 && (
                    <select
                      value={selectedVoice?.voice_id || ''}
                      onChange={(e) => {
                        const voice = clonedVoices.find(v => v.voice_id === e.target.value);
                        setSelectedVoice(voice);
                      }}
                      className="w-full p-2 border rounded text-sm"
                    >
                      {clonedVoices.map((voice) => (
                        <option key={voice.voice_id} value={voice.voice_id}>
                          {voice.voice_name} ({voice.language})
                        </option>
                      ))}
                    </select>
                  )}

                  {voiceType === 'cloned' && clonedVoices.length === 0 && (
                    <div className="text-xs text-muted-foreground">
                      No cloned voices available. Create one in Voice Cloning section.
                    </div>
                  )}

                  {selectedVoice && voiceType === 'cloned' && (
                    <div className="text-xs text-muted-foreground">
                      Quality: {Math.round((selectedVoice.quality_score || 0) * 100)}% •
                      Used {selectedVoice.usage_count || 0} times
                    </div>
                  )}
                </div>
              </div>

              {/* Call Status */}
              {currentCall && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Current Call</span>
                    <Badge variant={getRiskBadgeColor(currentCall.scamRisk)}>
                      {currentCall.scamRisk.toUpperCase()} RISK
                    </Badge>
                  </div>
                  <div className="text-lg font-mono">{currentCall.phoneNumber}</div>
                  <div className="text-sm text-muted-foreground">
                    Status: {currentCall.status} • Duration: {Math.floor(currentCall.duration / 60)}:{(currentCall.duration % 60).toString().padStart(2, '0')}
                  </div>
                  {currentCall.status === 'connected' && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Recording in progress
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Control Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {!isCallActive ? (
                  <Button onClick={handleStartCall} className="col-span-2">
                    <Play className="h-4 w-4 mr-2" />
                    Start Call
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setIsMuted(!isMuted)}>
                      {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                    <Button variant="destructive" onClick={handleEndCall}>
                      <Square className="h-4 w-4 mr-2" />
                      End Call
                    </Button>
                  </>
                )}
              </div>

              {/* Voice Settings */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Voice Volume</span>
                  <Volume2 className="h-4 w-4" />
                </div>
                <Progress value={75} className="h-2" />
              </div>

              {/* AI Status */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">AI Status</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    ElevenLabs
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Scam Detection
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    NLP Engine
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Voice Analysis
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="monitor" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="monitor">
                <Eye className="h-4 w-4 mr-2" />
                Monitor
              </TabsTrigger>
              <TabsTrigger value="transcript">
                <Activity className="h-4 w-4 mr-2" />
                Transcript
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="alerts">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Alerts
              </TabsTrigger>
            </TabsList>

            {/* Real-time Monitoring Tab */}
            <TabsContent value="monitor" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-500" />
                    Real-time Scam Detection
                  </CardTitle>
                  <CardDescription>
                    AI-powered threat analysis with 95%+ accuracy
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Threat Level</span>
                          <Badge variant="secondary">LOW</Badge>
                        </div>
                        <Progress value={15} className="h-2" />
                        <p className="text-xs text-muted-foreground">15% risk detected</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Confidence</span>
                          <Badge variant="secondary">HIGH</Badge>
                        </div>
                        <Progress value={92} className="h-2" />
                        <p className="text-xs text-muted-foreground">92% confidence</p>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 bg-muted/50">
                      <h4 className="font-medium mb-2">Pattern Analysis</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Urgency Keywords:</span>
                          <span className="ml-2 font-medium">0 detected</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Authority Claims:</span>
                          <span className="ml-2 font-medium">0 detected</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Financial Requests:</span>
                          <span className="ml-2 font-medium">0 detected</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Personal Info:</span>
                          <span className="ml-2 font-medium">0 detected</span>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">Voice Analysis</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Emotion:</span>
                          <span className="ml-2 font-medium text-green-600">Calm</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Stress Level:</span>
                          <span className="ml-2 font-medium">Low</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Speech Rate:</span>
                          <span className="ml-2 font-medium">Normal</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Transcript Tab */}
            <TabsContent value="transcript" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Live Conversation Transcript</CardTitle>
                  <CardDescription>
                    Real-time speech-to-text with sentiment analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {currentCall?.transcript.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        No conversation data available
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                            AI
                          </div>
                          <div className="flex-1">
                            <div className="bg-blue-50 rounded-lg p-3">
                              <p className="text-sm">Hello! Thank you for taking my call. I'm an AI assistant from LeadFlow Marketing. How are you doing today?</p>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Just now • Confidence: 98%
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs font-medium">
                            C
                          </div>
                          <div className="flex-1">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-sm">Hi there. I'm doing well, thank you. What is this call about?</p>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              2 seconds ago • Confidence: 95% • Sentiment: Neutral
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Call Analytics</CardTitle>
                  <CardDescription>
                    Performance metrics and insights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Conversation Metrics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Talk Time Ratio</span>
                          <span className="text-sm font-medium">60% / 40%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Response Time</span>
                          <span className="text-sm font-medium">1.2s avg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Interruptions</span>
                          <span className="text-sm font-medium">2</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">AI Performance</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Response Accuracy</span>
                          <span className="text-sm font-medium">94%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Voice Quality</span>
                          <span className="text-sm font-medium">Excellent</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Latency</span>
                          <span className="text-sm font-medium">85ms</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Alerts Tab */}
            <TabsContent value="alerts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Security Alerts
                  </CardTitle>
                  <CardDescription>
                    Real-time threat notifications and warnings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {scamAlerts.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <Shield className="h-12 w-12 mx-auto mb-4 text-green-500" />
                        <p>No security alerts detected</p>
                        <p className="text-sm">All systems operating normally</p>
                      </div>
                    ) : (
                      scamAlerts.map((alert, index) => (
                        <Alert key={index} className="border-orange-200">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="flex items-center justify-between">
                              <span>{alert.message}</span>
                              <Badge variant="outline">{alert.severity}</Badge>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
