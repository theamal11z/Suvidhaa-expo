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

export type TicketAttachment = {
  id: string;
  ticket_id: string;
  url: string;
  mime_type: string | null;
  size: number | null;
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

// Create ticket while appending attachment URLs into the description.
// This avoids relying on ticket_attachments and avoids setting URL into
// source_id (which may be a UUID column in some schemas).
export async function createTicketWithAttachments(
  input: Partial<Ticket> & { category: string },
  attachments: Array<{ url: string; mime_type?: string | null; size?: number | null }>
) {
  const urls = attachments.map(a => a.url).filter(Boolean);
  const appended = urls.length > 0
    ? [input.description?.trim() || '', 'Attachments:', ...urls].filter(Boolean).join('\n\n')
    : input.description ?? null;

  const ticket = await createTicket({
    ...input,
    description: appended,
    // Record type only; do not set source_id to a URL if the column is UUID
    source_type: urls.length > 0 ? (input.source_type ?? 'cloudinary') : (input.source_type ?? null),
    source_id: input.source_id ?? null,
  });

  return ticket;
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
