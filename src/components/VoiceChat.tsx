'use client';

// Simple wrapper to maintain backward compatibility
import VoiceChatComponent from './VoiceChat/index';

export default function VoiceChat(props: Record<string, never>) {
  return <VoiceChatComponent {...props} />;
} 