import { supabase } from './supabase';

export type WatchItem = {
  id: string;
  user_id: string | null;
  target_type: 'policy' | 'ticket';
  target_id: string;
  created_at: string;
};

export async function listWatchlist(limit = 100) {
  const { data, error } = await supabase
    .from('watchlist')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as WatchItem[];
}

export async function addToWatchlist(target_type: 'policy' | 'ticket', target_id: string) {
  const { data, error } = await supabase
    .from('watchlist')
    .insert({ target_type, target_id })
    .select('*')
    .single();
  if (error) throw error;
  return data as WatchItem;
}

export async function removeFromWatchlist(id: string) {
  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function removeIfExists(target_type: 'policy' | 'ticket', target_id: string) {
  const { data, error } = await supabase
    .from('watchlist')
    .select('id')
    .eq('target_type', target_type)
    .eq('target_id', target_id)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (data?.id) {
    await removeFromWatchlist(data.id);
  }
}
