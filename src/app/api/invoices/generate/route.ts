import { NextRequest, NextResponse } from 'next/server';
import billingSettingsService from '@/lib/services/billingSettingsService';

export async function POST(request: NextRequest) {
  try {
    // Initialize billing settings service
    await billingSettingsService.initialize();

    const body = await request.json();
    
    // Validate required fields for invoice generation
    const requiredFields = [
      'order_id',
      'user_id',
      'vendor_id',
      'customer_name',
      'customer_phone',
      'customer_address',
      'service_type',
      'service_description',
      'estimated_price',
      'final_price'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Missing required field: ${field}` 
          },
          { status: 400 }
        );
      }
    }

    // Validate price fields
    if (isNaN(body.estimated_price) || isNaN(body.final_price)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Estimated price and final price must be valid numbers' 
        },
        { status: 400 }
      );
    }

    if (body.final_price < 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Final price cannot be negative' 
        },
        { status: 400 }
      );
    }

    // Prepare invoice data
    const invoiceData = {
      order_id: body.order_id,
      user_id: body.user_id,
      vendor_id: body.vendor_id,
      customer_name: body.customer_name,
      customer_email: body.customer_email || null,
      customer_phone: body.customer_phone,
      customer_address: body.customer_address,
      service_type: body.service_type,
      service_description: body.service_description,
      estimated_price: parseFloat(body.estimated_price),
      final_price: parseFloat(body.final_price),
      before_images: body.before_images || [],
      after_images: body.after_images || [],
    };

    // Generate invoice
    const generatedInvoice = await billingSettingsService.generateInvoiceForCompletedOrder(invoiceData);

    return NextResponse.json({
      success: true,
      data: {
        invoice_id: generatedInvoice.id,
        invoice_number: generatedInvoice.invoice_number,
        invoice_date: generatedInvoice.invoice_date,
        due_date: generatedInvoice.due_date,
        total_amount: generatedInvoice.total_amount,
        status: generatedInvoice.status,
        pdf_url: generatedInvoice.pdf_url,
      },
      message: `Invoice ${generatedInvoice.invoice_number} generated successfully`,
    });

  } catch (error) {
    console.error('Error generating invoice:', error);
    
    // Handle specific error cases
    let errorMessage = 'Failed to generate invoice';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('Business information not found')) {
        errorMessage = 'Business information not found. Please set up billing settings first.';
        statusCode = 400;
      } else if (error.message.includes('Order not found')) {
        errorMessage = 'Order not found';
        statusCode = 404;
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        message: error instanceof Error ? error.message : 'Unknown error',
        details: {
          timestamp: new Date().toISOString(),
          source: 'invoice-generation',
        }
      },
      { status: statusCode }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Initialize billing settings service
    await billingSettingsService.initialize();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;

    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User ID is required' 
        },
        { status: 400 }
      );
    }

    // Get user invoices
    const invoices = await billingSettingsService.getUserInvoices(userId, limit);

    // Transform data for frontend
    const transformedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      order_id: invoice.order_id,
      customer_name: invoice.customer_name,
      customer_email: invoice.customer_email,
      service_type: invoice.service_type,
      total_amount: invoice.total_amount,
      status: invoice.status,
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date,
      pdf_url: invoice.pdf_url,
      created_at: invoice.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: transformedInvoices,
      total: transformedInvoices.length,
      message: 'Invoices retrieved successfully',
    });

  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch invoices',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
