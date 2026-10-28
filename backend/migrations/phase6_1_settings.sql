-- ============================================================
-- Phase 6.1: Configurable default gas price (settings table)
-- Run this file in the Supabase SQL editor (SQL Editor > New query).
-- Safe to re-run (idempotent).
--
-- One row per setting; value is jsonb so future settings can be added
-- without a migration. No row is seeded here on purpose: the backend
-- falls back to Rs. 2,060 only when no saved setting exists.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Match the access model of the existing tables: the backend connects with the
-- anon key and existing tables are not RLS-restricted for it. Some Supabase
-- setups enable RLS by default on newly created tables, which would reject
-- every upsert (42501) while silently hiding rows from SELECT.
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.settings TO anon, authenticated, service_role;