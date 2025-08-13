'use client';

import {
  DollarSign,
  Phone,
  Users,
  TrendingUp,
  Loader2,
  Activity,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Line,
  LineChart,
  Tooltip,
} from 'recharts';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/date-range-picker';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { DashboardMetrics } from '@/lib/services/dashboardAnalyticsService';

export default function Dashboard() {
  const { toast } = useToast();

  // State management
  const [analytics, setAnalytics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock user ID - in real app, get from auth context
  const userId = 'user-123';

  // Load analytics on component mount
  useEffect(() => {
    loadDashboardAnalytics();
  }, []);

  // Load real analytics data
  const loadDashboardAnalytics = async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/dashboard-analytics?user_id=${userId}`, {
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
        console.log('✅ Dashboard analytics loaded successfully');
      } else {
        throw new Error(result.message || 'Failed to load analytics');
      }
    } catch (error) {
      console.error('Error loading dashboard analytics:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load dashboard analytics. Please try again.',
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
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">
              Welcome Back!
            </h1>
            <p className="text-muted-foreground">
              Loading your business analytics...
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading dashboard analytics...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            Welcome Back!
          </h1>
          <p className="text-muted-foreground">
            Here's a summary of your business activities.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DatePickerWithRange />
          <Button className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold hover:opacity-90 transition-opacity">
            Download
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={analytics ? formatCurrency(analytics.total_revenue) : '$0.00'}
          helperText={analytics ? `${formatPercentage(analytics.revenue_growth)} from last month` : 'Loading...'}
          icon={DollarSign}
        />
        <StatCard
          title="Total Orders"
          value={analytics ? analytics.total_orders.toString() : '0'}
          helperText={analytics ? `${formatPercentage(analytics.orders_growth)} from last month` : 'Loading...'}
          icon={Users}
        />
        <StatCard
          title="Active Orders"
          value={analytics ? analytics.active_orders.toString() : '0'}
          helperText={analytics ? `${analytics.completed_orders} completed` : 'Loading...'}
          icon={Activity}
        />
        <StatCard
          title="Vendor Utilization"
          value={analytics ? `${analytics.vendor_utilization.toFixed(1)}%` : '0%'}
          helperText={analytics ? `${formatPercentage(analytics.vendor_growth)} vendor growth` : 'Loading...'}
          icon={TrendingUp}
        />
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics?.revenue_chart || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                  activeDot={{ r: 8, fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Vendor Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  cursor={{ fill: 'hsla(var(--muted), 0.5)' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                  }}
                />
                <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
                  {performanceData.map((entry, index) => (
                    <rect key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
