-- BONSAI CRM Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CONTACTS
-- ============================================
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT,
  last_name TEXT,
  business_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  category TEXT, -- Restaurant, Electrician, Plumbing, etc.
  contact_type TEXT DEFAULT 'prospect', -- prospect, club, client
  website_status TEXT, -- None, Facebook only, Blogspot, etc.
  priority BOOLEAN DEFAULT FALSE,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contacts_category ON contacts(category);
CREATE INDEX idx_contacts_contact_type ON contacts(contact_type);
CREATE INDEX idx_contacts_search ON contacts USING gin(to_tsvector('english', coalesce(business_name,'') || ' ' || coalesce(first_name,'') || ' ' || coalesce(last_name,'')));

-- ============================================
-- PIPELINE STAGES
-- ============================================
CREATE TABLE pipeline_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  pipeline TEXT DEFAULT 'websites', -- websites, clubs, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DEALS (contact in pipeline)
-- ============================================
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL,
  pipeline TEXT DEFAULT 'websites',
  value NUMERIC DEFAULT 0, -- one-time value
  recurring_value NUMERIC DEFAULT 0, -- monthly recurring
  position INTEGER DEFAULT 0, -- order within stage
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deals_contact ON deals(contact_id);
CREATE INDEX idx_deals_stage ON deals(stage_id);

-- ============================================
-- ACTIVITIES (calls, emails, SMS, meetings, notes)
-- ============================================
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- call, email, sms, meeting, note
  subject TEXT,
  body TEXT,
  outcome TEXT, -- for calls: connected, voicemail, no_answer
  direction TEXT, -- inbound, outbound
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activities_contact ON activities(contact_id);
CREATE INDEX idx_activities_created ON activities(created_at DESC);

-- ============================================
-- REMINDERS / FOLLOW-UPS
-- ============================================
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reminders_due ON reminders(due_date) WHERE completed = FALSE;
CREATE INDEX idx_reminders_contact ON reminders(contact_id);

-- ============================================
-- EMAIL TEMPLATES
-- ============================================
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EMAIL SEQUENCES
-- ============================================
CREATE TABLE sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sequence_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sequence_id UUID REFERENCES sequences(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  delay_days INTEGER NOT NULL, -- days after previous step
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sequence_id UUID REFERENCES sequences(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 0,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed BOOLEAN DEFAULT FALSE,
  UNIQUE(sequence_id, contact_id)
);

-- ============================================
-- SMART VIEWS (saved filters)
-- ============================================
CREATE TABLE smart_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  -- filters: { stage_ids: [], categories: [], tags: [], contact_type: '', priority_only: false, no_activity_days: null }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CUSTOM FIELDS DEFINITIONS
-- ============================================
CREATE TABLE custom_field_defs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text', -- text, number, date, select
  options TEXT[], -- for select type
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DEFAULT PIPELINE STAGES
-- ============================================
INSERT INTO pipeline_stages (name, position, color, pipeline) VALUES
  ('Lead', 0, '#6B7280', 'websites'),
  ('Contacted', 1, '#3B82F6', 'websites'),
  ('Mockup Sent', 2, '#8B5CF6', 'websites'),
  ('Proposal', 3, '#F59E0B', 'websites'),
  ('Client', 4, '#10B981', 'websites'),
  ('Care Plan', 5, '#059669', 'websites'),
  ('Lead', 0, '#6B7280', 'clubs'),
  ('Contacted', 1, '#3B82F6', 'clubs'),
  ('Demo Sent', 2, '#8B5CF6', 'clubs'),
  ('Onboarded', 3, '#10B981', 'clubs');

-- ============================================
-- DEFAULT EMAIL TEMPLATES
-- ============================================
INSERT INTO email_templates (name, subject, body) VALUES
  ('Initial Outreach', 'Quick question about {{business_name}}''s website',
   'Hi there,\n\nI noticed {{business_name}} doesn''t have a modern website. I build affordable websites for local businesses in St. John''s.\n\nHere''s my offer: I''ll build your website for free. If you love it, it''s $300 one-time plus $50/month for updates, backups, and support.\n\nNo risk, no obligation. Want to see what I''d build for you?\n\nBest,\nscott\n\nNot interested? Just reply "no thanks" and I won''t reach out again.'),
  ('Follow-up Day 4', 'Following up - {{business_name}} website',
   'Hi there,\n\nJust following up on my last email. I''d love to build a free mockup website for {{business_name}} so you can see what''s possible.\n\nIt takes me a couple days, costs you nothing to look at. Interested?\n\nBest,\nscott\n\nNot interested? Just reply "no thanks" and I won''t reach out again.'),
  ('Follow-up Day 11', 'Last check-in - {{business_name}}',
   'Hi there,\n\nI don''t want to be a pest, so this is my last follow-up. The offer stands: free website mockup, $300 only if you love it.\n\nIf timing''s not right, no worries. Just reply whenever.\n\nBest,\nscott\n\nNot interested? Just reply "no thanks" and I won''t reach out again.');

-- ============================================
-- DEFAULT SEQUENCE
-- ============================================
INSERT INTO sequences (name, description) VALUES
  ('Website Outreach', 'Day 0, Day 4, Day 11 follow-up for website prospects');

-- Row Level Security: for single-user, allow all for authenticated users
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_defs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access (single-user CRM)
CREATE POLICY "authenticated_all" ON contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON pipeline_stages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON deals FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON activities FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON reminders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON email_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON sequences FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON sequence_steps FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON sequence_enrollments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON smart_views FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON custom_field_defs FOR ALL TO authenticated USING (true) WITH CHECK (true);
