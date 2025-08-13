"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Phone, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  Clock,
  User,
  Building,
  MapPin,
  Mail,
  Globe,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Star,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  FileText,
  BarChart3,
  Users,
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface CallConversation {
  id: string;
  call_id: string;
  phone_number: string;
  call_type: 'elevenlabs_agent' | 'ai_cloned_voice';
  started_at: string;
  ended_at?: string;
  duration?: number;
  status: 'active' | 'completed' | 'failed' | 'cancelled';
  
  // Business information
  business_name?: string;
  contact_name?: string;
  owner_name?: string;
  location?: string;
  industry?: string;
  email?: string;
  website?: string;
  
  // Analysis results
  conversation_summary?: string;
  lead_status: 'new' | 'interested' | 'not_interested' | 'callback' | 'converted' | 'do_not_call';
  lead_score: number;
  sentiment_score: number;
  engagement_level: number;
  
  // User management
  user_comments?: string;
  follow_up_date?: string;
  priority_level: number;
  
  created_at: string;
  updated_at: string;
}

interface CallTrackingStats {
  total_calls: number;
  completed_calls: number;
  success_rate: number;
  avg_duration: number;
  avg_lead_score: number;
  conversion_rate: number;
  top_outcomes: Array<{ outcome: string; count: number; percentage: number }>;
}

