'use client';

import React from 'react';

interface VoiceChatStatusProps {
  isProcessing: boolean;
  isRecording: boolean;
  isSpeaking: boolean;
}

export default function VoiceChatStatus({
  isProcessing,
  isRecording,
  isSpeaking
}: VoiceChatStatusProps) {
  return (
    <div className="mt-6 flex justify-center">
      <div className={`inline-flex items-center px-4 py-2 rounded-full ${
        isProcessing ? 'bg-yellow-100 text-yellow-800' : 
        isRecording ? 'bg-red-100 text-red-800' : 
        isSpeaking ? 'bg-blue-100 text-blue-800' :
        'bg-gray-100 text-gray-600'
      }`}>
        <span className="text-sm font-medium">
          {isProcessing ? 'Processing your message...' : 
          isRecording ? 'Listening...' : 
          isSpeaking ? 'AI is speaking...' : 
          'Click the button to speak'}
        </span>
      </div>
    </div>
  );
} 