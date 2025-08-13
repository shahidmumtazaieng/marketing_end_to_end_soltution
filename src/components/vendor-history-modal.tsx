'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Star, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Activity,
  Calendar,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { VendorPerformanceMetrics } from '@/lib/services/vendorPerformanceAnalyticsService';

interface VendorHistoryModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId: string;
  vendorName: string;
  userId: string;
}

export function VendorHistoryModal({
  isOpen,
  onOpenChange,
  vendorId,
  vendorName,
  userId,
}: VendorHistoryModalProps) {
  const { toast } = useToast();
  
  // State management
  const [analytics, setAnalytics] = useState<VendorPerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  // Load vendor analytics when modal opens
  useEffect(() => {
    if (isOpen && vendorId) {
      loadVendorAnalytics();
    }
  }, [isOpen, vendorId]);

  // Load vendor performance analytics
  const loadVendorAnalytics = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/vendor-analytics/${vendorId}?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setAnalytics(result.data);
        console.log('✅ Vendor analytics loaded successfully');
      } else {
        throw new Error(result.message || 'Failed to load vendor analytics');
      }
    } catch (error) {
      console.error('Error loading vendor analytics:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load vendor analytics. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'on_way':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {vendorName} - Performance Analytics
          </DialogTitle>
          <DialogDescription>
            Comprehensive performance analytics and order history
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading vendor analytics...</span>
            </div>
          </div>
        ) : analytics ? (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="orders">Recent Orders</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Vendor Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Vendor Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{analytics.vendor_email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{analytics.vendor_phone}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Active {analytics.active_days} days this month</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Rank #{analytics.overall_rank} overall</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Key Metrics */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(analytics.total_revenue)}</div>
                    <p className="text-xs text-muted-foreground">
                      {analytics.revenue_growth >= 0 ? '+' : ''}{analytics.revenue_growth.toFixed(1)}% from last month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.total_orders}</div>
                    <p className="text-xs text-muted-foreground">
                      {analytics.completed_orders} completed, {analytics.pending_orders} pending
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatPercentage(analytics.completion_rate)}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatPercentage(analytics.acceptance_rate)} acceptance rate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.average_rating.toFixed(1)}</div>
                    <p className="text-xs text-muted-foreground">
                      From {analytics.total_reviews} reviews
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Service Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Service Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.service_breakdown.map((service, index) => (
                      <div key={service.service_type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{service.service_type}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{service.orders} orders</div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(service.revenue)} • ⭐ {service.avg_rating.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Response & Completion Times
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Average Response Time</span>
                        <span className="text-sm">{analytics.average_response_time.toFixed(0)} minutes</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min((60 - analytics.average_response_time) / 60 * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Average Completion Time</span>
                        <span className="text-sm">{analytics.average_completion_time.toFixed(1)} hours</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${Math.min((24 - analytics.average_completion_time) / 24 * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">On-Time Delivery Rate</span>
                        <span className="text-sm">{formatPercentage(analytics.on_time_delivery_rate)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: `${analytics.on_time_delivery_rate}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Customer Satisfaction
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-yellow-500">
                        {analytics.average_rating.toFixed(1)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Average Rating
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Reviews</span>
                        <span className="text-sm font-medium">{analytics.total_reviews}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Satisfaction Trend</span>
                        <span className={`text-sm font-medium ${analytics.customer_satisfaction_trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {analytics.customer_satisfaction_trend >= 0 ? '+' : ''}{analytics.customer_satisfaction_trend.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Utilization Rate</span>
                        <span className="text-sm font-medium">{formatPercentage(analytics.utilization_rate)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Performance Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.monthly_performance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="orders"
                        stroke="#8884d8"
                        strokeWidth={2}
                        name="Orders"
                      />
                      <Line
                        type="monotone"
                        dataKey="rating"
                        stroke="#82ca9d"
                        strokeWidth={2}
                        name="Rating"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Recent Orders Tab */}
            <TabsContent value="orders" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.recent_orders.map((order) => (
                      <div key={order.order_id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="font-medium">{order.order_id}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.customer_name} • {order.service_type}
                          </div>
                          {order.completed_at && (
                            <div className="text-xs text-muted-foreground">
                              Completed: {formatDate(order.completed_at)}
                            </div>
                          )}
                        </div>
                        <div className="text-right space-y-1">
                          <div className="font-medium">{formatCurrency(order.amount)}</div>
                          <Badge className={getStatusBadgeColor(order.status)}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                          {order.rating && (
                            <div className="text-xs text-yellow-500">
                              ⭐ {order.rating.toFixed(1)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No analytics data available for this vendor.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
