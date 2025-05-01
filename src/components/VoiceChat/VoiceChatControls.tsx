'use client';

import React from 'react';

interface VoiceChatControlsProps {
  isRecording: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  handleToggleRecording: () => void;
}

export default function VoiceChatControls({
  isRecording,
  isProcessing,
  isSpeaking,
  handleToggleRecording
}: VoiceChatControlsProps) {
  return (
    <div className="flex justify-center mb-8">
      <button
        onClick={handleToggleRecording}
        disabled={isProcessing}
        className={`w-24 h-24 rounded-full flex items-center justify-center text-white shadow-lg transform hover:scale-105 transition-all ${
          isRecording
            ? 'bg-red-600 animate-pulse'
            : isProcessing
            ? 'bg-gray-400'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isRecording ? (
          <>
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"></path>
            </svg>
            <span className="sr-only">Stop</span>
          </>
        ) : isProcessing ? (
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
        ) : (
          <>
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
            </svg>
            <span className="sr-only">Speak</span>
          </>
        )}
      </button>
    </div>
  );
} 