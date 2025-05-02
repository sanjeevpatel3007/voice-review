'use client';

import React from 'react';
import { AudioVisualizer } from '@/components/AudioVisualizer';
import { ConversationTurn } from '@/lib/supabase';

interface ConversationInterfaceProps {
  email: string;
  userText: string;
  botText: string;
  isRecording: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  isRecordingAudio: boolean;
  conversationState: string;
  conversationHistory: ConversationTurn[];
  conversationMinimumWarning: boolean;
  handleToggleRecording: () => void;
  handleEndConversation: () => void;
  handleContinueConversation: () => void;
}

export default function ConversationInterface({
  email,
  userText,
  botText,
  isRecording,
  isProcessing,
  isSpeaking,
  isRecordingAudio,
  conversationState,
  conversationHistory,
  conversationMinimumWarning,
  handleToggleRecording,
  handleEndConversation,
  handleContinueConversation
}: ConversationInterfaceProps) {
  return (
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
  );
} 