'use client';

import { useState, useEffect } from 'react';
import { useMicrophone } from '@/hooks/useMicrophone';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useReviewAI } from '@/hooks/useReviewAI';
import { saveFeedback, generateProfessionalFeedback, ConversationTurn } from '@/lib/supabase';

// Import subcomponents
import EmailForm from './EmailForm';
import ConversationInterface from './ConversationInterface';
import CompletedReview from './CompletedReview';

// Define SavingFeedback component inline
function SavingFeedback() {
  return (
    <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 flex flex-col items-center justify-center min-h-[250px]">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-6"></div>
      <p className="text-xl font-medium text-gray-800 mb-2">Generating professional feedback</p>
      <p className="text-sm text-gray-500">This may take a moment, please wait.</p>
    </div>
  );
}

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
        <EmailForm 
          emailInput={emailInput}
          setEmailInput={setEmailInput}
          emailError={emailError}
          handleEmailSubmit={handleEmailSubmit}
        />
      ) : conversationState === 'saving' ? (
        <SavingFeedback />
      ) : conversationState === 'complete' ? (
        <CompletedReview 
          saveStatus={saveStatus}
          reviewSummary={reviewSummary}
          professionalFeedback={professionalFeedback}
          conversationHistory={conversationHistory}
          handleRestart={handleRestart}
        />
      ) : (
        <ConversationInterface 
          email={email}
          userText={userText}
          botText={botText}
          isRecording={isRecording}
          isProcessing={isProcessing}
          isSpeaking={isSpeaking}
          isRecordingAudio={isRecordingAudio}
          conversationState={conversationState}
          conversationHistory={conversationHistory}
          conversationMinimumWarning={conversationMinimumWarning}
          handleToggleRecording={handleToggleRecording}
          handleEndConversation={handleEndConversation}
          handleContinueConversation={handleContinueConversation}
        />
      )}
    </div>
  );
} 