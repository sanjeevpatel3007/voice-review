'use client';

import { useState, useEffect, useRef } from 'react';
import { useMicrophone } from '@/hooks/useMicrophone';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { AudioVisualizer } from '@/components/AudioVisualizer';
import { useReviewAI } from '@/hooks/useReviewAI';
import { saveFeedback, generateProfessionalFeedback, validateConversation, ConversationTurn } from '@/lib/supabase';

type ConversationState = 'email-form' | 'conversation' | 'summarizing' | 'complete' | 'saving';

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
  const [professionalFeedback, setProfessionalFeedback] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [voiceType, setVoiceType] = useState<'male' | 'female'>('male');
  const [conversationMinimumWarning, setConversationMinimumWarning] = useState(false);
  
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
      const welcomeMessage = `Thank you, ${email}. I'll be asking you a few questions about your experience with the cohort. You can answer as many questions as you'd like and end the conversation when you're ready. Let's begin.`;
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
          
          // Reset the conversation minimum warning if it was set
          if (conversationMinimumWarning) {
            setConversationMinimumWarning(false);
          }
          
          // Get the next question based on the conversation so far
          const nextQuestion = await generateNextQuestion(updatedHistory);
          setBotText(nextQuestion);
          await speakText(nextQuestion, voiceType);
          
          // Add the new question to history
          updatedHistory.push({ question: nextQuestion, answer: '' });
          setConversationHistory(updatedHistory);
        }
      }
    } catch (error) {
      console.error('Error processing audio:', error);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleEndConversation() {
    if (conversationState !== 'conversation') {
      return;
    }
    
    try {
      // Remove the last question if it doesn't have an answer
      const updatedHistory = [...conversationHistory];
      if (updatedHistory.length > 0 && updatedHistory[updatedHistory.length - 1].answer === '') {
        updatedHistory.pop();
      }
      
      // Get answered questions count
      const answeredQuestions = updatedHistory.filter(turn => turn.answer && turn.answer.trim() !== '');
      
      // Check if there's enough conversation content to proceed
      if (answeredQuestions.length === 0) {
        setConversationMinimumWarning(true);
        const warningMsg = "I need more of your input before I can generate a summary. Please answer at least one question.";
        setBotText(warningMsg);
        await speakText(warningMsg, voiceType);
        
        // If we have at least one question but no answers, make sure we keep the conversation going
        if (updatedHistory.length === 0) {
          // Restart with a new first question
          const firstQuestion = await generateQuestion();
          setBotText(firstQuestion);
          await speakText(firstQuestion, voiceType);
          updatedHistory.push({ question: firstQuestion, answer: '' });
          setConversationHistory(updatedHistory);
        }
        
        return;
      }
      
      const finishingMsg = "Thank you for your responses. I'll prepare your review summary now. Please wait a moment.";
      setBotText(finishingMsg);
      await speakText(finishingMsg, voiceType);
      setConversationState('summarizing');
      
      // Generate summary
      const summary = await generateSummary(updatedHistory);
      setReviewSummary(summary);
      
      // Generate professional feedback
      setConversationState('saving');
      const proFeedback = await generateProfessionalFeedback(summary);
      setProfessionalFeedback(proFeedback);
      
      // Save to Supabase
      setSaveStatus('saving');
      
      // Prepare the feedback data with conversation history
      const feedbackData = {
        email: email,
        summary: summary,
        professional_feedback: proFeedback,
        conversation_history: updatedHistory
      };

      try {
        const result = await saveFeedback(feedbackData);
        
        if (result.success) {
          setSaveStatus('success');
          
          // Speak only a confirmation message, not the summary
          const successMsg = "Your feedback has been successfully saved. You can now review the summary on screen.";
          setBotText(successMsg);
          await speakText(successMsg, voiceType);
        } else {
          throw new Error('Failed to save feedback');
        }
      } catch (saveError) {
        console.error('Error saving to Supabase:', saveError);
        setSaveStatus('error');
        
        const errorMsg = "There was an issue saving your feedback, but you can still view the summary.";
        setBotText(errorMsg);
        await speakText(errorMsg, voiceType);
      }
      
      setConversationState('complete');
    } catch (error) {
      console.error('Error ending conversation:', error);
      setSaveStatus('error');
      setConversationState('complete');
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
    setProfessionalFeedback('');
    setSaveStatus('idle');
    setUserText('');
    setBotText('');
    setConversationMinimumWarning(false);
  }

  function handleContinueConversation() {
    if (conversationMinimumWarning && conversationState === 'conversation') {
      setConversationMinimumWarning(false);
      handleToggleRecording();
    }
  }

  return (
    <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl p-8 border border-gray-100">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Cohort Review Conversation</h2>
      </div>

      {conversationState === 'email-form' ? (
        <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">
          <h3 className="text-xl font-semibold mb-6 text-gray-800">Enter Your Email to Begin</h3>
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="you@example.com"
              />
              {emailError && (
                <p className="mt-2 text-sm text-red-600 font-medium">{emailError}</p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
            >
              Start Review Conversation
            </button>
          </form>
        </div>
      ) : conversationState === 'saving' ? (
        <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 flex flex-col items-center justify-center min-h-[250px]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-6"></div>
          <p className="text-xl font-medium text-gray-800 mb-2">Generating professional feedback</p>
          <p className="text-sm text-gray-500">This may take a moment, please wait.</p>
        </div>
      ) : conversationState === 'complete' ? (
        <div className="space-y-6">
          {saveStatus === 'success' && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-6 py-4 rounded-lg mb-6">
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <p className="font-bold">Success!</p>
              </div>
              <p className="text-sm mt-1">Your feedback has been saved successfully.</p>
            </div>
          )}
          
          {saveStatus === 'error' && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg mb-6">
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p className="font-bold">Error</p>
              </div>
              <p className="text-sm mt-1">There was a problem saving your feedback. The summary is still available below.</p>
            </div>
          )}
          
          <div className="p-6 border rounded-xl bg-green-50 border-green-100 shadow-sm">
            <h3 className="font-semibold text-lg mb-3 text-gray-800">Review Summary</h3>
            <p className="whitespace-pre-line text-gray-700">{reviewSummary}</p>
          </div>
          
          <div className="p-6 border rounded-xl bg-blue-50 border-blue-100 shadow-sm">
            <h3 className="font-semibold text-lg mb-3 text-gray-800">Professional Feedback</h3>
            <div className="whitespace-pre-line text-gray-700">{professionalFeedback}</div>
          </div>
          
          <div className="mt-8">
            <h3 className="font-semibold text-lg mb-4 text-gray-800">Conversation History</h3>
            {conversationHistory.map((turn, index) => (
              <div key={index} className="mb-5">
                <div className="bg-blue-50 p-4 rounded-xl mb-3 shadow-sm border border-blue-100">
                  <p className="text-sm text-blue-600 mb-1 font-medium">Question {index + 1}:</p>
                  <p className="text-gray-700">{turn.question}</p>
                </div>
                {turn.answer && (
                  <div className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-100 ml-4">
                    <p className="text-sm text-gray-500 mb-1 font-medium">Your Answer:</p>
                    <p className="text-gray-700">{turn.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <button 
            onClick={handleRestart}
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Start New Review
          </button>
        </div>
      ) : (
        <>
          <div className="bg-gray-50 p-6 rounded-xl mb-5 border border-gray-200 shadow-sm">
            <div className="mb-4">
              <p className="font-medium mb-1 text-gray-700">Conversation Status:</p>
              <p className="text-sm text-gray-600 bg-white py-1 px-3 rounded-md inline-block">
                {conversationState === 'conversation' && `Questions asked: ${conversationHistory.length}`}
                {conversationState === 'summarizing' && 'Generating your feedback summary...'}
              </p>
            </div>
            
            {email && (
              <div className="mb-5">
                <p className="font-medium mb-1 text-gray-700">Email:</p>
                <p className="text-sm text-gray-600 bg-white py-1 px-3 rounded-md inline-block">{email}</p>
              </div>
            )}
            
            <div className="flex flex-col items-center my-8">
              {conversationMinimumWarning ? (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 px-6 py-4 rounded-lg mb-5 text-center w-full max-w-md">
                  <div className="flex items-center justify-center mb-2">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    <p className="font-bold">Please continue your conversation</p>
                  </div>
                  <p className="text-sm mb-3">You need to answer at least one question before ending the review.</p>
                  <button
                    onClick={handleContinueConversation}
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                  >
                    Continue Conversation
                  </button>
                </div>
              ) : (
                <div className="flex justify-center mb-6">
                  <button
                    onClick={handleToggleRecording}
                    disabled={isProcessing || isSpeaking}
                    className={`w-24 h-24 rounded-full flex items-center justify-center text-white shadow-lg transform hover:scale-105 transition-all ${
                      isRecording
                        ? 'bg-red-600 animate-pulse'
                        : isProcessing || isSpeaking
                        ? 'bg-gray-400'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"></path>
                        </svg>
                        <span className="sr-only">Stop</span>
                      </>
                    ) : isProcessing ? (
                      'Processing...'
                    ) : isSpeaking ? (
                      <>
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                        </svg>
                        <span className="sr-only">Listening</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                        </svg>
                        <span className="sr-only">Speak</span>
                      </>
                    )}
                  </button>
                </div>
              )}
              
              {conversationState === 'conversation' && conversationHistory.length > 0 && !conversationMinimumWarning && (
                <button
                  onClick={handleEndConversation}
                  disabled={isProcessing || isSpeaking || isRecording}
                  className="px-5 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50 flex items-center font-medium"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  End Conversation & Generate Summary
                </button>
              )}
            </div>
            
            {(isRecordingAudio || isSpeaking) && (
              <div className="mb-5">
                <AudioVisualizer isListening={isRecordingAudio} isSpeaking={isSpeaking} />
              </div>
            )}
            
            <div className="space-y-4 mt-6">
              {botText && (
                <div className="bg-blue-50 p-4 rounded-xl shadow-sm border border-blue-100">
                  <p className="text-sm text-blue-600 mb-1 font-medium">AI:</p>
                  <p className="text-gray-700">{botText}</p>
                </div>
              )}
              
              {userText && (
                <div className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-100 ml-4">
                  <p className="text-sm text-gray-500 mb-1 font-medium">You said:</p>
                  <p className="text-gray-700">{userText}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-500 flex items-center justify-center">
            <div className={`inline-flex items-center px-3 py-1 rounded-full ${
              isProcessing ? 'bg-yellow-100 text-yellow-800' : 
              isRecording ? 'bg-red-100 text-red-800' : 
              isSpeaking ? 'bg-blue-100 text-blue-800' :
              conversationMinimumWarning ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100'
            }`}>
            {isProcessing 
              ? 'Processing your message...' 
              : isRecording 
                ? 'Listening...' 
                : isSpeaking 
                  ? 'AI is speaking...'
                  : conversationMinimumWarning
                    ? 'Please continue your conversation'
                    : 'Click the button to speak'}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 