import { supabase } from './supabase';

export type AIConversation = {
  id: string;
  user_id: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
};

export type AIMessage = {
  id: string;
  conversation_id: string;
  user_id: string | null;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

export async function getOrCreateConversation(title = 'New Chat') {
  // Try to find the most recent conversation
  const { data: existing, error: findErr } = await supabase
    .from('ai_conversations')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1);
  if (findErr) throw findErr;
  if (existing && existing.length > 0) return existing[0] as AIConversation;

  // Create one
  const { data, error } = await supabase
    .from('ai_conversations')
    .insert({ title })
    .select('*')
    .single();
  if (error) throw error;
  return data as AIConversation;
}

export async function listMessages(conversation_id: string) {
  const { data, error } = await supabase
    .from('ai_messages')
    .select('*')
    .eq('conversation_id', conversation_id)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []) as AIMessage[];
}

export async function sendMessage(conversation_id: string, content: string) {
  const { data, error } = await supabase
    .from('ai_messages')
    .insert({ conversation_id, role: 'user', content })
    .select('*')
    .single();
  if (error) throw error;
  return data as AIMessage;
}

export async function generateAIReply(conversation_id: string, prompt: string) {
  // Call NVIDIA via edge function
  const { data, error } = await supabase.functions.invoke('llm-proxy', {
    body: {
      prompt,
      temperature: 0.3,
      max_tokens: 500,
    },
  });
  if (error) throw error;
  const content: string = data?.choices?.[0]?.message?.content ?? data?.result ?? String(data);

  // Save assistant message
  const { data: msg, error: insErr } = await supabase
    .from('ai_messages')
    .insert({ conversation_id, role: 'assistant', content })
    .select('*')
    .single();
  if (insErr) throw insErr;

  // Touch conversation updated_at
  await supabase
    .from('ai_conversations')
    .update({ updated_at: new Date().toISOString(), title: 'Assistant Chat' })
    .eq('id', conversation_id);

  return msg as AIMessage;
}
