
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import ModernTemplate from '@/components/invoice-templates/modern';
import ClassicTemplate from '@/components/invoice-templates/classic';
import VibrantTemplate from '@/components/invoice-templates/vibrant';
import { sampleInvoice } from '@/lib/sample-data';

export type InvoiceTemplate = 'modern' | 'classic' | 'vibrant';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  template: InvoiceTemplate;
}

const templateMap = {
  modern: ModernTemplate,
  classic: ClassicTemplate,
  vibrant: VibrantTemplate,
};

export function InvoicePreviewModal({ isOpen, onOpenChange, template }: InvoicePreviewModalProps) {
  const SelectedTemplate = templateMap[template] || ModernTemplate;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Invoice Preview</DialogTitle>
          <DialogDescription>
            This is a preview of the '{template}' invoice template.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 bg-muted/40 rounded-lg">
            <div className="scale-[0.9] origin-top">
             <SelectedTemplate invoiceData={sampleInvoice} />
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
