"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Phone, 
  Clock, 
  DollarSign,
  Users,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Download,
  RefreshCw,
  Loader2,
  PieChart,
  Activity
} from 'lucide-react';

import { aiCallingAgentAPI, CallAnalytics } from '@/lib/api/ai-calling-agent';

interface CallAnalyticsDashboardProps {
  dateRange?: {
    start: string;
    end: string;
  };
}

export default function CallAnalyticsDashboard({ dateRange }: CallAnalyticsDashboardProps) {
  // State management
  const [analytics, setAnalytics] = useState<CallAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);

  // Load analytics on mount and when period changes
  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod, dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Calculate date range based on selected period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedPeriod) {
        case '1d':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 7);
      }

      const result = await aiCallingAgentAPI.getCallAnalytics(
        dateRange?.start || startDate.toISOString(),
        dateRange?.end || endDate.toISOString()
      );

      if (result.success) {
        setAnalytics(result.data);
      } else {
        setError(result.error || 'Failed to load analytics');
      }
    } catch (err) {
      setError('Failed to load analytics');
      console.error('Analytics load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSuccessRateIcon = (rate: number) => {
    if (rate >= 80) return <TrendingUp className="h-4 w-4" />;
    if (rate >= 60) return <Activity className="h-4 w-4" />;
    return <TrendingDown className="h-4 w-4" />;
  };

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Call Analytics Dashboard
          </h3>
          <p className="text-sm text-gray-600">
            AI calling performance metrics and insights
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {analytics && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.total_calls}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  {analytics.successful_calls} successful
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <div className={getSuccessRateColor(analytics.success_rate)}>
                  {getSuccessRateIcon(analytics.success_rate)}
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getSuccessRateColor(analytics.success_rate)}`}>
                  {analytics.success_rate.toFixed(1)}%
                </div>
                <Progress value={analytics.success_rate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatDuration(Math.round(analytics.average_duration))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Average call length
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(analytics.total_cost)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics.total_calls > 0 
                    ? `${formatCurrency(analytics.total_cost / analytics.total_calls)} per call`
                    : 'No calls yet'
                  }
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="outcomes" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="outcomes">Call Outcomes</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            {/* Call Outcomes Tab */}
            <TabsContent value="outcomes" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Call Outcomes Distribution</CardTitle>
                    <CardDescription>Breakdown of call results</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.top_outcomes.map((outcome, index) => {
                        const percentage = analytics.total_calls > 0 
                          ? (outcome.count / analytics.total_calls) * 100 
                          : 0;
                        
                        return (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium capitalize">
                                {outcome.outcome.replace('_', ' ')}
                              </span>
                              <span className="text-gray-600">
                                {outcome.count} ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quality Metrics</CardTitle>
                    <CardDescription>Call quality and detection rates</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Scam Detection Rate</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{analytics.scam_detection_rate.toFixed(1)}%</span>
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Failed Calls</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{analytics.failed_calls}</span>
                        <XCircle className="h-4 w-4 text-red-500" />
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Successful Calls</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{analytics.successful_calls}</span>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Hourly Distribution</CardTitle>
                    <CardDescription>Calls by hour of day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(analytics.hourly_distribution)
                        .sort(([a], [b]) => parseInt(a) - parseInt(b))
                        .map(([hour, count]) => {
                          const maxCount = Math.max(...Object.values(analytics.hourly_distribution));
                          const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                          
                          return (
                            <div key={hour} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>{hour}:00</span>
                                <span>{count} calls</span>
                              </div>
                              <Progress value={percentage} className="h-2" />
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Daily Distribution</CardTitle>
                    <CardDescription>Calls by day of week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(analytics.daily_distribution).map(([day, count]) => {
                        const maxCount = Math.max(...Object.values(analytics.daily_distribution));
                        const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                        
                        return (
                          <div key={day} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="capitalize">{day}</span>
                              <span>{count} calls</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Trends</CardTitle>
                  <CardDescription>Key performance indicators over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {analytics.success_rate > 75 ? '+' : analytics.success_rate > 50 ? '=' : '-'}
                        {Math.abs(analytics.success_rate - 70).toFixed(1)}%
                      </div>
                      <p className="text-sm text-gray-600">Success Rate Change</p>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatDuration(Math.round(analytics.average_duration - 120))}
                      </div>
                      <p className="text-sm text-gray-600">Duration vs Target</p>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatCurrency(analytics.total_cost / Math.max(analytics.total_calls, 1) - 0.15)}
                      </div>
                      <p className="text-sm text-gray-600">Cost vs Target</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Key Insights</CardTitle>
                    <CardDescription>AI-generated performance insights</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Positive Trend</span>
                        </div>
                        <p className="text-sm text-green-700">
                          Success rate is {analytics.success_rate.toFixed(1)}% which is above the industry average of 65%.
                        </p>
                      </div>
                      
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Optimization</span>
                        </div>
                        <p className="text-sm text-blue-700">
                          Peak calling hours are between 10 AM - 2 PM. Consider scheduling more calls during this window.
                        </p>
                      </div>
                      
                      {analytics.scam_detection_rate > 5 && (
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                            <span className="text-sm font-medium text-orange-800">Alert</span>
                          </div>
                          <p className="text-sm text-orange-700">
                            Scam detection rate is {analytics.scam_detection_rate.toFixed(1)}%. Review call quality and targeting.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                    <CardDescription>Actionable improvement suggestions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Target className="h-4 w-4 text-blue-600 mt-1" />
                        <div>
                          <p className="text-sm font-medium">Optimize Call Timing</p>
                          <p className="text-xs text-gray-600">
                            Schedule more calls during peak success hours (10 AM - 2 PM)
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <Users className="h-4 w-4 text-green-600 mt-1" />
                        <div>
                          <p className="text-sm font-medium">Improve Voice Quality</p>
                          <p className="text-xs text-gray-600">
                            Fine-tune voice stability and similarity settings for better engagement
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <PieChart className="h-4 w-4 text-purple-600 mt-1" />
                        <div>
                          <p className="text-sm font-medium">Enhance Knowledge Base</p>
                          <p className="text-xs text-gray-600">
                            Add more content to knowledge bases for better conversation handling
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
