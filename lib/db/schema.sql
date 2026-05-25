-- Create schema for credAI Database

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: audits
CREATE TABLE IF NOT EXISTS public.audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    team_size INTEGER NOT NULL,
    use_case VARCHAR(50) NOT NULL,
    input_tools JSONB NOT NULL,
    results_payload JSONB NOT NULL,
    email VARCHAR(255),
    company_name VARCHAR(255)
);

-- Table: leads
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    email VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    role VARCHAR(255),
    team_size INTEGER NOT NULL,
    audit_id UUID REFERENCES public.audits(id) ON DELETE SET NULL
);

-- Migration support for existing tables:
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS role VARCHAR(255);

-- Indexing for fast dynamic fetches and analytical views
CREATE INDEX IF NOT EXISTS idx_audits_created_at ON public.audits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

-- Row Level Security (RLS) policies (optional, but good practice for public databases)
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (lead creation)
CREATE POLICY "Allow anonymous inserts on audits" 
ON public.audits FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Allow anonymous reads on audits (for shared slug pages)
CREATE POLICY "Allow anonymous reads on audits" 
ON public.audits FOR SELECT 
TO anon, authenticated
USING (true);

-- Allow anonymous updates on audits (for saving feedback)
CREATE POLICY "Allow anonymous updates on audits" 
ON public.audits FOR UPDATE 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Allow anonymous inserts on leads (for email captures)
CREATE POLICY "Allow anonymous inserts on leads" 
ON public.leads FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Restrict read permissions on leads (keep lead emails completely private)
CREATE POLICY "Restrict reads on leads" 
ON public.leads FOR SELECT 
TO authenticated 
USING (true);
