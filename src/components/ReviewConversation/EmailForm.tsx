'use client';

import React from 'react';

interface EmailFormProps {
  emailInput: string;
  setEmailInput: (email: string) => void;
  emailError: string;
  handleEmailSubmit: (e: React.FormEvent) => void;
}

export default function EmailForm({
  emailInput,
  setEmailInput,
  emailError,
  handleEmailSubmit,
}: EmailFormProps) {
  return (
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
  );
} 