'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  Download, 
  Phone, 
  Users, 
  FileText, 
  Play,
  Pause,
  Square,
  Settings,
  Filter,
  Search,
  MapPin,
  Building2,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Database,
  Zap,
  Brain
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CallListContact {
  id: string;
  name: string;
  phone: string;
  business_name?: string;
  address?: string;
  category?: string;
  rating?: number;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'called' | 'completed' | 'failed' | 'do_not_call';
  call_attempts: number;
  last_called?: string;
  notes?: string;
  source: 'scraper' | 'upload' | 'manual';
  scraped_data?: any;
}

interface CallList {
  id: string;
  name: string;
  description?: string;
  total_contacts: number;
  pending_contacts: number;
  completed_contacts: number;
  success_rate: number;
  created_at: string;
  updated_at: string;
  agent_config?: {
    voice_id: string;
    voice_name: string;
    language: string;
    knowledge_base: string;
    call_script: string;
    rag_enabled: boolean;
  };
}

export default function CallListsPage() {
  const [callLists, setCallLists] = useState<CallList[]>([]);
  const [selectedList, setSelectedList] = useState<CallList | null>(null);
  const [contacts, setContacts] = useState<CallListContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('lists');
  
  // Form states
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [selectedScraperData, setSelectedScraperData] = useState<any[]>([]);
  
  // Agent configuration
  const [agentConfig, setAgentConfig] = useState({
    voice_id: '',
    voice_name: '',
    language: 'en',
    knowledge_base: '',
    call_script: '',
    rag_enabled: false
  });

  const { toast } = useToast();

  useEffect(() => {
    loadCallLists();
  }, []);

  const loadCallLists = async () => {
    try {
      setIsLoading(true);
      // Mock data for now - replace with actual API call
      const mockLists: CallList[] = [
        {
          id: '1',
          name: 'HVAC Services - Downtown',
          description: 'HVAC companies scraped from downtown area',
          total_contacts: 247,
          pending_contacts: 189,
          completed_contacts: 58,
          success_rate: 23.5,
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-20T15:45:00Z',
          agent_config: {
            voice_id: 'pNInz6obpgDQGcFmaJgB',
            voice_name: 'Adam',
            language: 'en',
            knowledge_base: 'HVAC services and maintenance',
            call_script: 'Professional HVAC service introduction',
            rag_enabled: true
          }
        },
        {
          id: '2',
          name: 'Plumbing Services - Suburbs',
          description: 'Plumbing companies from suburban areas',
          total_contacts: 156,
          pending_contacts: 134,
          completed_contacts: 22,
          success_rate: 14.1,
          created_at: '2024-01-18T09:15:00Z',
          updated_at: '2024-01-19T11:20:00Z'
        }
      ];
      setCallLists(mockLists);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load call lists",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file",
        variant: "destructive"
      });
      return;
    }

    setCsvFile(file);
    
    // Parse CSV file
    const text = await file.text();
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const parsedContacts: CallListContact[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length >= 2 && values[0] && values[1]) {
        parsedContacts.push({
          id: `upload_${Date.now()}_${i}`,
          name: values[0] || 'Unknown',
          phone: values[1] || '',
          business_name: values[2] || '',
          address: values[3] || '',
          category: values[4] || '',
          priority: 'medium',
          status: 'pending',
          call_attempts: 0,
          source: 'upload'
        });
      }
    }

    setContacts(parsedContacts);
    toast({
      title: "File Uploaded",
      description: `Parsed ${parsedContacts.length} contacts from CSV`,
    });
  };

  const importFromScraper = async () => {
    try {
      setIsLoading(true);
      
      // Get scraped data from localStorage or API
      const scrapedDataStr = localStorage.getItem('scrapedBusinessData');
      if (!scrapedDataStr) {
        toast({
          title: "No Data Found",
          description: "No scraped data available. Please run the data scraper first.",
          variant: "destructive"
        });
        return;
      }

      const scrapedData = JSON.parse(scrapedDataStr);
      const importedContacts: CallListContact[] = scrapedData
        .filter((business: any) => business.phone) // Only businesses with phone numbers
        .map((business: any, index: number) => ({
          id: `scraper_${business.id || index}`,
          name: business.name || 'Unknown Business',
          phone: business.phone,
          business_name: business.name,
          address: business.address,
          category: business.category,
          rating: business.rating,
          priority: business.rating >= 4.0 ? 'high' : business.rating >= 3.0 ? 'medium' : 'low',
          status: 'pending',
          call_attempts: 0,
          source: 'scraper',
          scraped_data: business
        }));

      setContacts(importedContacts);
      setSelectedScraperData(scrapedData);
      
      toast({
        title: "Data Imported",
        description: `Imported ${importedContacts.length} contacts from scraper data`,
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import scraped data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createCallList = async () => {
    if (!newListName.trim() || contacts.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please provide a list name and add contacts",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const newList: CallList = {
        id: `list_${Date.now()}`,
        name: newListName,
        description: newListDescription,
        total_contacts: contacts.length,
        pending_contacts: contacts.length,
        completed_contacts: 0,
        success_rate: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        agent_config: agentConfig.voice_id ? agentConfig : undefined
      };

      // Save to backend (mock for now)
      setCallLists(prev => [...prev, newList]);
      
      // Reset form
      setNewListName('');
      setNewListDescription('');
      setContacts([]);
      setCsvFile(null);
      setActiveTab('lists');
      
      toast({
        title: "Success",
        description: "Call list created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create call list",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startCalling = async (listId: string) => {
    const list = callLists.find(l => l.id === listId);
    if (!list) return;

    toast({
      title: "Starting Calls",
      description: `Initiating calling campaign for "${list.name}"`,
    });

    // Redirect to operations page with list ID
    window.location.href = `/calling-agent/operations?listId=${listId}`;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      case 'called': return 'secondary';
      case 'do_not_call': return 'outline';
      default: return 'secondary';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
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
          <h1 className="text-3xl font-bold font-headline tracking-tight">Call Lists Management</h1>
          <p className="text-muted-foreground">
            Import contacts from scraper data or CSV files and manage calling campaigns
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="px-3 py-1">
            <Database className="h-3 w-3 mr-1" />
            {callLists.length} Lists
          </Badge>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lists">
            <Database className="h-4 w-4 mr-2" />
            Call Lists
          </TabsTrigger>
          <TabsTrigger value="create">
            <Upload className="h-4 w-4 mr-2" />
            Create List
          </TabsTrigger>
          <TabsTrigger value="configure">
            <Settings className="h-4 w-4 mr-2" />
            Agent Config
          </TabsTrigger>
        </TabsList>

        {/* Call Lists Tab */}
        <TabsContent value="lists" className="space-y-4">
          <div className="grid gap-4">
            {callLists.map((list) => (
              <Card key={list.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {list.name}
                      </CardTitle>
                      <CardDescription>{list.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {list.agent_config && (
                        <Badge variant="secondary">
                          <Zap className="h-3 w-3 mr-1" />
                          Configured
                        </Badge>
                      )}
                      <Button
                        onClick={() => startCalling(list.id)}
                        disabled={list.pending_contacts === 0}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Calling
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{list.total_contacts}</div>
                      <div className="text-sm text-muted-foreground">Total Contacts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{list.pending_contacts}</div>
                      <div className="text-sm text-muted-foreground">Pending</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{list.completed_contacts}</div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{list.success_rate}%</div>
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                    </div>
                  </div>

                  <Progress
                    value={(list.completed_contacts / list.total_contacts) * 100}
                    className="h-2 mb-2"
                  />

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Progress: {list.completed_contacts}/{list.total_contacts}</span>
                    <span>Updated: {new Date(list.updated_at).toLocaleDateString()}</span>
                  </div>

                  {list.agent_config && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        Agent Configuration
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Voice: {list.agent_config.voice_name}</div>
                        <div>Language: {list.agent_config.language}</div>
                        <div>RAG: {list.agent_config.rag_enabled ? 'Enabled' : 'Disabled'}</div>
                        <div>Knowledge Base: {list.agent_config.knowledge_base ? 'Configured' : 'None'}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {callLists.length === 0 && !isLoading && (
              <Card>
                <CardContent className="text-center py-8">
                  <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Call Lists</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first call list by importing contacts from the data scraper or uploading a CSV file.
                  </p>
                  <Button onClick={() => setActiveTab('create')}>
                    <Upload className="h-4 w-4 mr-2" />
                    Create Call List
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Create List Tab */}
        <TabsContent value="create" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Import Options */}
            <Card>
              <CardHeader>
                <CardTitle>Import Contacts</CardTitle>
                <CardDescription>
                  Import contacts from scraped data or upload a CSV file
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Import from Scraper */}
                <div className="space-y-2">
                  <Label>Import from Data Scraper</Label>
                  <Button
                    onClick={importFromScraper}
                    className="w-full"
                    variant="outline"
                    disabled={isLoading}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Import Scraped Business Data
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Import contacts from your latest scraping session
                  </p>
                </div>

                {/* CSV Upload */}
                <div className="space-y-2">
                  <Label htmlFor="csv-upload">Upload CSV File</Label>
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    CSV format: Name, Phone, Business Name, Address, Category
                  </p>
                </div>

                {uploadProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Processing...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* List Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>List Configuration</CardTitle>
                <CardDescription>
                  Configure your new call list settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="list-name">List Name *</Label>
                  <Input
                    id="list-name"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="e.g., HVAC Services - Downtown"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="list-description">Description</Label>
                  <Textarea
                    id="list-description"
                    value={newListDescription}
                    onChange={(e) => setNewListDescription(e.target.value)}
                    placeholder="Brief description of this call list..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contacts Preview</Label>
                  <div className="border rounded-lg p-3 bg-muted/50">
                    <div className="text-sm">
                      <div className="font-medium">{contacts.length} contacts loaded</div>
                      {contacts.length > 0 && (
                        <div className="text-muted-foreground">
                          {contacts.filter(c => c.phone).length} with phone numbers
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={createCallList}
                  className="w-full"
                  disabled={!newListName.trim() || contacts.length === 0 || isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Create Call List
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Contacts Preview Table */}
          {contacts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Contacts Preview ({contacts.length} contacts)</CardTitle>
                <CardDescription>
                  Review the contacts that will be added to your call list
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Business</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Source</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.slice(0, 10).map((contact) => (
                        <TableRow key={contact.id}>
                          <TableCell className="font-medium">{contact.name}</TableCell>
                          <TableCell>{contact.phone}</TableCell>
                          <TableCell>{contact.business_name || '-'}</TableCell>
                          <TableCell>{contact.category || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={getPriorityBadgeColor(contact.priority)}>
                              {contact.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{contact.source}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {contacts.length > 10 && (
                    <div className="text-center text-sm text-muted-foreground mt-4">
                      Showing first 10 contacts. {contacts.length - 10} more will be included.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Agent Configuration Tab */}
        <TabsContent value="configure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-500" />
                Agent Configuration for Call Lists
              </CardTitle>
              <CardDescription>
                Configure the AI agent settings that will be used for calling campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Voice Configuration */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    Voice Settings
                  </h4>

                  <div className="space-y-2">
                    <Label>ElevenLabs Voice</Label>
                    <Select value={agentConfig.voice_id} onValueChange={(value) => {
                      const voice = value.split('|');
                      setAgentConfig(prev => ({
                        ...prev,
                        voice_id: voice[0],
                        voice_name: voice[1] || voice[0]
                      }));
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a voice" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pNInz6obpgDQGcFmaJgB|Adam">Adam - Deep, authoritative</SelectItem>
                        <SelectItem value="EXAVITQu4vr4xnSDxMaL|Bella">Bella - Warm, friendly</SelectItem>
                        <SelectItem value="ErXwobaYiN019PkySvjV|Antoni">Antoni - Professional, clear</SelectItem>
                        <SelectItem value="VR6AewLTigWG4xSOukaG|Arnold">Arnold - Confident, strong</SelectItem>
                        <SelectItem value="ThT5KcBeYPX3keUQqHPh|Dorothy">Dorothy - Pleasant, mature</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select value={agentConfig.language} onValueChange={(value) =>
                      setAgentConfig(prev => ({ ...prev, language: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="it">Italian</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Knowledge Base Configuration */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-500" />
                    Knowledge Base & RAG
                  </h4>

                  <div className="space-y-2">
                    <Label>Knowledge Base Topic</Label>
                    <Input
                      value={agentConfig.knowledge_base}
                      onChange={(e) => setAgentConfig(prev => ({ ...prev, knowledge_base: e.target.value }))}
                      placeholder="e.g., HVAC services, plumbing, electrical work"
                    />
                    <p className="text-xs text-muted-foreground">
                      Specify the domain knowledge for better conversation context
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rag-enabled"
                      checked={agentConfig.rag_enabled}
                      onCheckedChange={(checked) =>
                        setAgentConfig(prev => ({ ...prev, rag_enabled: checked as boolean }))
                      }
                    />
                    <Label htmlFor="rag-enabled" className="text-sm">
                      Enable RAG (Retrieval-Augmented Generation)
                    </Label>
                  </div>

                  {agentConfig.rag_enabled && (
                    <Alert>
                      <Brain className="h-4 w-4" />
                      <AlertDescription>
                        RAG will enhance conversations with relevant knowledge from your specified domain.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              {/* Call Script Configuration */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-500" />
                  Call Script & Conversation Flow
                </h4>

                <div className="space-y-2">
                  <Label>Call Script / Opening Line</Label>
                  <Textarea
                    value={agentConfig.call_script}
                    onChange={(e) => setAgentConfig(prev => ({ ...prev, call_script: e.target.value }))}
                    placeholder="Hello, this is [Agent Name] calling from [Company]. I'm reaching out to local businesses about our [Service/Product]..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be used as the opening script for all calls in this campaign
                  </p>
                </div>
              </div>

              {/* Configuration Preview */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-3">Configuration Preview</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Voice:</span>
                    <span className="ml-2 font-medium">{agentConfig.voice_name || 'Not selected'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Language:</span>
                    <span className="ml-2 font-medium">{agentConfig.language}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Knowledge Base:</span>
                    <span className="ml-2 font-medium">{agentConfig.knowledge_base || 'Not configured'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">RAG:</span>
                    <span className="ml-2 font-medium">{agentConfig.rag_enabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
                {agentConfig.call_script && (
                  <div className="mt-3">
                    <span className="text-muted-foreground">Script Preview:</span>
                    <p className="text-sm mt-1 p-2 bg-background rounded border">
                      {agentConfig.call_script.substring(0, 100)}
                      {agentConfig.call_script.length > 100 && '...'}
                    </p>
                  </div>
                )}
              </div>

              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  This configuration will be applied to new call lists. Existing lists can be updated individually.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
