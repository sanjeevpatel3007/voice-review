'use client';

import { useState, useCallback, useRef } from 'react';

type VoiceType = 'male' | 'female';

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize speech synthesis when needed
  const initSpeechSynthesis = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && !speechSynthesisRef.current) {
      speechSynthesisRef.current = window.speechSynthesis;
    }
  }, []);

  // Stop any current speech
  const stopSpeaking = useCallback(() => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Speak text
  const speakText = useCallback(async (text: string, voiceType: VoiceType = 'female'): Promise<void> => {
    // First, initialize the speech synthesis
    initSpeechSynthesis();
    
    // Check if the browser supports speech synthesis
    if (!speechSynthesisRef.current) {
      console.error('Speech synthesis not supported in this browser');
      return;
    }
    
    // Stop any existing speech
    stopSpeaking();
    
    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    speechUtteranceRef.current = utterance;
    
    // Get available voices
    const voices = speechSynthesisRef.current.getVoices();
    
    // Set a timeout in case the voices aren't loaded yet
    if (voices.length === 0) {
      await new Promise<void>((resolve) => {
        speechSynthesisRef.current!.onvoiceschanged = () => resolve();
        
        // Fallback timeout in case onvoiceschanged doesn't fire
        setTimeout(() => resolve(), 1000);
      });
    }
    
    // Get the refreshed list of voices
    const updatedVoices = speechSynthesisRef.current.getVoices();
    
    // Choose a voice based on the voiceType
    let selectedVoice;
    
    if (voiceType === 'male') {
      // Find a male voice (usually contains 'male' or common male names in the description)
      selectedVoice = updatedVoices.find(
        (voice) => voice.name.toLowerCase().includes('male') || 
                  (voice.name.toLowerCase().includes('david') || 
                   voice.name.toLowerCase().includes('james') || 
                   voice.name.toLowerCase().includes('daniel'))
      );
    } else {
      // Find a female voice (usually contains 'female' or common female names in the description)
      selectedVoice = updatedVoices.find(
        (voice) => voice.name.toLowerCase().includes('female') || 
                  (voice.name.toLowerCase().includes('samantha') || 
                   voice.name.toLowerCase().includes('karen') || 
                   voice.name.toLowerCase().includes('lisa'))
      );
    }
    
    // Set the voice if found, otherwise use the default
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Set utterance properties
    utterance.rate = 1.0;  // Normal speed
    utterance.pitch = 1.0; // Normal pitch
    utterance.volume = 1.0; // Maximum volume
    
    // Set event handlers
    utterance.onstart = () => {
      setIsSpeaking(true);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
    };
    
    // Start speaking
    speechSynthesisRef.current.speak(utterance);
    
    // Return a promise that resolves when the speech is complete
    return new Promise<void>((resolve) => {
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };
    });
  }, [initSpeechSynthesis, stopSpeaking]);

  return {
    speakText,
    stopSpeaking,
    isSpeaking,
  };
} 