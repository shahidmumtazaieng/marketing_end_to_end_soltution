
export interface InvoiceItem {
  description: string;
  qty: number;
  rate: number;
}

export interface InvoiceData {
  orderId: string;
  invoiceDate: string;
  dueDate?: string; // Optional as it's not used in all templates
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  clientName: string;
  clientAddress: string;
  clientPhone: string;
  items: InvoiceItem[];
  currencySymbol: string;
}

export const sampleInvoice: InvoiceData = {
  orderId: 'ORD-H459162',
  invoiceDate: 'July 31, 2024',
  companyName: 'LeadFlow Services',
  companyAddress: '123 Innovation Drive, Tech City, 12345',
  companyPhone: '+1 (555) 123-4567',
  clientName: 'Acme Corporation',
  clientAddress: '456 Business Ave, Suite 100, Metroburg',
  clientPhone: '+1 (555) 987-6543',
  currencySymbol: '¥',
  items: [
    { description: 'AC Repair & Maintenance', qty: 1, rate: 1000 },
    { description: 'Replaced Air Filter', qty: 2, rate: 250 },
    { description: 'Coolant Top-up', qty: 1, rate: 500 },
  ]
};
