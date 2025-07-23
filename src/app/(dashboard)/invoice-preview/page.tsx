
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { InvoicePreviewModal } from '@/components/invoice-preview-modal';
import type { InvoiceTemplate } from '@/components/invoice-preview-modal';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function InvoicePreviewPage() {
  const [template, setTemplate] = useState<InvoiceTemplate>('modern');

  return (
    <div className="space-y-8">
       <Link href="/invoice-settings" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Invoice Settings
        </Link>
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Invoice Preview</h1>
        <p className="text-muted-foreground">Select a template to see a full-page preview.</p>
      </div>

      <div className="grid md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Select Template</CardTitle>
              <CardDescription>Choose a template to preview.</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={template} onValueChange={(val: InvoiceTemplate) => setTemplate(val)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="modern" id="r1" />
                  <Label htmlFor="r1">Modern</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="classic" id="r2" />
                  <Label htmlFor="r2">Classic</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="vibrant" id="r3" />
                  <Label htmlFor="r3">Vibrant</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-3">
           <div className="bg-muted/40 p-4 rounded-lg">
                <div className="scale-[0.8] lg:scale-[1] origin-top-left">
                  <InvoicePreviewModal isOpen={true} onOpenChange={() => {}} template={template} />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
