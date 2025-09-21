import { supabase } from './supabase';

export type QuestionRow = {
  id: string;
  user_id: string | null;
  text: string;
  policy_id: string | null;
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

export async function submitQuestion(text: string, policy_id: string | null = null) {
  const { data, error } = await supabase
    .from('questions')
    .insert({ text, policy_id })
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
