'use client';

import { useState, useEffect } from 'react';
import { useMicrophone } from '@/hooks/useMicrophone';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useAI } from '@/hooks/useAI';
import VoiceChatControls from './VoiceChatControls';
import VoiceChatSubtitles from './VoiceChatSubtitles';
import VoiceChatStatus from './VoiceChatStatus';
import { AudioVisualizer } from '@/components/AudioVisualizer';

type VoiceType = 'male' | 'female';

export default function VoiceChat() {
  const [isRecording, setIsRecording] = useState(false);
  const [userText, setUserText] = useState('');
  const [botText, setBotText] = useState('');
  const [voiceType, setVoiceType] = useState<VoiceType>('male');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);

  const { 
    startRecording, 
    stopRecording, 
    audioBlob, 
    isRecordingAudio 
  } = useMicrophone();

  const { convertToText, isConverting } = useSpeechToText();
  const { generateAI, isGenerating } = useAI();
  const { speakText, isSpeaking } = useTextToSpeech();

  // Process the audio when recording stops
  useEffect(() => {
    if (audioBlob && !isRecordingAudio) {
      processAudio();
    }
  }, [audioBlob, isRecordingAudio]);

  async function processAudio() {
    if (!audioBlob) return;
    
    setIsProcessing(true);
    
    try {
      // Convert speech to text
      const transcribedText = await convertToText(audioBlob);
      if (transcribedText) {
        setUserText(transcribedText);
        
        // Generate AI response
        const aiResponse = await generateAI(transcribedText);
        if (aiResponse) {
          setBotText(aiResponse);
          
          // Speak the response
          await speakText(aiResponse, voiceType);
        }
      }
    } catch (error) {
      console.error('Error processing audio:', error);
    } finally {
      setIsProcessing(false);
    }
  }

  function handleToggleRecording() {
    if (isRecording) {
      stopRecording();
      setIsRecording(false);
    } else {
      startRecording();
      setIsRecording(true);
      // Clear previous messages when starting a new recording
      setUserText('');
      setBotText('');
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8 border border-gray-100">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Voice Assistant</h2>
        <div className="flex items-center space-x-2">
          <label className="text-sm flex items-center">
            <input
              type="checkbox"
              checked={showSubtitles}
              onChange={() => setShowSubtitles(!showSubtitles)}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
            />
            <span className="text-gray-700">Subtitles</span>
          </label>
        </div>
      </div>

      <VoiceChatControls 
        isRecording={isRecording}
        isProcessing={isProcessing}
        isSpeaking={isSpeaking}
        handleToggleRecording={handleToggleRecording}
      />

      {(isRecordingAudio || isSpeaking) && (
        <div className="mb-6">
          <AudioVisualizer isListening={isRecordingAudio} isSpeaking={isSpeaking} />
        </div>
      )}

      {showSubtitles && (
        <VoiceChatSubtitles userText={userText} botText={botText} />
      )}

      <VoiceChatStatus 
        isProcessing={isProcessing}
        isRecording={isRecording}
        isSpeaking={isSpeaking}
      />
    </div>
  );
} 