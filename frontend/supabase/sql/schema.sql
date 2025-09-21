-- ===================================================================
-- Suvidhaa - Complete Database Schema
-- Government transparency and citizen engagement platform
-- ===================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ===================================================================
-- Helper Functions
-- ===================================================================

-- Function to automatically set user_id on insert
CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS trigger AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- Core Tables
-- ===================================================================

-- User profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  photo_url text,
  location text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Documents (PDFs, files uploaded by users or linked from government)
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  url text NOT NULL,
  title text,
  type text DEFAULT 'pdf', -- pdf, doc, image, etc.
  cloudinary_public_id text,
  file_size bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- AI-generated summaries of documents
CREATE TABLE IF NOT EXISTS public.summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  summary_text text NOT NULL,
  key_points jsonb, -- array of key points
  simplified_language text, -- citizen-friendly version
  visual_highlights jsonb, -- for charts, important dates, etc.
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Government policies and schemes
CREATE TABLE IF NOT EXISTS public.policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE,
  title text NOT NULL,
  summary text,
  description text,
  category text, -- Healthcare, Education, Environment, etc.
  status text DEFAULT 'active', -- active, under_review, archived
  department text,
  effective_date timestamptz,
  expiry_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Policy updates and amendments
CREATE TABLE IF NOT EXISTS public.policy_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid REFERENCES public.policies(id) ON DELETE CASCADE,
  title text,
  body text NOT NULL,
  update_type text DEFAULT 'amendment', -- amendment, clarification, extension
  effective_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Link policies to their supporting documents
CREATE TABLE IF NOT EXISTS public.policy_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid REFERENCES public.policies(id) ON DELETE CASCADE,
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
  document_type text DEFAULT 'support', -- support, official, reference
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(policy_id, document_id)
);

-- ===================================================================
-- Citizen Engagement Tables
-- ===================================================================

-- Questions asked by citizens about policies/government services
CREATE TABLE IF NOT EXISTS public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text,
  text text NOT NULL,
  policy_id uuid REFERENCES public.policies(id) ON DELETE SET NULL,
  category text, -- general, policy-specific, service-inquiry
  status text DEFAULT 'open', -- open, answered, closed
  priority text DEFAULT 'normal', -- low, normal, high, urgent
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Answers to questions (from government officials or AI)
CREATE TABLE IF NOT EXISTS public.answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  answer_text text NOT NULL,
  source_type text DEFAULT 'human', -- human, ai, official
  verified boolean DEFAULT false,
  helpful_votes integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Suggestions and feedback from citizens
CREATE TABLE IF NOT EXISTS public.suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text,
  text text NOT NULL,
  policy_id uuid REFERENCES public.policies(id) ON DELETE SET NULL,
  category text,
  status text DEFAULT 'submitted', -- submitted, under_review, implemented, rejected
  upvotes integer DEFAULT 0,
  implementation_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===================================================================
-- Ticket System (Complaints, Applications, Requests)
-- ===================================================================

-- Main tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text,
  description text,
  category text NOT NULL, -- complaint, application, inquiry, emergency
  status text DEFAULT 'open', -- open, in_progress, resolved, closed, rejected
  priority text DEFAULT 'medium', -- low, medium, high, urgent
  assigned_department text,
  assigned_to_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source_type text, -- web, mobile, phone, in_person
  source_id uuid, -- reference to related object
  location text,
  contact_phone text,
  contact_email text,
  due_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Progress updates for tickets
CREATE TABLE IF NOT EXISTS public.progress_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  message text,
  status text,
  progress_percent integer CHECK (progress_percent >= 0 AND progress_percent <= 100),
  is_public boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Comments/conversations on tickets
CREATE TABLE IF NOT EXISTS public.ticket_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  message text NOT NULL,
  is_internal boolean DEFAULT false, -- true for internal government comments
  attachment_urls jsonb, -- array of file URLs
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Attachments for tickets
CREATE TABLE IF NOT EXISTS public.ticket_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES public.tickets(id) ON DELETE CASCADE,
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
  attachment_type text DEFAULT 'evidence', -- evidence, form, identity, other
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ticket_id, document_id)
);

-- ===================================================================
-- AI & Conversations
-- ===================================================================

