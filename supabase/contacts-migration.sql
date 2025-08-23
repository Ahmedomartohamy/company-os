-- CONTACTS AND RBAC MIGRATION
-- Sprint 1: Database schema updates for contacts management and role-based access control
--
-- How to run this migration:
-- 1. Open Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Go to your project
-- 3. Navigate to SQL Editor
-- 4. Copy and paste this entire file
-- 5. Click "Run" to execute
--
-- Note: This assumes the base tables (clients, profiles) already exist
-- Run database-setup.sql first if not already done

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add role column to profiles table if it doesn't exist (for existing installations)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

-- Update existing profiles RLS policies for role-based access
DROP POLICY IF EXISTS "profiles_read_all_auth" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_insert" ON public.profiles;

-- Recreate profiles policies with role-based access
CREATE POLICY "profiles_read_all_auth" ON public.profiles
FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_update_self_or_mgr" ON public.profiles
FOR UPDATE TO authenticated USING (
  id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','sales_manager')
  )
);

CREATE POLICY "profiles_admin_update" ON public.profiles
FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

CREATE POLICY "profiles_self_insert" ON public.profiles
FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Create contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  title TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable pg_trgm extension for full-text search (if available)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create indexes for contacts table
CREATE INDEX IF NOT EXISTS contacts_client_idx ON public.contacts(client_id);
CREATE INDEX IF NOT EXISTS contacts_email_idx ON public.contacts(email);
CREATE INDEX IF NOT EXISTS contacts_owner_idx ON public.contacts(owner_id);
-- Full-text search index (fallback to btree if pg_trgm not available)
CREATE INDEX IF NOT EXISTS contacts_name_search ON public.contacts(first_name, last_name);

-- Enable RLS on contacts table
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "contacts_read_all_auth" ON public.contacts;
DROP POLICY IF EXISTS "contacts_insert_role" ON public.contacts;
DROP POLICY IF EXISTS "contacts_update_owner_or_mgr" ON public.contacts;
DROP POLICY IF EXISTS "contacts_delete_admin_only" ON public.contacts;

-- Create RLS policies for contacts
CREATE POLICY "contacts_read_all_auth" ON public.contacts
FOR SELECT TO authenticated USING (true);

CREATE POLICY "contacts_insert_role" ON public.contacts
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','sales_manager','sales_rep'))
);

CREATE POLICY "contacts_update_owner_or_mgr" ON public.contacts
FOR UPDATE TO authenticated USING (
  owner_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','sales_manager')
  )
);

CREATE POLICY "contacts_delete_admin_only" ON public.contacts
FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- Create audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  row_id UUID,
  action TEXT CHECK (action IN ('insert','update','delete')) NOT NULL,
  actor_id UUID,
  at TIMESTAMPTZ DEFAULT NOW(),
  diff JSONB
);

-- Create audit logging function
CREATE OR REPLACE FUNCTION public.log_contacts_changes()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs(table_name,row_id,action,actor_id,diff)
    VALUES ('contacts', NEW.id, 'insert', auth.uid(), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs(table_name,row_id,action,actor_id,diff)
    VALUES ('contacts', NEW.id, 'update', auth.uid(), jsonb_strip_nulls(to_jsonb(NEW) - to_jsonb(OLD)));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs(table_name,row_id,action,actor_id,diff)
    VALUES ('contacts', OLD.id, 'delete', auth.uid(), to_jsonb(OLD));
    RETURN OLD;
  END IF;
END;$$;

-- Create audit trigger for contacts
DROP TRIGGER IF EXISTS trg_contacts_audit ON public.contacts;
CREATE TRIGGER trg_contacts_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.log_contacts_changes();

-- Display summary of migration
SELECT 
  'Migration Summary' as info,
  'Contacts table created' as contacts_status,
  'Audit logging enabled' as audit_status,
  'RBAC policies updated' as rbac_status;

-- Verify table creation
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('contacts', 'audit_logs')
ORDER BY table_name, ordinal_position;