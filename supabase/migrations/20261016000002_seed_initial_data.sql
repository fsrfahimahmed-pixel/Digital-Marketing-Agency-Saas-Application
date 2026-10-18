-- ==============================================================================
-- AgencyOS Initial Seed Data
-- Migration: 20261016000002_seed_initial_data.sql
-- ==============================================================================

-- 1. Insert default agency organization
INSERT INTO public.organizations (id, name, slug, currency)
VALUES ('00000000-0000-0000-0000-000000000001', 'AgencyOS Digital Global', 'agencyos-global', 'BDT')
ON CONFLICT (slug) DO NOTHING;

-- 2. Insert standard project blueprint templates
INSERT INTO public.project_templates (id, name, project_type, estimated_duration_days, default_budget_bdt, description, default_tasks, default_milestones)
VALUES
(
    '00000000-0000-0000-0000-000000000101',
    'Full-Funnel Paid Acquisition & CRO',
    'Paid Media & CRO Retainer',
    60,
    1500000,
    'End-to-end Meta/Google Ads campaign orchestration with landing page CRO and daily tracking.',
    '[
        {"title": "Meta Ads Pixel Audit & CAPI Server-side Verification", "estimatedHours": 6, "priority": "High", "tags": ["Paid Media", "Tracking"]},
        {"title": "High-intent Search Keywords & Competitor Negative Matching", "estimatedHours": 8, "priority": "High", "tags": ["Google Ads", "SEM"]},
        {"title": "Deliver 12 Modular UGC Ad Hooks & 3 Video Concept Scripts", "estimatedHours": 14, "priority": "High", "tags": ["Creative", "Video"]},
        {"title": "Design Above-the-Fold CRO A/B Variant Wireframe", "estimatedHours": 10, "priority": "Medium", "tags": ["Design", "CRO"]}
    ]'::jsonb,
    '["Discovery & Tracking Setup", "Creative Production & Approval", "Campaign Launch", "Mid-Sprint ROAS Scaling"]'::jsonb
),
(
    '00000000-0000-0000-0000-000000000102',
    'Technical SEO & Programmatic Authority',
    'Organic Search Retainer',
    90,
    950000,
    'Core Web Vitals remediation, semantic search keyword clusters, and programmatic schema.',
    '[
        {"title": "Deep Screaming Frog Crawl & Status Code 4xx/3xx Remediation", "estimatedHours": 8, "priority": "High", "tags": ["SEO", "Technical"]},
        {"title": "Core Web Vitals LCP & CLS Asset Optimization", "estimatedHours": 12, "priority": "High", "tags": ["Engineering", "Speed"]},
        {"title": "Build Topical Cluster Pillar Strategy for 24 High-Volume Keywords", "estimatedHours": 14, "priority": "Medium", "tags": ["Content", "Keywords"]}
    ]'::jsonb,
    '["Site Architecture Audit", "Keyword Matrix Delivery", "Core Web Vitals Pass", "Authority Link Sprint"]'::jsonb
),
(
    '00000000-0000-0000-0000-000000000103',
    'High-Conversion Headless Shopify / Webflow Build',
    'Web Design & Full Build',
    45,
    2800000,
    'Component-driven frontend design with sub-second page loads and seamless checkout.',
    '[
        {"title": "Figma Design System & Mobile UX Breakpoints Sign-Off", "estimatedHours": 20, "priority": "Critical", "tags": ["UI/UX", "Design"]},
        {"title": "Headless Component Architecture & Cart Flyout Engineering", "estimatedHours": 28, "priority": "High", "tags": ["Development", "Frontend"]},
        {"title": "Checkout Optimization & Abandoned Cart Integration", "estimatedHours": 16, "priority": "High", "tags": ["CRO", "Checkout"]}
    ]'::jsonb,
    '["Figma Prototype Approved", "Frontend Architecture Built", "Payment Gateway QA", "Production Go-Live"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Departments
INSERT INTO public.departments (id, organization_id, name, code, description, monthly_budget_bdt)
VALUES
('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000001', 'Executive Leadership', 'DEPT-EXEC', 'Executive agency strategy and capital allocation', 800000),
('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000001', 'Performance Growth', 'DEPT-PERF', 'Meta, Google, and omnichannel ad operations', 1800000),
('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000001', 'SEO & Organic Growth', 'DEPT-SEO', 'Technical SEO, site speed, and content marketing', 900000),
('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000001', 'Design & Creative Studio', 'DEPT-CREATIVE', 'UGC ad video, motion graphics, and UI design', 1200000)
ON CONFLICT (id) DO NOTHING;
