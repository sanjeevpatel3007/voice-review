# Speak Flow

A voice-based conversational interface using Next.js, React, and AI technologies.

## Features

### Voice Chat
- Real-time voice conversations with an AI assistant
- Speech-to-text and text-to-speech capabilities
- Audio visualization for voice input and output
- Customizable voice options (male/female)

### Cohort Review Conversation
- Guided voice-based review system for cohort participants
- Email form collection at the start of the conversation
- Adaptive questioning based on previous responses
- Formatted feedback summary at the end of the conversation
- Complete conversation history for reference

## Technical Implementation

- **Frontend**: Next.js with React and TypeScript
- **Speech Processing**:
  - Browser's SpeechRecognition API (with fallback to OpenAI's Whisper API)
  - Browser's SpeechSynthesis API for text-to-speech
- **AI Integration**: OpenAI GPT-3.5 API for generating questions and summaries
- **Audio Processing**: Web Audio API for microphone access and audio processing

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env.local` file with your OpenAI API key:
   ```
   NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
   ```
4. Run the development server:
   ```
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Using the Review Conversation

1. Navigate to the "Cohort Review" tab
2. Enter your email address in the form and click "Start Review Conversation"
3. Answer the AI's questions by speaking when prompted
4. After 5 questions, the AI will generate a formatted summary
5. View your feedback summary and conversation history
6. Click "Start New Review" to begin another review session

## Browser Compatibility

- Best experienced on Chrome, Edge, or Firefox
- Requires a browser that supports the Web Audio API and SpeechRecognition API
- Fallback mechanisms are in place for browsers with limited speech recognition support

## License

This project is licensed under the MIT License.
