
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Shield,
  Zap,
  Brain,
  Mic,
  Settings,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Star,
  Database
} from 'lucide-react';
import Link from 'next/link';

export default function CallingAgentPage() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold font-headline tracking-tight">
          AI-Powered Calling Agent Platform
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Choose your calling agent solution with enterprise-grade scam detection and voice technology
        </p>
      </div>

      {/* Calling Agent Options */}
      <div className="grid gap-8 lg:grid-cols-2 max-w-6xl mx-auto">

        {/* Option 1: ElevenLabs Built-in System */}
        <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-colors">
          <div className="absolute top-4 right-4">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Star className="h-3 w-3 mr-1" />
              Recommended
            </Badge>
          </div>

          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-headline">
                ElevenLabs Built-in System
              </CardTitle>
            </div>
            <CardDescription className="text-base">
              Professional AI calling agent with real-time scam detection and enterprise-grade voice technology
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Key Features */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                Security & Detection Features
              </h4>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>95%+ Scam Detection Accuracy</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Real-time Pattern Recognition</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Voice Stress Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Behavioral Analysis Engine</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Mic className="h-4 w-4 text-blue-500" />
                Voice Technology
              </h4>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>ElevenLabs Premium Voices</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Sub-100ms Response Time</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Natural Conversation Flow</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Multi-language Support</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                AI Capabilities
              </h4>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>GPT-4 / Claude / Gemini Integration</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Knowledge Base & RAG System</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Real-time Analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Conversation Recording</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4">
              <Link href="/calling-agent/configure">
                <Button className="w-full" size="lg">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Agent
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>

              <div className="grid grid-cols-2 gap-2">
                <Link href="/calling-agent/call-lists">
                  <Button variant="outline" className="w-full">
                    <Database className="h-4 w-4 mr-2" />
                    Call Lists
                  </Button>
                </Link>
                <Link href="/calling-agent/voice-cloning">
                  <Button variant="outline" className="w-full">
                    <Mic className="h-4 w-4 mr-2" />
                    Voice Cloning
                  </Button>
                </Link>
                <Link href="/calling-agent/operations">
                  <Button variant="outline" className="w-full">
                    <Phone className="h-4 w-4 mr-2" />
                    Operations
                  </Button>
                </Link>
                <Link href="/calling-agent/analytics">
                  <Button variant="outline" className="w-full">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Option 2: AI Voice Cloned System */}
        <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-colors opacity-75">
          <div className="absolute top-4 right-4">
            <Badge variant="outline" className="bg-orange-100 text-orange-800">
              Coming Soon
            </Badge>
          </div>

          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-2xl font-headline">
                AI Voice Cloned System
              </CardTitle>
            </div>
            <CardDescription className="text-base">
              Advanced voice cloning technology with custom voice training and enhanced personalization
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Key Features */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Mic className="h-4 w-4 text-purple-500" />
                Voice Cloning Features
              </h4>
              <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-gray-400" />
                  <span>Custom Voice Training</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-gray-400" />
                  <span>Voice Sample Upload</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-gray-400" />
                  <span>Emotional Voice Modulation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-gray-400" />
                  <span>Speaker Identity Preservation</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                Enhanced Security
              </h4>
              <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-gray-400" />
                  <span>Advanced Scam Detection</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-gray-400" />
                  <span>Voice Authentication</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-gray-400" />
                  <span>Deepfake Detection</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-gray-400" />
                  <span>Biometric Voice Analysis</span>
                </div>
              </div>
            </div>

            {/* Coming Soon Notice */}
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <h4 className="font-medium mb-2">🚀 Coming Soon</h4>
              <p className="text-sm text-muted-foreground">
                Advanced voice cloning capabilities are currently in development.
                Get started with our ElevenLabs system and upgrade when available.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4">
              <Button disabled className="w-full" size="lg">
                <Brain className="h-4 w-4 mr-2" />
                Coming Soon
              </Button>

              <Button variant="outline" className="w-full" asChild>
                <Link href="/calling-agent/configure">
                  Start with ElevenLabs System
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="bg-muted/50 rounded-lg p-6 max-w-4xl mx-auto">
        <h3 className="text-lg font-semibold mb-4 text-center">Platform Performance</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">95.2%</div>
            <div className="text-sm text-muted-foreground">Scam Detection Accuracy</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">85ms</div>
            <div className="text-sm text-muted-foreground">Average Response Time</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">1,284</div>
            <div className="text-sm text-muted-foreground">Total Calls Processed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">99.9%</div>
            <div className="text-sm text-muted-foreground">System Uptime</div>
          </div>
        </div>
      </div>
    </div>
  );
}
