import { supabase } from './supabase';

export type QuickAction = {
  id: string;
  user_id: string | null;
  action_type: string | null;
  payload: any | null;
  created_at: string;
};

export async function logQuickAction(action_type: string, payload: any = null) {
  const { data, error } = await supabase
    .from('quick_actions')
    .insert({ action_type, payload })
    .select('*')
    .single();
  if (error) throw error;
  return data as QuickAction;
}

export async function listQuickActions(limit = 50) {
  const { data, error } = await supabase
    .from('quick_actions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as QuickAction[];
}
