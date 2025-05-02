'use client';

import ReviewConversation from "@/components/ReviewConversation";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center p-4 bg-gray-50">
      <header className="w-full max-w-4xl text-center mb-8 mt-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">Cohort Review</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Voice-based feedback collection for cohort participants. Speak naturally and get AI-generated insights.
        </p>
      </header>
      
      <main className="w-full max-w-4xl flex flex-col items-center justify-center">
        <ReviewConversation />
      </main>
      
      <footer className="w-full max-w-4xl mt-12 mb-6 text-center text-gray-500 text-sm">
        <p>Powered by Next.js, React, and AI technologies</p>
      </footer>
    </div>
  );
}
