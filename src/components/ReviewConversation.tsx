'use client';

// Simple wrapper to maintain backward compatibility
import ReviewConversationComponent from './ReviewConversation/index';

export default function ReviewConversation(props: Record<string, never>) {
  return <ReviewConversationComponent {...props} />;
} 