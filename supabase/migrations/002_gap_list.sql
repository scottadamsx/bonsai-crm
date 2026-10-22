-- BONSAI CRM gap list build, 2026-10-22
-- Run this in the Supabase SQL editor (project bonsai-crm, ref jrurfmmbgglioaegyxck).
-- Adds the three columns the gap list features need:
--   contacts.lead_status  (gap #1: lead status, separate from pipeline stage)
--   reminders.snoozed_until (gap #8: reminder snooze)
--   deals.won_date        (gap #9: opportunity won date)

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS lead_status TEXT DEFAULT 'Spotted';
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS snoozed_until DATE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS won_date DATE;

CREATE INDEX IF NOT EXISTS idx_contacts_lead_status ON contacts(lead_status);
