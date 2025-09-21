import { supabase } from './supabase';

export type Policy = {
  id: string;
  slug: string | null;
  title: string;
  summary: string | null;
  category: string | null;
  status: string | null;
  created_at: string;
};

export type PolicyUpdate = {
  id: string;
  policy_id: string;
  title: string | null;
  body: string | null;
  effective_at: string | null;
  created_at: string;
};

export async function listPolicies(opts?: { search?: string; limit?: number }) {
  let query = supabase.from('policies').select('*').order('created_at', { ascending: false });
  if (opts?.search) {
    query = query.ilike('title', `%${opts.search}%`);
  }
  if (opts?.limit) query = query.limit(opts.limit);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Policy[];
}

export async function getPolicy(id: string) {
  const { data, error } = await supabase.from('policies').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Policy;
}

export async function listPolicyUpdates(policy_id: string) {
  const { data, error } = await supabase
    .from('policy_updates')
    .select('*')
    .eq('policy_id', policy_id)
    .order('effective_at', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as PolicyUpdate[];
}
