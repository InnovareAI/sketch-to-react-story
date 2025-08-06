import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Mic, MicOff, Volume2, VolumeX, Settings, AlertCircle } from 'lucide-react';
import { useVoice } from '@/hooks/useVoice';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VoiceInterfaceProps {
  onVoiceMessage: (text: string) => void;
  className?: string;
}

export function VoiceInterface({ onVoiceMessage, className = "" }: VoiceInterfaceProps) {
  const [apiKey, setApiKey] = useState('enabled'); // Flag to indicate ElevenLabs is available
  const [voiceId, setVoiceId] = useState('9BWtsMINqrJLrRacOk9x'); // Aria voice
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Use the voice hook with ElevenLabs enabled
  const { isListening, isPlaying, error, startListening, stopListening, speakText } = useVoice({
    apiKey: apiKey === 'enabled' ? 'enabled' : undefined,
    voiceId,
    model: 'eleven_turbo_v2'
  });

  const handleVoiceInput = async () => {
    try {
      if (isListening) {
        stopListening();
      } else {
        const transcript = await startListening();
        if (transcript) {
          onVoiceMessage(transcript);
        }
      }
    } catch (error) {
      console.error('Voice input failed:', error);
    }
  };

  const testVoice = () => {
    speakText("Hello! This is a test of Sam's voice. How do I sound?");
  };

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          onClick={handleVoiceInput}
          variant="outline"
          size="icon"
          className={`h-12 w-12 transition-all duration-200 ${
            isListening 
              ? "bg-red-900/50 border-red-600 text-red-400 hover:bg-red-900/70 animate-glow" 
              : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
          }`}
          disabled={isPlaying}
        >
          {isListening ? (
            <MicOff className="h-5 w-5 animate-bounce-subtle" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </Button>

        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 text-gray-400 hover:text-gray-300 hover:bg-gray-700"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Voice Settings
              </DialogTitle>
              <DialogDescription className="text-gray-300">
                Configure voice input and ElevenLabs text-to-speech
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <Alert className="border-blue-600 bg-blue-900/20">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-blue-300">
                  For enhanced voice quality, add your ElevenLabs API key. Otherwise, browser speech synthesis will be used.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="api-key" className="text-gray-300">
                  ElevenLabs API Key (Optional)
                </Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="Enter your ElevenLabs API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <p className="text-xs text-gray-400">
                  Get your API key from{' '}
                  <a 
                    href="https://elevenlabs.io/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    elevenlabs.io
                  </a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="voice-id" className="text-gray-300">
                  Voice ID
                </Label>
                <Input
                  id="voice-id"
                  placeholder="Voice ID"
                  value={voiceId}
                  onChange={(e) => setVoiceId(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <p className="text-xs text-gray-400">
                  Use default voice or enter a custom voice ID from ElevenLabs
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={testVoice}
                  disabled={isPlaying}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isPlaying ? (
                    <>
                      <VolumeX className="h-4 w-4 mr-2" />
                      Playing...
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4 mr-2" />
                      Test Voice
                    </>
                  )}
                </Button>
                <Button 
                  onClick={() => setIsSettingsOpen(false)}
                  variant="outline"
                  className="bg-gray-700 border-gray-600 text-gray-300"
                >
                  Done
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert className="mt-2 border-red-600 bg-red-900/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-300">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}