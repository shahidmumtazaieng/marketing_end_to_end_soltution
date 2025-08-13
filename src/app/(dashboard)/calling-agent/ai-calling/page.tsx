"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Phone, 
  PhoneCall, 
  Users, 
  TrendingUp, 
  Clock, 
  Mic, 
  MicOff,
  Play,
  Pause,
  Square,
  Settings,
  BarChart3,
  Brain,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

import { aiCallingAgentAPI, CallSession, CallAnalytics, SystemHealth, getCallStatusColor, getCallStatusIcon } from '@/lib/api/ai-calling-agent';
import { ApiKeyGuard } from '@/lib/middleware/apiKeyValidation';

export default function AICallingDashboard() {
  // State management
  const [activeSessions, setActiveSessions] = useState<CallSession[]>([]);
  const [analytics, setAnalytics] = useState<CallAnalytics | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');

  // Real-time updates
  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time updates
    const interval = setInterval(loadDashboardData, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all dashboard data in parallel
      const [sessionsResult, analyticsResult, healthResult] = await Promise.all([
        aiCallingAgentAPI.getActiveSessions(),
        aiCallingAgentAPI.getCallAnalytics(),
        aiCallingAgentAPI.healthCheck()
      ]);

      if (sessionsResult.success) {
        setActiveSessions(sessionsResult.data);
      }

      if (analyticsResult.success) {
        setAnalytics(analyticsResult.data);
      }

      if (healthResult.success) {
        setSystemHealth(healthResult.data);
      }

      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEndCall = async (callId: string) => {
    try {
      const result = await aiCallingAgentAPI.endCall(callId);
      if (result.success) {
        // Refresh active sessions
        loadDashboardData();
      } else {
        setError(result.error || 'Failed to end call');
      }
    } catch (err) {
      setError('Failed to end call');
      console.error('End call error:', err);
    }
  };

  const getSystemStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'unhealthy': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSystemStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'degraded': return <AlertCircle className="h-4 w-4" />;
      case 'unhealthy': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI Calling Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <ApiKeyGuard serviceType="ai-calling">
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            AI Calling Agent
          </h1>
          <p className="text-gray-600 mt-1">Real-time conversational AI calling system</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* System Health Indicator */}
          {systemHealth && (
            <div className={`flex items-center gap-2 ${getSystemStatusColor(systemHealth.status)}`}>
              {getSystemStatusIcon(systemHealth.status)}
              <span className="text-sm font-medium capitalize">{systemHealth.status}</span>
            </div>
          )}
          
          <Button onClick={loadDashboardData} variant="outline" size="sm">
            <Zap className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Calls</CardTitle>
            <PhoneCall className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSessions.length}</div>
            <p className="text-xs text-muted-foreground">
              Real-time conversations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics ? `${analytics.success_rate.toFixed(1)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              Call completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics ? analytics.total_calls : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              All time calls
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics ? `${Math.round(analytics.average_duration)}s` : '0s'}
            </div>
            <p className="text-xs text-muted-foreground">
              Average call length
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="active-calls">Active Calls</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Call Activity</CardTitle>
                <CardDescription>Latest AI conversation calls</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeSessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-lg">{getCallStatusIcon(session.status)}</div>
                        <div>
                          <p className="font-medium">{session.phone_number}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(session.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={getCallStatusColor(session.status)}>
                        {session.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                  
                  {activeSessions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <PhoneCall className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No active calls</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* System Performance */}
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>AI calling agent health metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {systemHealth && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Status</span>
                      <Badge variant={systemHealth.status === 'healthy' ? 'default' : 'destructive'}>
                        {systemHealth.status}
                      </Badge>
                    </div>
                    
                    {Object.entries(systemHealth.services || {}).map(([service, status]) => (
                      <div key={service} className="flex items-center justify-between">
                        <span className="text-sm">{service.replace('_', ' ')}</span>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            status.status === 'healthy' ? 'bg-green-500' : 
                            status.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <span className="text-xs text-gray-600">{status.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Active Calls Tab */}
        <TabsContent value="active-calls" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active AI Conversations</CardTitle>
              <CardDescription>Real-time call monitoring and control</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeSessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{getCallStatusIcon(session.status)}</div>
                        <div>
                          <h3 className="font-semibold">{session.phone_number}</h3>
                          <p className="text-sm text-gray-600">Call ID: {session.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getCallStatusColor(session.status)}>
                          {session.status.replace('_', ' ')}
                        </Badge>
                        
                        {session.status === 'in_progress' && (
                          <Button 
                            onClick={() => handleEndCall(session.id)}
                            variant="destructive" 
                            size="sm"
                          >
                            <Square className="h-4 w-4 mr-2" />
                            End Call
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Call Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Duration</p>
                        <p className="font-medium">
                          {session.duration ? `${session.duration}s` : 'In progress...'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Voice Type</p>
                        <p className="font-medium">{session.voice_config.voice_type}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Language</p>
                        <p className="font-medium">{session.voice_config.language}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Started</p>
                        <p className="font-medium">
                          {new Date(session.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    
                    {/* Conversation State */}
                    {session.conversation_context && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Conversation State</span>
                          <Badge variant="secondary">
                            {session.conversation_context.conversation_state}
                          </Badge>
                        </div>
                        
                        {session.conversation_context.current_intent && (
                          <div className="mt-2">
                            <span className="text-xs text-gray-600">Current Intent: </span>
                            <span className="text-xs font-medium">
                              {session.conversation_context.current_intent}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                
                {activeSessions.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <PhoneCall className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No Active Calls</h3>
                    <p>Start a new AI conversation from the Call Lists section</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Call Outcomes</CardTitle>
                <CardDescription>Distribution of call results</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics && analytics.top_outcomes.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.top_outcomes.map((outcome, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{outcome.outcome}</span>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={(outcome.count / analytics.total_calls) * 100} 
                            className="w-20" 
                          />
                          <span className="text-sm font-medium">{outcome.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No analytics data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics ? (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm">Success Rate</span>
                      <span className="font-medium">{analytics.success_rate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total Cost</span>
                      <span className="font-medium">${analytics.total_cost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Scam Detection Rate</span>
                      <span className="font-medium">{analytics.scam_detection_rate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Failed Calls</span>
                      <span className="font-medium">{analytics.failed_calls}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Loading analytics...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>AI calling agent service status</CardDescription>
            </CardHeader>
            <CardContent>
              {systemHealth ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Service</p>
                      <p className="font-medium">{systemHealth.service}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Version</p>
                      <p className="font-medium">{systemHealth.version}</p>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Service Components</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(systemHealth.services || {}).map(([service, status]) => (
                        <div key={service} className="flex items-center justify-between p-3 border rounded-lg">
                          <span className="text-sm font-medium">{service.replace('_', ' ')}</span>
                          <div className="flex items-center gap-2">
                            {getSystemStatusIcon(status.status)}
                            <span className={`text-sm ${getSystemStatusColor(status.status)}`}>
                              {status.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Loading system status...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </ApiKeyGuard>
  );
}
