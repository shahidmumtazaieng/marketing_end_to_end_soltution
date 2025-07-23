
'use client';
import { useActionState, useEffect, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
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
import { scrapeDataAction } from './actions';
import { Download, Loader2, Search, Key, Pencil, Check, Trash2, PlusCircle, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LocationSelector } from '@/components/location-selector';
import { Badge } from '@/components/ui/badge';

const initialState = {
  message: '',
  data: null,
  errors: {},
  input: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
      {pending ? 'Scraping...' : 'Scrape Data'}
    </Button>
  );
}

const initialExportHistory: { filename: string; date: string; recordCount: number; }[] = [];
const initialBusinessTargets: string[] = ['Restaurants', 'Hotels', 'Plumbers'];

export default function ScraperPage() {
  const [state, formAction] = useActionState(scrapeDataAction, initialState);
  const { toast } = useToast();
  
  const [apiKeys, setApiKeys] = useState({ google: '', serp: '' });
  const [editingKey, setEditingKey] = useState<null | 'google' | 'serp'>(null);
  const [provider, setProvider] = useState('serpapi');
  
  const [scrapedInput, setScrapedInput] = useState<{city?: string, businessType?: string} | null>(null);

  const [exportHistory, setExportHistory] = useState(initialExportHistory);
  const [businessTargets, setBusinessTargets] = useState(initialBusinessTargets);
  const [newTarget, setNewTarget] = useState('');

  useEffect(() => {
    const savedGoogleKey = localStorage.getItem('googleApiKey') || '';
    const savedSerpKey = localStorage.getItem('serpApiKey') || '';
    setApiKeys({ google: savedGoogleKey, serp: savedSerpKey });

    const savedHistory = localStorage.getItem('scraperExportHistory');
    if (savedHistory) {
      setExportHistory(JSON.parse(savedHistory));
    }
    const savedTargets = localStorage.getItem('scraperBusinessTargets');
    if (savedTargets) {
      setBusinessTargets(JSON.parse(savedTargets));
    }

  }, []);
  
  useEffect(() => {
    if (state.message) {
      if (state.data) {
        toast({
          title: 'Success',
          description: state.message,
        });
        setScrapedInput(state.input);
      } else if (state.message !== 'Validation failed.') {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: state.message,
        });
      }
    }
  }, [state, toast]);

  const handleSaveKey = (keyName: 'google' | 'serp') => {
    localStorage.setItem(keyName === 'google' ? 'googleApiKey' : 'serpApiKey', apiKeys[keyName]);
    setEditingKey(null);
    toast({ title: 'API Key Saved!' });
  };

  const handleExport = () => {
    if (!state.data || !Array.isArray(state.data) || state.data.length === 0) {
      toast({ title: "No data to export.", variant: "destructive" });
      return;
    }

    const brandName = "LeadFlow";
    const city = scrapedInput?.city?.replace(/\s/g, '') || "Location";
    const businessType = scrapedInput?.businessType?.replace(/\s/g, '') || "Business";
    const uniqueId = new Date().getTime();
    const filename = `${brandName}_${city}_${businessType}_${uniqueId}.csv`;

    const headers = Object.keys(state.data[0]);
    const csvContent = [
        headers.join(','),
        ...state.data.map((row: any) => headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    const newHistoryEntry = {
        filename,
        date: new Date().toISOString(),
        recordCount: state.data.length
    };
    const updatedHistory = [newHistoryEntry, ...exportHistory];
    setExportHistory(updatedHistory);
    localStorage.setItem('scraperExportHistory', JSON.stringify(updatedHistory));

    toast({ title: "Exported successfully!" });
  };

  const addBusinessTarget = () => {
    if (newTarget && !businessTargets.includes(newTarget)) {
        const updatedTargets = [...businessTargets, newTarget];
        setBusinessTargets(updatedTargets);
        localStorage.setItem('scraperBusinessTargets', JSON.stringify(updatedTargets));
        setNewTarget('');
        toast({ title: `Added "${newTarget}" to targets.`});
    }
  }

  const removeBusinessTarget = (targetToRemove: string) => {
    const updatedTargets = businessTargets.filter(t => t !== targetToRemove);
    setBusinessTargets(updatedTargets);
    localStorage.setItem('scraperBusinessTargets', JSON.stringify(updatedTargets));
    toast({ title: `Removed "${targetToRemove}".`, variant: 'destructive' });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1 space-y-8">
        
        <Card>
          <form action={formAction}>
            <CardHeader>
              <CardTitle className="font-headline">Data Scraper</CardTitle>
              <CardDescription>Select a location, then scrape business data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input type="hidden" name="apiKey" value={provider === 'serpapi' ? apiKeys.serp : apiKeys.google} />

              <div className="space-y-2">
                <Label htmlFor="provider">API Provider</Label>
                <Select name="provider" value={provider} onValueChange={setProvider}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select API Provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="serpapi">SerpAPI</SelectItem>
                    <SelectItem value="google-maps">Google Maps</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <LocationSelector />

              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type</Label>
                <Input id="businessType" name="businessType" placeholder="e.g., Restaurants, Hotels" required />
                {state.errors?.businessType && <p className="text-sm text-destructive">{state.errors.businessType[0]}</p>}
              </div>
               <div className="flex flex-wrap gap-2 pt-2">
                    {businessTargets.map(target => (
                        <Badge key={target} variant="secondary" className="cursor-pointer" onClick={() => (document.getElementById('businessType') as HTMLInputElement).value = target}>
                            {target}
                        </Badge>
                    ))}
                </div>
            </CardContent>
            <CardFooter>
              <SubmitButton />
            </CardFooter>
          </form>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><Key className="h-5 w-5" /> API Key Management</CardTitle>
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
                    <Button size="icon" onClick={() => handleSaveKey('google')}><Check className="h-4 w-4" /></Button>
                    ) : (
                    <Button size="icon" variant="outline" onClick={() => setEditingKey('google')}><Pencil className="h-4 w-4" /></Button>
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
                    <Button size="icon" onClick={() => handleSaveKey('serp')}><Check className="h-4 w-4" /></Button>
                    ) : (
                    <Button size="icon" variant="outline" onClick={() => setEditingKey('serp')}><Pencil className="h-4 w-4" /></Button>
                    )}
                </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">Business Target List</CardTitle>
                <CardDescription>Manage your saved business type keywords.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                    <Input 
                        placeholder="Add new business type" 
                        value={newTarget}
                        onChange={(e) => setNewTarget(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addBusinessTarget()}
                    />
                    <Button size="icon" onClick={addBusinessTarget}><PlusCircle className="h-4 w-4" /></Button>
                </div>
                <div className="space-y-2">
                    {businessTargets.map(target => (
                        <div key={target} className="flex items-center justify-between p-2 bg-muted rounded-md">
                            <span className="text-sm font-medium">{target}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeBusinessTarget(target)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>

      </div>

      <div className="lg:col-span-2 space-y-8">
        <Card>
          <CardHeader className='flex-row items-center justify-between'>
            <div>
              <CardTitle className="font-headline">Scraped Data</CardTitle>
              <CardDescription>Results from the scraping process will appear here.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={!state.data || !Array.isArray(state.data) || state.data.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export to CSV
            </Button>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-auto h-[600px] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Category</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.data && Array.isArray(state.data) && state.data.map((item: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.address}</TableCell>
                      <TableCell>{item.phone || 'N/A'}</TableCell>
                      <TableCell>{item.category || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                  {(!state.data || !Array.isArray(state.data) || state.data.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No data scraped yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><History className="h-5 w-5" /> Export History</CardTitle>
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
      </div>
    </div>
  );
}
