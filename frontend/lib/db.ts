import { supabase } from './supabase';

export type DocumentRow = {
  id: string;
  user_id: string | null;
  url: string;
  type: string | null;
  cloudinary_public_id: string | null;
  created_at: string;
};

export type SummaryRow = {
  id: string;
  document_id: string | null;
  summary_text: string;
  key_points: any | null;
  created_at: string;
};

export async function insertDocument(params: { url: string; type?: string | null; cloudinary_public_id?: string | null }) {
  const { data, error } = await supabase
    .from('documents')
    .insert({ url: params.url, type: params.type ?? null, cloudinary_public_id: params.cloudinary_public_id ?? null })
    .select('*')
    .single();
  if (error) throw error;
  return data as DocumentRow;
}

export async function insertSummary(params: { document_id?: string | null; summary_text: string; key_points?: any }) {
  const { data, error } = await supabase
    .from('summaries')
    .insert({ document_id: params.document_id ?? null, summary_text: params.summary_text, key_points: params.key_points ?? null })
    .select('*')
    .single();
  if (error) throw error;
  return data as SummaryRow;
}
