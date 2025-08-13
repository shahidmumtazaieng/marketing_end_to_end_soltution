"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mic, 
  Play, 
  Pause, 
  Volume2, 
  Settings, 
  Brain, 
  Zap,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
  Headphones,
  Waveform
} from 'lucide-react';

import { VoiceConfig } from '@/lib/api/ai-calling-agent';

interface VoiceConfigurationPanelProps {
  initialConfig?: VoiceConfig;
  onConfigChange?: (config: VoiceConfig) => void;
  onTestVoice?: (config: VoiceConfig, text: string) => Promise<string>;
  showAdvanced?: boolean;
}

export default function VoiceConfigurationPanel({ 
  initialConfig, 
  onConfigChange, 
  onTestVoice,
  showAdvanced = true 
}: VoiceConfigurationPanelProps) {
  // State management
  const [config, setConfig] = useState<VoiceConfig>(initialConfig || {
    voice_type: 'elevenlabs',
    voice_id: 'default',
    voice_name: 'Professional Voice',
    language: 'en-US',
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.0,
    use_speaker_boost: true,
    speed: 1.0,
    pitch: 1.0
  });

  const [testText, setTestText] = useState('Hello! This is a test of the AI voice configuration. How does this sound?');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);

  // Audio element ref
  const audioRef = React.useRef<HTMLAudioElement>(null);

  // Load available voices on mount
  useEffect(() => {
    loadAvailableVoices();
  }, [config.voice_type]);

  // Notify parent of config changes
  useEffect(() => {
    if (onConfigChange) {
      onConfigChange(config);
    }
  }, [config, onConfigChange]);

  const loadAvailableVoices = async () => {
    try {
      // Mock available voices - in production, this would fetch from the API
      const mockVoices = {
        elevenlabs: [
          { id: 'rachel', name: 'Rachel - Professional', language: 'en-US', gender: 'female' },
          { id: 'adam', name: 'Adam - Conversational', language: 'en-US', gender: 'male' },
          { id: 'domi', name: 'Domi - Energetic', language: 'en-US', gender: 'female' },
          { id: 'bella', name: 'Bella - Warm', language: 'en-US', gender: 'female' },
          { id: 'antoni', name: 'Antoni - Friendly', language: 'en-US', gender: 'male' }
        ],
        cloned: [
          { id: 'custom_1', name: 'Custom Voice 1', language: 'en-US', quality: 95 },
          { id: 'custom_2', name: 'Custom Voice 2', language: 'en-US', quality: 88 }
        ],
        google: [
          { id: 'en-US-Wavenet-A', name: 'Wavenet A - Female', language: 'en-US', gender: 'female' },
          { id: 'en-US-Wavenet-B', name: 'Wavenet B - Male', language: 'en-US', gender: 'male' },
          { id: 'en-US-Wavenet-C', name: 'Wavenet C - Female', language: 'en-US', gender: 'female' },
          { id: 'en-US-Wavenet-D', name: 'Wavenet D - Male', language: 'en-US', gender: 'male' }
        ],
        azure: [
          { id: 'en-US-AriaNeural', name: 'Aria - Natural', language: 'en-US', gender: 'female' },
          { id: 'en-US-GuyNeural', name: 'Guy - Professional', language: 'en-US', gender: 'male' },
          { id: 'en-US-JennyNeural', name: 'Jenny - Friendly', language: 'en-US', gender: 'female' }
        ]
      };

      setAvailableVoices(mockVoices[config.voice_type] || []);
    } catch (err) {
      console.error('Failed to load available voices:', err);
    }
  };

  const handleConfigChange = (field: keyof VoiceConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handleTestVoice = async () => {
    if (!onTestVoice || !testText.trim()) {
      setError('Test text is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const audioUrl = await onTestVoice(config, testText);
      setAudioUrl(audioUrl);
      
      // Play the audio
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      setError('Failed to generate voice test');
      console.error('Voice test error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const resetToDefaults = () => {
    setConfig({
      voice_type: 'elevenlabs',
      voice_id: 'rachel',
      voice_name: 'Rachel - Professional',
      language: 'en-US',
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true,
      speed: 1.0,
      pitch: 1.0
    });
  };

  const getVoiceTypeDescription = (type: string) => {
    const descriptions = {
      elevenlabs: 'High-quality AI voices with natural speech patterns',
      cloned: 'Custom cloned voices trained on specific voice samples',
      google: 'Google Cloud Text-to-Speech with WaveNet technology',
      azure: 'Microsoft Azure Cognitive Services Neural voices'
    };
    return descriptions[type as keyof typeof descriptions] || '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Configuration
          </h3>
          <p className="text-sm text-gray-600">Configure AI voice settings for optimal call quality</p>
        </div>
        
        <Button onClick={resetToDefaults} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Settings</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="test">Voice Test</TabsTrigger>
        </TabsList>

        {/* Basic Settings Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Voice Provider</CardTitle>
              <CardDescription>Select the AI voice provider and voice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Voice Provider</Label>
                <Select
                  value={config.voice_type}
                  onValueChange={(value) => handleConfigChange('voice_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                    <SelectItem value="cloned">Cloned Voice</SelectItem>
                    <SelectItem value="google">Google Cloud TTS</SelectItem>
                    <SelectItem value="azure">Azure Cognitive Services</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-600">{getVoiceTypeDescription(config.voice_type)}</p>
              </div>

              <div className="space-y-2">
                <Label>Available Voices</Label>
                <Select
                  value={config.voice_id}
                  onValueChange={(value) => {
                    const selectedVoice = availableVoices.find(v => v.id === value);
                    handleConfigChange('voice_id', value);
                    if (selectedVoice) {
                      handleConfigChange('voice_name', selectedVoice.name);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVoices.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{voice.name}</span>
                          {voice.gender && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {voice.gender}
                            </Badge>
                          )}
                          {voice.quality && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {voice.quality}% quality
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Language</Label>
                <Select
                  value={config.language}
                  onValueChange={(value) => handleConfigChange('language', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="en-GB">English (UK)</SelectItem>
                    <SelectItem value="es-ES">Spanish (Spain)</SelectItem>
                    <SelectItem value="es-MX">Spanish (Mexico)</SelectItem>
                    <SelectItem value="fr-FR">French</SelectItem>
                    <SelectItem value="de-DE">German</SelectItem>
                    <SelectItem value="it-IT">Italian</SelectItem>
                    <SelectItem value="pt-BR">Portuguese (Brazil)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Voice Quality Settings</CardTitle>
              <CardDescription>Adjust voice characteristics for optimal quality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Stability</Label>
                  <span className="text-sm text-gray-600">{Math.round(config.stability * 100)}%</span>
                </div>
                <Slider
                  value={[config.stability]}
                  onValueChange={([value]) => handleConfigChange('stability', value)}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-gray-600">
                  Higher stability = more consistent voice, lower creativity
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Similarity Boost</Label>
                  <span className="text-sm text-gray-600">{Math.round(config.similarity_boost * 100)}%</span>
                </div>
                <Slider
                  value={[config.similarity_boost]}
                  onValueChange={([value]) => handleConfigChange('similarity_boost', value)}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-gray-600">
                  Higher similarity = closer to original voice characteristics
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.use_speaker_boost}
                  onCheckedChange={(checked) => handleConfigChange('use_speaker_boost', checked)}
                />
                <Label>Speaker Boost</Label>
                <p className="text-xs text-gray-600">Enhance voice clarity for phone calls</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings Tab */}
        <TabsContent value="advanced" className="space-y-6">
          {showAdvanced && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Voice Parameters</CardTitle>
                  <CardDescription>Fine-tune voice characteristics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Style Exaggeration</Label>
                      <span className="text-sm text-gray-600">{Math.round(config.style * 100)}%</span>
                    </div>
                    <Slider
                      value={[config.style]}
                      onValueChange={([value]) => handleConfigChange('style', value)}
                      max={1}
                      min={0}
                      step={0.1}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-600">
                      Higher style = more expressive and varied speech patterns
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Speech Speed</Label>
                      <span className="text-sm text-gray-600">{config.speed.toFixed(1)}x</span>
                    </div>
                    <Slider
                      value={[config.speed]}
                      onValueChange={([value]) => handleConfigChange('speed', value)}
                      max={2}
                      min={0.5}
                      step={0.1}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-600">
                      Adjust speaking rate (0.5x = slow, 1.0x = normal, 2.0x = fast)
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Pitch Adjustment</Label>
                      <span className="text-sm text-gray-600">{config.pitch.toFixed(1)}x</span>
                    </div>
                    <Slider
                      value={[config.pitch]}
                      onValueChange={([value]) => handleConfigChange('pitch', value)}
                      max={2}
                      min={0.5}
                      step={0.1}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-600">
                      Adjust voice pitch (0.5x = lower, 1.0x = normal, 2.0x = higher)
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Voice Optimization</CardTitle>
                  <CardDescription>Optimize voice for specific use cases</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleConfigChange('stability', 0.7);
                        handleConfigChange('similarity_boost', 0.8);
                        handleConfigChange('style', 0.2);
                        handleConfigChange('speed', 0.9);
                      }}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Professional
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleConfigChange('stability', 0.5);
                        handleConfigChange('similarity_boost', 0.75);
                        handleConfigChange('style', 0.4);
                        handleConfigChange('speed', 1.1);
                      }}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Conversational
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleConfigChange('stability', 0.8);
                        handleConfigChange('similarity_boost', 0.9);
                        handleConfigChange('style', 0.1);
                        handleConfigChange('speed', 0.8);
                      }}
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Authoritative
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Voice Test Tab */}
        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Voice Test</CardTitle>
              <CardDescription>Test your voice configuration with sample text</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-text">Test Text</Label>
                <textarea
                  id="test-text"
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  className="w-full p-3 border rounded-lg resize-none"
                  rows={4}
                  placeholder="Enter text to test the voice configuration..."
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleTestVoice}
                  disabled={loading || !testText.trim()}
                  className="flex-1"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Headphones className="h-4 w-4 mr-2" />
                  )}
                  {loading ? 'Generating...' : 'Generate Voice Test'}
                </Button>

                {audioUrl && (
                  <Button 
                    onClick={handlePlayPause}
                    variant="outline"
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>

              {audioUrl && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Waveform className="h-4 w-4" />
                    <span className="text-sm font-medium">Generated Audio</span>
                  </div>
                  <audio
                    ref={audioRef}
                    onEnded={handleAudioEnded}
                    className="w-full"
                    controls
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Configuration</CardTitle>
              <CardDescription>Summary of your voice settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Provider:</span>
                  <span className="ml-2 font-medium">{config.voice_type}</span>
                </div>
                <div>
                  <span className="text-gray-600">Voice:</span>
                  <span className="ml-2 font-medium">{config.voice_name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Language:</span>
                  <span className="ml-2 font-medium">{config.language}</span>
                </div>
                <div>
                  <span className="text-gray-600">Stability:</span>
                  <span className="ml-2 font-medium">{Math.round(config.stability * 100)}%</span>
                </div>
                <div>
                  <span className="text-gray-600">Similarity:</span>
                  <span className="ml-2 font-medium">{Math.round(config.similarity_boost * 100)}%</span>
                </div>
                <div>
                  <span className="text-gray-600">Speed:</span>
                  <span className="ml-2 font-medium">{config.speed.toFixed(1)}x</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