-- AI conversation sessions
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text,
  context_type text, -- general, policy_specific, service_help
  context_id uuid, -- reference to policy, ticket, etc.
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Messages within AI conversations
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  role text CHECK (role IN ('user','assistant')) NOT NULL,
  content text NOT NULL,
  message_type text DEFAULT 'text', -- text, image, file, quick_reply
  metadata jsonb, -- for storing additional context, sources, etc.
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Long-term user preferences and AI memory
CREATE TABLE IF NOT EXISTS public.ai_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb NOT NULL,
  memory_type text DEFAULT 'preference', -- preference, fact, context
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, key)
);

-- ===================================================================
-- User Engagement & Tracking
-- ===================================================================

-- Personal watchlist (policies, tickets user wants to track)
CREATE TABLE IF NOT EXISTS public.watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text CHECK (target_type IN ('policy','ticket','question','suggestion')) NOT NULL,
  target_id uuid NOT NULL,
  notification_preferences jsonb, -- when to notify: status_change, updates, etc.
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User action history (for analytics and quick actions)
CREATE TABLE IF NOT EXISTS public.quick_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL, -- document_upload, question_ask, ticket_create, etc.
  target_type text,
  target_id uuid,
  payload jsonb, -- additional action data
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Notifications for users
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL, -- policy_update, ticket_update, question_answered, etc.
  title text,
  body text,
  data jsonb, -- additional notification payload
  read boolean DEFAULT false,
  action_url text, -- deep link to relevant screen
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===================================================================
-- Analytics & Metrics
-- ===================================================================

-- Track policy engagement metrics
CREATE TABLE IF NOT EXISTS public.policy_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid REFERENCES public.policies(id) ON DELETE CASCADE,
  metric_type text NOT NULL, -- views, questions, suggestions, watchlist_adds
  metric_value integer DEFAULT 1,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for anonymous
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Track overall system usage
CREATE TABLE IF NOT EXISTS public.usage_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  event_type text NOT NULL, -- page_view, action_taken, feature_used
  event_data jsonb,
  user_agent text,
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===================================================================
-- Row Level Security (RLS)
-- ===================================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_analytics ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- Policies (RLS Rules)
-- ===================================================================

-- User profiles: users can only see/edit their own
DROP POLICY IF EXISTS user_profiles_self ON public.user_profiles;
CREATE POLICY user_profiles_self ON public.user_profiles
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Documents: users can see their own documents
DROP POLICY IF EXISTS documents_own_rows ON public.documents;
CREATE POLICY documents_own_rows ON public.documents
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Summaries: users can see summaries of their documents or public ones
DROP POLICY IF EXISTS summaries_read_policy ON public.summaries;
CREATE POLICY summaries_read_policy ON public.summaries
  FOR SELECT USING (
    document_id IS NULL OR EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_id AND d.user_id = auth.uid()
    )
  );

-- Anyone can insert summaries (for AI processing)
DROP POLICY IF EXISTS summaries_insert_any ON public.summaries;
CREATE POLICY summaries_insert_any ON public.summaries
  FOR INSERT WITH CHECK (true);

-- Policies: everyone can read (public information)
DROP POLICY IF EXISTS policies_read_all ON public.policies;
CREATE POLICY policies_read_all ON public.policies
  FOR SELECT USING (true);

-- Policy updates: everyone can read
DROP POLICY IF EXISTS policy_updates_read_all ON public.policy_updates;
CREATE POLICY policy_updates_read_all ON public.policy_updates
  FOR SELECT USING (true);

-- Policy documents: everyone can read
DROP POLICY IF EXISTS policy_documents_read_all ON public.policy_documents;
CREATE POLICY policy_documents_read_all ON public.policy_documents
  FOR SELECT USING (true);

-- Questions: users manage their own
DROP POLICY IF EXISTS questions_own_rows ON public.questions;
CREATE POLICY questions_own_rows ON public.questions
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Answers: read if you own the question or answer
DROP POLICY IF EXISTS answers_access_policy ON public.answers;
CREATE POLICY answers_access_policy ON public.answers
  FOR SELECT USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.questions q
      WHERE q.id = answers.question_id AND q.user_id = auth.uid()
    )
  );

-- Anyone can insert answers (for officials/AI)
DROP POLICY IF EXISTS answers_insert_any ON public.answers;
CREATE POLICY answers_insert_any ON public.answers
  FOR INSERT WITH CHECK (true);

-- Suggestions: users manage their own
DROP POLICY IF EXISTS suggestions_own_rows ON public.suggestions;
CREATE POLICY suggestions_own_rows ON public.suggestions
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Tickets: users manage their own
DROP POLICY IF EXISTS tickets_own_rows ON public.tickets;
CREATE POLICY tickets_own_rows ON public.tickets
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Progress updates: see updates for your tickets
DROP POLICY IF EXISTS progress_updates_by_ticket_owner ON public.progress_updates;
CREATE POLICY progress_updates_by_ticket_owner ON public.progress_updates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id AND t.user_id = auth.uid()
    )
  );

