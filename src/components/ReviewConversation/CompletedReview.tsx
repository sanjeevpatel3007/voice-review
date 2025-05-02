'use client';

import React from 'react';
import { ConversationTurn } from '@/lib/supabase';

interface CompletedReviewProps {
  saveStatus: 'idle' | 'saving' | 'success' | 'error';
  reviewSummary: string;
  professionalFeedback: string;
  conversationHistory: ConversationTurn[];
  handleRestart: () => void;
}

export default function CompletedReview({
  saveStatus,
  reviewSummary,
  professionalFeedback,
  conversationHistory,
  handleRestart
}: CompletedReviewProps) {
  return (
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
  );
} 