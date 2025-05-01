'use client';

import ReviewConversation from "@/components/ReviewConversation";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Cohort Review</h1>
      <ReviewConversation />
    </div>
  );
}