-- Anyone can insert progress updates (for officials)
DROP POLICY IF EXISTS progress_updates_insert_any ON public.progress_updates;
CREATE POLICY progress_updates_insert_any ON public.progress_updates
  FOR INSERT WITH CHECK (true);

-- Ticket comments: access based on ticket ownership
DROP POLICY IF EXISTS ticket_comments_by_ticket_owner ON public.ticket_comments;
CREATE POLICY ticket_comments_by_ticket_owner ON public.ticket_comments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
  );

DROP POLICY IF EXISTS ticket_comments_insert_update ON public.ticket_comments;
CREATE POLICY ticket_comments_insert_update ON public.ticket_comments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
  );

-- Ticket attachments: access based on ticket ownership
DROP POLICY IF EXISTS ticket_attachments_by_owner ON public.ticket_attachments;
CREATE POLICY ticket_attachments_by_owner ON public.ticket_attachments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
  );

DROP POLICY IF EXISTS ticket_attachments_insert ON public.ticket_attachments;
CREATE POLICY ticket_attachments_insert ON public.ticket_attachments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
  );

-- AI Conversations: users manage their own
DROP POLICY IF EXISTS ai_conversations_own_rows ON public.ai_conversations;
CREATE POLICY ai_conversations_own_rows ON public.ai_conversations
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- AI Messages: access based on conversation ownership
DROP POLICY IF EXISTS ai_messages_by_conversation_owner ON public.ai_messages;
CREATE POLICY ai_messages_by_conversation_owner ON public.ai_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS ai_messages_insert ON public.ai_messages;
CREATE POLICY ai_messages_insert ON public.ai_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

-- AI Memory: users manage their own
DROP POLICY IF EXISTS ai_memory_own_rows ON public.ai_memory;
CREATE POLICY ai_memory_own_rows ON public.ai_memory
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Watchlist: users manage their own
DROP POLICY IF EXISTS watchlist_own_rows ON public.watchlist;
CREATE POLICY watchlist_own_rows ON public.watchlist
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Quick actions: users manage their own
DROP POLICY IF EXISTS quick_actions_own_rows ON public.quick_actions;
CREATE POLICY quick_actions_own_rows ON public.quick_actions
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Notifications: users manage their own
DROP POLICY IF EXISTS notifications_own_rows ON public.notifications;
CREATE POLICY notifications_own_rows ON public.notifications
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy metrics: read-only for users, anyone can insert (for analytics)
DROP POLICY IF EXISTS policy_metrics_read_all ON public.policy_metrics;
CREATE POLICY policy_metrics_read_all ON public.policy_metrics
  FOR SELECT USING (true);

DROP POLICY IF EXISTS policy_metrics_insert_any ON public.policy_metrics;
CREATE POLICY policy_metrics_insert_any ON public.policy_metrics
  FOR INSERT WITH CHECK (true);

-- Usage analytics: users can only see their own, anyone can insert
DROP POLICY IF EXISTS usage_analytics_own_or_anonymous ON public.usage_analytics;
CREATE POLICY usage_analytics_own_or_anonymous ON public.usage_analytics
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS usage_analytics_insert_any ON public.usage_analytics;
CREATE POLICY usage_analytics_insert_any ON public.usage_analytics
  FOR INSERT WITH CHECK (true);

-- ===================================================================
-- Triggers
-- ===================================================================

