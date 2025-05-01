'use client';

import { useState, useEffect, useRef } from 'react';
import { useMicrophone } from '@/hooks/useMicrophone';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { AudioVisualizer } from '@/components/AudioVisualizer';
import { useReviewAI } from '@/hooks/useReviewAI';

type ConversationState = 'email-form' | 'conversation' | 'summarizing' | 'complete';

type ConversationTurn = {
  question: string;
  answer: string;
};

export default function ReviewConversation() {
  const [email, setEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [userText, setUserText] = useState('');
  const [botText, setBotText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationState, setConversationState] = useState<ConversationState>('email-form');
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
  const [reviewSummary, setReviewSummary] = useState('');
  const [voiceType, setVoiceType] = useState<'male' | 'female'>('female');
  
  const { 
    startRecording, 
    stopRecording, 
    audioBlob, 
    isRecordingAudio 
  } = useMicrophone();

  const { convertToText, isConverting } = useSpeechToText();
  const { speakText, isSpeaking, stopSpeaking } = useTextToSpeech();
  const { 
    generateQuestion, 
    generateNextQuestion,
    generateSummary,
    isGenerating 
  } = useReviewAI();

  // Start the conversation after email is provided
  useEffect(() => {
    if (conversationState === 'conversation' && conversationHistory.length === 0) {
      startConversation();
    }
  }, [conversationState]);

  // Process the audio when recording stops
  useEffect(() => {
    if (audioBlob && !isRecordingAudio) {
      processAudio();
    }
  }, [audioBlob, isRecordingAudio]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(email);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailInput.trim()) {
      setEmailError('Email is required');
      return;
    }
    
    if (!validateEmail(emailInput)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    setEmailError('');
    setEmail(emailInput);
    setConversationState('conversation');
  };

  async function startConversation() {
    try {
      // Greet the user with their email
      const welcomeMessage = `Thank you, ${email}. I'll be asking you a few questions about your experience with the cohort. Let's begin.`;
      setBotText(welcomeMessage);
      await speakText(welcomeMessage, voiceType);
      
      // Get the first question from AI
      const firstQuestion = await generateQuestion();
      setBotText(firstQuestion);
      await speakText(firstQuestion, voiceType);
      
      // Update state
      setConversationHistory([{ question: firstQuestion, answer: '' }]);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  }

  async function processAudio() {
    if (!audioBlob) return;
    
    setIsProcessing(true);
    
    try {
      // Convert speech to text
      const transcribedText = await convertToText(audioBlob);
      if (transcribedText) {
        setUserText(transcribedText);
        
        if (conversationState === 'conversation') {
          // Update the answer to the current question
          const updatedHistory = [...conversationHistory];
          const currentQuestion = updatedHistory[updatedHistory.length - 1];
          currentQuestion.answer = transcribedText;
          setConversationHistory(updatedHistory);
          
          // Check if we should end the conversation (after ~5 questions)
          if (updatedHistory.length >= 5) {
            const finishingMsg = "Thank you for your responses. I'm going to summarize our conversation now.";
            setBotText(finishingMsg);
            await speakText(finishingMsg, voiceType);
            setConversationState('summarizing');
            
            // Generate summary
            const summary = await generateSummary(updatedHistory);
            setReviewSummary(summary);
            setBotText(summary);
            await speakText(summary, voiceType);
            setConversationState('complete');
          } else {
            // Get the next question based on the conversation so far
            const nextQuestion = await generateNextQuestion(updatedHistory);
            setBotText(nextQuestion);
            await speakText(nextQuestion, voiceType);
            
            // Add the new question to history
            updatedHistory.push({ question: nextQuestion, answer: '' });
            setConversationHistory(updatedHistory);
          }
        }
      }
    } catch (error) {
      console.error('Error processing audio:', error);
    } finally {
      setIsProcessing(false);
    }
  }

  function handleToggleRecording() {
    if (isRecording) {
      stopRecording();
      setIsRecording(false);
    } else {
      startRecording();
      setIsRecording(true);
      setUserText('');
    }
  }

  function handleRestart() {
    setConversationState('email-form');
    setConversationHistory([]);
    setEmail('');
    setEmailInput('');
    setReviewSummary('');
    setUserText('');
    setBotText('');
  }

  return (
    <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-6">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Cohort Review Conversation</h2>
        <div className="flex items-center space-x-2">
          <select 
            value={voiceType}
            onChange={(e) => setVoiceType(e.target.value as 'male' | 'female')}
            className="text-sm border rounded p-1"
            aria-label="Select voice type"
          >
            <option value="female">Female Voice</option>
            <option value="male">Male Voice</option>
          </select>
        </div>
      </div>

      {conversationState === 'email-form' ? (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Enter Your Email to Begin</h3>
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="you@example.com"
              />
              {emailError && (
                <p className="mt-1 text-sm text-red-600">{emailError}</p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Start Review Conversation
            </button>
          </form>
        </div>
      ) : conversationState === 'complete' ? (
        <div className="space-y-4">
          <div className="p-4 border rounded-lg bg-green-50">
            <h3 className="font-semibold mb-2">Review Summary</h3>
            <p className="whitespace-pre-line">{reviewSummary}</p>
          </div>
          
          <h3 className="font-semibold mt-6 mb-2">Conversation History</h3>
          {conversationHistory.map((turn, index) => (
            <div key={index} className="mb-4">
              <div className="bg-blue-50 p-3 rounded-lg mb-2">
                <p className="text-sm text-gray-500">Question {index + 1}:</p>
                <p>{turn.question}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Your Answer:</p>
                <p>{turn.answer}</p>
              </div>
            </div>
          ))}
          
          <button 
            onClick={handleRestart}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Start New Review
          </button>
        </div>
      ) : (
        <>
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="mb-4">
              <p className="font-medium mb-1">Conversation Status:</p>
              <p className="text-sm">
                {conversationState === 'conversation' && `Question ${conversationHistory.length} of 5`}
                {conversationState === 'summarizing' && 'Generating your feedback summary...'}
              </p>
            </div>
            
            {email && (
              <div className="mb-4">
                <p className="font-medium mb-1">Email:</p>
                <p className="text-sm">{email}</p>
              </div>
            )}
            
            <div className="flex justify-center my-6">
              <button
                onClick={handleToggleRecording}
                disabled={isProcessing || isSpeaking}
                className={`w-20 h-20 rounded-full flex items-center justify-center ${
                  isRecording
                    ? 'bg-red-500 animate-pulse'
                    : isProcessing || isSpeaking
                    ? 'bg-gray-400'
                    : 'bg-blue-500'
                } text-white`}
              >
                {isRecording ? 'Stop' : isProcessing ? 'Processing...' : isSpeaking ? 'Listening...' : 'Speak'}
              </button>
            </div>
            
            {(isRecordingAudio || isSpeaking) && (
              <div className="mb-4">
                <AudioVisualizer isListening={isRecordingAudio} isSpeaking={isSpeaking} />
              </div>
            )}
            
            <div className="space-y-4 mt-4">
              {botText && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">AI:</p>
                  <p>{botText}</p>
                </div>
              )}
              
              {userText && (
                <div className="bg-gray-100 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">You said:</p>
                  <p>{userText}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 text-xs text-gray-500">
            {isProcessing 
              ? 'Processing your message...' 
              : isRecording 
                ? 'Listening...' 
                : isSpeaking 
                  ? 'AI is speaking...'
                  : 'Click the button to speak'}
          </div>
        </>
      )}
    </div>
  );
} 