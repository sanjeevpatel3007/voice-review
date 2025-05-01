'use client';

import { useState, useRef, useEffect } from 'react';
import { useMicrophone } from '@/hooks/useMicrophone';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useAI } from '@/hooks/useAI';
import { AudioVisualizer } from '@/components/AudioVisualizer';

type VoiceType = 'male' | 'female';

export default function VoiceChat() {
  const [isRecording, setIsRecording] = useState(false);
  const [userText, setUserText] = useState('');
  const [botText, setBotText] = useState('');
  const [voiceType, setVoiceType] = useState<VoiceType>('female');
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
    <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Voice Assistant</h2>
        <div className="flex items-center space-x-2">
          <label className="text-sm flex items-center">
            <input
              type="checkbox"
              checked={showSubtitles}
              onChange={() => setShowSubtitles(!showSubtitles)}
              className="mr-1"
            />
            Subtitles
          </label>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Voice Type</label>
        <div className="flex space-x-2">
          <button
            className={`px-3 py-1 rounded ${voiceType === 'male' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setVoiceType('male')}
          >
            Male
          </button>
          <button
            className={`px-3 py-1 rounded ${voiceType === 'female' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setVoiceType('female')}
          >
            Female
          </button>
        </div>
      </div>

      <div className="flex justify-center mb-6">
        <button
          onClick={handleToggleRecording}
          disabled={isProcessing}
          className={`w-20 h-20 rounded-full flex items-center justify-center ${
            isRecording
              ? 'bg-red-500 animate-pulse'
              : isProcessing
              ? 'bg-gray-400'
              : 'bg-blue-500'
          } text-white`}
        >
          {isRecording ? 'Stop' : isProcessing ? 'Processing...' : 'Speak'}
        </button>
      </div>

      {(isRecordingAudio || isSpeaking) && (
        <div className="mb-4">
          <AudioVisualizer isListening={isRecordingAudio} isSpeaking={isSpeaking} />
        </div>
      )}

      {showSubtitles && (
        <div className="space-y-4">
          {userText && (
            <div className="bg-gray-100 p-3 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">You said:</p>
              <p className="text-sm">{userText}</p>
            </div>
          )}
          
          {botText && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">AI Response:</p>
              <p className="text-sm">{botText}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        {isProcessing ? 'Processing your message...' : isRecording ? 'Listening...' : 'Click the button to speak'}
      </div>
    </div>
  );
} 