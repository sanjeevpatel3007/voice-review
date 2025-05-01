'use client';

import React from 'react';

export default function SavingFeedback() {
  return (
    <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 flex flex-col items-center justify-center min-h-[250px]">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-6"></div>
      <p className="text-xl font-medium text-gray-800 mb-2">Generating professional feedback</p>
      <p className="text-sm text-gray-500">This may take a moment, please wait.</p>
    </div>
  );
} 