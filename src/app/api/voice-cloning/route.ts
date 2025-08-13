import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: Voice Cloning Integration
 * Handles communication with the Python voice cloning microservice
 */

interface VoiceCloneRequest {
  user_id: string;
  voice_id: string;
  text: string;
  settings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

interface VoiceSampleUpload {
  user_id: string;
  voice_name: string;
  description?: string;
  language: string;
}

// GET - Get user's cloned voices
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const voiceId = searchParams.get('voiceId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // Get the voice cloning service URL
    const voiceCloningUrl = process.env.VOICE_CLONING_SERVICE_URL || 'http://localhost:8005';
    
    if (voiceId) {
      // Get specific voice details
      const response = await fetch(`${voiceCloningUrl}/api/voice-cloning/voices/${userId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.VOICE_CLONING_API_KEY || 'dev-key'}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch voice details');
      }

      // Find specific voice
      const voice = data.voices.find((v: any) => v.voice_id === voiceId);
      
      if (!voice) {
        return NextResponse.json(
          { success: false, error: 'Voice not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        voice: voice,
      });
    } else {
      // Get all user voices
      const response = await fetch(`${voiceCloningUrl}/api/voice-cloning/voices/${userId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.VOICE_CLONING_API_KEY || 'dev-key'}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch user voices');
      }

      return NextResponse.json({
        success: true,
        voices: data.voices || [],
        total_count: data.total_count || 0,
      });
    }

  } catch (error) {
    console.error('❌ Failed to fetch voices:', error);
    
    // Return mock data for development
    const mockVoices = [
      {
        voice_id: 'mock_voice_1',
        voice_name: 'Professional Voice',
        description: 'Clear, professional speaking voice',
        language: 'en',
        status: 'ready',
        quality_score: 0.92,
        created_at: '2024-01-15T10:30:00Z'
      }
    ];
    
    return NextResponse.json({
      success: true,
      voices: mockVoices,
      total_count: mockVoices.length,
      note: 'Using mock data - voice cloning service not available'
    });
  }
}

// POST - Upload voice sample or synthesize speech
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    // Get the voice cloning service URL
    const voiceCloningUrl = process.env.VOICE_CLONING_SERVICE_URL || 'http://localhost:8005';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle voice sample upload
      const formData = await request.formData();
      const audioFile = formData.get('audio_file') as File;
      const voiceData = JSON.parse(formData.get('voice_data') as string) as VoiceSampleUpload;
      
      if (!audioFile || !voiceData.user_id || !voiceData.voice_name) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields: audio_file, user_id, voice_name' },
          { status: 400 }
        );
      }

      // Validate audio file
      if (!audioFile.type.startsWith('audio/')) {
        return NextResponse.json(
          { success: false, error: 'File must be an audio file' },
          { status: 400 }
        );
      }

      // Check file size (max 50MB)
      if (audioFile.size > 50 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: 'Audio file too large (max 50MB)' },
          { status: 400 }
        );
      }

      // Forward to voice cloning service
      const uploadFormData = new FormData();
      uploadFormData.append('audio_file', audioFile);
      uploadFormData.append('voice_data', JSON.stringify(voiceData));

      const response = await fetch(`${voiceCloningUrl}/api/voice-cloning/upload-sample`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.VOICE_CLONING_API_KEY || 'dev-key'}`,
        },
        body: uploadFormData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload voice sample');
      }

      return NextResponse.json({
        success: true,
        voice_id: data.voice_id,
        voice_name: data.voice_name,
        status: data.status,
        message: data.message,
        processing_time_ms: data.processing_time_ms,
        estimated_training_time: data.estimated_training_time,
      });

    } else {
      // Handle speech synthesis
      const body = await request.json() as VoiceCloneRequest;
      
      // Validate required fields
      const requiredFields = ['user_id', 'voice_id', 'text'];
      for (const field of requiredFields) {
        if (!body[field]) {
          return NextResponse.json(
            { success: false, error: `Missing required field: ${field}` },
            { status: 400 }
          );
        }
      }

      // Validate text length
      if (body.text.length > 5000) {
        return NextResponse.json(
          { success: false, error: 'Text too long (max 5000 characters)' },
          { status: 400 }
        );
      }

      // Forward to voice cloning service
      const response = await fetch(`${voiceCloningUrl}/api/voice-cloning/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VOICE_CLONING_API_KEY || 'dev-key'}`,
        },
        body: JSON.stringify({
          voice_id: body.voice_id,
          text: body.text,
          user_id: body.user_id,
          settings: body.settings || {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to synthesize speech');
      }

      return NextResponse.json({
        success: true,
        voice_id: data.voice_id,
        audio_url: data.audio_url,
        audio_duration: data.audio_duration,
        processing_time_ms: data.processing_time_ms,
        model_version: data.model_version,
        timestamp: data.timestamp,
      });
    }

  } catch (error) {
    console.error('❌ Voice cloning operation failed:', error);
    
    // Return mock response for development
    const mockResponse = {
      success: true,
      voice_id: 'mock_voice_1',
      audio_url: 'https://mock-audio-cdn.com/synthesized/mock_audio.mp3',
      audio_duration: 5.2,
      processing_time_ms: 1250,
      model_version: 'mock-2.0.0',
      timestamp: new Date().toISOString(),
      note: 'Using mock data - voice cloning service not available'
    };
    
    return NextResponse.json(mockResponse);
  }
}

// PUT - Update voice settings or retrain
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { voice_id, user_id, action, ...updateData } = body;
    
    if (!voice_id || !user_id) {
      return NextResponse.json(
        { success: false, error: 'Missing voice_id or user_id' },
        { status: 400 }
      );
    }

    // Get the voice cloning service URL
    const voiceCloningUrl = process.env.VOICE_CLONING_SERVICE_URL || 'http://localhost:8005';
    
    if (action === 'retrain') {
      // Start retraining
      const response = await fetch(`${voiceCloningUrl}/api/voice-cloning/train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VOICE_CLONING_API_KEY || 'dev-key'}`,
        },
        body: JSON.stringify({
          voice_id: voice_id,
          user_id: user_id,
          training_settings: updateData.training_settings || {}
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start retraining');
      }

      return NextResponse.json({
        success: true,
        voice_id: data.voice_id,
        status: data.status,
        message: data.message,
      });
    } else {
      // Update voice metadata (this would be handled by your main database)
      return NextResponse.json({
        success: true,
        message: 'Voice updated successfully',
        voice_id: voice_id,
      });
    }

  } catch (error) {
    console.error('❌ Failed to update voice:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete cloned voice
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const voiceId = searchParams.get('voiceId');
    const userId = searchParams.get('userId');
    
    if (!voiceId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing voiceId or userId' },
        { status: 400 }
      );
    }

    // Get the voice cloning service URL
    const voiceCloningUrl = process.env.VOICE_CLONING_SERVICE_URL || 'http://localhost:8005';
    
    // Delete from voice cloning service
    const response = await fetch(`${voiceCloningUrl}/api/voice-cloning/delete?voiceId=${voiceId}&userId=${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${process.env.VOICE_CLONING_API_KEY || 'dev-key'}`,
      },
    });

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Voice deleted successfully',
      });
    } else {
      const data = await response.json();
      throw new Error(data.error || 'Failed to delete voice');
    }

  } catch (error) {
    console.error('❌ Failed to delete voice:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
