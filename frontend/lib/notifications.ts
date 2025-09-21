import { supabase } from './supabase';

export type Notification = {
  id: string;
  user_id: string;
  type: string | null;
  title: string | null;
  body: string | null;
  data: any | null;
  read: boolean;
  created_at: string;
};

export async function listNotifications(limit = 50) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as Notification[];
}

export async function markRead(id: string, read = true) {
  const { error } = await supabase
    .from('notifications')
    .update({ read })
    .eq('id', id);
  if (error) throw error;
}

export async function getUnreadCount() {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('read', false);
  if (error) throw error;
  return count || 0;
}
