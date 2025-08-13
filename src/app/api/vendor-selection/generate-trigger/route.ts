import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { aiTriggerGenerator, TriggerRequirements } from '@/lib/services/aiTriggerGenerator';

/**
 * POST /api/vendor-selection/generate-trigger
 * Generate optimized trigger point using AI
 */
export async function POST(request: NextRequest) {
  try {
    // Get user ID from authentication
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const userId = getUserIdFromAuth(authorization);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      business_context,
      trigger_type,
      specific_requirements,
      priority_level,
      response_time_requirement,
      additional_context
    } = body;

    // Validate required fields
    if (!business_context || !trigger_type) {
      return NextResponse.json(
        { success: false, error: 'Business context and trigger type are required' },
        { status: 400 }
      );
    }

    console.log(`🤖 Generating AI trigger point for user ${userId}:`, {
      business_type: business_context.business_type,
      trigger_type,
      priority_level
    });

    // Prepare trigger requirements
    const requirements: TriggerRequirements = {
      trigger_type,
      business_context,
      specific_requirements: specific_requirements || '',
      priority_level: priority_level || 3,
      response_time_requirement: response_time_requirement || 'within 30 minutes',
      additional_context: additional_context || ''
    };

    // Generate trigger point using AI
    const generatedTrigger = await aiTriggerGenerator.generateTriggerPoint(requirements);

    // Log generation result
    console.log(`✅ AI trigger generated:`, {
      name: generatedTrigger.name,
      keywords_count: generatedTrigger.keywords.length,
      quality_score: generatedTrigger.quality_score,
      confidence_threshold: generatedTrigger.confidence_threshold
    });

    // Store generation activity for analytics
    await logTriggerGeneration(userId, requirements, generatedTrigger);

    return NextResponse.json({
      success: true,
      generated_trigger: generatedTrigger,
      generation_info: {
        quality_score: generatedTrigger.quality_score,
        keywords_count: generatedTrigger.keywords.length,
        alternative_phrases_count: generatedTrigger.alternative_phrases?.length || 0,
        example_conversations_count: (generatedTrigger.example_conversations?.positive_examples?.length || 0) +
                                   (generatedTrigger.example_conversations?.negative_examples?.length || 0),
        optimization_notes_count: generatedTrigger.optimization_notes?.length || 0
      },
      message: 'AI-optimized trigger point generated successfully'
    });

  } catch (error) {
    console.error('AI trigger generation error:', error);
    
    // Return specific error messages for different failure types
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'AI API configuration required. Please configure your LLM API keys in Settings → API Keys.',
            error_type: 'missing_api_key'
          },
          { status: 400 }
        );
      } else if (error.message.includes('API error')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'AI service temporarily unavailable. Please try again.',
            error_type: 'api_error'
          },
          { status: 503 }
        );
      } else if (error.message.includes('Invalid AI response')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'AI generated invalid response. Please try again with different parameters.',
            error_type: 'invalid_response'
          },
          { status: 422 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate AI trigger point. Please try again.',
        error_type: 'generation_failed'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/vendor-selection/generate-trigger/templates
 * Get business context templates for AI generation
 */
export async function GET(request: NextRequest) {
  try {
    // Get user ID from authentication
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const userId = getUserIdFromAuth(authorization);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Business context templates for AI generation
    const businessTemplates = {
      cleaning_services: {
        business_type: 'Commercial Cleaning Services',
        service_description: 'Professional office and commercial space cleaning',
        target_customers: 'Office buildings, retail stores, medical facilities, restaurants',
        service_area: 'Local metropolitan area',
        typical_scenarios: [
          'Regular weekly/monthly cleaning contracts',
          'One-time deep cleaning projects',
          'Emergency cleanup situations',
          'Post-construction cleanup',
          'Event cleanup services'
        ],
        pain_points: [
          'Customers need immediate response for emergencies',
          'Scheduling conflicts with business hours',
          'Specific cleaning requirements for different industries',
          'Quality assurance and customer satisfaction'
        ],
        urgency_levels: ['Emergency (same day)', 'Urgent (within 24 hours)', 'Standard (within week)', 'Scheduled (planned)']
      },
      maintenance_services: {
        business_type: 'Facility Maintenance Services',
        service_description: 'Equipment repair and facility maintenance',
        target_customers: 'Office buildings, manufacturing facilities, retail chains, hospitals',
        service_area: 'Regional service coverage',
        typical_scenarios: [
          'HVAC system repairs and maintenance',
          'Electrical system troubleshooting',
          'Plumbing repairs and installations',
          'Preventive maintenance schedules',
          'Emergency equipment failures'
        ],
        pain_points: [
          'Equipment downtime costs customers money',
          'Emergency repairs need immediate response',
          'Specialized technician requirements',
          'Parts availability and procurement'
        ],
        urgency_levels: ['Critical emergency', 'Urgent repair', 'Scheduled maintenance', 'Preventive service']
      },
      delivery_services: {
        business_type: 'Courier and Delivery Services',
        service_description: 'Same-day and scheduled delivery services',
        target_customers: 'Businesses, medical facilities, legal offices, e-commerce companies',
        service_area: 'City-wide and regional delivery',
        typical_scenarios: [
          'Same-day document delivery',
          'Medical specimen transport',
          'Legal document filing',
          'E-commerce last-mile delivery',
          'Bulk commercial deliveries'
        ],
        pain_points: [
          'Time-sensitive deliveries with strict deadlines',
          'Special handling requirements',
          'Traffic and route optimization',
          'Proof of delivery requirements'
        ],
        urgency_levels: ['Immediate (within 2 hours)', 'Same day', 'Next day', 'Scheduled delivery']
      },
      landscaping_services: {
        business_type: 'Commercial Landscaping Services',
        service_description: 'Landscape design, installation, and maintenance',
        target_customers: 'Corporate campuses, retail centers, apartment complexes, municipal properties',
        service_area: 'Local and surrounding counties',
        typical_scenarios: [
          'Weekly lawn maintenance contracts',
          'Seasonal landscape installation',
          'Irrigation system maintenance',
          'Tree and shrub care',
          'Snow removal services'
        ],
        pain_points: [
          'Weather-dependent scheduling',
          'Seasonal demand fluctuations',
          'Equipment and crew coordination',
          'Property access and timing'
        ],
        urgency_levels: ['Emergency (storm damage)', 'Urgent (within week)', 'Scheduled maintenance', 'Seasonal projects']
      },
      security_services: {
        business_type: 'Security Systems and Services',
        service_description: 'Security system installation, monitoring, and consultation',
        target_customers: 'Office buildings, retail stores, warehouses, residential complexes',
        service_area: 'Metropolitan area coverage',
        typical_scenarios: [
          'Security system installations',
          'Access control setup',
          'Camera system maintenance',
          'Security assessments',
          'Emergency response services'
        ],
        pain_points: [
          'Security breaches require immediate response',
          'System downtime creates vulnerabilities',
          'Compliance and regulatory requirements',
          'Integration with existing systems'
        ],
        urgency_levels: ['Security emergency', 'System failure', 'Scheduled installation', 'Routine maintenance']
      }
    };

    // Trigger type templates
    const triggerTypeTemplates = {
      appointment_booking: {
        name: 'Appointment Booking',
        description: 'Customer wants to schedule a service appointment',
        typical_requirements: 'Customer name, location, preferred date/time, service type',
        common_scenarios: ['Initial service request', 'Follow-up appointment', 'Recurring service setup']
      },
      quotation_sending: {
        name: 'Quote Request',
        description: 'Customer asks for pricing or cost estimation',
        typical_requirements: 'Customer details, service scope, location, timeline',
        common_scenarios: ['Price inquiry', 'Proposal request', 'Budget planning']
      },
      order_booking: {
        name: 'Order Confirmation',
        description: 'Customer confirms they want to proceed with service',
        typical_requirements: 'All service details confirmed, payment method, scheduling',
        common_scenarios: ['Service confirmation', 'Contract signing', 'Work authorization']
      },
      location_visit: {
        name: 'Site Visit Request',
        description: 'Customer agrees to on-site visit or inspection',
        typical_requirements: 'Customer name, address, access details, visit purpose',
        common_scenarios: ['Assessment visit', 'Consultation', 'Problem diagnosis']
      },
      service_inquiry: {
        name: 'Service Interest',
        description: 'Customer shows interest and wants more information',
        typical_requirements: 'Customer contact info, service interest area',
        common_scenarios: ['Initial inquiry', 'Information request', 'Capability questions']
      },
      emergency_service: {
        name: 'Emergency Service',
        description: 'Customer has urgent service needs requiring immediate response',
        typical_requirements: 'Customer details, location, nature of emergency, immediate availability',
        common_scenarios: ['Equipment failure', 'Safety issues', 'Urgent repairs', 'Crisis situations']
      }
    };

    return NextResponse.json({
      success: true,
      business_templates: businessTemplates,
      trigger_type_templates: triggerTypeTemplates,
      generation_tips: [
        'Be specific about your business type and typical customer scenarios',
        'Include common pain points and urgency levels your customers experience',
        'Describe your service area and target customer types',
        'Mention any industry-specific terminology or requirements',
        'Consider seasonal or time-sensitive aspects of your business'
      ]
    });

  } catch (error) {
    console.error('Get AI templates error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve AI generation templates' },
      { status: 500 }
    );
  }
}

/**
 * Log trigger generation activity for analytics
 */
async function logTriggerGeneration(userId: string, requirements: TriggerRequirements, result: any) {
  try {
    const logEntry = {
      user_id: userId,
      business_type: requirements.business_context.business_type,
      trigger_type: requirements.trigger_type,
      quality_score: result.quality_score,
      keywords_generated: result.keywords.length,
      generation_timestamp: new Date().toISOString(),
      success: true
    };

    console.log('AI trigger generation logged:', logEntry);

    // In production, save to analytics database
    /*
    await db.ai_generation_logs.create({
      data: logEntry
    });
    */

  } catch (error) {
    console.error('Failed to log trigger generation:', error);
    // Don't throw error for logging failures
  }
}

/**
 * Extract user ID from authorization header
 */
function getUserIdFromAuth(authorization: string | null): string | null {
  if (!authorization) return null;
  
  try {
    const token = authorization.replace('Bearer ', '');
    return 'user_123'; // Replace with actual user ID extraction
  } catch (error) {
    console.error('Auth extraction error:', error);
    return null;
  }
}
