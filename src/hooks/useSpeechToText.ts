'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';

// Add type definitions for the browser Speech Recognition API
declare global {
  interface Window {
    webkitSpeechRecognition: typeof SpeechRecognition;
    SpeechRecognition: typeof SpeechRecognition;
  }
}

export function useSpeechToText() {
  const [isConverting, setIsConverting] = useState(false);

  const convertToText = useCallback(async (audioBlob: Blob): Promise<string> => {
    setIsConverting(true);
    
    try {
      // Create a form data object to send the audio file
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.wav');
      formData.append('model', 'whisper-1');
      
      // Make a fallback if we can't reach OpenAI API
      try {
        // Call the OpenAI transcription API
        const response = await axios.post(
          'https://api.openai.com/v1/audio/transcriptions',
          formData,
          {
            headers: {
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        
        return response.data.text;
      } catch (openaiError) {
        console.error('Error with OpenAI transcription:', openaiError);
        
        // Fallback: Use browser's built-in speech recognition if available
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          return new Promise((resolve) => {
            // Create a temporary audio element to play the recording
            const audioUrl = URL.createObjectURL(audioBlob);
            const audioElement = new Audio(audioUrl);
            
            // Use browser's speech recognition as fallback
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            
            recognition.lang = 'en-US';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;
            
            recognition.onresult = (event) => {
              const transcript = event.results[0][0].transcript;
              resolve(transcript);
            };
            
            recognition.onerror = () => {
              resolve('Sorry, I could not transcribe the audio. Please try again.');
            };
            
            // Play the audio while recognition is running
            audioElement.play();
            recognition.start();
          });
        } else {
          return 'Speech recognition is not available in this browser. Please try another browser.';
        }
      }
    } catch (error) {
      console.error('Error in speech to text conversion:', error);
      return 'Error transcribing audio. Please try again.';
    } finally {
      setIsConverting(false);
    }
  }, []);

  return {
    convertToText,
    isConverting,
  };
} 