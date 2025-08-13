
'use client';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { configureAgentAction } from '../actions';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UploadCloud, Bot, Zap, Globe, Volume2, Shield, Settings, Play } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';

const formSchema = z.object({
  // Agent Basic Info
  agentName: z.string().min(1, 'Agent name is required.'),
  agentDescription: z.string().optional(),

  // Voice Configuration
  voiceOption: z.enum(['elevenlabs', 'clone']).default('elevenlabs'),
  voiceId: z.string().min(1, 'Voice selection is required.'),
  voiceSample: z.any().optional(),
  modelId: z.string().default('eleven_flash_v2_5'),

  // Voice Settings
  stability: z.number().min(0).max(1).default(0.5),
  similarityBoost: z.number().min(0).max(1).default(0.8),
  style: z.number().min(0).max(1).default(0.0),
  useSpeakerBoost: z.boolean().default(true),

  // Language & Conversation
  conversationLanguage: z.string().min(1, 'Language is required.'),
  welcomeMessage: z.string().min(1, 'Welcome message is required.'),

  // LLM Configuration
  llmModel: z.string().default('gpt-4o-mini'),
  systemPrompt: z.string().min(1, 'System prompt is required.'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(100).max(4000).default(1000),

  // Behavior Settings
  conversationStyle: z.enum(['professional', 'casual', 'friendly']).default('professional'),
  scamDetectionEnabled: z.boolean().default(true),
  maxCallDuration: z.number().default(300000),
  autoEndOnSilence: z.boolean().default(true),

  // Knowledge Base & RAG
  knowledgeBase: z.string().optional(),
  enableRag: z.boolean().default(true),

  // Integration Settings
  googleSheetId: z.string().optional(),
  webhookUrl: z.string().optional(),
});

type AgentFormValues = z.infer<typeof formSchema>;

// Interface definitions for ElevenLabs data
interface Voice {
  voice_id: string;
  name: string;
  category: string;
  description: string;
  labels: {
    gender?: string;
    age?: string;
    accent?: string;
  };
  verified_languages: Array<{
    language: string;
    accent: string;
  }>;
}

interface Model {
  model_id: string;
  name: string;
  description: string;
  languages: number;
  latency: string;
  quality: string;
  use_cases: string[];
}

export default function ConfigureAgentPage() {
  const { toast } = useToast();

  // State management
  const [voices, setVoices] = useState<Voice[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [serviceHealth, setServiceHealth] = useState<any>(null);
  const [previewAudio, setPreviewAudio] = useState<string | null>(null);

  const form = useForm<AgentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      agentName: '',
      agentDescription: '',
      voiceOption: 'elevenlabs',
      voiceId: '',
      modelId: 'eleven_flash_v2_5',
      stability: 0.5,
      similarityBoost: 0.8,
      style: 0.0,
      useSpeakerBoost: true,
      conversationLanguage: 'en',
      welcomeMessage: 'Hello! Thank you for taking my call. How can I help you today?',
      llmModel: 'gpt-4o-mini',
      systemPrompt: `You are a professional AI calling agent for a marketing company. Your role is to:

1. Be friendly, professional, and respectful
2. Clearly identify yourself as an AI assistant
3. Explain the purpose of your call briefly
4. Listen actively to the customer's needs
5. Provide helpful information about our services
6. Handle objections professionally
7. Respect "do not call" requests immediately
8. Keep conversations concise and valuable

Guidelines:
- Always be honest about being an AI
- Speak naturally with appropriate pauses
- Ask permission before continuing if the call seems unwelcome
- Focus on providing value, not just selling
- End calls politely if requested
- Maintain a professional tone throughout

Remember: You represent our company's values of integrity, respect, and customer service excellence.`,
      temperature: 0.7,
      maxTokens: 1000,
      conversationStyle: 'professional',
      scamDetectionEnabled: true,
      maxCallDuration: 300000,
      autoEndOnSilence: true,
      knowledgeBase: '',
      enableRag: true,
      googleSheetId: '',
      webhookUrl: '',
    },
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadVoices(),
        loadModels(),
        loadServiceHealth()
      ]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load ElevenLabs data'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadVoices = async () => {
    try {
      // Mock data for demo - replace with actual API call
      const mockVoices = [
        {
          voice_id: 'pNInz6obpgDQGcFmaJgB',
          name: 'Adam',
          category: 'premade',
          description: 'Deep, authoritative voice',
          labels: { gender: 'male', age: 'middle_aged', accent: 'american' },
          verified_languages: [{ language: 'en', accent: 'american' }]
        },
        {
          voice_id: 'EXAVITQu4vr4xnSDxMaL',
          name: 'Bella',
          category: 'premade',
          description: 'Warm, friendly voice',
          labels: { gender: 'female', age: 'young', accent: 'american' },
          verified_languages: [{ language: 'en', accent: 'american' }]
        },
        {
          voice_id: 'ErXwobaYiN019PkySvjV',
          name: 'Antoni',
          category: 'premade',
          description: 'Professional, clear voice',
          labels: { gender: 'male', age: 'young', accent: 'american' },
          verified_languages: [{ language: 'en', accent: 'american' }]
        }
      ];
      setVoices(mockVoices);
    } catch (error) {
      console.error('Failed to load voices:', error);
    }
  };

  const loadModels = async () => {
    try {
      // Mock data for demo - replace with actual API call
      const mockModels = [
        {
          model_id: 'eleven_flash_v2_5',
          name: 'Eleven Flash v2.5',
          description: 'Fastest model with great quality',
          languages: 32,
          latency: 'Lowest',
          quality: 'High',
          use_cases: ['Conversational AI', 'Real-time applications']
        },
        {
          model_id: 'eleven_turbo_v2_5',
          name: 'Eleven Turbo v2.5',
          description: 'Balanced speed and quality',
          languages: 32,
          latency: 'Low',
          quality: 'High',
          use_cases: ['Conversational AI', 'Narration']
        }
      ];
      setModels(mockModels);
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const loadServiceHealth = async () => {
    try {
      // Mock health status for demo
      const mockHealth = {
        elevenlabs: { status: 'healthy', latency: 45 },
        scam_detection: { status: 'healthy', latency: 120 },
        nlp_processing: { status: 'healthy', latency: 85 },
        voice_analysis: { status: 'healthy', latency: 200 }
      };
      setServiceHealth(mockHealth);
    } catch (error) {
      console.error('Failed to load service health:', error);
    }
  };

  const voiceOption = form.watch('voiceOption');

  async function onSubmit(values: AgentFormValues) {
    setLoading(true);
    try {
      // Create agent configuration for our backend
      const agentConfig = {
        name: values.agentName,
        description: values.agentDescription,
        voice_id: values.voiceId,
        model_id: values.modelId,
        language: values.conversationLanguage,
        llm_model: values.llmModel,
        system_prompt: values.systemPrompt,
        temperature: values.temperature,
        max_tokens: values.maxTokens,
        voice_settings: {
          stability: values.stability,
          similarity_boost: values.similarityBoost,
          style: values.style,
          use_speaker_boost: values.useSpeakerBoost
        },
        behavior_config: {
          conversation_style: values.conversationStyle,
          scam_detection_enabled: values.scamDetectionEnabled,
          max_call_duration: values.maxCallDuration,
          auto_end_on_silence: values.autoEndOnSilence
        },
        integrations: {
          knowledge_base: values.knowledgeBase,
          enable_rag: values.enableRag,
          google_sheet_id: values.googleSheetId,
          webhook_url: values.webhookUrl
        }
      };

      // Call our Node.js backend API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/calling-agent/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(agentConfig)
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: '🎉 Success!',
          description: 'AI calling agent with scam detection created successfully!',
        });

        // Show additional success info
        toast({
          title: '🛡️ Security Features Enabled',
          description: 'Real-time scam detection and voice analysis are now active',
        });

        // Reset form
        form.reset();

        // Redirect to operations page
        setTimeout(() => {
          window.location.href = '/calling-agent/operations';
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to create agent');
      }
    } catch (error) {
      console.error('Agent creation error:', error);
      toast({
        title: '❌ Error',
        description: error.message || 'Failed to create calling agent. Please check your configuration.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const playVoicePreview = async (voiceId: string) => {
    try {
      const selectedVoice = voices.find(v => v.voice_id === voiceId);
      if (selectedVoice?.preview_url) {
        setPreviewAudio(selectedVoice.preview_url);
        const audio = new Audio(selectedVoice.preview_url);
        audio.play();
      }
    } catch (error) {
      console.error('Failed to play voice preview:', error);
    }
  };

  return (
     <div className="space-y-8">
       <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Configure AI Agent</h1>
        <p className="text-muted-foreground">Set up and manage the settings for your automated calling agent.</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Voice Configuration</CardTitle>
                    <CardDescription>Choose a voice for your agent and select the language.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                        control={form.control}
                        name="voiceOption"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                            <FormLabel>Voice Option</FormLabel>
                            <FormControl>
                                <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid md:grid-cols-2 gap-4"
                                >
                                <FormItem>
                                    <RadioGroupItem value="elevenlabs" id="elevenlabs" className="peer sr-only" />
                                    <Label htmlFor="elevenlabs" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                        <div className="flex items-center gap-2">
                                          <Zap className="h-5 w-5 text-blue-500" />
                                          <h3 className="font-semibold">ElevenLabs Built-in Voices</h3>
                                        </div>
                                        <p className="text-sm text-muted-foreground">Professional AI voices with scam detection</p>
                                        <Badge variant="secondary" className="mt-2">Recommended</Badge>
                                    </Label>
                                </FormItem>
                                <FormItem>
                                    <RadioGroupItem value="clone" id="clone" className="peer sr-only" />
                                     <Label htmlFor="clone" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                        <h3 className="font-semibold">Clone Your Voice</h3>
                                        <p className="text-sm text-muted-foreground">Upload a sample to create a digital twin of your voice.</p>
                                    </Label>
                                </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    {voiceOption === 'clone' && (
                         <FormField
                            control={form.control}
                            name="voiceSample"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Upload Voice Sample</FormLabel>
                                <FormControl>
                                    <div className="flex items-center justify-center w-full">
                                        <Label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-muted">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                <p className="text-xs text-muted-foreground">MP3 or WAV (MIN. 30s, MAX. 5MB)</p>
                                            </div>
                                            <Input id="dropzone-file" type="file" className="hidden" accept=".mp3,.wav" onChange={(e) => field.onChange(e.target.files)} />
                                        </Label>
                                    </div>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    {voiceOption === 'elevenlabs' && (
                        <>
                          <FormField
                            control={form.control}
                            name="voiceId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ElevenLabs Voice</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a voice" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {voices.map((voice) => (
                                      <SelectItem key={voice.voice_id} value={voice.voice_id}>
                                        <div className="flex items-center justify-between w-full">
                                          <div>
                                            <div className="font-medium">{voice.name}</div>
                                            <div className="text-sm text-muted-foreground">
                                              {voice.labels.gender} • {voice.labels.age} • {voice.labels.accent}
                                            </div>
                                          </div>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              playVoicePreview(voice.voice_id);
                                            }}
                                          >
                                            <Volume2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Choose from high-quality ElevenLabs voices
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="modelId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Voice Model</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a model" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {models.map((model) => (
                                      <SelectItem key={model.model_id} value={model.model_id}>
                                        <div>
                                          <div className="font-medium">{model.name}</div>
                                          <div className="text-sm text-muted-foreground">
                                            {model.latency} latency • {model.quality} quality
                                          </div>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Select the AI model for voice generation
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                    )}

                    <FormField
                        control={form.control}
                        name="conversationLanguage"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Conversation Language</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a language" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                <SelectItem value="en-US">English (US)</SelectItem>
                                <SelectItem value="es-ES">Spanish</SelectItem>
                                <SelectItem value="fr-FR">French</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Agent Behavior</CardTitle>
                    <CardDescription>Define how the agent interacts and what knowledge it uses.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                        control={form.control}
                        name="welcomeMessage"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Welcome Message / Call Title</FormLabel>
                            <FormControl>
                            <Textarea
                                placeholder="e.g., 'Hi, this is a call from [Your Company]. How can I help you?'"
                                {...field}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="knowledgeBase"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Knowledge Base</FormLabel>
                            <FormControl>
                            <Input placeholder="Enter URLs or upload text files" {...field} />
                            </FormControl>
                            <FormDescription>
                            Provide data for the RAG system to use. Separate URLs with commas.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="enableRag"
                        render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                            <FormLabel>Enable RAG</FormLabel>
                            <FormDescription>
                                Allow the agent to use the knowledge base for context.
                            </FormDescription>
                            </div>
                            <FormControl>
                            <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                            </FormControl>
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="googleSheetId"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Google Sheet ID for Conversation Sync</FormLabel>
                            <FormControl>
                            <Input placeholder="Enter your Google Sheet ID for data syncing" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

            {/* Advanced Voice Settings */}
            {voiceOption === 'elevenlabs' && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline">Advanced Voice Settings</CardTitle>
                  <CardDescription>Fine-tune voice characteristics for optimal performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="stability"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stability: {field.value}</FormLabel>
                          <FormControl>
                            <Slider
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                              max={1}
                              min={0}
                              step={0.1}
                              className="w-full"
                            />
                          </FormControl>
                          <FormDescription>
                            Higher values make voice more stable but less expressive
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="similarityBoost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Similarity Boost: {field.value}</FormLabel>
                          <FormControl>
                            <Slider
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                              max={1}
                              min={0}
                              step={0.1}
                              className="w-full"
                            />
                          </FormControl>
                          <FormDescription>
                            Enhances similarity to the original voice
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="style"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Style: {field.value}</FormLabel>
                          <FormControl>
                            <Slider
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                              max={1}
                              min={0}
                              step={0.1}
                              className="w-full"
                            />
                          </FormControl>
                          <FormDescription>
                            Amplifies the style of the original speaker
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="useSpeakerBoost"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>Speaker Boost</FormLabel>
                            <FormDescription>
                              Enhance speaker similarity
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Scam Detection Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  Scam Detection & Security
                </CardTitle>
                <CardDescription>Configure AI-powered threat detection with 95%+ accuracy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="scamDetectionEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-green-500" />
                          Enable Real-time Scam Detection
                        </FormLabel>
                        <FormDescription>
                          Automatically detect and alert on potential scam indicators during calls
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="maxCallDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Call Duration (seconds)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Automatically end calls after this duration
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="autoEndOnSilence"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Auto-end on Silence</FormLabel>
                          <FormDescription>
                            End call after extended silence
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Security Features Display */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-blue-500" />
                    Included Security Features
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Pattern Recognition (95%+ accuracy)
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Voice Stress Analysis
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Behavioral Analysis
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Real-time Alerts
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Sentiment Monitoring
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Conversation Recording
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
                 <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Saving...' : 'Save Configuration'}
                </Button>
            </div>

        </form>
      </Form>
    </div>
  );
}
