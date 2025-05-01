import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = 'https://xlyszpuwabvvclyhqcib.supabase.co';
// const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhseXN6cHV3YWJ2dmNseWhxY2liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwODYxMTAsImV4cCI6MjA2MTY2MjExMH0.qXU2CuHPn2Zrerac11P8i5XV2bqGti0sYvBABj36u_w';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define conversation turn type
export type ConversationTurn = {
  question: string;
  answer: string;
};

// Define types for our database tables
export type FeedbackEntry = {
  id?: number;
  email: string;
  summary: string;
  professional_feedback: string;
  conversation_history: ConversationTurn[];
  created_at?: string;
};

// Function to ensure conversation history is valid before saving
export function validateConversation(conversation: ConversationTurn[]): boolean {
  if (!Array.isArray(conversation) || conversation.length === 0) {
    console.log('Validation failed: conversation is not an array or is empty');
    return false;
  }
  
  // Check if at least one turn has a valid question and answer
  const validTurns = conversation.filter(turn => 
    typeof turn.question === 'string' && 
    turn.question.trim() !== '' && 
    typeof turn.answer === 'string' && 
    turn.answer.trim() !== ''
  );
  
  console.log(`Validation result: ${validTurns.length} valid turns out of ${conversation.length} total`);
  return validTurns.length > 0;
}

// Function to save feedback to Supabase with retry logic
export async function saveFeedback(feedbackData: Omit<FeedbackEntry, 'id' | 'created_at'>, maxRetries = 2) {
  // Validate that there's at least one conversation turn with content
  if (!validateConversation(feedbackData.conversation_history)) {
    console.error('Cannot save feedback: Invalid or empty conversation history');
    return { success: false, error: new Error('Invalid conversation history') };
  }
  
  let retries = 0;
  
  const attemptSave = async () => {
    try {
      console.log('Attempting to save feedback to Supabase:', { 
        email: feedbackData.email,
        conversationLength: feedbackData.conversation_history.length
      });
      
      const { data, error } = await supabase
        .from('cohort_feedback')
        .insert(feedbackData);
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Feedback saved successfully');
      return { success: true, data };
    } catch (error) {
      console.error(`Attempt ${retries + 1} failed:`, error);
      
      if (retries < maxRetries) {
        retries++;
        console.log(`Retrying... (${retries}/${maxRetries})`);
        // Wait 1 second before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        return attemptSave();
      }
      
      return { success: false, error };
    }
  };
  
  return attemptSave();
}

// Function to generate professional feedback from summary
export async function generateProfessionalFeedback(summary: string): Promise<string> {
  try {
    console.log('Generating professional feedback from summary');
    
    // Call OpenAI API to generate professional feedback
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a professional feedback analyzer. Based on a user's cohort review summary, 
            create a concise, professional point-by-point feedback that highlights key insights.
            Format should be clear with bullet points, focusing on strengths, areas for improvement, 
            and actionable recommendations. Keep it under 300 words.`
          },
          {
            role: 'user',
            content: `Based on this cohort review summary, please create a professional, 
            point-wise feedback that can be presented to program administrators: 
            "${summary}"`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Professional feedback generated successfully');
    return result.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating professional feedback:', error);
    return 'Unable to generate professional feedback at this time.';
  }
} 