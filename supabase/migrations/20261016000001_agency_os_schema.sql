-- ==============================================================================
-- AgencyOS Production Database Schema for Supabase PostgreSQL
-- Migration: 20261016000001_agency_os_schema.sql
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. Organizations & Multi-Tenant Core
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    currency TEXT DEFAULT 'BDT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 3. Profiles (Linked to auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('FOUNDER', 'MANAGER', 'EMPLOYEE', 'CLIENT')),
    title TEXT,
    phone TEXT,
    avatar_initials TEXT,
    avatar_color TEXT,
    timezone TEXT DEFAULT 'Asia/Dhaka',
    availability TEXT DEFAULT 'Available',
    weekly_capacity_hours NUMERIC DEFAULT 40,
    performance_score NUMERIC DEFAULT 92,
    department_id UUID,
    client_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helper function to fetch the current user's organization_id
CREATE OR REPLACE FUNCTION public.get_auth_org_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Helper function to fetch current user's role
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Helper function to fetch current user's client_id (if role is CLIENT)
CREATE OR REPLACE FUNCTION public.get_auth_client_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT client_id FROM public.profiles WHERE id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ==============================================================================
-- 4. Departments
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    manager_id UUID,
    monthly_budget_bdt NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 5. Clients
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    company TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    industry TEXT,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Lead', 'Active', 'Paused', 'Completed', 'Inactive')),
    manager_id UUID,
    total_value_bdt NUMERIC DEFAULT 0,
    website TEXT,
    notes TEXT,
    joined_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 6. Leads (CRM Pipeline)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    company TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    source TEXT DEFAULT 'Inbound SEO',
    service TEXT,
    potential_value_bdt NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost')),
    assigned_manager_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_contact TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 7. Projects
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    objectives JSONB DEFAULT '[]'::jsonb,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    manager_id UUID,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Lead', 'Planning', 'Active', 'Review', 'Client Approval', 'Completed', 'On Hold', 'Cancelled')),
    priority TEXT DEFAULT 'High' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    project_type TEXT,
    budget_bdt NUMERIC DEFAULT 0,
    spent_bdt NUMERIC DEFAULT 0,
    start_date DATE DEFAULT CURRENT_DATE,
    deadline DATE NOT NULL,
    custom_progress_percent NUMERIC,
    transfer_history JSONB DEFAULT '[]'::jsonb,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 8. Project Members (Assigned Specialists)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT DEFAULT 'specialist',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(project_id, user_id)
);

