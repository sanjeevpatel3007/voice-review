'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';

type ConversationTurn = {
  question: string;
  answer: string;
};

export function useReviewAI() {
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate the first question to start the conversation
  const generateQuestion = useCallback(async (): Promise<string> => {
    setIsGenerating(true);
    
    try {
      // Call the OpenAI API for the initial question
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are an AI assistant conducting a review conversation for a cohort program. 
              Your goal is to ask insightful questions about the user's experience in the cohort.
              Keep your questions concise and conversational as they will be spoken to the user.
              Focus on gathering valuable feedback about their learning experience, challenges, 
              interactions with instructors and peers, and suggestions for improvement.`
            },
            {
              role: 'user',
              content: 'Please provide the first question to start a cohort review conversation.'
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
      console.error('Error generating initial question:', error);
      return "What aspects of the cohort did you find most valuable for your learning journey?";
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Generate the next question based on the conversation history
  const generateNextQuestion = useCallback(async (history: ConversationTurn[]): Promise<string> => {
    setIsGenerating(true);
    
    try {
      // Format the conversation history for the API
      const messages = [
        {
          role: 'system',
          content: `You are an AI assistant conducting a review conversation for a cohort program. 
          Your goal is to ask insightful follow-up questions based on the conversation history.
          Keep your questions concise and conversational as they will be spoken to the user.
          Each question should build upon previous answers and explore different aspects of their experience.
          Do not repeat previous questions or topics already covered in detail.`
        }
      ];
      
      // Add the conversation history
      history.forEach((turn) => {
        messages.push(
          { role: 'assistant', content: turn.question },
          { role: 'user', content: turn.answer || "No answer provided." }
        );
      });
      
      // Add the request for the next question
      messages.push({ 
        role: 'user', 
        content: 'Based on this conversation, what should be the next question to ask?' 
      });
      
      // Call the OpenAI API for the next question
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages,
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
      console.error('Error generating next question:', error);
      return "Could you share any suggestions for improving the cohort experience?";
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Generate a summary of the conversation
  const generateSummary = useCallback(async (history: ConversationTurn[]): Promise<string> => {
    setIsGenerating(true);
    
    try {
      // Format the conversation history for the API
      const messages = [
        {
          role: 'system',
          content: `You are an AI assistant tasked with summarizing feedback from a cohort program review.
          Create a well-formatted, structured summary of the conversation that includes:
          1. Key positive aspects mentioned
          2. Areas for improvement
          3. Specific suggestions
          4. Overall sentiment
          5. Action items or recommendations
          
          The summary should be concise yet comprehensive, suitable for program administrators to understand
          the participant's experience. Use clear sections with headings and bullet points.`
        }
      ];
      
      // Add the conversation history
      history.forEach((turn) => {
        messages.push(
          { role: 'assistant', content: turn.question },
          { role: 'user', content: turn.answer || "No answer provided." }
        );
      });
      
      // Add the request for the summary
      messages.push({ 
        role: 'user', 
        content: 'Please provide a well-formatted summary of this cohort review conversation.' 
      });
      
      // Call the OpenAI API for the summary
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages,
          temperature: 0.5,
          max_tokens: 500
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
      console.error('Error generating summary:', error);
      return "Unable to generate a summary at this time. Please try again later.";
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    generateQuestion,
    generateNextQuestion,
    generateSummary,
    isGenerating,
  };
} 