-- Auto-set user_id triggers
DROP TRIGGER IF EXISTS set_user_id_user_profiles ON public.user_profiles;
CREATE TRIGGER set_user_id_user_profiles BEFORE INSERT ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_user_id_documents ON public.documents;
CREATE TRIGGER set_user_id_documents BEFORE INSERT ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_user_id_questions ON public.questions;
CREATE TRIGGER set_user_id_questions BEFORE INSERT ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_user_id_answers ON public.answers;
CREATE TRIGGER set_user_id_answers BEFORE INSERT ON public.answers
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_user_id_suggestions ON public.suggestions;
CREATE TRIGGER set_user_id_suggestions BEFORE INSERT ON public.suggestions
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_user_id_tickets ON public.tickets;
CREATE TRIGGER set_user_id_tickets BEFORE INSERT ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_user_id_progress_updates ON public.progress_updates;
CREATE TRIGGER set_user_id_progress_updates BEFORE INSERT ON public.progress_updates
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_user_id_ticket_comments ON public.ticket_comments;
CREATE TRIGGER set_user_id_ticket_comments BEFORE INSERT ON public.ticket_comments
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_user_id_ai_conversations ON public.ai_conversations;
CREATE TRIGGER set_user_id_ai_conversations BEFORE INSERT ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_user_id_ai_messages ON public.ai_messages;
CREATE TRIGGER set_user_id_ai_messages BEFORE INSERT ON public.ai_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_user_id_ai_memory ON public.ai_memory;
CREATE TRIGGER set_user_id_ai_memory BEFORE INSERT ON public.ai_memory
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_user_id_quick_actions ON public.quick_actions;
CREATE TRIGGER set_user_id_quick_actions BEFORE INSERT ON public.quick_actions
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_user_id_notifications ON public.notifications;
CREATE TRIGGER set_user_id_notifications BEFORE INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

-- Updated_at triggers
DROP TRIGGER IF EXISTS touch_user_profiles ON public.user_profiles;
CREATE TRIGGER touch_user_profiles BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS touch_policies ON public.policies;
CREATE TRIGGER touch_policies BEFORE UPDATE ON public.policies
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS touch_tickets ON public.tickets;
CREATE TRIGGER touch_tickets BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS touch_ai_conversations ON public.ai_conversations;
CREATE TRIGGER touch_ai_conversations BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS touch_ai_memory ON public.ai_memory;
CREATE TRIGGER touch_ai_memory BEFORE UPDATE ON public.ai_memory
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===================================================================
-- Realtime Publications
-- ===================================================================

-- Ensure supabase_realtime publication exists
DO $$ BEGIN
  PERFORM 1 FROM pg_publication WHERE pubname = 'supabase_realtime';
  IF NOT FOUND THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE
  public.tickets,
  public.progress_updates,
  public.ticket_comments,
  public.watchlist,
  public.ai_conversations,
  public.ai_messages,
  public.notifications,
  public.policies,
  public.policy_updates,
  public.questions,
  public.answers;

-- ===================================================================
-- Indexes for Performance
-- ===================================================================

-- User-related indexes
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_user_id ON public.questions(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_user_id ON public.suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON public.watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON public.notifications(user_id, read);

-- Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_summaries_document_id ON public.summaries(document_id);
CREATE INDEX IF NOT EXISTS idx_policy_updates_policy_id ON public.policy_updates(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_documents_policy_id ON public.policy_documents(policy_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON public.answers(question_id);
CREATE INDEX IF NOT EXISTS idx_progress_updates_ticket_id ON public.progress_updates(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id ON public.ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);

-- Search and filtering indexes
CREATE INDEX IF NOT EXISTS idx_policies_status_category ON public.policies(status, category);
CREATE INDEX IF NOT EXISTS idx_tickets_status_created_at ON public.tickets(status, created_at);
CREATE INDEX IF NOT EXISTS idx_questions_status_created_at ON public.questions(status, created_at);
CREATE INDEX IF NOT EXISTS idx_watchlist_target ON public.watchlist(target_type, target_id);

-- Text search indexes
CREATE INDEX IF NOT EXISTS idx_policies_title_trgm ON public.policies USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_policies_summary_trgm ON public.policies USING gin (summary gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_tickets_title_trgm ON public.tickets USING gin (title gin_trgm_ops);

-- ===================================================================
-- Sample Data (Optional - for development)
-- ===================================================================

-- Sample policies
INSERT INTO public.policies (title, summary, category, department, status) VALUES 
  ('Digital India Initiative', 'Comprehensive program to transform India into a digitally empowered society', 'Technology', 'Ministry of Electronics & IT', 'active'),
  ('Pradhan Mantri Awas Yojana', 'Housing for All by 2024 scheme providing affordable housing', 'Housing', 'Ministry of Housing & Urban Affairs', 'active'),
  ('Swachh Bharat Mission', 'Clean India campaign focusing on sanitation and waste management', 'Environment', 'Ministry of Water & Sanitation', 'active'),
  ('Ayushman Bharat', 'National health protection scheme covering 10 crore families', 'Healthcare', 'Ministry of Health & Family Welfare', 'active'),
  ('Make in India', 'Initiative to promote manufacturing and create jobs in India', 'Economy', 'Ministry of Commerce & Industry', 'active')
ON CONFLICT (slug) DO NOTHING;