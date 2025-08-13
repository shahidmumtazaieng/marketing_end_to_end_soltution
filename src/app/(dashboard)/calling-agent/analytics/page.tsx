
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Shield,
  Clock,
  Phone,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Brain,
  Zap
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Mock data for analytics
const callVolumeData = [
  { date: '2024-01-01', calls: 45, scams: 3, success: 38 },
  { date: '2024-01-02', calls: 52, scams: 5, success: 42 },
  { date: '2024-01-03', calls: 38, scams: 2, success: 33 },
  { date: '2024-01-04', calls: 61, scams: 7, success: 48 },
  { date: '2024-01-05', calls: 55, scams: 4, success: 46 },
  { date: '2024-01-06', calls: 48, scams: 6, success: 39 },
  { date: '2024-01-07', calls: 67, scams: 8, success: 52 }
];

const scamTypeData = [
  { name: 'Tech Support', value: 35, color: '#ef4444' },
  { name: 'Financial', value: 28, color: '#f97316' },
  { name: 'Authority Impersonation', value: 22, color: '#eab308' },
  { name: 'Prize Scam', value: 15, color: '#84cc16' }
];

const performanceMetrics = [
  { metric: 'Detection Accuracy', value: 95.2, change: +2.1, trend: 'up' },
  { metric: 'Response Time', value: 85, change: -5.2, trend: 'down', unit: 'ms' },
  { metric: 'Call Success Rate', value: 87.4, change: +1.8, trend: 'up' },
  { metric: 'Customer Satisfaction', value: 4.6, change: +0.3, trend: 'up', unit: '/5' }
];


export default function CallingAgentAnalytics() {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('calls');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Calling Agent Analytics</h1>
          <p className="text-muted-foreground">
            Performance insights and scam detection analytics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setTimeRange('24h')}>
            24h
          </Button>
          <Button variant="outline" size="sm" onClick={() => setTimeRange('7d')}>
            7d
          </Button>
          <Button variant="outline" size="sm" onClick={() => setTimeRange('30d')}>
            30d
          </Button>
        </div>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {performanceMetrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.metric}</CardTitle>
              {metric.trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metric.value}{metric.unit || '%'}
              </div>
              <p className={`text-xs ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {metric.change > 0 ? '+' : ''}{metric.change}% from last period
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="scam-detection">
            <Shield className="h-4 w-4 mr-2" />
            Scam Detection
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Activity className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Brain className="h-4 w-4 mr-2" />
            AI Insights
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Call Volume Trends</CardTitle>
                <CardDescription>
                  Daily call volume with success and scam detection rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={callVolumeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="calls"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="success"
                      stackId="2"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="scams"
                      stackId="3"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Call Outcomes</CardTitle>
                <CardDescription>
                  Distribution of call results over the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Successful Calls</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">342</div>
                      <div className="text-xs text-muted-foreground">87.4%</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm">Scams Detected</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">35</div>
                      <div className="text-xs text-muted-foreground">8.9%</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Incomplete</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">14</div>
                      <div className="text-xs text-muted-foreground">3.6%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Scam Detection Tab */}
        <TabsContent value="scam-detection" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  Scam Types Detected
                </CardTitle>
                <CardDescription>
                  Breakdown of different scam categories identified
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={scamTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {scamTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detection Accuracy</CardTitle>
                <CardDescription>
                  AI model performance metrics over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Accuracy</span>
                      <span className="text-2xl font-bold text-green-600">95.2%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '95.2%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">False Positive Rate</span>
                      <span className="text-2xl font-bold text-blue-600">2.1%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '2.1%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Response Time</span>
                      <span className="text-2xl font-bold text-purple-600">85ms</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Average detection latency
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Performance Metrics</CardTitle>
              <CardDescription>
                Real-time monitoring of all AI services and components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-4">
                  <h4 className="font-medium">ElevenLabs Voice Service</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Latency</span>
                      <Badge variant="secondary">45ms</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Uptime</span>
                      <Badge variant="secondary">99.9%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Quality Score</span>
                      <Badge variant="secondary">9.8/10</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Scam Detection Engine</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Processing Time</span>
                      <Badge variant="secondary">120ms</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Accuracy</span>
                      <Badge variant="secondary">95.2%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Patterns Loaded</span>
                      <Badge variant="secondary">1,247</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Voice Analysis</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Analysis Time</span>
                      <Badge variant="secondary">200ms</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Emotion Accuracy</span>
                      <Badge variant="secondary">88.5%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Stress Detection</span>
                      <Badge variant="secondary">92.1%</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-500" />
                AI-Generated Insights
              </CardTitle>
              <CardDescription>
                Automated analysis and recommendations from your calling data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-blue-50">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Peak Performance Hours</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Your calling agent performs best between 10 AM - 2 PM, with 94% success rate and lowest scam detection false positives.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-green-50">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">Security Improvement</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Scam detection accuracy improved by 2.1% this week. New pattern recognition for tech support scams is particularly effective.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-orange-50">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-orange-900">Optimization Opportunity</h4>
                      <p className="text-sm text-orange-700 mt-1">
                        Consider adjusting voice stability settings to 0.6 for better emotional expression during customer interactions.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-purple-50">
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-purple-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-purple-900">Performance Trend</h4>
                      <p className="text-sm text-purple-700 mt-1">
                        Response latency decreased by 15ms after recent optimizations. Customer satisfaction scores increased by 0.3 points.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
