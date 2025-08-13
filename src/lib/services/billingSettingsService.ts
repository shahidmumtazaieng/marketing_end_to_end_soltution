/**
 * Enhanced Billing Settings Service
 * Manages invoice templates, business information, and automatic invoice generation
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your_supabase_url_here';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_supabase_service_key_here';

export type InvoiceTemplate = 'modern' | 'classic' | 'vibrant';

export interface BusinessInformation {
  id?: string;
  user_id: string;
  business_name: string;
  business_address: string;
  business_phone: string;
  business_email: string;
  business_website?: string;
  tax_id?: string;
  logo_url?: string;
  
  // Payment details
  payment_terms: string; // e.g., "Payment due within 15 days"
  payment_methods: string[]; // e.g., ["Cash", "Card", "Bank Transfer"]
  bank_details?: {
    bank_name: string;
    account_number: string;
    routing_number: string;
  };
  
  // Invoice settings
  invoice_template: InvoiceTemplate;
  invoice_prefix: string; // e.g., "INV-"
  invoice_counter: number;
  currency_symbol: string;
  
  // Service details
  service_details: string; // Terms and conditions
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface InvoiceData {
  id?: string;
  invoice_number: string;
  order_id: string;
  user_id: string;
  vendor_id: string;
  
  // Business information
  business_info: BusinessInformation;
  
  // Customer information
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  customer_address: string;
  
  // Service information
  service_type: string;
  service_description: string;
  work_completed_date: string;
  
  // Pricing
  estimated_price: number;
  final_price: number;
  tax_amount?: number;
  total_amount: number;
  
  // Images
  before_images: string[];
  after_images: string[];
  
  // Invoice details
  invoice_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  
  // Generated files
  pdf_url?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

class BillingSettingsService {
  private supabase: SupabaseClient;
  private isInitialized = false;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async initialize(): Promise<void> {
    try {
      // Test connection
      const { data, error } = await this.supabase.from('business_information').select('count').limit(1);
      if (error && !error.message.includes('does not exist')) throw error;
      
      this.isInitialized = true;
      console.log('✅ Billing Settings Service initialized');
    } catch (error) {
      console.error('❌ Billing Settings Service initialization failed:', error);
      throw error;
    }
  }

  // ==========================================
  // BUSINESS INFORMATION MANAGEMENT
  // ==========================================

  /**
   * Save or update business information
   */
  async saveBusinessInformation(businessInfo: Omit<BusinessInformation, 'id' | 'created_at' | 'updated_at'>): Promise<BusinessInformation> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const now = new Date().toISOString();
      
      // Check if business info already exists for this user
      const { data: existing, error: fetchError } = await this.supabase
        .from('business_information')
        .select('*')
        .eq('user_id', businessInfo.user_id)
        .single();

      let result;
      
      if (existing) {
        // Update existing business information
        const { data, error } = await this.supabase
          .from('business_information')
          .update({
            ...businessInfo,
            updated_at: now,
          })
          .eq('user_id', businessInfo.user_id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new business information
        const { data, error } = await this.supabase
          .from('business_information')
          .insert({
            ...businessInfo,
            invoice_counter: businessInfo.invoice_counter || 1,
            created_at: now,
            updated_at: now,
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      console.log(`✅ Business information saved for user: ${businessInfo.user_id}`);
      return result;
    } catch (error) {
      console.error('Error saving business information:', error);
      throw error;
    }
  }

  /**
   * Get business information for user
   */
  async getBusinessInformation(userId: string): Promise<BusinessInformation | null> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const { data, error } = await this.supabase
        .from('business_information')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No data found
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching business information:', error);
      throw error;
    }
  }

  // ==========================================
  // AUTOMATIC INVOICE GENERATION
  // ==========================================

  /**
   * Generate invoice when order is completed
   */
  async generateInvoiceForCompletedOrder(orderData: {
    order_id: string;
    user_id: string;
    vendor_id: string;
    customer_name: string;
    customer_email?: string;
    customer_phone: string;
    customer_address: string;
    service_type: string;
    service_description: string;
    estimated_price: number;
    final_price: number;
    before_images: string[];
    after_images: string[];
  }): Promise<InvoiceData> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Get business information
      const businessInfo = await this.getBusinessInformation(orderData.user_id);
      if (!businessInfo) {
        throw new Error('Business information not found. Please set up billing settings first.');
      }

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(orderData.user_id);

      // Calculate dates
      const invoiceDate = new Date().toISOString();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 15); // 15 days payment terms

      // Calculate total amount (including tax if applicable)
      const taxAmount = 0; // Can be calculated based on business settings
      const totalAmount = orderData.final_price + taxAmount;

      // Create invoice data
      const invoiceData: Omit<InvoiceData, 'id' | 'created_at' | 'updated_at'> = {
        invoice_number: invoiceNumber,
        order_id: orderData.order_id,
        user_id: orderData.user_id,
        vendor_id: orderData.vendor_id,
        business_info: businessInfo,
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email,
        customer_phone: orderData.customer_phone,
        customer_address: orderData.customer_address,
        service_type: orderData.service_type,
        service_description: orderData.service_description,
        work_completed_date: new Date().toISOString(),
        estimated_price: orderData.estimated_price,
        final_price: orderData.final_price,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        before_images: orderData.before_images,
        after_images: orderData.after_images,
        invoice_date: invoiceDate,
        due_date: dueDate.toISOString(),
        status: 'draft',
      };

      // Save invoice to database
      const { data: savedInvoice, error } = await this.supabase
        .from('invoices')
        .insert({
          ...invoiceData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update invoice counter
      await this.updateInvoiceCounter(orderData.user_id);

      // Generate PDF (this would typically be done by a background service)
      await this.generateInvoicePDF(savedInvoice);

      // Send invoice to customer email if available
      if (orderData.customer_email) {
        await this.sendInvoiceToCustomer(savedInvoice);
      }

      console.log(`✅ Invoice generated: ${invoiceNumber} for order: ${orderData.order_id}`);
      return savedInvoice;
    } catch (error) {
      console.error('Error generating invoice:', error);
      throw error;
    }
  }

  /**
   * Generate unique invoice number
   */
  private async generateInvoiceNumber(userId: string): Promise<string> {
    try {
      const businessInfo = await this.getBusinessInformation(userId);
      if (!businessInfo) {
        throw new Error('Business information not found');
      }

      const prefix = businessInfo.invoice_prefix || 'INV-';
      const counter = businessInfo.invoice_counter || 1;
      const paddedCounter = counter.toString().padStart(4, '0');
      
      return `${prefix}${paddedCounter}`;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      throw error;
    }
  }

  /**
   * Update invoice counter
   */
  private async updateInvoiceCounter(userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('business_information')
        .update({
          invoice_counter: this.supabase.rpc('increment_invoice_counter'),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating invoice counter:', error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * Generate PDF invoice (placeholder - would use PDF generation service)
   */
  private async generateInvoicePDF(invoiceData: InvoiceData): Promise<string> {
    try {
      // This would typically call a PDF generation service
      // For now, we'll just create a placeholder URL
      const pdfUrl = `/api/invoices/${invoiceData.invoice_number}/pdf`;
      
      // Update invoice with PDF URL
      const { error } = await this.supabase
        .from('invoices')
        .update({
          pdf_url: pdfUrl,
          status: 'sent',
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceData.id);

      if (error) throw error;

      return pdfUrl;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Send invoice to customer email
   */
  private async sendInvoiceToCustomer(invoiceData: InvoiceData): Promise<void> {
    try {
      // This would typically integrate with an email service
      console.log(`📧 Sending invoice ${invoiceData.invoice_number} to ${invoiceData.customer_email}`);
      
      // Placeholder for email service integration
      // await emailService.sendInvoice(invoiceData);
    } catch (error) {
      console.error('Error sending invoice to customer:', error);
      // Don't throw error as this is not critical
    }
  }

  // ==========================================
  // INVOICE MANAGEMENT
  // ==========================================

  /**
   * Get invoices for user
   */
  async getUserInvoices(userId: string, limit: number = 50): Promise<InvoiceData[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const { data, error } = await this.supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching user invoices:', error);
      throw error;
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(invoiceId: string): Promise<InvoiceData | null> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const { data, error } = await this.supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching invoice by ID:', error);
      throw error;
    }
  }

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(invoiceId: string, status: InvoiceData['status']): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const { error } = await this.supabase
        .from('invoices')
        .update({
          status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      if (error) throw error;

      console.log(`✅ Invoice ${invoiceId} status updated to: ${status}`);
    } catch (error) {
      console.error('Error updating invoice status:', error);
      throw error;
    }
  }
}

export const billingSettingsService = new BillingSettingsService();
export default billingSettingsService;
