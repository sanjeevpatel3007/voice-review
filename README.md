# Speak Flow

A voice-based feedback collection system for cohort participants using Next.js, React, and AI technologies.

## Features

### Cohort Review Conversation
- Guided voice-based review system for cohort participants
- Email form collection at the start of the conversation
- Continuous adaptive questioning based on previous responses
- User-controlled conversation length with "End Conversation" button
- Formatted feedback summary at the end of the conversation
- Professional point-wise feedback generation for program administrators
- Automatic saving of feedback to Supabase database
- Complete conversation history for reference

## Technical Implementation

- **Frontend**: Next.js with React and TypeScript
- **Speech Processing**:
  - Browser's SpeechRecognition API (with fallback to OpenAI's Whisper API)
  - Browser's SpeechSynthesis API for text-to-speech
- **AI Integration**: 
  - OpenAI GPT-3.5 API for generating questions and summaries
  - Second-level processing for professional point-wise feedback
- **Database**: Supabase for storing user feedback and emails
- **Audio Processing**: Web Audio API for microphone access and audio processing

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env.local` file with your API keys:
   ```
   NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
   ```
4. Set up the Supabase database:
   - Run the SQL commands in `supabase-table-setup.sql` in your Supabase SQL editor
5. Run the development server:
   ```
   npm run dev
   ```
6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Using the Review Conversation

1. Enter your email address in the form and click "Start Review Conversation"
2. Answer the AI's questions by speaking when prompted
3. Continue answering as many questions as you like
4. Click "End Conversation & Generate Summary" when you're ready to finish
5. The system will:
   - Generate a conversational summary
   - Create a professional point-wise feedback report
   - Save both to the Supabase database with your email
6. View your personalized feedback summary and professional feedback
7. Click "Start New Review" to begin another review session

## Database Schema

The application uses a Supabase table with the following structure:

```sql
CREATE TABLE public.cohort_feedback (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  summary TEXT NOT NULL,
  professional_feedback TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

## Browser Compatibility

- Best experienced on Chrome, Edge, or Firefox
- Requires a browser that supports the Web Audio API and SpeechRecognition API
- Fallback mechanisms are in place for browsers with limited speech recognition support

## License

This project is licensed under the MIT License.
