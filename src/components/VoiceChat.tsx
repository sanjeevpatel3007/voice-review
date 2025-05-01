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

      <div className="flex justify-center mb-8">
        <button
          onClick={handleToggleRecording}
          disabled={isProcessing}
          className={`w-24 h-24 rounded-full flex items-center justify-center text-white shadow-lg transform hover:scale-105 transition-all ${
            isRecording
              ? 'bg-red-600 animate-pulse'
              : isProcessing
              ? 'bg-gray-400'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isRecording ? (
            <>
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"></path>
              </svg>
              <span className="sr-only">Stop</span>
            </>
          ) : isProcessing ? (
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
          ) : (
            <>
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
              </svg>
              <span className="sr-only">Speak</span>
            </>
          )}
        </button>
      </div>

      {(isRecordingAudio || isSpeaking) && (
        <div className="mb-6">
          <AudioVisualizer isListening={isRecordingAudio} isSpeaking={isSpeaking} />
        </div>
      )}

      {showSubtitles && (
        <div className="space-y-6 bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
          {userText && (
            <div className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-1 font-medium">You said:</p>
              <p className="text-gray-700">{userText}</p>
            </div>
          )}
          
          {botText && (
            <div className="bg-blue-50 p-4 rounded-xl shadow-sm border border-blue-100">
              <p className="text-sm text-blue-600 mb-1 font-medium">AI Response:</p>
              <p className="text-gray-700">{botText}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <div className={`inline-flex items-center px-4 py-2 rounded-full ${
          isProcessing ? 'bg-yellow-100 text-yellow-800' : 
          isRecording ? 'bg-red-100 text-red-800' : 
          isSpeaking ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-600'
        }`}>
          <span className="text-sm font-medium">
            {isProcessing ? 'Processing your message...' : 
            isRecording ? 'Listening...' : 
            isSpeaking ? 'AI is speaking...' : 
            'Click the button to speak'}
          </span>
        </div>
      </div>
    </div>
  );
} 