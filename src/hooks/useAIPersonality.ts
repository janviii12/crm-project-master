import { useCallback, useState, useRef } from 'react';
import { Howl, Howler } from 'howler';

export type AIPersonality = 'neutral' | 'happy' | 'excited' | 'concerned' | 'processing' | 'celebrating';

interface PersonalityConfig {
  voice: {
    text: string;
    pitch: number;
    rate: number;
    volume: number;
  };
  lighting: {
    primaryColor: string;
    secondaryColor: string;
    intensity: number;
  };
  animation: {
    scale: number;
    blur: number;
    glow: boolean;
  };
}

const personalityConfigs: Record<AIPersonality, PersonalityConfig> = {
  neutral: {
    voice: { text: '', pitch: 1.0, rate: 1.0, volume: 0.8 },
    lighting: { primaryColor: '#4f46e5', secondaryColor: '#0f172a', intensity: 1.0 },
    animation: { scale: 1.0, blur: 0, glow: false }
  },
  happy: {
    voice: { text: 'Welcome back! Ready to grow?', pitch: 1.2, rate: 1.1, volume: 0.9 },
    lighting: { primaryColor: '#10b981', secondaryColor: '#064e3b', intensity: 1.2 },
    animation: { scale: 1.05, blur: 0, glow: true }
  },
  excited: {
    voice: { text: 'Access granted! Let\'s make magic happen!', pitch: 1.3, rate: 1.2, volume: 1.0 },
    lighting: { primaryColor: '#f59e0b', secondaryColor: '#92400e', intensity: 1.4 },
    animation: { scale: 1.1, blur: 0, glow: true }
  },
  concerned: {
    voice: { text: 'Hmm, that didn\'t work. Let\'s try again?', pitch: 0.9, rate: 0.9, volume: 0.7 },
    lighting: { primaryColor: '#ef4444', secondaryColor: '#7f1d1d', intensity: 1.1 },
    animation: { scale: 0.95, blur: 1, glow: false }
  },
  processing: {
    voice: { text: 'Analyzing your credentials...', pitch: 1.0, rate: 1.0, volume: 0.8 },
    lighting: { primaryColor: '#8b5cf6', secondaryColor: '#1e1b4b', intensity: 1.3 },
    animation: { scale: 1.02, blur: 0, glow: true }
  },
  celebrating: {
    voice: { text: 'Success! Welcome to your dashboard!', pitch: 1.4, rate: 1.3, volume: 1.0 },
    lighting: { primaryColor: '#22c55e', secondaryColor: '#14532d', intensity: 1.5 },
    animation: { scale: 1.15, blur: 0, glow: true }
  }
};

export const useAIPersonality = () => {
  const [isMuted, setIsMuted] = useState(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((personality: AIPersonality, customText?: string) => {
    if (!window.speechSynthesis || isMuted) return;

    // Cancel any ongoing speech
    if (currentUtteranceRef.current) {
      window.speechSynthesis.cancel();
    }

    const config = personalityConfigs[personality];
    const utterance = new SpeechSynthesisUtterance(customText || config.voice.text);

    utterance.pitch = config.voice.pitch;
    utterance.rate = config.voice.rate;
    utterance.volume = config.voice.volume;

    // Resume audio context if suspended
    if (Howler.ctx?.state === 'suspended') {
      Howler.ctx.resume();
    }

    // Store reference and speak
    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);

    // Clear reference when speech ends
    utterance.onend = () => {
      currentUtteranceRef.current = null;
    };
  }, [isMuted]);

  const playSound = useCallback((type: 'success' | 'error' | 'thinking' | 'logout') => {
    const sounds = {
      success: '/sounds/success.mp3',
      error: '/sounds/error.mp3',
      thinking: '/sounds/login.mp3',
      logout: '/sounds/logout.mp3'
    };

    new Howl({ src: [sounds[type]], volume: 0.7 }).play();
  }, []);

  const getPersonalityConfig = useCallback((personality: AIPersonality) => {
    return personalityConfigs[personality];
  }, []);

  const setAmbientLighting = useCallback((personality: AIPersonality) => {
    const config = personalityConfigs[personality];
    document.documentElement.style.setProperty('--ai-primary', config.lighting.primaryColor);
    document.documentElement.style.setProperty('--ai-secondary', config.lighting.secondaryColor);
    document.documentElement.style.setProperty('--ai-intensity', config.lighting.intensity.toString());
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      // If muting, cancel any ongoing speech
      if (newMuted && currentUtteranceRef.current) {
        window.speechSynthesis.cancel();
        currentUtteranceRef.current = null;
      }
      return newMuted;
    });
  }, []);

  return {
    speak,
    playSound,
    getPersonalityConfig,
    setAmbientLighting,
    toggleMute,
    isMuted,
    personalities: personalityConfigs
  };
};
