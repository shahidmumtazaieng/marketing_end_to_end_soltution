'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Download, 
  Search, 
  Filter, 
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
  Loader2,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Types
interface CompletedOrder {
  id: string;
  order_id: string;
  vendor_name: string;
  vendor_id: string;
  customer_name: string;
  customer_email?: string;
  service_type: string;
  final_price: number;
  completed_at: string;
  invoice_number?: string;
  invoice_id?: string;
  invoice_status: 'draft' | 'sent' | 'paid' | 'overdue';
  pdf_url?: string;
}

interface BillingAnalytics {
  total_completed_orders: number;
  total_revenue: number;
  total_invoices_generated: number;
  pending_payments: number;
  average_order_value: number;
  top_performing_vendors: Array<{
    vendor_name: string;
    vendor_id: string;
    total_orders: number;
    total_revenue: number;
  }>;
  monthly_revenue: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
}

export default function BillingAnalyticsPage() {
  const { toast } = useToast();
  
  // State management
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);
  const [analytics, setAnalytics] = useState<BillingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Mock user ID - in real app, get from auth context
  const userId = 'user-123';

  // Load data on component mount
  useEffect(() => {
    loadBillingData();
  }, []);

  // Load billing analytics and completed orders
  const loadBillingData = async () => {
    try {
      setLoading(true);
      
      // Fetch completed orders with invoices
      const ordersResponse = await fetch(`/api/billing-analytics/orders?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!ordersResponse.ok) {
        throw new Error(`HTTP error! status: ${ordersResponse.status}`);
      }

      const ordersResult = await ordersResponse.json();

      if (ordersResult.success) {
        setCompletedOrders(ordersResult.data);
      }

      // Fetch billing analytics
      const analyticsResponse = await fetch(`/api/billing-analytics/summary?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!analyticsResponse.ok) {
        throw new Error(`HTTP error! status: ${analyticsResponse.status}`);
      }

      const analyticsResult = await analyticsResponse.json();

      if (analyticsResult.success) {
        setAnalytics(analyticsResult.data);
      }

      console.log('✅ Billing data loaded successfully');
    } catch (error) {
      console.error('Error loading billing data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load billing data. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Download invoice PDF
  const downloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/download`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: `Invoice ${invoiceNumber} downloaded successfully`,
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to download invoice. Please try again.',
      });
    }
  };

  // View invoice details
  const viewInvoiceDetails = (invoiceId: string) => {
    // This would open an invoice details modal or navigate to invoice page
    console.log('View invoice details:', invoiceId);
    toast({
      title: 'Invoice Details',
      description: 'Invoice details modal would open here',
    });
  };

  // Filter completed orders based on search and filters
  const filteredOrders = useMemo(() => {
    let filtered = completedOrders;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.service_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.invoice_number && order.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.invoice_status === statusFilter);
    }

    // Service type filter
    if (serviceTypeFilter !== 'all') {
      filtered = filtered.filter(order => order.service_type === serviceTypeFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      if (dateFilter !== 'all') {
        filtered = filtered.filter(order => 
          new Date(order.completed_at) >= filterDate
        );
      }
    }

    // Custom date range filter
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date

      filtered = filtered.filter(order => {
        const orderDate = new Date(order.completed_at);
        return orderDate >= start && orderDate <= end;
      });
    }

    return filtered;
  }, [completedOrders, searchTerm, statusFilter, serviceTypeFilter, dateFilter, startDate, endDate]);

  // Get unique service types for filter
  const serviceTypes = useMemo(() => {
    const types = [...new Set(completedOrders.map(order => order.service_type))];
    return types.sort();
  }, [completedOrders]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Billing Analytics</h1>
          <p className="text-muted-foreground">Track completed orders, invoices, and revenue analytics</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading billing analytics...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Billing Analytics</h1>
        <p className="text-muted-foreground">Track completed orders, invoices, and revenue analytics</p>
      </div>

      {/* Analytics Summary Cards */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.total_revenue)}</div>
              <p className="text-xs text-muted-foreground">
                From {analytics.total_completed_orders} completed orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Invoices Generated</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_invoices_generated}</div>
              <p className="text-xs text-muted-foreground">
                Automatic invoice generation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.average_order_value)}</div>
              <p className="text-xs text-muted-foreground">
                Per completed order
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.pending_payments)}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting payment
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Completed Orders & Invoices</CardTitle>
          <CardDescription>
            All completed orders from your registered vendors with invoice details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order ID, customer, vendor, service type, or invoice number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {/* Filters */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="quarter">Last Quarter</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Invoice Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Service Type</Label>
                <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All services" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    {serviceTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredOrders.length} of {completedOrders.length} completed orders
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setDateFilter('all');
                  setStatusFilter('all');
                  setServiceTypeFilter('all');
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No completed orders found</p>
                        <p className="text-sm text-muted-foreground">
                          Orders will appear here once vendors complete their work
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customer_name}</p>
                          {order.customer_email && (
                            <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <button
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                          onClick={() => {
                            // This will be implemented in the vendor history modal
                            console.log('Show vendor history:', order.vendor_id);
                          }}
                        >
                          {order.vendor_name}
                        </button>
                      </TableCell>
                      <TableCell>{order.service_type}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(order.final_price)}
                      </TableCell>
                      <TableCell>{formatDate(order.completed_at)}</TableCell>
                      <TableCell>
                        {order.invoice_number ? (
                          <span className="font-medium">{order.invoice_number}</span>
                        ) : (
                          <span className="text-muted-foreground">Not generated</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(order.invoice_status)}>
                          {order.invoice_status.charAt(0).toUpperCase() + order.invoice_status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {order.invoice_id && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => viewInvoiceDetails(order.invoice_id!)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadInvoice(order.invoice_id!, order.invoice_number!)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
