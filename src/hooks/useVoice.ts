import { useState, useCallback } from 'react';

interface VoiceConfig {
  apiKey?: string;
  voiceId?: string;
  model?: string;
}

export function useVoice(config?: VoiceConfig) {
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startListening = useCallback(async () => {
    try {
      setError(null);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Voice input not supported in this browser');
      }

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onstart = () => {
          setIsListening(true);
        };
        
        recognition.onend = () => {
          setIsListening(false);
          stream.getTracks().forEach(track => track.stop());
        };
        
        recognition.onerror = (event: any) => {
          setError(`Speech recognition error: ${event.error}`);
          setIsListening(false);
          stream.getTracks().forEach(track => track.stop());
        };
        
        return new Promise<string>((resolve, reject) => {
          recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            resolve(transcript);
          };
          
          recognition.start();
        });
      } else {
        throw new Error('Speech recognition not supported in this browser');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start voice input');
      setIsListening(false);
      throw err;
    }
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
    // Stop any ongoing recognition
  }, []);

  const speakText = useCallback(async (text: string) => {
    try {
      setError(null);
      setIsPlaying(true);

      if (config?.apiKey) {
        // Use Supabase Edge Function for secure ElevenLabs TTS
        const response = await fetch('/functions/v1/voice-tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
          },
          body: JSON.stringify({
            text,
            voiceId: config.voiceId || '9BWtsMINqrJLrRacOk9x', // Aria voice
            model: config.model || 'eleven_turbo_v2'
          })
        });

        if (!response.ok) {
          throw new Error('Failed to generate speech');
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        audio.onerror = () => {
          setError('Audio playback failed');
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        await audio.play();
      } else {
        // Fallback to browser's built-in speech synthesis
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.9;
          utterance.pitch = 1;
          utterance.volume = 0.8;
          
          utterance.onend = () => setIsPlaying(false);
          utterance.onerror = () => {
            setError('Speech synthesis failed');
            setIsPlaying(false);
          };
          
          speechSynthesis.speak(utterance);
        } else {
          throw new Error('Speech synthesis not supported');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to speak text');
      setIsPlaying(false);
    }
  }, [config]);

  return {
    isListening,
    isPlaying,
    error,
    startListening,
    stopListening,
    speakText
  };
}