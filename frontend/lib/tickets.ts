import { supabase } from './supabase';

export type Ticket = {
  id: string;
  user_id: string | null;
  title: string | null;
  description: string | null;
  category: string;
  status: string;
  priority: string;
  assigned_department: string | null;
  source_type: string | null;
  source_id: string | null;
  location: string | null;
  due_at: string | null;
  created_at: string;
};

export async function createTicket(input: Partial<Ticket> & { category: string }) {
  const { data, error } = await supabase
    .from('tickets')
    .insert({
      title: input.title ?? null,
      description: input.description ?? null,
      category: input.category,
      priority: input.priority ?? 'medium',
      status: input.status ?? 'open',
      assigned_department: input.assigned_department ?? null,
      source_type: input.source_type ?? null,
      source_id: input.source_id ?? null,
      location: input.location ?? null,
      due_at: input.due_at ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Ticket;
}

export async function listTickets(limit = 50) {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as Ticket[];
}
