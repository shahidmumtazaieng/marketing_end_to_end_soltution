"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Brain, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  FileText, 
  Upload, 
  Download,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2,
  BookOpen,
  Database,
  Tag,
  Clock
} from 'lucide-react';

import { KnowledgeBase } from '@/lib/api/ai-calling-agent';

interface KnowledgeBaseManagerProps {
  onKnowledgeBaseSelect?: (knowledgeBase: KnowledgeBase) => void;
  selectedKnowledgeBaseId?: string;
}

export default function KnowledgeBaseManager({ 
  onKnowledgeBaseSelect, 
  selectedKnowledgeBaseId 
}: KnowledgeBaseManagerProps) {
  // State management
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingKB, setEditingKB] = useState<KnowledgeBase | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    tags: [] as string[],
    is_active: true
  });
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);

  // Load knowledge bases on mount
  useEffect(() => {
    loadKnowledgeBases();
  }, []);

  const loadKnowledgeBases = async () => {
    try {
      setLoading(true);
      
      // Mock data - in production, this would fetch from the API
      const mockKnowledgeBases: KnowledgeBase[] = [
        {
          id: 'kb_1',
          name: 'Product Information',
          description: 'Comprehensive product details and specifications',
          content: 'Our marketing platform offers advanced lead generation, AI-powered calling agents, and comprehensive analytics...',
          tags: ['products', 'features', 'pricing'],
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-20T15:30:00Z',
          user_id: 'user_1',
          is_active: true
        },
        {
          id: 'kb_2',
          name: 'Sales Objection Handling',
          description: 'Common objections and proven responses',
          content: 'When customers say "too expensive": Acknowledge their concern and focus on ROI. When they say "not interested": Ask qualifying questions...',
          tags: ['sales', 'objections', 'responses'],
          created_at: '2024-01-10T09:00:00Z',
          updated_at: '2024-01-18T11:45:00Z',
          user_id: 'user_1',
          is_active: true
        },
        {
          id: 'kb_3',
          name: 'Company Information',
          description: 'About our company, mission, and values',
          content: 'LeadFlow Marketing was founded in 2020 with the mission to revolutionize digital marketing through AI...',
          tags: ['company', 'about', 'mission'],
          created_at: '2024-01-05T14:00:00Z',
          updated_at: '2024-01-12T16:20:00Z',
          user_id: 'user_1',
          is_active: true
        }
      ];
      
      setKnowledgeBases(mockKnowledgeBases);
      setError(null);
    } catch (err) {
      setError('Failed to load knowledge bases');
      console.error('Load knowledge bases error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKnowledgeBase = async () => {
    try {
      setSaving(true);
      
      // Mock creation - in production, this would call the API
      const newKB: KnowledgeBase = {
        id: `kb_${Date.now()}`,
        name: formData.name,
        description: formData.description,
        content: formData.content,
        tags: formData.tags,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'user_1',
        is_active: formData.is_active
      };
      
      setKnowledgeBases(prev => [newKB, ...prev]);
      setIsCreateDialogOpen(false);
      resetForm();
      setError(null);
    } catch (err) {
      setError('Failed to create knowledge base');
      console.error('Create knowledge base error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateKnowledgeBase = async () => {
    if (!editingKB) return;
    
    try {
      setSaving(true);
      
      // Mock update - in production, this would call the API
      const updatedKB: KnowledgeBase = {
        ...editingKB,
        name: formData.name,
        description: formData.description,
        content: formData.content,
        tags: formData.tags,
        is_active: formData.is_active,
        updated_at: new Date().toISOString()
      };
      
      setKnowledgeBases(prev => 
        prev.map(kb => kb.id === editingKB.id ? updatedKB : kb)
      );
      setEditingKB(null);
      resetForm();
      setError(null);
    } catch (err) {
      setError('Failed to update knowledge base');
      console.error('Update knowledge base error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKnowledgeBase = async (id: string) => {
    if (!confirm('Are you sure you want to delete this knowledge base?')) {
      return;
    }
    
    try {
      // Mock deletion - in production, this would call the API
      setKnowledgeBases(prev => prev.filter(kb => kb.id !== id));
      setError(null);
    } catch (err) {
      setError('Failed to delete knowledge base');
      console.error('Delete knowledge base error:', err);
    }
  };

  const handleSelectKnowledgeBase = (kb: KnowledgeBase) => {
    if (onKnowledgeBaseSelect) {
      onKnowledgeBaseSelect(kb);
    }
  };

  const handleEditKnowledgeBase = (kb: KnowledgeBase) => {
    setEditingKB(kb);
    setFormData({
      name: kb.name,
      description: kb.description,
      content: kb.content,
      tags: kb.tags,
      is_active: kb.is_active
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      content: '',
      tags: [],
      is_active: true
    });
    setNewTag('');
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const filteredKnowledgeBases = knowledgeBases.filter(kb =>
    kb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kb.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kb.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const KnowledgeBaseForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="kb-name">Name *</Label>
        <Input
          id="kb-name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter knowledge base name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="kb-description">Description</Label>
        <Input
          id="kb-description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Brief description of the knowledge base"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="kb-content">Content *</Label>
        <Textarea
          id="kb-content"
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          placeholder="Enter the knowledge base content that the AI will use to answer questions..."
          rows={8}
          className="resize-none"
        />
        <p className="text-xs text-gray-600">
          This content will be used by the AI to answer customer questions during calls.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add a tag"
            onKeyPress={(e) => e.key === 'Enter' && addTag()}
          />
          <Button onClick={addTag} variant="outline" size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="cursor-pointer">
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-red-600"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button 
          onClick={() => {
            setIsCreateDialogOpen(false);
            setEditingKB(null);
            resetForm();
          }}
          variant="outline"
          disabled={saving}
        >
          Cancel
        </Button>
        <Button 
          onClick={editingKB ? handleUpdateKnowledgeBase : handleCreateKnowledgeBase}
          disabled={saving || !formData.name.trim() || !formData.content.trim()}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          {editingKB ? 'Update' : 'Create'} Knowledge Base
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading knowledge bases...</p>
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
            <Brain className="h-5 w-5" />
            Knowledge Base Management
          </h3>
          <p className="text-sm text-gray-600">
            Manage AI knowledge bases for enhanced conversation capabilities
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Knowledge Base
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Knowledge Base</DialogTitle>
              <DialogDescription>
                Create a knowledge base to enhance AI conversation capabilities
              </DialogDescription>
            </DialogHeader>
            <KnowledgeBaseForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search knowledge bases..."
            className="pl-10"
          />
        </div>
        
        <Badge variant="secondary">
          {filteredKnowledgeBases.length} knowledge bases
        </Badge>
      </div>

      {/* Knowledge Bases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredKnowledgeBases.map((kb) => (
          <Card 
            key={kb.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedKnowledgeBaseId === kb.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => handleSelectKnowledgeBase(kb)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    {kb.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {kb.description || 'No description'}
                  </CardDescription>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditKnowledgeBase(kb);
                    }}
                    variant="ghost"
                    size="sm"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteKnowledgeBase(kb.id);
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
                {/* Content Preview */}
                <div className="text-sm text-gray-600">
                  <p className="line-clamp-3">
                    {kb.content.substring(0, 150)}
                    {kb.content.length > 150 ? '...' : ''}
                  </p>
                </div>
                
                {/* Tags */}
                {kb.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {kb.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {kb.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{kb.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
                
                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(kb.updated_at).toLocaleDateString()}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={kb.is_active ? "default" : "secondary"} className="text-xs">
                      {kb.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    
                    {selectedKnowledgeBaseId === kb.id && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredKnowledgeBases.length === 0 && (
        <div className="text-center py-12">
          <Database className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">
            {searchTerm ? 'No knowledge bases found' : 'No knowledge bases yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'Create your first knowledge base to enhance AI conversations'
            }
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Knowledge Base
            </Button>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingKB} onOpenChange={(open) => !open && setEditingKB(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Knowledge Base</DialogTitle>
            <DialogDescription>
              Update knowledge base content and settings
            </DialogDescription>
          </DialogHeader>
          <KnowledgeBaseForm />
        </DialogContent>
      </Dialog>
    </div>
  );
}
