import { supabase } from './supabase';

export type QuestionRow = {
  id: string;
  user_id: string | null;
  text: string;
  policy_id: string | null;
  category?: string | null;
  status: string;
  created_at: string;
};

export type SuggestionRow = {
  id: string;
  user_id: string | null;
  text: string;
  policy_id: string | null;
  status: string;
  created_at: string;
};

export async function submitQuestion(text: string, policy_id: string | null = null, category: string | null = null) {
  const { data, error } = await supabase
    .from('questions')
    .insert({ text, policy_id, category })
    .select('*')
    .single();
  if (error) throw error;
  return data as QuestionRow;
}

export async function submitSuggestion(text: string, policy_id: string | null = null) {
  const { data, error } = await supabase
    .from('suggestions')
    .insert({ text, policy_id })
    .select('*')
    .single();
  if (error) throw error;
  return data as SuggestionRow;
}

// List current user's recent questions
export async function listMyQuestions(limit = 10) {
  const { data, error } = await supabase
    .from('questions')
    .select('id, text, status, created_at, category')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as Array<Pick<QuestionRow, 'id' | 'text' | 'status' | 'created_at' | 'category'>>;
}

export type AnswerRow = {
  id: string;
  question_id: string;
  user_id: string | null;
  answer_text: string;
  source_type: string;
  verified: boolean;
  helpful_votes: number;
  created_at: string;
};

// Fetch one question with its answers
export async function getQuestionWithAnswers(questionId: string) {
  const { data: question, error: qErr } = await supabase
    .from('questions')
    .select('id, text, status, created_at, category')
    .eq('id', questionId)
    .single();
  if (qErr) throw qErr;

  const { data: answers, error: aErr } = await supabase
    .from('answers')
    .select('id, answer_text, source_type, verified, helpful_votes, created_at')
    .eq('question_id', questionId)
    .order('created_at', { ascending: true });
  if (aErr) throw aErr;

  return {
    question: question as Pick<QuestionRow, 'id' | 'text' | 'status' | 'created_at' | 'category'>,
    answers: (answers || []) as Array<Pick<AnswerRow, 'id' | 'answer_text' | 'source_type' | 'verified' | 'helpful_votes' | 'created_at'>>,
  };
}

// List current user's questions filtered by category
export async function listQuestionsByCategory(category: string, limit = 20) {
  const { data, error } = await supabase
    .from('questions')
    .select('id, text, status, created_at, category')
    .eq('category', category)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as Array<Pick<QuestionRow, 'id' | 'text' | 'status' | 'created_at' | 'category'>>;
}
