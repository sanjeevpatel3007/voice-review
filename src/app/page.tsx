'use client';

import { useState } from 'react';
import VoiceChat from "@/components/VoiceChat";
import ReviewConversation from "@/components/ReviewConversation";

type TabType = 'voice-chat' | 'review';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('voice-chat');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Speak Flow</h1>
      
      <div className="w-full max-w-2xl mb-4">
        <div className="flex border-b border-gray-200 mb-4">
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'voice-chat' 
                ? 'text-blue-500 border-b-2 border-blue-500' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('voice-chat')}
          >
            Voice Chat
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'review' 
                ? 'text-blue-500 border-b-2 border-blue-500' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('review')}
          >
            Cohort Review
          </button>
        </div>
      </div>
      
      {activeTab === 'voice-chat' ? <VoiceChat /> : <ReviewConversation />}
    </div>
  );
}
