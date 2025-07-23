
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Eye } from 'lucide-react';
import { InvoicePreviewModal } from '@/components/invoice-preview-modal';
import type { InvoiceTemplate } from '@/components/invoice-preview-modal';

export default function InvoiceSettingsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate>('modern');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [templateForPreview, setTemplateForPreview] = useState<InvoiceTemplate>('modern');

  const handlePreview = (template: InvoiceTemplate) => {
    setTemplateForPreview(template);
    setIsPreviewOpen(true);
  };
  
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

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select defaultValue="usd">
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usd">USD ($)</SelectItem>
                    <SelectItem value="eur">EUR (€)</SelectItem>
                    <SelectItem value="gbp">GBP (£)</SelectItem>
                    <SelectItem value="jpy">JPY (¥)</SelectItem>
                    <SelectItem value="cny">CNY (¥)</SelectItem>
                    <SelectItem value="inr">INR (₹)</SelectItem>
                    <SelectItem value="pkr">PKR (₨)</SelectItem>
                    <SelectItem value="cad">CAD (C$)</SelectItem>
                    <SelectItem value="aud">AUD (A$)</SelectItem>
                    <SelectItem value="nzd">NZD (NZ$)</SelectItem>
                    <SelectItem value="chf">CHF (CHF)</SelectItem>
                    <SelectItem value="rub">RUB (₽)</SelectItem>
                    <SelectItem value="sar">SAR (﷼)</SelectItem>
                    <SelectItem value="aed">AED (د.إ)</SelectItem>
                    <SelectItem value="try">TRY (₺)</SelectItem>
                    <SelectItem value="krw">KRW (₩)</SelectItem>
                    <SelectItem value="mxn">MXN (Mex$)</SelectItem>
                    <SelectItem value="brl">BRL (R$)</SelectItem>
                    <SelectItem value="zar">ZAR (R)</SelectItem>
                    <SelectItem value="idr">IDR (Rp)</SelectItem>
                    <SelectItem value="egp">EGP (E£)</SelectItem>
                    <SelectItem value="thb">THB (฿)</SelectItem>
                    <SelectItem value="bdt">BDT (৳)</SelectItem>
                    <SelectItem value="ngn">NGN (₦)</SelectItem>
                    <SelectItem value="php">PHP (₱)</SelectItem>
                    <SelectItem value="myr">MYR (RM)</SelectItem>
                    <SelectItem value="lkr">LKR (₨)</SelectItem>
                    <SelectItem value="npr">NPR (₨)</SelectItem>
                    <SelectItem value="afn">AFN (؋)</SelectItem>
                    <SelectItem value="iqd">IQD (ع.د)</SelectItem>
                    <SelectItem value="irr">IRR (﷼)</SelectItem>
                    <SelectItem value="kwd">KWD (د.ك)</SelectItem>
                    <SelectItem value="bhd">BHD (.د.ب)</SelectItem>
                    <SelectItem value="qar">QAR (ر.ق)</SelectItem>
                    <SelectItem value="omr">OMR (﷼)</SelectItem>
                    <SelectItem value="jod">JOD (د.ا)</SelectItem>
                    <SelectItem value="ils">ILS (₪)</SelectItem>
                    <SelectItem value="ves">VES (Bs.)</SelectItem>
                    <SelectItem value="ars">ARS (AR$)</SelectItem>
                    <SelectItem value="vnd">VND (₫)</SelectItem>
                    <SelectItem value="mmk">MMK (Ks)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankAccountName">Bank Account Name</Label>
                <Input id="bankAccountName" placeholder="e.g., John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
                <Input id="bankAccountNumber" placeholder="e.g., 1234567890" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input id="bankName" placeholder="e.g., Global Financial" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ifscCode">IFSC/SWIFT Code</Label>
                <Input id="ifscCode" placeholder="e.g., GFIN1234" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qrCode">Payment QR Code</Label>
              <Input id="qrCode" type="file" />
              <p className="text-sm text-muted-foreground">Upload an image of your payment QR code.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceDetails">Service Details / Terms</Label>
              <Textarea id="serviceDetails" placeholder="e.g., 'Thank you for your business. Payment is due within 15 days.'" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => handlePreview(selectedTemplate)}>
            <Eye className="mr-2 h-4 w-4" />
            Preview Selected Template
          </Button>
          <Button>Save Invoice Settings</Button>
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
