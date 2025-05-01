'use client';

import React from 'react';

interface VoiceChatSubtitlesProps {
  userText: string;
  botText: string;
}

export default function VoiceChatSubtitles({
  userText,
  botText
}: VoiceChatSubtitlesProps) {
  return (
    <div className="space-y-6 bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
      {userText && (
        <div className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1 font-medium">You said:</p>
          <p className="text-gray-700">{userText}</p>
        </div>
      )}
      
      {botText && (
        <div className="bg-blue-50 p-4 rounded-xl shadow-sm border border-blue-100">
          <p className="text-sm text-blue-600 mb-1 font-medium">AI Response:</p>
          <p className="text-gray-700">{botText}</p>
        </div>
      )}
    </div>
  );
} 