export default function CallTrackingPage() {
  // State management
  const [conversations, setConversations] = useState<CallConversation[]>([]);
  const [stats, setStats] = useState<CallTrackingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<CallConversation | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [callTypeFilter, setCallTypeFilter] = useState<string>('all');
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState('started_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Comments and updates
  const [editingComments, setEditingComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [updatingLeadStatus, setUpdatingLeadStatus] = useState<string | null>(null);

  // Load conversations on mount and when filters change
  useEffect(() => {
    loadConversations();
  }, [searchTerm, dateFrom, dateTo, callTypeFilter, leadStatusFilter, sortBy, sortOrder, currentPage]);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sort_by: sortBy,
        sort_order: sortOrder
      });

      if (searchTerm) params.append('search', searchTerm);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (callTypeFilter !== 'all') params.append('call_type', callTypeFilter);
      if (leadStatusFilter !== 'all') params.append('lead_status', leadStatusFilter);

      const response = await fetch(`/api/call-tracking/conversations?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load conversations');
      }

      const data = await response.json();
      if (data.success) {
        setConversations(data.conversations);
        setError(null);
      } else {
        setError(data.error || 'Failed to load conversations');
      }
    } catch (err) {
      setError('Failed to load conversations');
      console.error('Load conversations error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/call-tracking/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Load stats error:', err);
    }
  };

  const handleViewDetails = (conversation: CallConversation) => {
    setSelectedConversation(conversation);
    setIsDetailsDialogOpen(true);
  };

  const handleUpdateComments = async (conversationId: string, comments: string) => {
    try {
      const response = await fetch(`/api/call-tracking/conversations/${conversationId}/comments`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comments })
      });

      if (response.ok) {
        // Update local state
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversationId 
              ? { ...conv, user_comments: comments }
              : conv
          )
        );
        setEditingComments(null);
        setCommentText('');
      }
    } catch (err) {
      console.error('Update comments error:', err);
    }
  };

  const handleUpdateLeadStatus = async (conversationId: string, leadStatus: string) => {
    try {
      setUpdatingLeadStatus(conversationId);
      
      const response = await fetch(`/api/call-tracking/conversations/${conversationId}/lead-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lead_status: leadStatus })
      });

      if (response.ok) {
        // Update local state
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversationId 
              ? { ...conv, lead_status: leadStatus as any }
              : conv
          )
        );
      }
    } catch (err) {
      console.error('Update lead status error:', err);
    } finally {
      setUpdatingLeadStatus(null);
    }
  };

  const handleExportData = async (format: 'csv' | 'excel') => {
    try {
      const params = new URLSearchParams({
        format,
        search: searchTerm,
        date_from: dateFrom,
        date_to: dateTo,
        call_type: callTypeFilter,
        lead_status: leadStatusFilter
      });

      const response = await fetch(`/api/call-tracking/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `call-tracking-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const getLeadStatusColor = (status: string) => {
    switch (status) {
      case 'interested': return 'bg-green-100 text-green-800';
      case 'converted': return 'bg-blue-100 text-blue-800';
      case 'callback': return 'bg-yellow-100 text-yellow-800';
      case 'not_interested': return 'bg-red-100 text-red-800';
      case 'do_not_call': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeadStatusIcon = (status: string) => {
    switch (status) {
      case 'interested': return <TrendingUp className="h-3 w-3" />;
      case 'converted': return <CheckCircle className="h-3 w-3" />;
      case 'callback': return <Clock className="h-3 w-3" />;
      case 'not_interested': return <TrendingDown className="h-3 w-3" />;
      case 'do_not_call': return <XCircle className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'text-red-600';
    if (priority >= 3) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading call tracking data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Phone className="h-6 w-6" />
            Call Tracking & Lead Management
          </h1>
          <p className="text-gray-600">
            Track all conversations from both ElevenLabs and AI cloned voice calling systems
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => handleExportData('csv')}
            variant="outline" 
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button 
            onClick={() => handleExportData('excel')}
            variant="outline" 
            size="sm"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button 
            onClick={loadConversations}
            variant="outline" 
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
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

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_calls}</div>
              <p className="text-xs text-gray-600">
                {stats.completed_calls} completed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.success_rate}%</div>
              <p className="text-xs text-gray-600">
                Positive outcomes
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(stats.avg_duration)}</div>
              <p className="text-xs text-gray-600">
                Per conversation
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Lead Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avg_lead_score}/100</div>
              <p className="text-xs text-gray-600">
                Quality indicator
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Business name, phone, contact..."
                  className="pl-10"
                />
              </div>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <Label>Date From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label>Date To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            {/* Call Type */}
            <div className="space-y-2">
              <Label>Call Type</Label>
              <Select value={callTypeFilter} onValueChange={setCallTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="elevenlabs_agent">ElevenLabs Agent</SelectItem>
                  <SelectItem value="ai_cloned_voice">AI Cloned Voice</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lead Status */}
            <div className="space-y-2">
              <Label>Lead Status</Label>
              <Select value={leadStatusFilter} onValueChange={setLeadStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="interested">Interested</SelectItem>
                  <SelectItem value="not_interested">Not Interested</SelectItem>
                  <SelectItem value="callback">Callback</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="do_not_call">Do Not Call</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="started_at">Date</SelectItem>
                  <SelectItem value="lead_score">Lead Score</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                  <SelectItem value="business_name">Business Name</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <Label>Order</Label>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setDateFrom('');
                  setDateTo('');
                  setCallTypeFilter('all');
                  setLeadStatusFilter('all');
                  setSortBy('started_at');
                  setSortOrder('desc');
                  setCurrentPage(1);
                }}
                variant="outline"
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Call Conversations ({conversations.length})</span>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Date & Time</th>
                  <th className="text-left p-3">Business Info</th>
                  <th className="text-left p-3">Contact</th>
                  <th className="text-left p-3">Call Details</th>
                  <th className="text-left p-3">Lead Status</th>
                  <th className="text-left p-3">Score</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((conversation) => (
                  <tr key={conversation.id} className="border-b hover:bg-gray-50">
                    {/* Date & Time */}
                    <td className="p-3">
                      <div className="text-sm">
                        <div className="font-medium">
                          {formatDate(conversation.started_at)}
                        </div>
                        <div className="text-gray-600">
                          {formatDuration(conversation.duration)}
                        </div>
                      </div>
                    </td>

                    {/* Business Info */}
                    <td className="p-3">
                      <div className="text-sm">
                        <div className="font-medium flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {conversation.business_name || 'Unknown Business'}
                        </div>
                        <div className="text-gray-600 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {conversation.phone_number}
                        </div>
                        {conversation.location && (
                          <div className="text-gray-600 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {conversation.location}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="p-3">
                      <div className="text-sm">
                        {conversation.contact_name && (
                          <div className="font-medium flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {conversation.contact_name}
                          </div>
                        )}
                        {conversation.email && (
                          <div className="text-gray-600 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {conversation.email}
                          </div>
                        )}
                        {conversation.website && (
                          <div className="text-gray-600 flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {conversation.website}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Call Details */}
                    <td className="p-3">
                      <div className="text-sm space-y-1">
                        <Badge variant="outline" className="text-xs">
                          {conversation.call_type === 'elevenlabs_agent' ? 'ElevenLabs' : 'AI Cloned'}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span className={getPriorityColor(conversation.priority_level)}>
                            Priority {conversation.priority_level}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Lead Status */}
                    <td className="p-3">
                      <div className="space-y-1">
                        <Badge className={`text-xs ${getLeadStatusColor(conversation.lead_status)}`}>
                          <span className="flex items-center gap-1">
                            {getLeadStatusIcon(conversation.lead_status)}
                            {conversation.lead_status.replace('_', ' ')}
                          </span>
                        </Badge>
                        {updatingLeadStatus === conversation.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Select
                            value={conversation.lead_status}
                            onValueChange={(value) => handleUpdateLeadStatus(conversation.id, value)}
                          >
                            <SelectTrigger className="h-6 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="interested">Interested</SelectItem>
                              <SelectItem value="not_interested">Not Interested</SelectItem>
                              <SelectItem value="callback">Callback</SelectItem>
                              <SelectItem value="converted">Converted</SelectItem>
                              <SelectItem value="do_not_call">Do Not Call</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </td>

                    {/* Score */}
                    <td className="p-3">
                      <div className="text-sm">
                        <div className="font-medium">
                          {conversation.lead_score}/100
                        </div>
                        <div className="text-gray-600">
                          Sentiment: {(conversation.sentiment_score * 100).toFixed(0)}%
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Button
                          onClick={() => handleViewDetails(conversation)}
                          size="sm"
                          variant="outline"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingComments(conversation.id);
                            setCommentText(conversation.user_comments || '');
                          }}
                          size="sm"
                          variant="outline"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {conversations.length === 0 && !loading && (
            <div className="text-center py-8">
              <Phone className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No conversations found</h3>
              <p className="text-gray-600">
                {searchTerm || dateFrom || dateTo || callTypeFilter !== 'all' || leadStatusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Start making calls to see conversation tracking data here'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversation Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Call Conversation Details</DialogTitle>
            <DialogDescription>
              Complete conversation analysis and business information
            </DialogDescription>
          </DialogHeader>
          
          {selectedConversation && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Call Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div><strong>Date:</strong> {formatDate(selectedConversation.started_at)}</div>
                    <div><strong>Duration:</strong> {formatDuration(selectedConversation.duration)}</div>
                    <div><strong>Type:</strong> {selectedConversation.call_type}</div>
                    <div><strong>Phone:</strong> {selectedConversation.phone_number}</div>
                    <div><strong>Status:</strong> {selectedConversation.status}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Business Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div><strong>Business:</strong> {selectedConversation.business_name || 'N/A'}</div>
                    <div><strong>Contact:</strong> {selectedConversation.contact_name || 'N/A'}</div>
                    <div><strong>Location:</strong> {selectedConversation.location || 'N/A'}</div>
                    <div><strong>Email:</strong> {selectedConversation.email || 'N/A'}</div>
                    <div><strong>Website:</strong> {selectedConversation.website || 'N/A'}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Analysis Results */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Conversation Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold">{selectedConversation.lead_score}/100</div>
                      <div className="text-sm text-gray-600">Lead Score</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold">{(selectedConversation.sentiment_score * 100).toFixed(0)}%</div>
                      <div className="text-sm text-gray-600">Sentiment</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold">{(selectedConversation.engagement_level * 100).toFixed(0)}%</div>
                      <div className="text-sm text-gray-600">Engagement</div>
                    </div>
                  </div>

                  {selectedConversation.conversation_summary && (
                    <div>
                      <h4 className="font-medium mb-2">Conversation Summary</h4>
                      <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded-lg">
                        {selectedConversation.conversation_summary}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Comments Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Comments & Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  {editingComments === selectedConversation.id ? (
                    <div className="space-y-3">
                      <Textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add your comments and notes about this conversation..."
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleUpdateComments(selectedConversation.id, commentText)}
                          size="sm"
                        >
                          Save Comments
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingComments(null);
                            setCommentText('');
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {selectedConversation.user_comments ? (
                        <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded-lg mb-3">
                          {selectedConversation.user_comments}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 mb-3">No comments added yet.</p>
                      )}
                      <Button
                        onClick={() => {
                          setEditingComments(selectedConversation.id);
                          setCommentText(selectedConversation.user_comments || '');
                        }}
                        size="sm"
                        variant="outline"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit Comments
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Comments Edit Dialog */}
      <Dialog open={!!editingComments && editingComments !== selectedConversation?.id} onOpenChange={() => setEditingComments(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Comments</DialogTitle>
            <DialogDescription>
              Add or update your notes for this conversation
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add your comments and notes about this conversation..."
              rows={6}
            />
            
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setEditingComments(null);
                  setCommentText('');
                }}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingComments) {
                    handleUpdateComments(editingComments, commentText);
                  }
                }}
              >
                Save Comments
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
