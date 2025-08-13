
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Eye, Save, Loader2, CheckCircle } from 'lucide-react';
import { InvoicePreviewModal } from '@/components/invoice-preview-modal';
import type { InvoiceTemplate } from '@/components/invoice-preview-modal';
import { useToast } from '@/hooks/use-toast';
import billingSettingsService, { BusinessInformation } from '@/lib/services/billingSettingsService';

export default function InvoiceSettingsPage() {
  const { toast } = useToast();

  // State management
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate>('modern');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [templateForPreview, setTemplateForPreview] = useState<InvoiceTemplate>('modern');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Mock user ID - in real app, get from auth context
  const userId = 'user-123';

  // Business information form state
  const [businessInfo, setBusinessInfo] = useState<Partial<BusinessInformation>>({
    business_name: '',
    business_address: '',
    business_phone: '',
    business_email: '',
    business_website: '',
    tax_id: '',
    payment_terms: 'Payment due within 15 days',
    payment_methods: ['Cash', 'Card'],
    invoice_template: 'modern',
    invoice_prefix: 'INV-',
    currency_symbol: '$',
    service_details: '',
  });

  // Load existing business information on component mount
  useEffect(() => {
    loadBusinessInformation();
  }, []);

  // Load business information from database
  const loadBusinessInformation = async () => {
    try {
      setLoading(true);

      const existingInfo = await billingSettingsService.getBusinessInformation(userId);

      if (existingInfo) {
        setBusinessInfo(existingInfo);
        setSelectedTemplate(existingInfo.invoice_template);
        console.log('✅ Loaded existing business information');
      } else {
        console.log('📝 No existing business information found');
      }
    } catch (error) {
      console.error('Error loading business information:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load business information. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Save business information to database
  const saveBusinessInformation = async () => {
    try {
      setSaving(true);

      // Validate required fields
      if (!businessInfo.business_name || !businessInfo.business_address || !businessInfo.business_phone) {
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: 'Please fill in all required fields (Business Name, Address, Phone).',
        });
        return;
      }

      // Prepare data for saving
      const dataToSave = {
        ...businessInfo,
        user_id: userId,
        invoice_template: selectedTemplate,
      } as Omit<BusinessInformation, 'id' | 'created_at' | 'updated_at'>;

      // Save to database
      const savedInfo = await billingSettingsService.saveBusinessInformation(dataToSave);

      setBusinessInfo(savedInfo);

      toast({
        title: 'Success',
        description: 'Invoice settings saved successfully!',
      });

      console.log('✅ Business information saved successfully');
    } catch (error) {
      console.error('Error saving business information:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save invoice settings. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = (template: InvoiceTemplate) => {
    setTemplateForPreview(template);
    setIsPreviewOpen(true);
  };

  // Update business info field
  const updateBusinessInfo = (field: keyof BusinessInformation, value: any) => {
    setBusinessInfo(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  
  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Invoice Settings</h1>
          <p className="text-muted-foreground">Customize the information and look of your auto-generated bills.</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading invoice settings...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <InvoicePreviewModal
        isOpen={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        template={templateForPreview}
      />
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Invoice Settings</h1>
          <p className="text-muted-foreground">Customize the information and look of your auto-generated bills.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Invoice &amp; Billing Customization</CardTitle>
            <CardDescription>Set up your branding, payment details, and invoice appearance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <Label className="text-base font-semibold">Invoice Template</Label>
              <RadioGroup 
                defaultValue="modern" 
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
                onValueChange={(value: InvoiceTemplate) => setSelectedTemplate(value)}
                value={selectedTemplate}
              >
                <TemplateOption value="modern" title="Modern" onPreview={() => handlePreview('modern')}>
                   <div className="w-full h-32 p-1.5 space-y-1.5 flex flex-col bg-white text-black font-sans text-[5px] leading-tight rounded-sm border">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="font-bold text-purple-700">Invoice</div>
                                <div className="h-1 w-8 bg-gray-400 rounded-sm mt-0.5" />
                                <div className="h-1 w-10 bg-gray-400 rounded-sm mt-0.5" />
                            </div>
                            <div className="text-right">
                                <div className="font-semibold h-1.5 w-10 bg-gray-600 rounded-sm" />
                                <div className="h-1 w-12 bg-gray-400 rounded-sm mt-0.5" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-sm">
                            <div>
                                <div className="font-bold h-1.5 w-8 bg-gray-700 rounded-sm"/>
                                <div className="h-1 w-full bg-gray-500 rounded-sm mt-0.5" />
                            </div>
                            <div>
                                <div className="font-bold h-1.5 w-8 bg-gray-700 rounded-sm"/>
                                <div className="h-1 w-full bg-gray-500 rounded-sm mt-0.5" />
                            </div>
                        </div>
                        <table className="w-full text-left flex-grow">
                            <thead className="bg-purple-700 text-white">
                                <tr><th className="p-0.5 w-1/2">Item</th><th className="p-0.5">Qty</th><th className="p-0.5">Rate</th><th className="p-0.5">Amt</th></tr>
                            </thead>
                        </table>
                         <div className="border-t-2 border-b-2 border-purple-700 flex-grow"/>
                        <div className="text-right">
                            <div className="h-1.5 w-12 bg-gray-600 rounded-sm ml-auto" />
                        </div>
                   </div>
                </TemplateOption>
                
                <TemplateOption value="classic" title="Classic" onPreview={() => handlePreview('classic')}>
                  <div className="border border-green-300 rounded-sm w-full h-32 p-1.5 space-y-1.5 flex flex-col bg-green-50 text-black font-sans text-[5px] leading-tight">
                    <div className="flex justify-between">
                        <div>
                            <div className="font-bold text-green-700">Invoice</div>
                            <div className="h-1 w-12 bg-gray-500 rounded-sm mt-2" />
                            <div className="h-1 w-10 bg-gray-500 rounded-sm mt-0.5" />
                        </div>
                        <div className="text-right">
                           <div className="font-semibold h-1.5 w-10 bg-gray-600 rounded-sm" />
                           <div className="h-1 w-12 bg-gray-400 rounded-sm mt-0.5" />
                        </div>
                    </div>
                    <table className="w-full text-left flex-grow mt-2">
                        <thead className="bg-green-600 text-white">
                            <tr><th className="p-0.5 w-1/2">Item</th><th className="p-0.5">Qty</th><th className="p-0.5">Rate</th><th className="p-0.5">Amt</th></tr>
                        </thead>
                    </table>
                    <div className="border-t-2 border-b-2 border-green-600 flex-grow"/>
                    <div className="text-right mt-auto">
                        <div className="h-1.5 w-16 bg-gray-600 rounded-sm ml-auto" />
                        <div className="h-2 w-12 bg-green-700 rounded-sm ml-auto mt-0.5" />
                    </div>
                  </div>
                </TemplateOption>
                
                <TemplateOption value="vibrant" title="Vibrant" onPreview={() => handlePreview('vibrant')}>
                   <div className="border border-orange-400/50 rounded-sm w-full h-32 p-1.5 space-y-1.5 flex flex-col text-orange-600 bg-white">
                      <div className="flex justify-between">
                        <div>
                           <div className="h-2 w-10 bg-orange-500 rounded-sm" />
                           <div className="h-1.5 w-14 bg-gray-600 rounded-sm mt-1" />
                           <div className="h-1 w-12 bg-gray-500 rounded-sm mt-0.5" />
                        </div>
                        <div className="text-right text-[4px] space-y-0.5">
                          <div className="h-1 w-16 bg-gray-600 rounded-sm" />
                          <div className="h-1 w-16 bg-gray-500 rounded-sm" />
                          <div className="h-1 w-16 bg-gray-500 rounded-sm" />
                        </div>
                      </div>
                      <div className="flex-grow grid grid-cols-2 gap-1.5 pt-1">
                         <div className="bg-orange-50/80 rounded-sm p-1 space-y-0.5">
                            <div className="h-1 w-1/3 bg-orange-400 rounded-sm" />
                            <div className="h-0.5 w-full bg-gray-500 rounded-sm" />
                            <div className="h-0.5 w-2/3 bg-gray-500 rounded-sm" />
                         </div>
                          <div className="bg-orange-50/80 rounded-sm p-1 space-y-0.5">
                            <div className="h-1 w-1/3 bg-orange-400 rounded-sm" />
                            <div className="h-0.5 w-full bg-gray-500 rounded-sm" />
                            <div className="h-0.5 w-2/3 bg-gray-500 rounded-sm" />
                         </div>
                      </div>
                       <table className="w-full text-left flex-grow">
                            <thead className="bg-orange-600 text-white">
                                <tr><th className="p-0.5 w-1/2">Item</th><th className="p-0.5">Qty</th><th className="p-0.5">Rate</th></tr>
                            </thead>
                        </table>
                      <div className="border-t-2 border-b-2 border-orange-600 flex-grow"/>
                      <div className="self-end bg-orange-50/80 rounded-sm p-1 w-1/3 mt-0.5 space-y-0.5">
                         <div className="h-1 w-full bg-gray-500 rounded-sm" />
                         <div className="h-1.5 w-full bg-orange-500 rounded-sm" />
                      </div>
                   </div>
                </TemplateOption>
              </RadioGroup>
            </div>

            {/* Business Information Section */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Business Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      placeholder="e.g., ABC Services LLC"
                      value={businessInfo.business_name || ''}
                      onChange={(e) => updateBusinessInfo('business_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessEmail">Business Email *</Label>
                    <Input
                      id="businessEmail"
                      type="email"
                      placeholder="e.g., contact@abcservices.com"
                      value={businessInfo.business_email || ''}
                      onChange={(e) => updateBusinessInfo('business_email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessPhone">Business Phone *</Label>
                    <Input
                      id="businessPhone"
                      placeholder="e.g., +1-555-0123"
                      value={businessInfo.business_phone || ''}
                      onChange={(e) => updateBusinessInfo('business_phone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessWebsite">Business Website</Label>
                    <Input
                      id="businessWebsite"
                      placeholder="e.g., www.abcservices.com"
                      value={businessInfo.business_website || ''}
                      onChange={(e) => updateBusinessInfo('business_website', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessAddress">Business Address *</Label>
                  <Textarea
                    id="businessAddress"
                    placeholder="e.g., 123 Main Street, City, State, ZIP Code"
                    value={businessInfo.business_address || ''}
                    onChange={(e) => updateBusinessInfo('business_address', e.target.value)}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID / Business License</Label>
                    <Input
                      id="taxId"
                      placeholder="e.g., 12-3456789"
                      value={businessInfo.tax_id || ''}
                      onChange={(e) => updateBusinessInfo('tax_id', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                    <Input
                      id="invoicePrefix"
                      placeholder="e.g., INV-"
                      value={businessInfo.invoice_prefix || ''}
                      onChange={(e) => updateBusinessInfo('invoice_prefix', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Payment Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={businessInfo.currency_symbol || '$'}
                      onValueChange={(value) => updateBusinessInfo('currency_symbol', value)}
                    >
                      <SelectTrigger id="currency">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="$">USD ($)</SelectItem>
                        <SelectItem value="€">EUR (€)</SelectItem>
                        <SelectItem value="£">GBP (£)</SelectItem>
                        <SelectItem value="¥">JPY (¥)</SelectItem>
                        <SelectItem value="₹">INR (₹)</SelectItem>
                        <SelectItem value="₨">PKR (₨)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms">Payment Terms</Label>
                    <Input
                      id="paymentTerms"
                      placeholder="e.g., Payment due within 15 days"
                      value={businessInfo.payment_terms || ''}
                      onChange={(e) => updateBusinessInfo('payment_terms', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceDetails">Service Details / Terms</Label>
                  <Textarea
                    id="serviceDetails"
                    placeholder="e.g., 'Thank you for your business. Payment is due within 15 days.'"
                    value={businessInfo.service_details || ''}
                    onChange={(e) => updateBusinessInfo('service_details', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => handlePreview(selectedTemplate)}>
            <Eye className="mr-2 h-4 w-4" />
            Preview Selected Template
          </Button>
          <Button onClick={saveBusinessInformation} disabled={saving || loading}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Invoice Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}

interface TemplateOptionProps {
  value: string;
  title: string;
  onPreview: () => void;
  children: React.ReactNode;
}

function TemplateOption({ value, title, onPreview, children }: TemplateOptionProps) {
  return (
    <div className="relative">
      <RadioGroupItem value={value} id={`t-${value}`} className="peer sr-only" />
      <Label
        htmlFor={`t-${value}`}
        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
      >
        {children}
        <span className="mt-2 font-semibold">{title}</span>
      </Label>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/50 text-muted-foreground hover:bg-background hover:text-primary"
        onClick={(e) => {
          e.preventDefault();
          onPreview();
        }}
      >
        <Eye className="h-4 w-4" />
        <span className="sr-only">Preview {title}</span>
      </Button>
    </div>
  );
}
