'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';

export function useAI() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateAI = useCallback(async (text: string): Promise<string> => {
    setIsGenerating(true);
    
    try {
      // Call the OpenAI API for chat completion
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant in a voice conversation. Keep your responses natural, concise, and conversational. Your answers should be direct and clear as they will be spoken back to the user.'
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.7,
          max_tokens: 150
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Provide a fallback response if the API call fails
      return "I'm sorry, I couldn't generate a response at the moment. Please try again later.";
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    generateAI,
    isGenerating,
  };
} 