-- ==============================================================================
-- 9. Tasks
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    assigned_to UUID,
    assigned_manager_id UUID,
    priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    status TEXT DEFAULT 'To Do' CHECK (status IN ('Backlog', 'To Do', 'In Progress', 'Blocked', 'Review', 'Completed')),
    due_date DATE NOT NULL,
    estimated_hours NUMERIC DEFAULT 0,
    actual_hours NUMERIC DEFAULT 0,
    tags JSONB DEFAULT '[]'::jsonb,
    checklist JSONB DEFAULT '[]'::jsonb,
    comments JSONB DEFAULT '[]'::jsonb,
    created_by UUID,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 10. Milestones
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'Upcoming' CHECK (status IN ('Completed', 'Current', 'Upcoming')),
    weight NUMERIC DEFAULT 25,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 11. Deliverables
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.deliverables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Internal Review', 'Ready for Client', 'Client Approved', 'Changes Requested', 'Final')),
    due_date DATE NOT NULL,
    owner_id UUID,
    client_feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 12. Approvals
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    requester_id UUID,
    target_role TEXT DEFAULT 'CLIENT',
    priority TEXT DEFAULT 'High' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Changes Requested', 'Rejected')),
    visibility TEXT DEFAULT 'Client-visible' CHECK (visibility IN ('Internal', 'Client-visible')),
    notes TEXT,
    feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 13. Messages & Realtime Conversations
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    sender_id UUID NOT NULL,
    sender_name TEXT,
    channel TEXT DEFAULT 'Client Thread',
    visibility TEXT DEFAULT 'Client-visible' CHECK (visibility IN ('Internal', 'Client-visible')),
    content TEXT NOT NULL,
    mentions JSONB DEFAULT '[]'::jsonb,
    attachments JSONB DEFAULT '[]'::jsonb,
    unread_by JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 14. Agency Files & Metadata
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    file_type TEXT,
    size_label TEXT,
    storage_path TEXT,
    uploaded_by UUID,
    category TEXT DEFAULT 'Documents',
    visibility TEXT DEFAULT 'Client-visible' CHECK (visibility IN ('Internal', 'Client-visible')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 15. Notifications
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    link_project_id UUID,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 16. Calendar Events
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    date DATE NOT NULL,
    time_label TEXT,
    project_id UUID,
    client_id UUID,
    visibility TEXT DEFAULT 'Client-visible' CHECK (visibility IN ('Internal', 'Client-visible')),
    attendee_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 17. Time Tracking Entries
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    task_id UUID,
    project_id UUID,
    date DATE NOT NULL,
    hours NUMERIC NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 18. Invoices
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    amount_bdt NUMERIC NOT NULL,
    status TEXT DEFAULT 'Sent' CHECK (status IN ('Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled')),
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 19. Activity Audit Logs
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    actor_id UUID,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_name TEXT NOT NULL,
    project_id UUID,
    client_id UUID,
    visibility TEXT DEFAULT 'Internal' CHECK (visibility IN ('Internal', 'Client-safe')),
    metadata TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 20. Project Templates
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.project_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    project_type TEXT NOT NULL,
    default_department_id UUID,
    estimated_duration_days INTEGER DEFAULT 30,
    default_budget_bdt NUMERIC DEFAULT 0,
    description TEXT,
    default_tasks JSONB DEFAULT '[]'::jsonb,
    default_milestones JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 21. Indexes for Maximum Performance
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_org ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_org ON public.projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_client ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_messages_project ON public.messages(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_files_project ON public.files(project_id);
CREATE INDEX IF NOT EXISTS idx_approvals_project ON public.approvals(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_org ON public.activity_logs(organization_id);

-- ==============================================================================
-- 22. Enable Supabase Realtime Publication
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ==============================================================================
-- 23. Row Level Security (RLS) Configuration
-- ==============================================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;

-- Profiles: Authenticated users can read member profiles in their organization, update their own profile
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT TO authenticated
    USING (organization_id = public.get_auth_org_id() OR id = auth.uid());

CREATE POLICY "profiles_update_self_policy" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid());

-- Projects: Internal team members can see active projects in their org; Clients only see their own active projects
CREATE POLICY "projects_select_policy" ON public.projects
    FOR SELECT TO authenticated
    USING (
        (public.get_auth_role() IN ('FOUNDER', 'MANAGER', 'EMPLOYEE') AND organization_id = public.get_auth_org_id())
        OR
        (public.get_auth_role() = 'CLIENT' AND client_id = public.get_auth_client_id())
    );

CREATE POLICY "projects_insert_policy" ON public.projects
    FOR INSERT TO authenticated
    WITH CHECK (public.get_auth_role() IN ('FOUNDER', 'MANAGER'));

CREATE POLICY "projects_update_policy" ON public.projects
    FOR UPDATE TO authenticated
    USING (public.get_auth_role() IN ('FOUNDER', 'MANAGER', 'EMPLOYEE'));

-- Tasks: Internal users see tasks in their projects; Clients do not see internal sprint backlog
CREATE POLICY "tasks_select_policy" ON public.tasks
    FOR SELECT TO authenticated
    USING (public.get_auth_role() IN ('FOUNDER', 'MANAGER', 'EMPLOYEE') AND organization_id = public.get_auth_org_id());

CREATE POLICY "tasks_insert_policy" ON public.tasks
    FOR INSERT TO authenticated
    WITH CHECK (public.get_auth_role() IN ('FOUNDER', 'MANAGER', 'EMPLOYEE'));

CREATE POLICY "tasks_update_policy" ON public.tasks
    FOR UPDATE TO authenticated
    USING (public.get_auth_role() IN ('FOUNDER', 'MANAGER', 'EMPLOYEE'));

-- Messages: Realtime chat authorization
CREATE POLICY "messages_select_policy" ON public.messages
    FOR SELECT TO authenticated
    USING (
        (public.get_auth_role() IN ('FOUNDER', 'MANAGER', 'EMPLOYEE'))
        OR
        (public.get_auth_role() = 'CLIENT' AND client_id = public.get_auth_client_id() AND visibility = 'Client-visible')
    );

CREATE POLICY "messages_insert_policy" ON public.messages
    FOR INSERT TO authenticated
    WITH CHECK (
        (public.get_auth_role() IN ('FOUNDER', 'MANAGER', 'EMPLOYEE'))
        OR
        (public.get_auth_role() = 'CLIENT' AND client_id = public.get_auth_client_id() AND visibility = 'Client-visible')
    );

-- Clients table
CREATE POLICY "clients_select_policy" ON public.clients
    FOR SELECT TO authenticated
    USING (
        (public.get_auth_role() IN ('FOUNDER', 'MANAGER', 'EMPLOYEE') AND organization_id = public.get_auth_org_id())
        OR
        (public.get_auth_role() = 'CLIENT' AND id = public.get_auth_client_id())
    );

CREATE POLICY "clients_all_policy" ON public.clients
    FOR ALL TO authenticated
    USING (public.get_auth_role() IN ('FOUNDER', 'MANAGER'));

-- Leads table
CREATE POLICY "leads_all_policy" ON public.leads
    FOR ALL TO authenticated
    USING (public.get_auth_role() IN ('FOUNDER', 'MANAGER'));

-- Files table
CREATE POLICY "files_select_policy" ON public.files
    FOR SELECT TO authenticated
    USING (
        (public.get_auth_role() IN ('FOUNDER', 'MANAGER', 'EMPLOYEE'))
        OR
        (public.get_auth_role() = 'CLIENT' AND client_id = public.get_auth_client_id() AND visibility = 'Client-visible')
    );

CREATE POLICY "files_insert_policy" ON public.files
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- Notifications: Only target user can read/update their notifications
CREATE POLICY "notifications_policy" ON public.notifications
    FOR ALL TO authenticated
    USING (user_id = auth.uid() OR user_id IS NULL);

-- Templates: readable by authenticated users
CREATE POLICY "templates_select_policy" ON public.project_templates
    FOR SELECT TO authenticated USING (true);
