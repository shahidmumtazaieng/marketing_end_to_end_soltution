"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Brain, 
  Mic,
  Edit,
  Trash2,
  PhoneCall,
  AlertCircle,
  CheckCircle,
  Loader2,
  Filter,
  Download,
  Upload
} from 'lucide-react';

import { aiCallingAgentAPI, Customer, formatPhoneNumber, validatePhoneNumber } from '@/lib/api/ai-calling-agent';
import CustomerAICallingPanel from '@/components/ai-calling/CustomerAICallingPanel';

export default function AICallingCustomersPage() {
  // State management
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'do_not_call'>('all');

  // Load customers on mount
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const result = await aiCallingAgentAPI.getCustomers();
      
      if (result.success) {
        setCustomers(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to load customers');
      }
    } catch (err) {
      setError('Failed to load customers');
      console.error('Load customers error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerUpdate = (updatedCustomer: Customer) => {
    setCustomers(prev => 
      prev.map(customer => 
        customer.id === updatedCustomer.id ? updatedCustomer : customer
      )
    );
    setSelectedCustomer(updatedCustomer);
  };

  const handleCustomerCreate = (newCustomer: Customer) => {
    setCustomers(prev => [newCustomer, ...prev]);
    setIsCreateDialogOpen(false);
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) {
      return;
    }

    try {
      // Mock deletion - in production, this would call the API
      setCustomers(prev => prev.filter(c => c.id !== customerId));
      if (selectedCustomer?.id === customerId) {
        setSelectedCustomer(null);
      }
    } catch (err) {
      setError('Failed to delete customer');
      console.error('Delete customer error:', err);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone_number.includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.company?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'available' && !customer.do_not_call) ||
      (filterStatus === 'do_not_call' && customer.do_not_call);

    return matchesSearch && matchesFilter;
  });

  const getCustomerStatusColor = (customer: Customer) => {
    if (customer.do_not_call) return 'text-red-600';
    if (customer.call_count > 0) return 'text-green-600';
    return 'text-gray-600';
  };

  const getCustomerStatusIcon = (customer: Customer) => {
    if (customer.do_not_call) return '🚫';
    if (customer.call_count > 0) return '📞';
    return '👤';
  };

  // If a customer is selected, show the AI calling panel
  if (selectedCustomer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            onClick={() => setSelectedCustomer(null)} 
            variant="outline"
          >
            ← Back to Customers
          </Button>
        </div>
        
        <CustomerAICallingPanel 
          customerId={selectedCustomer.id}
          onCustomerUpdate={handleCustomerUpdate}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            AI Calling Customers
          </h1>
          <p className="text-gray-600">
            Manage customers for AI-powered calling campaigns
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Create New Customer</DialogTitle>
                <DialogDescription>
                  Add a new customer for AI calling campaigns
                </DialogDescription>
              </DialogHeader>
              <CustomerAICallingPanel onCustomerUpdate={handleCustomerCreate} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters and Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customers..."
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('all')}
          >
            All ({customers.length})
          </Button>
          <Button
            variant={filterStatus === 'available' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('available')}
          >
            Available ({customers.filter(c => !c.do_not_call).length})
          </Button>
          <Button
            variant={filterStatus === 'do_not_call' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('do_not_call')}
          >
            Do Not Call ({customers.filter(c => c.do_not_call).length})
          </Button>
        </div>
      </div>

      {/* Customers Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading customers...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <Card 
              key={customer.id} 
              className="cursor-pointer transition-all hover:shadow-md"
              onClick={() => setSelectedCustomer(customer)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="text-lg">{getCustomerStatusIcon(customer)}</span>
                      {customer.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {customer.company || 'No company'}
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCustomer(customer);
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomer(customer.id);
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Contact Information */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3 w-3" />
                      <span>{formatPhoneNumber(customer.phone_number)}</span>
                    </div>
                    {customer.email && (
                      <div className="text-sm text-gray-600">
                        {customer.email}
                      </div>
                    )}
                  </div>
                  
                  {/* Call Statistics */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Total Calls:</span>
                      <span className="ml-1 font-medium">{customer.call_count}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Successful:</span>
                      <span className="ml-1 font-medium">{customer.successful_calls}</span>
                    </div>
                  </div>
                  
                  {/* Tags */}
                  {customer.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {customer.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {customer.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{customer.tags.length - 2} more
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {/* Status and Actions */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <Badge variant={customer.do_not_call ? "destructive" : "default"}>
                      {customer.do_not_call ? 'Do Not Call' : 'Available'}
                    </Badge>
                    
                    {!customer.do_not_call && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomer(customer);
                        }}
                        size="sm"
                        variant="outline"
                      >
                        <PhoneCall className="h-3 w-3 mr-1" />
                        Call
                      </Button>
                    )}
                  </div>
                  
                  {/* Last Called */}
                  {customer.last_called && (
                    <div className="text-xs text-gray-500">
                      Last called: {new Date(customer.last_called).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">
            {searchTerm || filterStatus !== 'all' ? 'No customers found' : 'No customers yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterStatus !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Add your first customer to start AI calling campaigns'
            }
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
