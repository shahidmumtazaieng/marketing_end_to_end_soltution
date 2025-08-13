"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Settings,
  Zap,
  Users,
  MapPin,
  Mail,
  Bell,
  Target,
  Brain,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  Loader2,
  Info,
  ExternalLink,
  Clock,
  Star,
  TrendingUp
} from 'lucide-react';

interface TriggerPoint {
  id: string;
  name: string;
  type: 'location_visit' | 'quotation_sending' | 'order_booking' | 'service_inquiry' | 'emergency_service' | 'custom';
  description: string;
  instructions: string;
  keywords: string[];
  conditions: {
    customer_name_required: boolean;
    location_required: boolean;
    contact_details_required: boolean;
    service_type_required: boolean;
    budget_mentioned: boolean;
    timeline_mentioned: boolean;
  };
  actions: {
    send_customer_email: boolean;
    notify_vendors: boolean;
    create_order: boolean;
    priority_level: number;
  };
  vendor_selection_criteria: {
    location_radius: number; // in km
    min_rating: number;
    max_vendors_to_notify: number;
    prefer_available: boolean;
    work_type_match: boolean;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface VendorSelectionSettings {
  global_settings: {
    auto_vendor_selection: boolean;
    default_location_radius: number;
    min_vendor_rating: number;
    max_response_time: number; // minutes
    business_hours_only: boolean;
    weekend_operations: boolean;
  };
  email_templates: {
    customer_confirmation: string;
    vendor_notification: string;
  };
  notification_settings: {
    email_notifications: boolean;
    sms_notifications: boolean;
    push_notifications: boolean;
    webhook_url?: string;
  };
}

export default function VendorSelectionSettingsPage() {
  // State management
  const [triggerPoints, setTriggerPoints] = useState<TriggerPoint[]>([]);
  const [settings, setSettings] = useState<VendorSelectionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrigger, setSelectedTrigger] = useState<TriggerPoint | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBusinessRole, setSelectedBusinessRole] = useState<string>('general');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showManualInstructions, setShowManualInstructions] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiBusinessContext, setAiBusinessContext] = useState({
    business_type: '',
    service_description: '',
    target_customers: '',
    service_area: '',
    typical_scenarios: [''],
    pain_points: [''],
    urgency_levels: ['']
  });
  const [aiTriggerType, setAiTriggerType] = useState('location_visit');
  const [aiSpecificRequirements, setAiSpecificRequirements] = useState('');
  const [aiAdditionalContext, setAiAdditionalContext] = useState('');

  // Form state for trigger point creation/editing
  const [formData, setFormData] = useState<Partial<TriggerPoint>>({
    name: '',
    type: 'location_visit',
    description: '',
    instructions: '',
    keywords: [],
    conditions: {
      customer_name_required: true,
      location_required: true,
      contact_details_required: true,
      service_type_required: false,
      budget_mentioned: false,
      timeline_mentioned: false
    },
    actions: {
      send_customer_email: true,
      notify_vendors: true,
      create_order: true,
      priority_level: 3
    },
    vendor_selection_criteria: {
      location_radius: 10,
      min_rating: 4.0,
      max_vendors_to_notify: 3,
      prefer_available: true,
      work_type_match: true
    },
    is_active: true
  });

  // Enhanced role-based trigger point templates
  const triggerTemplatesByRole = {
    // CLEANING SERVICES
    cleaning_services: {
      location_visit: {
        name: 'Cleaning Site Visit Request',
        description: 'Customer wants cleaner to visit their location for service or assessment',
        instructions: 'Trigger when customer requests cleaning service at their location or wants assessment visit. Must have customer name, address, and service type. Example: "Can you come clean our office?" or "We need someone to look at our facility"',
        keywords: ['come clean', 'visit', 'come over', 'send someone', 'at our location', 'our office', 'our building', 'site visit', 'look at'],
        example_conversation: 'Customer: "Can you send someone to clean our office building next week?" → TRIGGER: Location service request + cleaning need',
        business_context: 'Perfect for cleaning companies that provide on-site services at customer locations',
        conditions: {
          customer_name_required: true,
          location_required: true,
          contact_details_required: true,
          service_type_required: true,
          budget_mentioned: false,
          timeline_mentioned: true
        }
      },
      quotation_request: {
        name: 'Cleaning Quote Request',
        description: 'Customer asks for cleaning service pricing or estimates',
        instructions: 'Trigger when customer asks about cleaning costs, pricing, or wants a quote. Must collect property details and cleaning requirements. Example: "How much do you charge for office cleaning?"',
        keywords: ['price', 'cost', 'quote', 'estimate', 'how much', 'pricing', 'rate', 'charge'],
        example_conversation: 'Customer: "What do you charge for weekly office cleaning? It\'s a 2000 sq ft space." → TRIGGER: Pricing inquiry + property details',
        business_context: 'Ideal for getting detailed quotes to customers quickly',
        conditions: {
          customer_name_required: true,
          location_required: true,
          contact_details_required: true,
          service_type_required: true,
          budget_mentioned: false,
          timeline_mentioned: false
        }
      },
      emergency_service: {
        name: 'Emergency Cleaning Request',
        description: 'Customer needs urgent/emergency cleaning services',
        instructions: 'Trigger for urgent cleaning needs like spills, accidents, or emergency situations. High priority - immediate vendor notification. Example: "We had a water leak and need emergency cleanup"',
        keywords: ['emergency', 'urgent', 'immediate', 'asap', 'right now', 'spill', 'accident', 'flood', 'leak'],
        example_conversation: 'Customer: "We had a pipe burst and need emergency water cleanup right now!" → TRIGGER: Emergency keywords + immediate need',
        business_context: 'Critical for emergency response cleaning services',
        conditions: {
          customer_name_required: true,
          location_required: true,
          contact_details_required: true,
          service_type_required: true,
          budget_mentioned: false,
          timeline_mentioned: true
        }
      }
    },

    // MAINTENANCE SERVICES
    maintenance_services: {
      service_call_request: {
        name: 'Maintenance Service Call',
        description: 'Customer needs technician to visit location for repair or maintenance',
        instructions: 'Trigger when customer requests maintenance technician to visit their location for repairs, service, or troubleshooting. Must have location and problem description. Example: "Can you send a technician to fix our HVAC?"',
        keywords: ['send technician', 'come fix', 'service call', 'visit', 'come out', 'look at', 'repair on-site', 'at our location'],
        example_conversation: 'Customer: "Can you send someone to look at our broken elevator?" → TRIGGER: Service call request + location visit needed',
        business_context: 'Essential for maintenance companies that provide on-site repair services',
        conditions: {
          customer_name_required: true,
          location_required: true,
          contact_details_required: true,
          service_type_required: true,
          budget_mentioned: false,
          timeline_mentioned: true
        }
      },
      repair_request: {
        name: 'Equipment Repair Request',
        description: 'Customer reports equipment or facility issues needing repair',
        instructions: 'Trigger when customer reports broken equipment, facility issues, or maintenance needs. Must identify problem type and urgency. Example: "Our HVAC system is not working"',
        keywords: ['repair', 'fix', 'broken', 'not working', 'maintenance', 'service', 'problem', 'issue', 'malfunction', 'down'],
        example_conversation: 'Customer: "Our elevator is stuck between floors and we need immediate repair" → TRIGGER: Repair need + urgency indicated',
        business_context: 'Essential for maintenance companies handling equipment repairs',
        conditions: {
          customer_name_required: true,
          location_required: true,
          contact_details_required: true,
          service_type_required: true,
          budget_mentioned: false,
          timeline_mentioned: true
        }
      },
      inspection_request: {
        name: 'Maintenance Inspection',
        description: 'Customer wants preventive maintenance or safety inspection',
        instructions: 'Trigger for scheduled inspections, preventive maintenance, or safety checks. Example: "We need our fire safety systems inspected"',
        keywords: ['inspection', 'check', 'maintenance', 'safety', 'preventive', 'service', 'examine'],
        example_conversation: 'Customer: "We need quarterly HVAC maintenance and inspection for our building" → TRIGGER: Inspection request + maintenance type',
        business_context: 'Perfect for scheduled maintenance and inspection services',
        conditions: {
          customer_name_required: true,
          location_required: true,
          contact_details_required: true,
          service_type_required: true,
          budget_mentioned: false,
          timeline_mentioned: true
        }
      }
    },

    // DELIVERY SERVICES
    delivery_services: {
      pickup_delivery_request: {
        name: 'Pickup & Delivery Request',
        description: 'Customer needs items picked up from their location and delivered',
        instructions: 'Trigger when customer needs pickup and delivery service. Must have pickup location, delivery location, and item details. Example: "Can you pick up documents from our office and deliver to the courthouse?"',
        keywords: ['pickup', 'pick up', 'collect', 'delivery', 'deliver', 'transport', 'courier', 'send', 'take from', 'bring to'],
        example_conversation: 'Customer: "I need same-day pickup from our office and delivery to the airport. Can you handle that?" → TRIGGER: Pickup/delivery request + locations + timeline',
        business_context: 'Ideal for courier and delivery service companies that pickup from customer locations',
        conditions: {
          customer_name_required: true,
          location_required: true,
          contact_details_required: true,
          service_type_required: true,
          budget_mentioned: false,
          timeline_mentioned: true
        }
      },
      bulk_delivery: {
        name: 'Bulk/Commercial Delivery',
        description: 'Customer needs large or commercial delivery services',
        instructions: 'Trigger for bulk deliveries, commercial shipments, or large item transport. Example: "We need to move office furniture between buildings"',
        keywords: ['bulk', 'commercial', 'large', 'furniture', 'equipment', 'moving', 'transport'],
        example_conversation: 'Customer: "We\'re relocating our office and need to move 50 desks and computers" → TRIGGER: Bulk delivery + commercial context',
        business_context: 'Perfect for commercial moving and bulk delivery services',
        conditions: {
          customer_name_required: true,
          location_required: true,
          contact_details_required: true,
          service_type_required: true,
          budget_mentioned: true,
          timeline_mentioned: true
        }
      }
    },

    // LANDSCAPING SERVICES
    landscaping_services: {
      property_service_request: {
        name: 'Property Landscaping Service',
        description: 'Customer needs landscaping services at their property location',
        instructions: 'Trigger when customer requests landscaping services at their property. Must have property location and service type. Example: "Can you come maintain our office landscaping?"',
        keywords: ['come maintain', 'service our property', 'at our location', 'our grounds', 'property maintenance', 'on-site', 'visit property'],
        example_conversation: 'Customer: "Can you come service our office complex landscaping weekly?" → TRIGGER: Property service request + location specified',
        business_context: 'Essential for landscaping companies that service customer properties',
        conditions: {
          customer_name_required: true,
          location_required: true,
          contact_details_required: true,
          service_type_required: true,
          budget_mentioned: false,
          timeline_mentioned: true
        }
      },
      lawn_maintenance: {
        name: 'Lawn Care & Maintenance',
        description: 'Customer needs regular lawn care or landscaping maintenance',
        instructions: 'Trigger for lawn mowing, landscaping maintenance, or garden care services. Example: "We need weekly lawn service for our office complex"',
        keywords: ['lawn', 'grass', 'mowing', 'landscaping', 'garden', 'maintenance', 'yard', 'grounds', 'property care'],
        example_conversation: 'Customer: "Our office complex needs weekly lawn mowing and monthly landscaping maintenance" → TRIGGER: Lawn service + regular maintenance',
        business_context: 'Essential for landscaping and lawn care businesses',
        conditions: {
          customer_name_required: true,
          location_required: true,
          contact_details_required: true,
          service_type_required: true,
          budget_mentioned: false,
          timeline_mentioned: true
        }
      },
      landscape_design: {
        name: 'Landscape Design Project',
        description: 'Customer wants landscape design or installation services',
        instructions: 'Trigger for landscape design, installation, or major landscaping projects. Example: "We want to redesign our front entrance landscaping"',
        keywords: ['design', 'landscaping', 'installation', 'project', 'redesign', 'new', 'create'],
        example_conversation: 'Customer: "We want to completely redesign our corporate headquarters landscaping" → TRIGGER: Design project + major scope',
        business_context: 'Perfect for landscape design and installation companies',
        conditions: {
          customer_name_required: true,
          location_required: true,
          contact_details_required: true,
          service_type_required: true,
          budget_mentioned: true,
          timeline_mentioned: true
        }
      }
    },

    // SECURITY SERVICES
    security_services: {
      site_security_assessment: {
        name: 'On-Site Security Assessment',
        description: 'Customer wants security professional to visit and assess their location',
        instructions: 'Trigger when customer requests security assessment or consultation at their location. Must have site location and assessment type. Example: "Can you come assess our building security?"',
        keywords: ['come assess', 'visit our site', 'security evaluation', 'on-site assessment', 'at our location', 'inspect our building'],
        example_conversation: 'Customer: "Can you send someone to assess the security of our new office building?" → TRIGGER: On-site assessment request + location specified',
        business_context: 'Ideal for security companies that provide on-site assessment services',
        conditions: {
          customer_name_required: true,
          location_required: true,
          contact_details_required: true,
          service_type_required: true,
          budget_mentioned: false,
          timeline_mentioned: true
        }
      },
      security_assessment: {
        name: 'Security Assessment Request',
        description: 'Customer wants security evaluation or consultation',
        instructions: 'Trigger when customer needs security assessment, consultation, or evaluation. Example: "We need a security assessment for our new office"',
        keywords: ['security', 'assessment', 'evaluation', 'consultation', 'review', 'audit', 'security check'],
        example_conversation: 'Customer: "We just moved to a new building and need a complete security assessment" → TRIGGER: Security need + assessment request',
        business_context: 'Ideal for security consulting and assessment services',
        conditions: {
          customer_name_required: true,
          location_required: true,
          contact_details_required: true,
          service_type_required: true,
          budget_mentioned: false,
          timeline_mentioned: true
        }
      },
      security_installation: {
        name: 'Security System Installation',
        description: 'Customer wants security systems installed or upgraded',
        instructions: 'Trigger for security system installation, camera setup, or access control installation. Example: "We need security cameras installed in our warehouse"',
        keywords: ['install', 'installation', 'cameras', 'security system', 'access control', 'setup'],
        example_conversation: 'Customer: "We need to install security cameras and access control for our new facility" → TRIGGER: Installation request + security systems',
        business_context: 'Perfect for security installation companies',
        conditions: {
          customer_name_required: true,
          location_required: true,
          contact_details_required: true,
          service_type_required: true,
          budget_mentioned: true,
          timeline_mentioned: true
        }
      }
    },

    // GENERAL/CUSTOM TEMPLATES
    general: {
      service_visit_request: {
        name: 'General Service Visit Request',
        description: 'Customer requests service provider to visit their location',
        instructions: 'Trigger when customer requests service at their location or wants provider to visit. Ensure customer provides name, location, and service type. Example: "Can you come service our equipment?"',
        keywords: ['come service', 'visit', 'come over', 'at our location', 'send someone', 'come out', 'on-site service'],
        example_conversation: 'Customer: "Can you send someone to look at our equipment?" → TRIGGER: Service visit request + location specified',
        business_context: 'Universal template for any location-based service business',
        conditions: {
          customer_name_required: true,
          location_required: true,
          contact_details_required: true,
          service_type_required: true,
          budget_mentioned: false,
          timeline_mentioned: true
        }
      },
      quotation_sending: {
        name: 'General Quotation Request',
        description: 'Customer asks for price quote or cost estimation',
        instructions: 'Trigger when customer asks about pricing, costs, quotes, or estimates. Collect service details and location for accurate quotation.',
        keywords: ['quote', 'price', 'cost', 'estimate', 'how much', 'pricing'],
        example_conversation: 'Customer: "What would it cost to service our building monthly?" → TRIGGER: Pricing inquiry + service scope',
        business_context: 'Universal template for any service business providing quotes',
        conditions: {
          customer_name_required: true,
          location_required: true,
          contact_details_required: true,
          service_type_required: true,
          budget_mentioned: false,
          timeline_mentioned: false
        }
      },
      order_booking: {
        name: 'General Order Confirmation',
        description: 'Customer confirms order or wants to proceed with service',
        instructions: 'Trigger when customer confirms they want to proceed, book the service, or place an order. Ensure all details are collected.',
        keywords: ['book', 'order', 'proceed', 'confirm', 'yes', 'go ahead'],
        example_conversation: 'Customer: "Yes, let\'s go ahead and book this service for next week" → TRIGGER: Confirmation + booking intent',
        business_context: 'Universal template for confirming service orders',
        conditions: {
          customer_name_required: true,
          location_required: true,
          contact_details_required: true,
          service_type_required: true,
          budget_mentioned: true,
          timeline_mentioned: true
        }
      },
      location_visit: {
        name: 'General Location Visit',
        description: 'Customer agrees to location visit or site inspection',
        instructions: 'Trigger when customer agrees to have someone visit their location for inspection, assessment, or service delivery.',
        keywords: ['visit', 'come over', 'inspection', 'assessment', 'site visit', 'location'],
        example_conversation: 'Customer: "Yes, you can come take a look at our facility next Tuesday" → TRIGGER: Visit agreement + location access',
        business_context: 'Universal template for any location-based service',
        conditions: {
          customer_name_required: true,
          location_required: true,
          contact_details_required: true,
          service_type_required: false,
          budget_mentioned: false,
          timeline_mentioned: true
        }
      },
      service_inquiry: {
        name: 'General Service Inquiry',
        description: 'Customer shows interest in services and provides details',
        instructions: 'Trigger when customer shows genuine interest and provides their details for follow-up.',
        keywords: ['interested', 'tell me more', 'details', 'information', 'help'],
        example_conversation: 'Customer: "I\'m interested in your services. Can you tell me more about what you offer?" → TRIGGER: Interest + information request',
        business_context: 'Universal template for initial service inquiries',
        conditions: {
          customer_name_required: true,
          location_required: false,
          contact_details_required: true,
          service_type_required: false,
          budget_mentioned: false,
          timeline_mentioned: false
        }
      }
    }
  };

  // Business role categories for easy selection
  const businessRoles = [
    {
      key: 'cleaning_services',
      name: 'Cleaning Services',
      description: 'Office cleaning, residential cleaning, commercial cleaning',
      icon: '🧹',
      examples: ['Office cleaning', 'Residential cleaning', 'Commercial cleaning', 'Carpet cleaning']
    },
    {
      key: 'maintenance_services',
      name: 'Maintenance Services',
      description: 'Equipment repair, facility maintenance, HVAC services',
      icon: '🔧',
      examples: ['HVAC repair', 'Equipment maintenance', 'Facility management', 'Electrical services']
    },
    {
      key: 'delivery_services',
      name: 'Delivery Services',
      description: 'Courier services, logistics, transportation',
      icon: '🚚',
      examples: ['Same-day delivery', 'Courier services', 'Moving services', 'Logistics']
    },
    {
      key: 'landscaping_services',
      name: 'Landscaping Services',
      description: 'Lawn care, garden maintenance, landscape design',
      icon: '🌿',
      examples: ['Lawn mowing', 'Garden maintenance', 'Landscape design', 'Tree services']
    },
    {
      key: 'security_services',
      name: 'Security Services',
      description: 'Security systems, monitoring, consultation',
      icon: '🛡️',
      examples: ['Security installation', 'Monitoring services', 'Access control', 'Security consulting']
    },
    {
      key: 'general',
      name: 'General/Other Services',
      description: 'Universal templates for any service business',
      icon: '⚙️',
      examples: ['Custom services', 'Consulting', 'Professional services', 'Other businesses']
    }
  ];

  // Load settings and trigger points on mount
  useEffect(() => {
    loadVendorSelectionSettings();
    loadTriggerPoints();
  }, []);

  const loadVendorSelectionSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vendor-selection/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettings(data.settings);
        }
      }
    } catch (err) {
      console.error('Load settings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTriggerPoints = async () => {
    try {
      const response = await fetch('/api/vendor-selection/trigger-points', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTriggerPoints(data.trigger_points);
        }
      }
    } catch (err) {
      console.error('Load trigger points error:', err);
    }
  };

  const handleSaveTriggerPoint = async () => {
    try {
      setSaving(true);
      setError(null);

      const endpoint = selectedTrigger 
        ? `/api/vendor-selection/trigger-points/${selectedTrigger.id}`
        : '/api/vendor-selection/trigger-points';
      
      const method = selectedTrigger ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        await loadTriggerPoints();
        setIsCreateDialogOpen(false);
        setIsEditDialogOpen(false);
        resetForm();
      } else {
        setError(data.error || 'Failed to save trigger point');
      }
    } catch (err) {
      setError('Failed to save trigger point');
      console.error('Save trigger point error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTriggerPoint = async (triggerId: string) => {
    if (!confirm('Are you sure you want to delete this trigger point?')) {
      return;
    }

    try {
      const response = await fetch(`/api/vendor-selection/trigger-points/${triggerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await loadTriggerPoints();
      }
    } catch (err) {
      console.error('Delete trigger point error:', err);
    }
  };

  const handleToggleTriggerPoint = async (triggerId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/vendor-selection/trigger-points/${triggerId}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: isActive })
      });

      if (response.ok) {
        await loadTriggerPoints();
      }
    } catch (err) {
      console.error('Toggle trigger point error:', err);
    }
  };

  const handleUseTemplate = (roleKey: string, templateKey: string) => {
    const roleTemplates = triggerTemplatesByRole[roleKey as keyof typeof triggerTemplatesByRole];
    const template = roleTemplates?.[templateKey as keyof typeof roleTemplates];
    if (template) {
      setFormData(prev => ({
        ...prev,
        ...template,
        type: templateKey as any
      }));
      setShowTemplateSelector(false);
    }
  };

  const handleManualSetup = () => {
    setShowManualInstructions(true);
    setShowTemplateSelector(false);
  };

  const handleAIGeneration = () => {
    setShowAIGenerator(true);
    setShowTemplateSelector(false);
  };

  const handleGenerateWithAI = async () => {
    try {
      setAiGenerating(true);
      setError(null);

      // Validate AI input
      if (!aiBusinessContext.business_type || !aiBusinessContext.service_description) {
        setError('Business type and service description are required for AI generation');
        return;
      }

      console.log('🤖 Generating trigger point with AI...');

      const response = await fetch('/api/vendor-selection/generate-trigger', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          business_context: aiBusinessContext,
          trigger_type: aiTriggerType,
          specific_requirements: aiSpecificRequirements,
          priority_level: 3,
          response_time_requirement: 'within 30 minutes',
          additional_context: aiAdditionalContext
        })
      });

      const data = await response.json();

      if (data.success) {
        // Apply AI-generated configuration to form
        setFormData(prev => ({
          ...prev,
          name: data.generated_trigger.name,
          type: aiTriggerType as any,
          description: data.generated_trigger.description,
          instructions: data.generated_trigger.instructions,
          keywords: data.generated_trigger.keywords,
          conditions: data.generated_trigger.conditions,
          actions: data.generated_trigger.actions,
          vendor_selection_criteria: data.generated_trigger.vendor_selection_criteria,
          is_active: true
        }));

        // Show success message with AI insights
        console.log('✅ AI-generated trigger point applied:', {
          name: data.generated_trigger.name,
          quality_score: data.generation_info.quality_score,
          keywords_count: data.generation_info.keywords_count
        });

        setShowAIGenerator(false);

        // Show AI generation results
        alert(`🤖 AI Generated Trigger Point Successfully!\n\nQuality Score: ${(data.generation_info.quality_score * 100).toFixed(0)}%\nKeywords Generated: ${data.generation_info.keywords_count}\nExample Conversations: ${data.generation_info.example_conversations_count}\n\nYou can now review and customize the configuration before saving.`);

      } else {
        setError(data.error || 'Failed to generate trigger point with AI');

        if (data.error_type === 'missing_api_key') {
          setError('AI generation requires LLM API keys. Please configure your API keys in Settings → API Keys first.');
        }
      }

    } catch (error) {
      console.error('AI generation error:', error);
      setError('Failed to generate trigger point with AI. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'location_visit',
      description: '',
      instructions: '',
      keywords: [],
      conditions: {
        customer_name_required: true,
        location_required: true,
        contact_details_required: true,
        service_type_required: false,
        budget_mentioned: false,
        timeline_mentioned: false
      },
      actions: {
        send_customer_email: true,
        notify_vendors: true,
        create_order: true,
        priority_level: 3
      },
      vendor_selection_criteria: {
        location_radius: 10,
        min_rating: 4.0,
        max_vendors_to_notify: 3,
        prefer_available: true,
        work_type_match: true
      },
      is_active: true
    });
    setSelectedTrigger(null);
    setSelectedBusinessRole('general');
    setShowTemplateSelector(false);
    setShowManualInstructions(false);
    setShowAIGenerator(false);
    setAiBusinessContext({
      business_type: '',
      service_description: '',
      target_customers: '',
      service_area: '',
      typical_scenarios: [''],
      pain_points: [''],
      urgency_levels: ['']
    });
    setAiTriggerType('location_visit');
    setAiSpecificRequirements('');
    setAiAdditionalContext('');
  };

  const getTriggerTypeIcon = (type: string) => {
    switch (type) {
      case 'location_visit': return <MapPin className="h-4 w-4" />;
      case 'quotation_sending': return <Mail className="h-4 w-4" />;
      case 'order_booking': return <CheckCircle className="h-4 w-4" />;
      case 'service_inquiry': return <Info className="h-4 w-4" />;
      case 'emergency_service': return <AlertCircle className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getTriggerTypeColor = (type: string) => {
    switch (type) {
      case 'location_visit': return 'bg-blue-100 text-blue-800';
      case 'quotation_sending': return 'bg-green-100 text-green-800';
      case 'order_booking': return 'bg-purple-100 text-purple-800';
      case 'service_inquiry': return 'bg-gray-100 text-gray-800';
      case 'emergency_service': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading vendor selection settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Vendor Selection Agent
          </h1>
          <p className="text-gray-600">
            Configure automated vendor selection based on conversation triggers
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              resetForm();
              setIsCreateDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Trigger Point
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="trigger-points" className="space-y-6">
        <TabsList>
          <TabsTrigger value="trigger-points">Trigger Points</TabsTrigger>
          <TabsTrigger value="global-settings">Global Settings</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Trigger Points Tab */}
        <TabsContent value="trigger-points" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Active Trigger Points
              </CardTitle>
              <CardDescription>
                Configure when the vendor selection agent should activate based on conversation analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {triggerPoints.map((trigger) => (
                  <Card key={trigger.id} className={`relative ${!trigger.is_active ? 'opacity-60' : ''}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={`${getTriggerTypeColor(trigger.type)}`}>
                            <span className="flex items-center gap-1">
                              {getTriggerTypeIcon(trigger.type)}
                              {trigger.type.replace('_', ' ')}
                            </span>
                          </Badge>
                          <Switch
                            checked={trigger.is_active}
                            onCheckedChange={(checked) => handleToggleTriggerPoint(trigger.id, checked)}
                          />
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            onClick={() => {
                              setSelectedTrigger(trigger);
                              setFormData(trigger);
                              setIsEditDialogOpen(true);
                            }}
                            variant="ghost"
                            size="sm"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteTriggerPoint(trigger.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <CardTitle className="text-base">{trigger.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {trigger.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {/* Keywords */}
                        <div>
                          <span className="text-sm font-medium text-gray-600">Keywords:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {trigger.keywords.slice(0, 3).map((keyword) => (
                              <Badge key={keyword} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                            {trigger.keywords.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{trigger.keywords.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Vendor Selection Criteria */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Radius:</span>
                            <span className="ml-1 font-medium">{trigger.vendor_selection_criteria.location_radius}km</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Min Rating:</span>
                            <span className="ml-1 font-medium">{trigger.vendor_selection_criteria.min_rating}★</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Max Vendors:</span>
                            <span className="ml-1 font-medium">{trigger.vendor_selection_criteria.max_vendors_to_notify}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Priority:</span>
                            <span className="ml-1 font-medium">{trigger.actions.priority_level}/5</span>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2 border-t">
                          {trigger.actions.send_customer_email && (
                            <Badge variant="outline" className="text-xs">
                              <Mail className="h-3 w-3 mr-1" />
                              Email
                            </Badge>
                          )}
                          {trigger.actions.notify_vendors && (
                            <Badge variant="outline" className="text-xs">
                              <Bell className="h-3 w-3 mr-1" />
                              Notify
                            </Badge>
                          )}
                          {trigger.actions.create_order && (
                            <Badge variant="outline" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Order
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {triggerPoints.length === 0 && (
                <div className="text-center py-12">
                  <Target className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No trigger points configured</h3>
                  <p className="text-gray-600 mb-4">
                    Add your first trigger point to start automating vendor selection
                  </p>
                  <Button onClick={() => {
                    resetForm();
                    setIsCreateDialogOpen(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Trigger Point
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Global Settings Tab */}
        <TabsContent value="global-settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Global Vendor Selection Settings</CardTitle>
              <CardDescription>
                Configure default behavior for vendor selection agent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Auto Vendor Selection</Label>
                      <Switch 
                        checked={settings.global_settings.auto_vendor_selection}
                        onCheckedChange={(checked) => {
                          setSettings(prev => prev ? {
                            ...prev,
                            global_settings: { ...prev.global_settings, auto_vendor_selection: checked }
                          } : null);
                        }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Default Location Radius (km)</Label>
                      <Input
                        type="number"
                        value={settings.global_settings.default_location_radius}
                        onChange={(e) => {
                          setSettings(prev => prev ? {
                            ...prev,
                            global_settings: { ...prev.global_settings, default_location_radius: parseInt(e.target.value) }
                          } : null);
                        }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Minimum Vendor Rating</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="1"
                        max="5"
                        value={settings.global_settings.min_vendor_rating}
                        onChange={(e) => {
                          setSettings(prev => prev ? {
                            ...prev,
                            global_settings: { ...prev.global_settings, min_vendor_rating: parseFloat(e.target.value) }
                          } : null);
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Max Response Time (minutes)</Label>
                      <Input
                        type="number"
                        value={settings.global_settings.max_response_time}
                        onChange={(e) => {
                          setSettings(prev => prev ? {
                            ...prev,
                            global_settings: { ...prev.global_settings, max_response_time: parseInt(e.target.value) }
                          } : null);
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label>Business Hours Only</Label>
                      <Switch 
                        checked={settings.global_settings.business_hours_only}
                        onCheckedChange={(checked) => {
                          setSettings(prev => prev ? {
                            ...prev,
                            global_settings: { ...prev.global_settings, business_hours_only: checked }
                          } : null);
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label>Weekend Operations</Label>
                      <Switch 
                        checked={settings.global_settings.weekend_operations}
                        onCheckedChange={(checked) => {
                          setSettings(prev => prev ? {
                            ...prev,
                            global_settings: { ...prev.global_settings, weekend_operations: checked }
                          } : null);
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Confirmation Email</CardTitle>
                <CardDescription>
                  Email sent to customers when trigger point is activated
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={settings?.email_templates.customer_confirmation || ''}
                  onChange={(e) => {
                    setSettings(prev => prev ? {
                      ...prev,
                      email_templates: { ...prev.email_templates, customer_confirmation: e.target.value }
                    } : null);
                  }}
                  rows={10}
                  placeholder="Dear {{customer_name}}, Thank you for your interest..."
                />
                <p className="text-sm text-gray-600 mt-2">
                  Available variables: {{customer_name}}, {{service_type}}, {{location}}, {{business_name}}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Vendor Notification</CardTitle>
                <CardDescription>
                  Notification sent to selected vendors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={settings?.email_templates.vendor_notification || ''}
                  onChange={(e) => {
                    setSettings(prev => prev ? {
                      ...prev,
                      email_templates: { ...prev.email_templates, vendor_notification: e.target.value }
                    } : null);
                  }}
                  rows={10}
                  placeholder="New order available: {{service_type}} at {{location}}..."
                />
                <p className="text-sm text-gray-600 mt-2">
                  Available variables: {{vendor_name}}, {{customer_name}}, {{service_type}}, {{location}}, {{priority}}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Triggers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{triggerPoints.length}</div>
                <p className="text-xs text-gray-600">
                  {triggerPoints.filter(t => t.is_active).length} active
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-gray-600">
                  Triggers activated
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0%</div>
                <p className="text-xs text-gray-600">
                  Successful matches
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0m</div>
                <p className="text-xs text-gray-600">
                  Vendor response time
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Trigger Point Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTrigger ? 'Edit Trigger Point' : 'Create New Trigger Point'}
            </DialogTitle>
            <DialogDescription>
              Configure when and how the vendor selection agent should activate
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Enhanced Template Selection */}
            {!selectedTrigger && !showManualInstructions && !showAIGenerator && (
              <div className="space-y-6">
                {!showTemplateSelector ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-medium mb-2">How would you like to create your trigger point?</h3>
                      <p className="text-gray-600 mb-6">Choose from business-specific templates, use AI generation, or create your own custom trigger point</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 border-blue-200 bg-blue-50" onClick={handleAIGeneration}>
                        <CardContent className="p-6 text-center">
                          <div className="text-3xl mb-3">🤖</div>
                          <h4 className="font-medium mb-2 text-blue-700">AI-Generated (Recommended)</h4>
                          <p className="text-sm text-blue-600">Let AI create optimized trigger points based on your business context</p>
                          <Badge className="mt-2 bg-blue-600 text-white">Most Accurate</Badge>
                        </CardContent>
                      </Card>

                      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowTemplateSelector(true)}>
                        <CardContent className="p-6 text-center">
                          <div className="text-3xl mb-3">🎯</div>
                          <h4 className="font-medium mb-2">Use Business Template</h4>
                          <p className="text-sm text-gray-600">Choose from pre-built templates designed for specific business types</p>
                        </CardContent>
                      </Card>

                      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleManualSetup}>
                        <CardContent className="p-6 text-center">
                          <div className="text-3xl mb-3">✏️</div>
                          <h4 className="font-medium mb-2">Manual Setup</h4>
                          <p className="text-sm text-gray-600">Create a custom trigger point with your own instructions</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Select Your Business Type</h3>
                      <Button
                        onClick={() => setShowTemplateSelector(false)}
                        variant="outline"
                        size="sm"
                      >
                        Back
                      </Button>
                    </div>

                    {/* Business Role Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {businessRoles.map((role) => (
                        <Card
                          key={role.key}
                          className={`cursor-pointer transition-all ${
                            selectedBusinessRole === role.key
                              ? 'ring-2 ring-blue-500 bg-blue-50'
                              : 'hover:shadow-md'
                          }`}
                          onClick={() => setSelectedBusinessRole(role.key)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="text-2xl">{role.icon}</div>
                              <div className="flex-1">
                                <h4 className="font-medium mb-1">{role.name}</h4>
                                <p className="text-sm text-gray-600 mb-2">{role.description}</p>
                                <div className="flex flex-wrap gap-1">
                                  {role.examples.slice(0, 2).map((example) => (
                                    <Badge key={example} variant="outline" className="text-xs">
                                      {example}
                                    </Badge>
                                  ))}
                                  {role.examples.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{role.examples.length - 2} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Template Selection for Selected Role */}
                    {selectedBusinessRole && (
                      <div className="space-y-3">
                        <h4 className="font-medium">
                          Choose Template for {businessRoles.find(r => r.key === selectedBusinessRole)?.name}
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                          {Object.entries(triggerTemplatesByRole[selectedBusinessRole as keyof typeof triggerTemplatesByRole] || {}).map(([templateKey, template]) => (
                            <Card
                              key={templateKey}
                              className="cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => handleUseTemplate(selectedBusinessRole, templateKey)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      {getTriggerTypeIcon(templateKey)}
                                      <h5 className="font-medium">{template.name}</h5>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>

                                    {/* Example Conversation */}
                                    <div className="bg-gray-50 p-3 rounded-lg mb-3">
                                      <p className="text-xs font-medium text-gray-700 mb-1">Example Conversation:</p>
                                      <p className="text-xs text-gray-600 italic">{template.example_conversation}</p>
                                    </div>

                                    {/* Business Context */}
                                    <div className="flex items-center gap-2">
                                      <Info className="h-4 w-4 text-blue-500" />
                                      <p className="text-xs text-blue-600">{template.business_context}</p>
                                    </div>
                                  </div>
                                  <Button size="sm" variant="outline">
                                    Use Template
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Manual Instructions Guide */}
            {showManualInstructions && !selectedTrigger && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Manual Trigger Point Setup</h3>
                  <Button
                    onClick={() => setShowManualInstructions(false)}
                    variant="outline"
                    size="sm"
                  >
                    Back
                  </Button>
                </div>

                {/* Step-by-step Guide */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-6">
                    <h4 className="font-medium mb-4 flex items-center gap-2">
                      <Info className="h-5 w-5 text-blue-600" />
                      Step-by-Step Guide to Creating Effective Trigger Points
                    </h4>

                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
                        <div>
                          <h5 className="font-medium">Define When to Trigger</h5>
                          <p className="text-sm text-gray-600">Think about the exact moment in a conversation when you want vendor selection to activate. Examples: "When customer agrees to a visit", "When customer asks for pricing", "When customer confirms an order"</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
                        <div>
                          <h5 className="font-medium">Choose Keywords</h5>
                          <p className="text-sm text-gray-600">List words and phrases customers typically use. Examples: "appointment, schedule, book, visit" for appointment booking or "price, cost, quote, estimate" for pricing inquiries</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
                        <div>
                          <h5 className="font-medium">Set Required Information</h5>
                          <p className="text-sm text-gray-600">Decide what information must be collected before triggering. Usually: customer name, location, and contact details are essential for vendor assignment</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">4</div>
                        <div>
                          <h5 className="font-medium">Configure Actions</h5>
                          <p className="text-sm text-gray-600">Choose what happens when triggered: send customer confirmation email, notify vendors, create order record, and set priority level (1-5)</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">5</div>
                        <div>
                          <h5 className="font-medium">Set Vendor Criteria</h5>
                          <p className="text-sm text-gray-600">Define how to select vendors: location radius (km), minimum rating, maximum vendors to notify, prefer available vendors, match work type</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Example Scenarios */}
                <Card>
                  <CardContent className="p-6">
                    <h4 className="font-medium mb-4">Common Trigger Point Examples</h4>

                    <div className="space-y-4">
                      <div className="border-l-4 border-green-500 pl-4">
                        <h5 className="font-medium text-green-700">Appointment Booking</h5>
                        <p className="text-sm text-gray-600 mb-2"><strong>When:</strong> Customer wants to schedule a service visit</p>
                        <p className="text-sm text-gray-600 mb-2"><strong>Keywords:</strong> "appointment", "schedule", "book", "visit", "come over"</p>
                        <p className="text-sm text-gray-600"><strong>Example:</strong> "Can you send someone to clean our office next Tuesday?"</p>
                      </div>

                      <div className="border-l-4 border-blue-500 pl-4">
                        <h5 className="font-medium text-blue-700">Emergency Service</h5>
                        <p className="text-sm text-gray-600 mb-2"><strong>When:</strong> Customer has urgent service needs</p>
                        <p className="text-sm text-gray-600 mb-2"><strong>Keywords:</strong> "emergency", "urgent", "immediate", "asap", "right now"</p>
                        <p className="text-sm text-gray-600"><strong>Example:</strong> "We have a water leak and need emergency cleanup right now!"</p>
                      </div>

                      <div className="border-l-4 border-purple-500 pl-4">
                        <h5 className="font-medium text-purple-700">Quote Request</h5>
                        <p className="text-sm text-gray-600 mb-2"><strong>When:</strong> Customer asks about pricing</p>
                        <p className="text-sm text-gray-600 mb-2"><strong>Keywords:</strong> "price", "cost", "quote", "estimate", "how much"</p>
                        <p className="text-sm text-gray-600"><strong>Example:</strong> "What would it cost to maintain our building monthly?"</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* AI Generation Interface */}
            {showAIGenerator && !selectedTrigger && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Brain className="h-5 w-5 text-blue-600" />
                    AI-Powered Trigger Point Generation
                  </h3>
                  <Button
                    onClick={() => setShowAIGenerator(false)}
                    variant="outline"
                    size="sm"
                  >
                    Back
                  </Button>
                </div>

                {/* AI Generation Benefits */}
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                  <CardContent className="p-6">
                    <h4 className="font-medium mb-4 flex items-center gap-2 text-blue-700">
                      <Zap className="h-5 w-5" />
                      Why Use AI Generation?
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Comprehensive Keywords</p>
                            <p className="text-xs text-gray-600">AI generates 15-25 keywords including variations, slang, and regional differences</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Avoids False Positives</p>
                            <p className="text-xs text-gray-600">Includes negative keywords to prevent incorrect triggering</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Optimized Conditions</p>
                            <p className="text-xs text-gray-600">AI determines the best required conditions based on your business type</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Real Examples</p>
                            <p className="text-xs text-gray-600">Provides actual conversation examples for testing and validation</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Business Context Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Tell AI About Your Business</CardTitle>
                    <CardDescription>
                      Provide details about your business so AI can generate the most accurate trigger point
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Business Type *</Label>
                        <Input
                          value={aiBusinessContext.business_type}
                          onChange={(e) => setAiBusinessContext(prev => ({ ...prev, business_type: e.target.value }))}
                          placeholder="e.g., Commercial Cleaning Services"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Service Area</Label>
                        <Input
                          value={aiBusinessContext.service_area}
                          onChange={(e) => setAiBusinessContext(prev => ({ ...prev, service_area: e.target.value }))}
                          placeholder="e.g., Local metropolitan area"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Service Description *</Label>
                      <Textarea
                        value={aiBusinessContext.service_description}
                        onChange={(e) => setAiBusinessContext(prev => ({ ...prev, service_description: e.target.value }))}
                        placeholder="e.g., Professional office and commercial space cleaning services including regular maintenance, deep cleaning, and emergency cleanup"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Target Customers</Label>
                      <Input
                        value={aiBusinessContext.target_customers}
                        onChange={(e) => setAiBusinessContext(prev => ({ ...prev, target_customers: e.target.value }))}
                        placeholder="e.g., Office buildings, retail stores, medical facilities, restaurants"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Trigger Type</Label>
                      <Select
                        value={aiTriggerType}
                        onValueChange={setAiTriggerType}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="location_visit">Location Visit</SelectItem>
                          <SelectItem value="quotation_sending">Quotation Request</SelectItem>
                          <SelectItem value="order_booking">Order Confirmation</SelectItem>
                          <SelectItem value="service_inquiry">Service Inquiry</SelectItem>
                          <SelectItem value="emergency_service">Emergency Service</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Specific Requirements</Label>
                      <Textarea
                        value={aiSpecificRequirements}
                        onChange={(e) => setAiSpecificRequirements(e.target.value)}
                        placeholder="e.g., Must detect when customer mentions specific cleaning types, emergency situations should have high priority, require location details for all triggers"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Additional Context</Label>
                      <Textarea
                        value={aiAdditionalContext}
                        onChange={(e) => setAiAdditionalContext(e.target.value)}
                        placeholder="e.g., We serve medical facilities so cleanliness standards are critical, customers often call during business hours, emergency spills need immediate response"
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Generate Button */}
                <div className="flex justify-center">
                  <Button
                    onClick={handleGenerateWithAI}
                    disabled={aiGenerating || !aiBusinessContext.business_type || !aiBusinessContext.service_description}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {aiGenerating ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        AI is generating your optimized trigger point...
                      </>
                    ) : (
                      <>
                        <Brain className="h-5 w-5 mr-2" />
                        Generate Optimized Trigger Point with AI
                      </>
                    )}
                  </Button>
                </div>

                {/* AI Generation Tips */}
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-4">
                    <h5 className="font-medium mb-2 flex items-center gap-2 text-yellow-700">
                      <Info className="h-4 w-4" />
                      Tips for Better AI Generation
                    </h5>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Be specific about your business type and services</li>
                      <li>• Mention any industry-specific terminology your customers use</li>
                      <li>• Include common scenarios and pain points</li>
                      <li>• Describe urgency levels and response time requirements</li>
                      <li>• The more context you provide, the better the AI-generated trigger will be</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Basic Information - Only show when not using AI generation */}
            {!showAIGenerator && (
            <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Trigger Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Appointment Booking"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Trigger Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="location_visit">Location Visit</SelectItem>
                    <SelectItem value="quotation_sending">Quotation Sending</SelectItem>
                    <SelectItem value="order_booking">Order Booking</SelectItem>
                    <SelectItem value="service_inquiry">Service Inquiry</SelectItem>
                    <SelectItem value="emergency_service">Emergency Service</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of when this trigger should activate"
              />
            </div>

            <div className="space-y-2">
              <Label>Detailed Instructions</Label>
              <Textarea
                value={formData.instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                rows={4}
                placeholder="Detailed instructions for when this trigger should activate. Be specific about the conditions and requirements."
              />
            </div>

            <div className="space-y-2">
              <Label>Keywords (comma-separated)</Label>
              <Input
                value={formData.keywords?.join(', ') || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                }))}
                placeholder="visit, come service, on-site, location"
              />
            </div>
            </>
            )}

            {/* Conditions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Required Conditions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Customer Name Required</Label>
                    <Switch
                      checked={formData.conditions?.customer_name_required}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        conditions: { ...prev.conditions!, customer_name_required: checked }
                      }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Location Required</Label>
                    <Switch
                      checked={formData.conditions?.location_required}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        conditions: { ...prev.conditions!, location_required: checked }
                      }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Contact Details Required</Label>
                    <Switch
                      checked={formData.conditions?.contact_details_required}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        conditions: { ...prev.conditions!, contact_details_required: checked }
                      }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Service Type Required</Label>
                    <Switch
                      checked={formData.conditions?.service_type_required}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        conditions: { ...prev.conditions!, service_type_required: checked }
                      }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Budget Mentioned</Label>
                    <Switch
                      checked={formData.conditions?.budget_mentioned}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        conditions: { ...prev.conditions!, budget_mentioned: checked }
                      }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Timeline Mentioned</Label>
                    <Switch
                      checked={formData.conditions?.timeline_mentioned}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        conditions: { ...prev.conditions!, timeline_mentioned: checked }
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Actions to Take</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Send Customer Email</Label>
                    <Switch
                      checked={formData.actions?.send_customer_email}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        actions: { ...prev.actions!, send_customer_email: checked }
                      }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Notify Vendors</Label>
                    <Switch
                      checked={formData.actions?.notify_vendors}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        actions: { ...prev.actions!, notify_vendors: checked }
                      }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Create Order</Label>
                    <Switch
                      checked={formData.actions?.create_order}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        actions: { ...prev.actions!, create_order: checked }
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm">Priority Level</Label>
                    <Select 
                      value={formData.actions?.priority_level?.toString()} 
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        actions: { ...prev.actions!, priority_level: parseInt(value) }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Low</SelectItem>
                        <SelectItem value="2">2 - Below Normal</SelectItem>
                        <SelectItem value="3">3 - Normal</SelectItem>
                        <SelectItem value="4">4 - High</SelectItem>
                        <SelectItem value="5">5 - Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vendor Selection Criteria */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Vendor Selection Criteria</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Location Radius (km)</Label>
                    <Input
                      type="number"
                      value={formData.vendor_selection_criteria?.location_radius}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        vendor_selection_criteria: { 
                          ...prev.vendor_selection_criteria!, 
                          location_radius: parseInt(e.target.value) 
                        }
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm">Minimum Rating</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={formData.vendor_selection_criteria?.min_rating}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        vendor_selection_criteria: { 
                          ...prev.vendor_selection_criteria!, 
                          min_rating: parseFloat(e.target.value) 
                        }
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm">Max Vendors to Notify</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.vendor_selection_criteria?.max_vendors_to_notify}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        vendor_selection_criteria: { 
                          ...prev.vendor_selection_criteria!, 
                          max_vendors_to_notify: parseInt(e.target.value) 
                        }
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Prefer Available Vendors</Label>
                      <Switch
                        checked={formData.vendor_selection_criteria?.prefer_available}
                        onCheckedChange={(checked) => setFormData(prev => ({
                          ...prev,
                          vendor_selection_criteria: { 
                            ...prev.vendor_selection_criteria!, 
                            prefer_available: checked 
                          }
                        }))}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Match Work Type</Label>
                    <Switch
                      checked={formData.vendor_selection_criteria?.work_type_match}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        vendor_selection_criteria: { 
                          ...prev.vendor_selection_criteria!, 
                          work_type_match: checked 
                        }
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setIsEditDialogOpen(false);
                  resetForm();
                }}
                variant="outline"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveTriggerPoint}
                disabled={saving || !formData.name || !formData.instructions}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {selectedTrigger ? 'Update' : 'Create'} Trigger Point
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
