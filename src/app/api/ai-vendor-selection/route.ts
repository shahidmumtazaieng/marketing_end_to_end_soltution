import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'service_request',
      'available_vendors'
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

    // Validate service request structure
    const serviceRequest = body.service_request;
    const requiredRequestFields = [
      'request_id',
      'user_id',
      'customer_name',
      'customer_location',
      'service_type',
      'description',
      'priority',
      'estimated_value'
    ];

    for (const field of requiredRequestFields) {
      if (!serviceRequest[field]) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Missing required service request field: ${field}` 
          },
          { status: 400 }
        );
      }
    }

    // Validate customer location
    if (!serviceRequest.customer_location.latitude || !serviceRequest.customer_location.longitude) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Customer location must include latitude and longitude' 
        },
        { status: 400 }
      );
    }

    // Validate available vendors
    if (!Array.isArray(body.available_vendors) || body.available_vendors.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'At least one vendor must be provided' 
        },
        { status: 400 }
      );
    }

    // Call Python AI vendor selection service
    const selectionResult = await callAIVendorSelectionService({
      service_request: serviceRequest,
      available_vendors: body.available_vendors,
      api_key: process.env.OPENAI_API_KEY || body.api_key,
    });

    return NextResponse.json({
      success: true,
      data: selectionResult,
      message: 'AI vendor selection completed successfully',
      algorithm: 'pydantic_ai_langgraph_v1',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in AI vendor selection:', error);
    
    // Handle specific error cases
    let errorMessage = 'Failed to perform AI vendor selection';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('Python service unavailable')) {
        errorMessage = 'AI vendor selection service is currently unavailable';
        statusCode = 503;
      } else if (error.message.includes('Invalid API key')) {
        errorMessage = 'Invalid or missing OpenAI API key';
        statusCode = 401;
      } else if (error.message.includes('No suitable vendors')) {
        errorMessage = 'No suitable vendors found for the service request';
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
          source: 'ai-vendor-selection',
        }
      },
      { status: statusCode }
    );
  }
}

/**
 * Call Python AI vendor selection service
 */
async function callAIVendorSelectionService(data: {
  service_request: any;
  available_vendors: any[];
  api_key: string;
}): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      // Path to Python script
      const pythonScriptPath = path.join(process.cwd(), 'python_services', 'ai_vendor_selection_api.py');
      
      // Spawn Python process
      const pythonProcess = spawn('python', [pythonScriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          OPENAI_API_KEY: data.api_key,
        }
      });

      let outputData = '';
      let errorData = '';

      // Send input data to Python process
      pythonProcess.stdin.write(JSON.stringify(data));
      pythonProcess.stdin.end();

      // Collect output data
      pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
      });

      // Collect error data
      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      // Handle process completion
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(outputData);
            resolve(result);
          } catch (parseError) {
            reject(new Error(`Failed to parse Python service response: ${parseError}`));
          }
        } else {
          reject(new Error(`Python service failed with code ${code}: ${errorData}`));
        }
      });

      // Handle process errors
      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to start Python service: ${error.message}`));
      });

      // Set timeout
      setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('Python service timeout'));
      }, 30000); // 30 second timeout

    } catch (error) {
      reject(error);
    }
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const healthCheck = searchParams.get('health');

    if (healthCheck === 'true') {
      // Health check for AI vendor selection service
      try {
        const testResult = await callAIVendorSelectionService({
          service_request: {
            request_id: 'health-check',
            user_id: 'test',
            customer_name: 'Test Customer',
            customer_location: { latitude: 40.7128, longitude: -74.0060 },
            service_type: 'AC Repair',
            description: 'Health check',
            priority: 'low',
            estimated_value: 100.0,
          },
          available_vendors: [{
            vendor_id: 'test-vendor',
            name: 'Test Vendor',
            email: 'test@example.com',
            phone: '+1-555-0123',
            services: ['AC Repair'],
            location: { latitude: 40.7128, longitude: -74.0060 },
            status: 'active',
            total_orders: 10,
            completed_orders: 9,
            average_rating: 4.5,
            is_online: true,
            current_orders: 0,
          }],
          api_key: process.env.OPENAI_API_KEY || 'test-key',
        });

        return NextResponse.json({
          success: true,
          status: 'healthy',
          message: 'AI vendor selection service is operational',
          test_result: testResult,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        return NextResponse.json({
          success: false,
          status: 'unhealthy',
          message: 'AI vendor selection service is not operational',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        }, { status: 503 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'AI Vendor Selection API',
      endpoints: {
        'POST /': 'Perform AI-powered vendor selection',
        'GET /?health=true': 'Health check for AI service',
      },
      features: [
        'Pydantic AI integration',
        'LangGraph workflow',
        'Multi-factor vendor scoring',
        'Intelligent decision making',
        'Performance optimization',
        'Fair opportunity distribution',
      ],
      version: '1.0.0',
    });

  } catch (error) {
    console.error('Error in AI vendor selection GET:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
