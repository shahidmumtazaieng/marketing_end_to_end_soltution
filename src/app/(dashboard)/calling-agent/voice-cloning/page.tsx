'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Upload, 
  Mic, 
  MicOff,
  Play, 
  Pause,
  Square,
  Download,
  Trash2,
  Settings,
  Brain,
  Zap,
  Clock,
  CheckCircle,
  AlertTriangle,
  Volume2,
  Waveform,
  User,
  Globe,
  Star,
  BarChart3,
  RefreshCw,
  FileAudio,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ClonedVoice {
  voice_id: string;
  voice_name: string;
  description?: string;
  language: string;
  status: 'processing' | 'training' | 'ready' | 'failed';
  quality_score?: number;
  created_at: string;
  updated_at?: string;
  model_version?: string;
  usage_count?: number;
  last_used?: string;
}

interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
}

export default function VoiceCloningPage() {
  const [clonedVoices, setClonedVoices] = useState<ClonedVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<ClonedVoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('voices');
  
  // Voice upload states
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [voiceName, setVoiceName] = useState('');
  const [voiceDescription, setVoiceDescription] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  
  // Voice synthesis states
  const [synthesisText, setSynthesisText] = useState('');
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.0,
    use_speaker_boost: true
  });
  const [synthesizedAudio, setSynthesizedAudio] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Recording states
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    loadClonedVoices();
  }, []);

  const loadClonedVoices = async () => {
    try {
      setIsLoading(true);
      
      // Get user ID (replace with actual user context)
      const userId = 'user_123'; // This should come from your auth context
      
      const response = await fetch(`/api/voice-cloning?userId=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setClonedVoices(data.voices || []);
      } else {
        throw new Error(data.error || 'Failed to load voices');
      }
      
    } catch (error) {
      console.error('Failed to load cloned voices:', error);
      toast({
        title: "Error",
        description: "Failed to load cloned voices",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 22050,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'voice_sample.webm', { type: 'audio/webm' });
        setAudioFile(audioFile);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Speak clearly for 10-20 seconds for best results",
      });
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast({
        title: "Recording Error",
        description: "Failed to access microphone",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      toast({
        title: "Recording Stopped",
        description: "Voice sample captured successfully",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an audio file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Audio file must be less than 50MB",
        variant: "destructive"
      });
      return;
    }

    setAudioFile(file);
    toast({
      title: "File Selected",
      description: `Selected: ${file.name}`,
    });
  };

  const uploadVoiceSample = async () => {
    if (!audioFile || !voiceName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a voice name and audio file",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append('audio_file', audioFile);
      formData.append('voice_data', JSON.stringify({
        user_id: 'user_123', // Replace with actual user ID
        voice_name: voiceName,
        description: voiceDescription,
        language: selectedLanguage
      }));

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      const response = await fetch('/api/voice-cloning', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Voice Upload Successful",
          description: `${data.voice_name} is being processed. Training will take 5-10 minutes.`,
        });

        // Reset form
        setAudioFile(null);
        setVoiceName('');
        setVoiceDescription('');
        setUploadProgress(0);
        
        // Reload voices
        await loadClonedVoices();
        
        // Switch to voices tab
        setActiveTab('voices');
      } else {
        throw new Error(data.error || 'Upload failed');
      }

    } catch (error) {
      console.error('Voice upload failed:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload voice sample",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const synthesizeSpeech = async () => {
    if (!selectedVoice || !synthesisText.trim()) {
      toast({
        title: "Validation Error",
        description: "Please select a voice and enter text to synthesize",
        variant: "destructive"
      });
      return;
    }

    if (selectedVoice.status !== 'ready') {
      toast({
        title: "Voice Not Ready",
        description: `Voice is currently ${selectedVoice.status}. Please wait for training to complete.`,
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch('/api/voice-cloning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'user_123', // Replace with actual user ID
          voice_id: selectedVoice.voice_id,
          text: synthesisText,
          settings: voiceSettings
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSynthesizedAudio(data.audio_url);
        
        toast({
          title: "Speech Synthesized",
          description: `Generated ${data.audio_duration?.toFixed(1)}s of audio in ${data.processing_time_ms}ms`,
        });
      } else {
        throw new Error(data.error || 'Synthesis failed');
      }

    } catch (error) {
      console.error('Speech synthesis failed:', error);
      toast({
        title: "Synthesis Failed",
        description: error instanceof Error ? error.message : "Failed to synthesize speech",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    audio.onended = () => setIsPlaying(false);

    audio.play().catch(error => {
      console.error('Audio playback failed:', error);
      toast({
        title: "Playback Error",
        description: "Failed to play audio",
        variant: "destructive"
      });
    });
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const deleteVoice = async (voiceId: string) => {
    if (!confirm('Are you sure you want to delete this voice? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`/api/voice-cloning?voiceId=${voiceId}&userId=user_123`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Voice Deleted",
          description: "Voice has been permanently deleted",
        });

        // Reload voices
        await loadClonedVoices();
        
        // Clear selection if deleted voice was selected
        if (selectedVoice?.voice_id === voiceId) {
          setSelectedVoice(null);
        }
      } else {
        throw new Error(data.error || 'Delete failed');
      }

    } catch (error) {
      console.error('Voice deletion failed:', error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete voice",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const retrainVoice = async (voiceId: string) => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/voice-cloning', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voice_id: voiceId,
          user_id: 'user_123',
          action: 'retrain'
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Retraining Started",
          description: "Voice retraining has been initiated. This will take 5-10 minutes.",
        });

        // Reload voices to update status
        await loadClonedVoices();
      } else {
        throw new Error(data.error || 'Retrain failed');
      }

    } catch (error) {
      console.error('Voice retraining failed:', error);
      toast({
        title: "Retrain Failed",
        description: error instanceof Error ? error.message : "Failed to start retraining",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ready': return 'default';
      case 'processing': return 'secondary';
      case 'training': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return <CheckCircle className="h-3 w-3" />;
      case 'processing': return <Clock className="h-3 w-3" />;
      case 'training': return <Brain className="h-3 w-3" />;
      case 'failed': return <AlertTriangle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'pl', name: 'Polish' },
    { code: 'tr', name: 'Turkish' },
    { code: 'ru', name: 'Russian' },
    { code: 'nl', name: 'Dutch' },
    { code: 'cs', name: 'Czech' },
    { code: 'ar', name: 'Arabic' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ko', name: 'Korean' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="h-8 w-8 text-purple-600" />
            </div>
            AI Voice Cloning
          </h1>
          <p className="text-muted-foreground">
            Create and manage custom AI voices for your calling campaigns
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="px-3 py-1">
            <Mic className="h-3 w-3 mr-1" />
            {clonedVoices.length} Voices
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            <Zap className="h-3 w-3 mr-1" />
            ElevenLabs Powered
          </Badge>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="voices">
            <User className="h-4 w-4 mr-2" />
            My Voices
          </TabsTrigger>
          <TabsTrigger value="create">
            <Upload className="h-4 w-4 mr-2" />
            Create Voice
          </TabsTrigger>
          <TabsTrigger value="synthesize">
            <Volume2 className="h-4 w-4 mr-2" />
            Synthesize
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* My Voices Tab */}
        <TabsContent value="voices" className="space-y-4">
          <div className="grid gap-4">
            {clonedVoices.length === 0 && !isLoading ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Mic className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Cloned Voices</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first AI voice clone by uploading a 10-20 second voice sample.
                  </p>
                  <Button onClick={() => setActiveTab('create')}>
                    <Upload className="h-4 w-4 mr-2" />
                    Create Your First Voice
                  </Button>
                </CardContent>
              </Card>
            ) : (
              clonedVoices.map((voice) => (
                <Card key={voice.voice_id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Mic className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {voice.voice_name}
                            <Badge variant={getStatusBadgeColor(voice.status)} className="ml-2">
                              {getStatusIcon(voice.status)}
                              {voice.status.charAt(0).toUpperCase() + voice.status.slice(1)}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {languages.find(l => l.code === voice.language)?.name || voice.language}
                            </span>
                            {voice.quality_score && (
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                {(voice.quality_score * 100).toFixed(0)}% Quality
                              </span>
                            )}
                            <span className="text-xs">
                              Created {new Date(voice.created_at).toLocaleDateString()}
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {voice.status === 'ready' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedVoice(voice);
                              setActiveTab('synthesize');
                            }}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Use Voice
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => retrainVoice(voice.voice_id)}
                          disabled={voice.status === 'training' || isLoading}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Retrain
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteVoice(voice.voice_id)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {voice.description && (
                      <p className="text-sm text-muted-foreground mb-3">{voice.description}</p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Model Version</div>
                        <div className="text-muted-foreground">{voice.model_version || 'v2.0.0'}</div>
                      </div>
                      <div>
                        <div className="font-medium">Usage Count</div>
                        <div className="text-muted-foreground">{voice.usage_count || 0} calls</div>
                      </div>
                      <div>
                        <div className="font-medium">Last Used</div>
                        <div className="text-muted-foreground">
                          {voice.last_used ? new Date(voice.last_used).toLocaleDateString() : 'Never'}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">Status</div>
                        <div className="text-muted-foreground">
                          {voice.status === 'training' ? 'Training in progress...' :
                           voice.status === 'processing' ? 'Processing audio...' :
                           voice.status === 'ready' ? 'Ready for use' :
                           voice.status === 'failed' ? 'Training failed' : voice.status}
                        </div>
                      </div>
                    </div>

                    {voice.status === 'training' && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span>Training Progress</span>
                          <span>Estimated 5-10 minutes</span>
                        </div>
                        <Progress value={65} className="h-2" />
                      </div>
                    )}

                    {voice.status === 'failed' && (
                      <Alert className="mt-4" variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Voice training failed. Please try uploading a new voice sample with better audio quality.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Create Voice Tab */}
        <TabsContent value="create" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Voice Recording/Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileAudio className="h-5 w-5 text-blue-500" />
                  Voice Sample
                </CardTitle>
                <CardDescription>
                  Record or upload a 10-20 second clear voice sample for best results
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Recording Section */}
                <div className="space-y-3">
                  <Label>Record Voice Sample</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant={isRecording ? "destructive" : "outline"}
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isRecording ? (
                        <>
                          <Square className="h-4 w-4 mr-2" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4 mr-2" />
                          Start Recording
                        </>
                      )}
                    </Button>
                  </div>
                  {isRecording && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                      Recording... Speak clearly for 10-20 seconds
                    </div>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                {/* File Upload Section */}
                <div className="space-y-3">
                  <Label htmlFor="audio-upload">Upload Audio File</Label>
                  <Input
                    id="audio-upload"
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supported formats: MP3, WAV, M4A, FLAC (max 50MB)
                  </p>
                </div>

                {audioFile && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        Audio file ready: {audioFile.name}
                      </span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      Size: {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Voice Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-purple-500" />
                  Voice Configuration
                </CardTitle>
                <CardDescription>
                  Configure your voice clone settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="voice-name">Voice Name *</Label>
                  <Input
                    id="voice-name"
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value)}
                    placeholder="e.g., Professional Sales Voice"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="voice-description">Description</Label>
                  <Textarea
                    id="voice-description"
                    value={voiceDescription}
                    onChange={(e) => setVoiceDescription(e.target.value)}
                    placeholder="Brief description of this voice..."
                    rows={3}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage} disabled={isLoading}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          <div className="flex items-center gap-2">
                            <Globe className="h-3 w-3" />
                            {lang.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={uploadVoiceSample}
                    disabled={!audioFile || !voiceName.trim() || isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Voice...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Create AI Voice Clone
                      </>
                    )}
                  </Button>
                </div>

                {uploadProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Upload Progress</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Voice Cloning Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-green-500" />
                Voice Cloning Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">📝 Recording Guidelines</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Record 10-20 seconds of clear speech</li>
                    <li>• Speak naturally at normal pace</li>
                    <li>• Use a quiet environment</li>
                    <li>• Avoid background noise</li>
                    <li>• Speak directly into microphone</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-3">🎯 Best Practices</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Use professional, clear speech</li>
                    <li>• Include varied intonation</li>
                    <li>• Avoid monotone delivery</li>
                    <li>• Record multiple samples if needed</li>
                    <li>• Training takes 5-10 minutes</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Synthesize Tab */}
        <TabsContent value="synthesize" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Voice Selection & Text Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-blue-500" />
                  Speech Synthesis
                </CardTitle>
                <CardDescription>
                  Generate speech using your cloned voices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Voice</Label>
                  <Select
                    value={selectedVoice?.voice_id || ''}
                    onValueChange={(value) => {
                      const voice = clonedVoices.find(v => v.voice_id === value);
                      setSelectedVoice(voice || null);
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a voice to use" />
                    </SelectTrigger>
                    <SelectContent>
                      {clonedVoices.filter(v => v.status === 'ready').map((voice) => (
                        <SelectItem key={voice.voice_id} value={voice.voice_id}>
                          <div className="flex items-center gap-2">
                            <Mic className="h-3 w-3" />
                            {voice.voice_name}
                            <Badge variant="outline" className="ml-2">
                              {languages.find(l => l.code === voice.language)?.name}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {clonedVoices.filter(v => v.status === 'ready').length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No ready voices available. Create a voice first.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="synthesis-text">Text to Synthesize</Label>
                  <Textarea
                    id="synthesis-text"
                    value={synthesisText}
                    onChange={(e) => setSynthesisText(e.target.value)}
                    placeholder="Enter the text you want to convert to speech..."
                    rows={6}
                    disabled={isLoading}
                    maxLength={5000}
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Characters: {synthesisText.length}/5000</span>
                    <span>Estimated duration: ~{(synthesisText.length * 0.1).toFixed(1)}s</span>
                  </div>
                </div>

                <Button
                  onClick={synthesizeSpeech}
                  disabled={!selectedVoice || !synthesisText.trim() || isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating Speech...
                    </>
                  ) : (
                    <>
                      <Waveform className="h-4 w-4 mr-2" />
                      Generate Speech
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Voice Settings & Output */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-purple-500" />
                  Voice Settings
                </CardTitle>
                <CardDescription>
                  Fine-tune voice synthesis parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Stability: {voiceSettings.stability}</Label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={voiceSettings.stability}
                      onChange={(e) => setVoiceSettings(prev => ({ ...prev, stability: parseFloat(e.target.value) }))}
                      className="w-full"
                      disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Higher values make voice more stable but less expressive
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Similarity Boost: {voiceSettings.similarity_boost}</Label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={voiceSettings.similarity_boost}
                      onChange={(e) => setVoiceSettings(prev => ({ ...prev, similarity_boost: parseFloat(e.target.value) }))}
                      className="w-full"
                      disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enhances similarity to original voice
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Style: {voiceSettings.style}</Label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={voiceSettings.style}
                      onChange={(e) => setVoiceSettings(prev => ({ ...prev, style: parseFloat(e.target.value) }))}
                      className="w-full"
                      disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Adds stylistic variation to speech
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="speaker-boost"
                      checked={voiceSettings.use_speaker_boost}
                      onChange={(e) => setVoiceSettings(prev => ({ ...prev, use_speaker_boost: e.target.checked }))}
                      disabled={isLoading}
                    />
                    <Label htmlFor="speaker-boost" className="text-sm">
                      Use Speaker Boost
                    </Label>
                  </div>
                </div>

                {/* Audio Output */}
                {synthesizedAudio && (
                  <div className="space-y-3 pt-4 border-t">
                    <Label>Generated Audio</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => isPlaying ? pauseAudio() : playAudio(synthesizedAudio)}
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(synthesizedAudio, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Audio ready for download
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileAudio className="h-5 w-5 text-green-500" />
                Quick Templates
              </CardTitle>
              <CardDescription>
                Pre-written scripts for common calling scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-auto p-4 text-left"
                  onClick={() => setSynthesisText("Hello, this is [Your Name] calling from [Company]. I'm reaching out to local businesses about our marketing services. Do you have a moment to discuss how we can help grow your business?")}
                >
                  <div>
                    <div className="font-medium">Sales Introduction</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Professional sales opening
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-4 text-left"
                  onClick={() => setSynthesisText("Hi, I'm calling to follow up on your recent inquiry about our services. I wanted to see if you had any questions and discuss how we can help meet your needs.")}
                >
                  <div>
                    <div className="font-medium">Follow-up Call</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Customer follow-up script
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-4 text-left"
                  onClick={() => setSynthesisText("Thank you for your interest in our services. I'm calling to schedule a brief consultation to discuss your specific needs and how we can provide the best solution for your business.")}
                >
                  <div>
                    <div className="font-medium">Appointment Setting</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Schedule consultation
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-6">
            {/* Usage Statistics */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Voices</p>
                      <p className="text-2xl font-bold">{clonedVoices.length}</p>
                    </div>
                    <Mic className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Ready Voices</p>
                      <p className="text-2xl font-bold">{clonedVoices.filter(v => v.status === 'ready').length}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Usage</p>
                      <p className="text-2xl font-bold">{clonedVoices.reduce((sum, v) => sum + (v.usage_count || 0), 0)}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg Quality</p>
                      <p className="text-2xl font-bold">
                        {clonedVoices.length > 0
                          ? Math.round(clonedVoices.reduce((sum, v) => sum + (v.quality_score || 0), 0) / clonedVoices.length * 100)
                          : 0}%
                      </p>
                    </div>
                    <Star className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Voice Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Voice Performance</CardTitle>
                <CardDescription>
                  Quality scores and usage statistics for your cloned voices
                </CardDescription>
              </CardHeader>
              <CardContent>
                {clonedVoices.length > 0 ? (
                  <div className="space-y-4">
                    {clonedVoices.map((voice) => (
                      <div key={voice.voice_id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Mic className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <div className="font-medium">{voice.voice_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {languages.find(l => l.code === voice.language)?.name} • {voice.status}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <div className="font-medium">{voice.usage_count || 0}</div>
                            <div className="text-muted-foreground">Uses</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium">
                              {voice.quality_score ? `${Math.round(voice.quality_score * 100)}%` : 'N/A'}
                            </div>
                            <div className="text-muted-foreground">Quality</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium">
                              {voice.last_used ? new Date(voice.last_used).toLocaleDateString() : 'Never'}
                            </div>
                            <div className="text-muted-foreground">Last Used</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No Analytics Data</h3>
                    <p className="text-muted-foreground">
                      Create and use voice clones to see analytics data here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Usage Insights */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Language Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {clonedVoices.length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(
                        clonedVoices.reduce((acc, voice) => {
                          const langName = languages.find(l => l.code === voice.language)?.name || voice.language;
                          acc[langName] = (acc[langName] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([language, count]) => (
                        <div key={language} className="flex items-center justify-between">
                          <span className="text-sm">{language}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-muted rounded-full h-2">
                              <div
                                className="bg-purple-500 h-2 rounded-full"
                                style={{ width: `${(count / clonedVoices.length) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-8">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No data available</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  {clonedVoices.length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(
                        clonedVoices.reduce((acc, voice) => {
                          acc[voice.status] = (acc[voice.status] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(status)}
                            <span className="text-sm capitalize">{status}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-muted rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${(count / clonedVoices.length) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-8">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
