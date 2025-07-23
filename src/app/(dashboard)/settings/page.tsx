
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application settings.</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Business Profile</TabsTrigger>
          <TabsTrigger value="vendor">Vendor Settings</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Business Profile</CardTitle>
              <CardDescription>Update your business details and branding.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input id="businessName" defaultValue="LeadFlow Inc." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" defaultValue="123 Innovation Drive, Tech City, 12345" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo">Logo</Label>
                <Input id="logo" type="file" />
                <p className="text-sm text-muted-foreground">Upload a PNG or JPG file. Max size: 2MB.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendor">
           <Card>
            <CardHeader>
              <CardTitle className="font-headline">Vendor AI Configuration</CardTitle>
              <CardDescription>Provide the AI with context to improve vendor assignments.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vendorKnowledgeBase">Vendor Knowledge Base</Label>
                <Textarea 
                    id="vendorKnowledgeBase" 
                    placeholder="Provide details about vendor skills, preferred job types, or other criteria. e.g., 'Vendor A is best for large commercial plumbing jobs. Vendor B specializes in residential AC repair and is available on weekends.'"
                    rows={6}
                 />
                 <p className="text-sm text-muted-foreground">This information will be used by the AI to make more accurate vendor selections.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">API Configuration</CardTitle>
              <CardDescription>Manage your API keys for third-party services.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="googleMapsKey">Google Maps API Key</Label>
                <Input id="googleMapsKey" type="password" placeholder="Enter your Google Maps API key" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twilioSid">Twilio Account SID</Label>
                <Input id="twilioSid" type="password" placeholder="Enter your Twilio Account SID" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="elevenLabsKey">ElevenLabs API Key</Label>
                <Input id="elevenLabsKey" type="password" placeholder="Enter your ElevenLabs API key" />
              </div>
               <div className="space-y-2">
                <Label htmlFor="openaiKey">LLM API Key (OpenAI, Gemini, etc.)</Label>
                <Input id="openaiKey" type="password" placeholder="Enter your LLM API key" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
      <div className="flex justify-end">
          <Button>Save Settings</Button>
      </div>
    </div>
  );
}
