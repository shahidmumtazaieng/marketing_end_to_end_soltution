
'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Download,
  Loader2,
  Search,
  Key,
  Pencil,
  Check,
  History,
  Play,
  Pause,
  Square,
  Database,
  MapPin,
  Building2,
  TrendingUp,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LocationSelector } from '@/components/location-selector';
import { BusinessTypeSelector } from '@/components/business-type-selector';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiKeyGuard } from '@/lib/middleware/apiKeyValidation';

// Import our new API client
import { scraperAPI, type ScrapedBusiness, type ScraperRequest } from '@/lib/scraper-api';

const initialExportHistory: { filename: string; date: string; recordCount: number; }[] = [];

export default function ScraperPage() {
  const { toast } = useToast();

  // Configuration State
  const [apiProvider, setApiProvider] = useState<'serpapi' | 'google_maps'>('serpapi');
  const [apiKey, setApiKey] = useState('');
  const [isApiKeyValid, setIsApiKeyValid] = useState(false);
  const [editingKey, setEditingKey] = useState<null | 'google' | 'serp'>(null);
  const [location, setLocation] = useState({
    country: '',
    state: '',
    city: '',
    village: '',
  });
  const [businessTypes, setBusinessTypes] = useState<string[]>([]);
  const [customBusinessType, setCustomBusinessType] = useState('');

  // Scraping State
  const [isScrapingActive, setIsScrapingActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scrapedData, setScrapedData] = useState<ScrapedBusiness[]>([]);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Legacy state for compatibility
  const [apiKeys, setApiKeys] = useState({ google: '', serp: '' });
  const [exportHistory, setExportHistory] = useState(initialExportHistory);

  // Statistics
  const [stats, setStats] = useState({
    totalRecords: 0,
    uniqueCategories: 0,
    averageRating: 0,
    recordsWithPhone: 0,
    recordsWithWebsite: 0,
  });

  // Load API keys from localStorage
  useEffect(() => {
    const savedGoogleKey = localStorage.getItem('googleApiKey') || '';
    const savedSerpKey = localStorage.getItem('serpApiKey') || '';
    setApiKeys({ google: savedGoogleKey, serp: savedSerpKey });

    // Load API key for current provider
    const savedApiKey = localStorage.getItem(`${apiProvider}_api_key`);
    if (savedApiKey) {
      setApiKey(savedApiKey);
      validateApiKey(savedApiKey);
    }

    const savedHistory = localStorage.getItem('scraperExportHistory');
    if (savedHistory) {
      setExportHistory(JSON.parse(savedHistory));
    }
  }, [apiProvider]);

  // Update statistics when data changes
  useEffect(() => {
    updateStatistics();
  }, [scrapedData]);

  // API Key Validation
  const validateApiKey = async (key: string) => {
    if (!key.trim()) {
      setIsApiKeyValid(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await scraperAPI.validateApiKey(apiProvider, key);
      setIsApiKeyValid(result.valid);

      if (result.valid) {
        localStorage.setItem(`${apiProvider}_api_key`, key);
        toast({
          title: 'API Key Valid',
          description: 'Your API key has been validated successfully.',
        });
      } else {
        setErrors(prev => [...prev, result.error || 'Invalid API key']);
        toast({
          variant: 'destructive',
          title: 'Invalid API Key',
          description: result.error || 'Please check your API key.',
        });
      }
    } catch (error) {
      setIsApiKeyValid(false);
      setErrors(prev => [...prev, error.message]);
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveKey = (keyName: 'google' | 'serp') => {
    localStorage.setItem(keyName === 'google' ? 'googleApiKey' : 'serpApiKey', apiKeys[keyName]);
    setEditingKey(null);
    toast({ title: 'API Key Saved!' });
  };

  // Start Scraping Process
  const startScraping = async () => {
    if (!isApiKeyValid || !location.country) {
      toast({
        variant: 'destructive',
        title: 'Configuration Error',
        description: 'Please provide valid API key and location',
      });
      return;
    }

    if (businessTypes.length === 0 && !customBusinessType.trim()) {
      toast({
        variant: 'destructive',
        title: 'Business Type Required',
        description: 'Please select business types or enter custom type',
      });
      return;
    }

    setIsScrapingActive(true);
    setIsPaused(false);
    setProgress(0);
    setScrapedData([]);
    setErrors([]);
    setCurrentBatch(0);

    try {
      const requestData: ScraperRequest = {
        provider: apiProvider,
        apiKey,
        location,
        businessTypes,
        customBusinessType,
        filters: {
          rating: 3.0, // Default minimum rating
        },
      };

      // Estimate total batches
      const estimatedResults = 200; // Conservative estimate
      const batchSize = 20;
      setTotalBatches(Math.ceil(estimatedResults / batchSize));

      let start = 0;
      let hasMoreResults = true;
      let allResults: ScrapedBusiness[] = [];

      while (hasMoreResults && !isPaused && start < 200) { // Limit to 200 results
        setCurrentBatch(Math.floor(start / batchSize) + 1);

        const response = await scraperAPI.searchBusinesses({
          ...requestData,
          pagination: { start, num: batchSize },
        });

        if (response.success && response.data.length > 0) {
          allResults = [...allResults, ...response.data];
          setScrapedData(allResults);
          setProgress((start + response.data.length) / estimatedResults * 100);
          start += batchSize;

          // Check if we have more results
          hasMoreResults = response.data.length === batchSize && response.totalResults > start;

          // Rate limiting delay
          await new Promise(resolve => setTimeout(resolve, 1500));
        } else {
          hasMoreResults = false;
        }
      }

      toast({
        title: 'Scraping Complete',
        description: `Successfully scraped ${allResults.length} businesses`,
      });

    } catch (error) {
      setErrors(prev => [...prev, error.message]);
      toast({
        variant: 'destructive',
        title: 'Scraping Error',
        description: error.message,
      });
    } finally {
      setIsScrapingActive(false);
      setProgress(100);
    }
  };

  // Pause/Resume Scraping
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // Stop Scraping
  const stopScraping = () => {
    setIsScrapingActive(false);
    setIsPaused(false);
  };

  // Update Statistics
  const updateStatistics = () => {
    if (scrapedData.length === 0) {
      setStats({
        totalRecords: 0,
        uniqueCategories: 0,
        averageRating: 0,
        recordsWithPhone: 0,
        recordsWithWebsite: 0,
      });
      return;
    }

    const categories = new Set(scrapedData.map(item => item.category));
    const ratingsData = scrapedData.filter(item => item.rating);
    const averageRating = ratingsData.length > 0
      ? ratingsData.reduce((sum, item) => sum + item.rating!, 0) / ratingsData.length
      : 0;

    setStats({
      totalRecords: scrapedData.length,
      uniqueCategories: categories.size,
      averageRating: Math.round(averageRating * 10) / 10,
      recordsWithPhone: scrapedData.filter(item => item.phone).length,
      recordsWithWebsite: scrapedData.filter(item => item.website).length,
    });
  };

  const handleExport = async () => {
    const callableData = scrapedData.filter(item => item.phone);

    if (!callableData || callableData.length === 0) {
      toast({
        title: "No callable businesses found.",
        description: "Only businesses with phone numbers can be exported for calling.",
        variant: "destructive"
      });
      return;
    }

    try {
      const blob = await scraperAPI.exportData({
        data: callableData,
        format: 'csv',
        filename: `Calling_List_${location.city || 'Export'}_${Date.now()}`
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Calling_List_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const newHistoryEntry = {
        filename: `Calling_List_${Date.now()}.csv`,
        date: new Date().toISOString(),
        recordCount: callableData.length
      };
      const updatedHistory = [newHistoryEntry, ...exportHistory];
      setExportHistory(updatedHistory);
      localStorage.setItem('scraperExportHistory', JSON.stringify(updatedHistory));

      toast({
        title: "Calling list exported successfully!",
        description: `${callableData.length} businesses ready for AI calling.`
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Export Error',
        description: error.message,
      });
    }
  };

  const handleExportExcel = async () => {
    const callableData = scrapedData.filter(item => item.phone);

    if (!callableData || callableData.length === 0) {
      toast({
        title: "No callable businesses found.",
        variant: "destructive"
      });
      return;
    }

    try {
      const blob = await scraperAPI.exportData({
        data: callableData,
        format: 'excel',
        filename: `Calling_List_${location.city || 'Export'}_${Date.now()}`
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Calling_List_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Excel calling list exported!",
        description: `Multi-sheet workbook with ${callableData.length} businesses.`
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Export Error',
        description: error.message,
      });
    }
  };

  const handlePriorityExport = async (priority: string) => {
    const priorityData = scrapedData.filter(item =>
      item.phone && item.callPriority === priority
    );

    if (!priorityData || priorityData.length === 0) {
      toast({
        title: `No ${priority} priority businesses found.`,
        variant: "destructive"
      });
      return;
    }

    try {
      const blob = await scraperAPI.exportData({
        data: priorityData,
        format: 'csv',
        filename: `${priority.toUpperCase()}_Priority_${Date.now()}`
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${priority.toUpperCase()}_Priority_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: `${priority.toUpperCase()} priority list exported!`,
        description: `${priorityData.length} businesses ready for calling.`
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Export Error',
        description: error.message,
      });
    }
  };

  return (
    <ApiKeyGuard serviceType="data-scraper">
      <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8" />
            Data Scraper
          </h1>
          <p className="text-muted-foreground">
            Extract business data from Google Maps using SerpAPI or Google Maps API
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isScrapingActive ? "default" : "secondary"}>
            {isScrapingActive ? "Active" : "Idle"}
          </Badge>
          {isApiKeyValid && (
            <Badge variant="outline" className="text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              API Connected
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      {scrapedData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Records</p>
                  <p className="text-2xl font-bold">{stats.totalRecords}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Categories</p>
                  <p className="text-2xl font-bold">{stats.uniqueCategories}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Rating</p>
                  <p className="text-2xl font-bold">{stats.averageRating}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div>
                <p className="text-sm text-muted-foreground">With Phone</p>
                <p className="text-2xl font-bold">{stats.recordsWithPhone}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div>
                <p className="text-sm text-muted-foreground">With Website</p>
                <p className="text-2xl font-bold">{stats.recordsWithWebsite}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Scraper Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Provider Selection */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">API Provider</Label>
              <p className="text-sm text-muted-foreground">
                Choose your preferred data source. You must use your own API keys.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className={`cursor-pointer border-2 ${apiProvider === 'serpapi' ? 'border-primary' : 'border-muted'}`}
                    onClick={() => setApiProvider('serpapi')}>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">SerpAPI</h4>
                      <Badge variant="outline">Pay per search</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Comprehensive Google Maps data with rich business information
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className={`cursor-pointer border-2 ${apiProvider === 'google_maps' ? 'border-primary' : 'border-muted'}`}
                    onClick={() => setApiProvider('google_maps')}>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Google Maps API</h4>
                      <Badge variant="outline">Pay per request</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Direct Google Maps Places API integration
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* API Key Input */}
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="apiKey"
                  type="password"
                  placeholder={`Enter your ${apiProvider === 'serpapi' ? 'SerpAPI' : 'Google Maps'} API key`}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={() => validateApiKey(apiKey)}
                  disabled={!apiKey.trim() || isLoading}
                  variant="outline"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Validate'
                  )}
                </Button>
              </div>

              {/* Validation Status */}
              {apiKey && (
                <div className="flex items-center gap-2 text-sm">
                  {isApiKeyValid ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">API key is valid</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-red-600">Invalid or expired API key</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Location Selection */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Location</Label>
              <p className="text-sm text-muted-foreground">
                Specify the geographic area to search for businesses
              </p>
            </div>
            <LocationSelector
              location={location}
              onLocationChange={setLocation}
            />
          </div>

          {/* Business Type Selection */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Business Types</Label>
              <p className="text-sm text-muted-foreground">
                Select business categories or enter a custom search term
              </p>
            </div>
            <BusinessTypeSelector
              selectedTypes={businessTypes}
              onTypesChange={setBusinessTypes}
              customType={customBusinessType}
              onCustomTypeChange={setCustomBusinessType}
            />
          </div>
        </CardContent>
      </Card>

      {/* Scraping Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Scraping Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              onClick={startScraping}
              disabled={!isApiKeyValid || !location.country || isScrapingActive}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Start Scraping
            </Button>

            {isScrapingActive && (
              <>
                <Button
                  onClick={togglePause}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>

                <Button
                  onClick={stopScraping}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Square className="h-4 w-4" />
                  Stop
                </Button>
              </>
            )}
          </div>

          {/* Progress Tracking */}
          {(isScrapingActive || scrapedData.length > 0) && (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Batch:</span>
                  <span className="ml-1 font-medium">{currentBatch}/{totalBatches}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Scraped:</span>
                  <span className="ml-1 font-medium">{scrapedData.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <span className="ml-1 font-medium">
                    {isScrapingActive ? (isPaused ? 'Paused' : 'Active') : 'Idle'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <Tabs defaultValue="preview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="preview">Preview ({scrapedData.length})</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="errors">Errors ({errors.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="preview">
          <Card>
            <CardHeader className='flex-row items-center justify-between'>
              <div>
                <CardTitle className="font-headline">Scraped Data</CardTitle>
                <CardDescription>Results from the scraping process will appear here.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleExport} disabled={scrapedData.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export to CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-auto h-[600px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business Name</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Call Priority</TableHead>
                      <TableHead>Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scrapedData
                      .filter(item => item.phone) // Only show businesses with phone numbers
                      .map((item, index) => (
                      <TableRow key={item.id || index}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="font-mono text-green-600">
                          {item.phone || 'No Phone'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{item.address}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category || 'Business'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.callPriority === 'high' ? 'default' :
                              item.callPriority === 'medium' ? 'secondary' :
                              'outline'
                            }
                          >
                            {item.callPriority?.toUpperCase() || 'MEDIUM'}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.rating ? `⭐ ${item.rating}` : 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                    {scrapedData.filter(item => item.phone).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          {scrapedData.length > 0
                            ? 'No businesses with phone numbers found.'
                            : 'No data scraped yet.'
                          }
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Export Calling Lists</CardTitle>
              <CardDescription>Download optimized calling lists for AI agents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Export Statistics */}
              {scrapedData.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {scrapedData.filter(item => item.phone).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Callable Businesses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {scrapedData.filter(item => item.callPriority === 'high').length}
                    </div>
                    <div className="text-sm text-muted-foreground">High Priority</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {scrapedData.filter(item => item.callPriority === 'medium').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Medium Priority</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {scrapedData.filter(item => item.callPriority === 'low').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Low Priority</div>
                  </div>
                </div>
              )}

              {/* Export Options */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Complete Calling List</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={handleExport}
                      disabled={scrapedData.filter(item => item.phone).length === 0}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export CSV for Calling
                    </Button>
                    <Button
                      onClick={() => handleExportExcel()}
                      disabled={scrapedData.filter(item => item.phone).length === 0}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export Excel (Multi-Sheet)
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Priority-Based Lists</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      onClick={() => handlePriorityExport('high')}
                      disabled={scrapedData.filter(item => item.callPriority === 'high').length === 0}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      High Priority Only
                    </Button>
                    <Button
                      onClick={() => handlePriorityExport('medium')}
                      disabled={scrapedData.filter(item => item.callPriority === 'medium').length === 0}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Medium Priority Only
                    </Button>
                    <Button
                      onClick={() => handlePriorityExport('low')}
                      disabled={scrapedData.filter(item => item.callPriority === 'low').length === 0}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Low Priority Only
                    </Button>
                  </div>
                </div>
              </div>

              {scrapedData.length > 0 && (
                <div className="text-sm text-muted-foreground p-4 bg-blue-50 rounded-lg">
                  <strong>📞 Ready for AI Calling:</strong> {scrapedData.filter(item => item.phone).length} businesses with valid phone numbers
                  <br />
                  <strong>📊 Export includes:</strong> Business name, phone number, address, category, call priority, best time to call, and rating
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <CardTitle>Errors & Warnings</CardTitle>
            </CardHeader>
            <CardContent>
              {errors.length > 0 ? (
                <div className="space-y-2">
                  {errors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No errors encountered.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>


      {/* Export History */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <History className="h-5 w-5" /> Export History
          </CardTitle>
          <CardDescription>A log of your recent CSV exports.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-auto h-[300px] border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exportHistory.length > 0 ? exportHistory.map((item) => (
                  <TableRow key={item.filename}>
                    <TableCell className="font-medium text-xs">{item.filename}</TableCell>
                    <TableCell>{item.recordCount}</TableCell>
                    <TableCell>{new Date(item.date).toLocaleString()}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      No export history yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Legacy API Key Management (Hidden but functional) */}
      <Card className="hidden">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Key className="h-5 w-5" /> Legacy API Key Management
          </CardTitle>
          <CardDescription>Save your API keys here for easy access.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="google-key">Google Maps API Key</Label>
            <div className="flex items-center gap-2">
              <Input
                id="google-key"
                type={editingKey === 'google' ? 'text' : 'password'}
                value={apiKeys.google}
                onChange={(e) => setApiKeys(prev => ({ ...prev, google: e.target.value }))}
                disabled={editingKey !== 'google'}
              />
              {editingKey === 'google' ? (
                <Button size="icon" onClick={() => handleSaveKey('google')}>
                  <Check className="h-4 w-4" />
                </Button>
              ) : (
                <Button size="icon" variant="outline" onClick={() => setEditingKey('google')}>
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="serp-key">SerpAPI Key</Label>
            <div className="flex items-center gap-2">
              <Input
                id="serp-key"
                type={editingKey === 'serp' ? 'text' : 'password'}
                value={apiKeys.serp}
                onChange={(e) => setApiKeys(prev => ({ ...prev, serp: e.target.value }))}
                disabled={editingKey !== 'serp'}
              />
              {editingKey === 'serp' ? (
                <Button size="icon" onClick={() => handleSaveKey('serp')}>
                  <Check className="h-4 w-4" />
                </Button>
              ) : (
                <Button size="icon" variant="outline" onClick={() => setEditingKey('serp')}>
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </ApiKeyGuard>
  );
}
