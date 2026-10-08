import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Layers,
  Lock,
  RefreshCw,
  Shield,
  Workflow,
} from 'lucide-react';
import { useAgency } from '../../context/AgencyContext';
import {
  formatCurrency,
  ProjectHealthEngine,
  ROLE_PERMISSIONS,
  WorkloadEngine,
} from '../../services/agencyServices';
import { HorizontalDistributionBar, InteractiveAreaChart } from '../ui/Charts';
import {
  AvatarCircle,
  KpiCard,
  PageHeader,
} from '../ui/Primitives';
import { InvoiceStatus, Role } from '../../types/domain';

// ============================================================================
// 1. ANALYTICS VIEW (Section 35)
// ============================================================================
export const AnalyticsView: React.FC = () => {
  const { snapshot, currency } = useAgency();

  const taskVelocityData = [
    { label: 'Wk 1', value: 18, secondaryValue: 15 },
    { label: 'Wk 2', value: 24, secondaryValue: 20 },
    { label: 'Wk 3', value: 29, secondaryValue: 25 },
    { label: 'Wk 4', value: 34, secondaryValue: 28 },
    { label: 'Wk 5', value: 38, secondaryValue: 33 },
    { label: 'Wk 6', value: 44, secondaryValue: 39 },
  ];

  const leadSourceSegments = [
    { label: 'Inbound SEO', count: 4, colorClass: 'bg-indigo-500', dotColor: 'bg-indigo-500' },
    { label: 'Referral', count: 3, colorClass: 'bg-emerald-500', dotColor: 'bg-emerald-500' },
    { label: 'LinkedIn ABM', count: 3, colorClass: 'bg-sky-500', dotColor: 'bg-sky-500' },
    { label: 'Meta Ads', count: 2, colorClass: 'bg-violet-500', dotColor: 'bg-violet-500' },
    { label: 'Partner', count: 2, colorClass: 'bg-amber-500', dotColor: 'bg-amber-500' },
  ];

  const completedTasksCount = snapshot.tasks.filter((t) => t.status === 'Completed').length;
  const completionRate = Math.round(
    (completedTasksCount / Math.max(1, snapshot.tasks.length)) * 100
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agency Performance & Delivery Analytics"
        subtitle="Decision-grade telemetry across department profitability, sprint task velocity, lead conversion, and project health."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Blended Agency Margin"
          value="38.4%"
          delta="+3.2% vs Q3"
          deltaPositive
          subtext="Net of specialist delivery hours"
        />
        <KpiCard
          label="Sprint Task Completion Rate"
          value={`${completionRate}%`}
          delta="+8.5% velocity"
          deltaPositive
          subtext={`${completedTasksCount} of ${snapshot.tasks.length} tasks completed`}
        />
        <KpiCard
          label="Client Net Retention (NRR)"
          value="114.2%"
          delta="+6.0% YoY"
          deltaPositive
          subtext="Driven by Q4 paid media upsells"
        />
        <KpiCard
          label="Average Project Health"
          value="88/100"
          delta="Healthy"
          deltaPositive
          subtext="Across active client campaigns"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Weekly Sprint Task Velocity (Completed vs Assigned)
          </h2>
          <InteractiveAreaChart
            data={taskVelocityData}
            primaryLabel="Tasks Completed"
            secondaryLabel="Tasks Scoped"
            valuePrefix=""
            valueSuffix=" tasks"
          />
        </div>

        <div className="lg:col-span-5 p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            CRM Pipeline Attribution by Channel
          </h2>
          <HorizontalDistributionBar segments={leadSourceSegments} />
        </div>
      </div>

      {/* Department Performance Table */}
      <div className="rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 overflow-x-auto">
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Department Delivery & Budget Efficiency Matrix
          </h2>
        </div>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 bg-slate-50/50 dark:bg-slate-950/40">
              <th className="py-3 px-5">Department</th>
              <th className="py-3 px-4">Lead Manager</th>
              <th className="py-3 px-4">Active Projects</th>
              <th className="py-3 px-4">Open Tasks</th>
              <th className="py-3 px-5 text-right">Monthly Budget</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
            {snapshot.departments.map((dept) => {
              const mgr = snapshot.users.find((u) => u.id === dept.manager_id);
              const prjs = snapshot.projects.filter((p) => p.department_id === dept.id);
              const tsks = snapshot.tasks.filter(
                (t) => t.department_id === dept.id && t.status !== 'Completed'
              );
              return (
                <tr key={dept.id}>
                  <td className="py-3.5 px-5 font-semibold text-slate-900 dark:text-white">
                    {dept.name} <span className="font-mono text-slate-400">({dept.code})</span>
                  </td>
                  <td className="py-3.5 px-4">{mgr?.name}</td>
                  <td className="py-3.5 px-4 font-mono">{prjs.length}</td>
                  <td className="py-3.5 px-4 font-mono">{tsks.length}</td>
                  <td className="py-3.5 px-5 text-right font-mono font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(dept.monthlyBudgetBdt, currency)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================================================
// 2. REPORTS MODULE VIEW (Section 36)
// ============================================================================
export const ReportsView: React.FC = () => {
  const { snapshot, currency, addToast } = useAgency();

  const [reportType, setReportType] = useState<
    | 'Monthly Agency Report'
    | 'Project Report'
    | 'Client Report'
    | 'Team Workload Report'
    | 'Department Report'
  >('Monthly Agency Report');
  const [dateRange, setDateRange] = useState('October 2026 (Q4 Sprint 1)');
  const [selectedProjectId, setSelectedProjectId] = useState(
    snapshot.projects[0]?.id || 'prj_001'
  );

  const selectedProject = snapshot.projects.find((p) => p.id === selectedProjectId);
  const projectHealth = selectedProject
    ? ProjectHealthEngine.calculate(selectedProject, snapshot.tasks, snapshot.approvals)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive & Client Report Builder"
        subtitle="Generate structured agency reports across projects, clients, departments, and specialist teams."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                addToast('PDF Export Generated', `${reportType} (${dateRange}) exported as PDF.`)
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={() =>
                addToast('CSV Export Generated', `${reportType} raw dataset exported as CSV.`)
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CSV / Excel</span>
            </button>
          </div>
        }
      />

      {/* Report Configuration Controls */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Report Template</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as typeof reportType)}
            className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-medium"
          >
            <option value="Monthly Agency Report">Monthly Agency Executive Report</option>
            <option value="Project Report">Project Delivery & SLA Report</option>
            <option value="Client Report">Client QBR Performance Summary</option>
            <option value="Team Workload Report">Team Capacity & Utilization Report</option>
            <option value="Department Report">Department Profitability Report</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Reporting Window</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-medium"
          >
            <option value="October 2026 (Q4 Sprint 1)">October 2026 (Q4 Sprint 1)</option>
            <option value="Q3 2026 Full Quarter">Q3 2026 Full Quarter</option>
            <option value="Year-to-Date 2026">Year-to-Date 2026</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Focus Workspace</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-medium"
          >
            {snapshot.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} · {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Live Report Document Preview */}
      <div className="p-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
              AGENCYOS VERIFIED REPORT PREVIEW · {dateRange}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display mt-1">
              {reportType}
            </h2>
          </div>
          <div className="text-right text-xs font-mono text-slate-500">
            <div>Generated: 2026-10-07</div>
            <div>Currency: {currency}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
            <div className="text-xs text-slate-500">Active Projects</div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              {snapshot.projects.length}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
            <div className="text-xs text-slate-500">Selected Project Health</div>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {projectHealth?.healthScore || 92}%
            </div>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
            <div className="text-xs text-slate-500">Focus Budget</div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              {formatCurrency(selectedProject?.budgetBdt || 1850000, currency)}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
            <div className="text-xs text-slate-500">Deliverables Signed Off</div>
            <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
              {snapshot.deliverables.length}
            </div>
          </div>
        </div>

        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="font-semibold text-slate-900 dark:text-white text-sm">
            Executive Narrative Summary — {selectedProject?.name}
          </div>
          <p>
            {selectedProject?.description} Current delivery progress stands at{' '}
            <strong>{projectHealth?.progressPercent}%</strong> ({projectHealth?.completedTasks}{' '}
            of {projectHealth?.totalTasks} tasks completed). Diagnostic status:{' '}
            <strong>{projectHealth?.reason}</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. FINANCE & INVOICES VIEW (Section 37)
// ============================================================================
export const FinanceAndInvoicesView: React.FC = () => {
  const {
    currentUser,
    snapshot,
    currency,
    toggleCurrency,
    updateInvoiceStatus,
  } = useAgency();

  if (!currentUser) return null;
  const isClient = currentUser.role === 'CLIENT';

  const visibleInvoices = snapshot.invoices.filter((inv) =>
    isClient ? inv.client_id === currentUser.client_id : true
  );

  const paidBdt = visibleInvoices
    .filter((i) => i.status === 'Paid')
    .reduce((s, i) => s + i.amountBdt, 0);
  const pendingBdt = visibleInvoices
    .filter((i) => i.status === 'Sent' || i.status === 'Draft')
    .reduce((s, i) => s + i.amountBdt, 0);
  const overdueBdt = visibleInvoices
    .filter((i) => i.status === 'Overdue')
    .reduce((s, i) => s + i.amountBdt, 0);
  const totalBdt = paidBdt + pendingBdt + overdueBdt;

  return (
    <div className="space-y-6">
      <PageHeader
        title={isClient ? 'Client Billing & Invoice Ledger' : 'Agency Finance & Retainer Ledger'}
        subtitle="Track monthly retainer billing, collected revenue, outstanding invoices, and currency conversion."
        actions={
          <button
            onClick={toggleCurrency}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono font-semibold text-slate-800 dark:text-slate-200"
          >
            Display Currency: {currency} (Click to switch BDT/USD)
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Invoiced Volume"
          value={formatCurrency(totalBdt, currency)}
          subtext="Current billing cycle"
        />
        <KpiCard
          label="Collected / Paid"
          value={formatCurrency(paidBdt, currency)}
          delta="Cleared"
          deltaPositive
          subtext="Settled via bank wire"
        />
        <KpiCard
          label="Pending Collection (Sent)"
          value={formatCurrency(pendingBdt, currency)}
          subtext="Within Net-15 terms"
        />
        <KpiCard
          label="Overdue Receivables"
          value={formatCurrency(overdueBdt, currency)}
          urgent={overdueBdt > 0}
          subtext="Requires finance follow-up"
        />
      </div>

      <div className="rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 bg-slate-50/50 dark:bg-slate-950/40">
              <th className="py-3 px-5">Invoice ID</th>
              <th className="py-3 px-4">Client & Project</th>
              <th className="py-3 px-4">Line Summary</th>
              <th className="py-3 px-4">Issue / Due Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
            {visibleInvoices.map((inv) => {
              const cli = snapshot.clients.find((c) => c.id === inv.client_id);
              const prj = snapshot.projects.find((p) => p.id === inv.project_id);
              return (
                <tr key={inv.id}>
                  <td className="py-3.5 px-5 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                    {inv.code}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {cli?.company}
                    </div>
                    <div className="text-slate-500 truncate max-w-xs">{prj?.name}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                    {inv.itemsSummary}
                  </td>
                  <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                    {inv.issue_date} → {inv.due_date}
                  </td>
                  <td className="py-3.5 px-4">
                    {!isClient ? (
                      <select
                        value={inv.status}
                        onChange={(e) =>
                          updateInvoiceStatus(inv.id, e.target.value as InvoiceStatus)
                        }
                        className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                      >
                        <option value="Draft">Draft</option>
                        <option value="Sent">Sent</option>
                        <option value="Paid">Paid</option>
                        <option value="Overdue">Overdue</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    ) : (
                      <span className="font-mono font-semibold">{inv.status}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    {formatCurrency(inv.amountBdt, currency)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================================================
// 4. ACTIVITY & AUDIT LOG VIEW (Section 39)
// ============================================================================
export const ActivityAuditView: React.FC = () => {
  const { currentUser, snapshot } = useAgency();
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  if (!currentUser) return null;
  const isClient = currentUser.role === 'CLIENT';

  const activities = snapshot.activities.filter((act) => {
    if (isClient && act.visibility !== 'Client-safe') return false;
    if (typeFilter !== 'ALL' && act.targetType !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Activity & Immutable Audit Log"
        subtitle="Complete chronological trail of project transfers, task state mutations, client approvals, and file uploads."
      />

      <div className="flex items-center gap-1.5 overflow-x-auto">
        {(['ALL', 'Project', 'Task', 'Approval', 'Client', 'Lead', 'File', 'Team'] as const).map(
          (t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                typeFilter === t
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {t === 'ALL' ? 'All Events' : t}
            </button>
          )
        )}
      </div>

      <div className="rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 divide-y divide-slate-200/60 dark:divide-slate-800/60">
        {activities.map((act) => {
          const actor = snapshot.users.find((u) => u.id === act.actor_id);
          return (
            <div
              key={act.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-3">
                {actor && (
                  <AvatarCircle
                    initials={actor.avatarInitials}
                    colorClass={actor.avatarColor}
                    size="sm"
                  />
                )}
                <div>
                  <div className="text-slate-900 dark:text-white">
                    <strong>{actor?.name || 'System'}</strong> ({actor?.role}) {act.action}{' '}
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {act.targetName}
                    </span>
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    Entity: {act.targetType} · Visibility: {act.visibility}{' '}
                    {act.metadata ? `· ${act.metadata}` : ''}
                  </div>
                </div>
              </div>
              <span className="font-mono text-slate-400 shrink-0">{act.created_at}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// 5. SETTINGS, AUTOMATION CENTER, INTEGRATIONS & PROFILE (Sections 51, 52, 83, 105)
// ============================================================================
export const SettingsAndProfileView: React.FC<{ initialTab?: 'profile' | 'rbac' | 'templates' | 'automation' | 'integrations' }> = ({
  initialTab = 'profile',
}) => {
  const {
    currentUser,
    snapshot,
    currency,
    resetDemoEnvironment,
    addToast,
  } = useAgency();

  const [tab, setTab] = useState<'profile' | 'rbac' | 'templates' | 'automation' | 'integrations'>(
    initialTab
  );

  if (!currentUser) return null;

  const isFounder = currentUser.role === 'FOUNDER';
  const myWorkload =
    currentUser.role === 'EMPLOYEE'
      ? WorkloadEngine.calculateForUser(currentUser, snapshot.tasks, snapshot.projects)
      : null;

  const integrationsList = [
    { name: 'Supabase PostgreSQL & Auth', category: 'Database & Auth Adapter', state: 'Architecture Ready (Phase 2/3)' },
    { name: 'n8n Workflow Engine', category: 'Webhook & Event Bus Automation', state: 'Event Contracts Ready' },
    { name: 'Google Workspace (Gmail, Drive, Calendar)', category: 'Productivity & SSO', state: 'Integration Ready' },
    { name: 'Slack Agency Channels', category: 'Real-Time Team Alerts', state: 'Integration Ready' },
    { name: 'WhatsApp Business API', category: 'Client Deliverable Notifications', state: 'Coming Soon' },
    { name: 'Gemini / OpenAI Copilot Adapter', category: 'AiAssistantService Backend', state: 'Interface Ready' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={isFounder ? 'Organization Settings, RBAC & Automation' : 'Account Profile & Workspace Preferences'}
        subtitle="Manage user profile, role permission matrix, project templates, event-driven automations, and future integrations."
        actions={
          <button
            onClick={resetDemoEnvironment}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Seed Demo Data</span>
          </button>
        }
      />

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setTab('profile')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${
            tab === 'profile'
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          Profile & Organization
        </button>
        {isFounder && (
          <>
            <button
              onClick={() => setTab('rbac')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${
                tab === 'rbac'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Roles & Permissions (RBAC)
            </button>
            <button
              onClick={() => setTab('templates')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${
                tab === 'templates'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Project Blueprints ({snapshot.templates.length})
            </button>
            <button
              onClick={() => setTab('automation')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${
                tab === 'automation'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Automation Center
            </button>
            <button
              onClick={() => setTab('integrations')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${
                tab === 'integrations'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Integrations
            </button>
          </>
        )}
      </div>

      {/* 1. PROFILE TAB */}
      {tab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-5">
            <div className="flex items-center gap-4">
              <AvatarCircle
                initials={currentUser.avatarInitials}
                colorClass={currentUser.avatarColor}
                size="lg"
              />
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                  {currentUser.name}
                </h2>
                <p className="text-xs text-slate-500">
                  {currentUser.title} · Role: <strong>{currentUser.role}</strong>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-slate-500 block">Primary Email</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">
                  {currentUser.email}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Phone</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">
                  {currentUser.phone}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Timezone</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {currentUser.timezone}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Availability Status</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {currentUser.availability}
                </span>
              </div>
            </div>

            {myWorkload && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <div className="font-semibold text-slate-900 dark:text-white">
                  Personal Capacity Telemetry
                </div>
                <div className="text-slate-500">
                  Utilization: {myWorkload.utilizationPercent}% ({myWorkload.workloadStatus}) ·{' '}
                  {myWorkload.openTasksCount} open tasks ({myWorkload.estimatedActiveHours}h est.)
                </div>
              </div>
            )}

            <button
              onClick={() => addToast('Preferences Saved', 'Profile & notification settings updated.')}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              Save Profile Preferences
            </button>
          </div>

          <div className="lg:col-span-5 p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-4 text-xs">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Environment & Architecture Configuration
            </h3>
            <div className="space-y-2.5 font-mono">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">APP_ENV</span>
                <span className="text-indigo-500">demo_phase_1</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">AUTH_PROVIDER</span>
                <span>MockAuthService (Session Ready)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">DATABASE_PROVIDER</span>
                <span>MockAgencyRepository</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">AUTOMATION_PROVIDER</span>
                <span>InternalEventBus (n8n Ready)</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">AI_PROVIDER</span>
                <span>Deterministic Copilot</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ROLES & PERMISSIONS MATRIX */}
      {tab === 'rbac' && (
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-500" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Centralized Role & Permission Governance Matrix
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(['FOUNDER', 'MANAGER', 'EMPLOYEE', 'CLIENT'] as Role[]).map((r) => (
              <div
                key={r}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5"
              >
                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {r} ROLE ({ROLE_PERMISSIONS[r].length} permissions)
                </div>
                <ul className="space-y-1.5 text-xs font-mono text-slate-600 dark:text-slate-400">
                  {ROLE_PERMISSIONS[r].map((perm) => (
                    <li key={perm} className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{perm}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. PROJECT TEMPLATES */}
      {tab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {snapshot.templates.map((tpl) => (
            <div
              key={tpl.id}
              className="p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {tpl.projectType}
                </span>
                <span className="font-mono text-slate-500">
                  {tpl.estimatedDurationDays} days ·{' '}
                  {formatCurrency(tpl.defaultBudgetBdt, currency)}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {tpl.name}
              </h3>
              <p className="text-xs text-slate-500">{tpl.description}</p>
              <div className="pt-2 space-y-1">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Seeded Tasks ({tpl.defaultTasks.length}):
                </div>
                {tpl.defaultTasks.map((dt, i) => (
                  <div key={i} className="text-xs text-slate-500 font-mono">
                    · {dt.title} ({dt.estimatedHours}h)
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. AUTOMATION CENTER (Section 52) */}
      {tab === 'automation' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-xs text-slate-700 dark:text-slate-300">
            <strong>Future-Ready Event Architecture:</strong> Every mutation inside AgencyOS
            emits typed domain events (<code>PROJECT_CREATED</code>,{' '}
            <code>PROJECT_ASSIGNED</code>, <code>TASK_COMPLETED</code>,{' '}
            <code>CLIENT_APPROVAL_REQUIRED</code>). Phase 7 connects these triggers directly to
            n8n, email, and WhatsApp webhooks.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {snapshot.automations.map((aut) => (
              <div
                key={aut.id}
                className="p-5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                    TRIGGER: {aut.trigger}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {aut.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {aut.name}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {aut.actionSummary}
                </p>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-mono text-slate-500">
                  <span>Channel: {aut.targetChannel}</span>
                  <span>
                    {aut.executionsCount} runs · Last: {aut.lastRun}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. EXTERNAL INTEGRATIONS (Section 105) */}
      {tab === 'integrations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrationsList.map((item) => (
            <div
              key={item.name}
              className="p-5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  {item.category}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {item.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Service boundary and repository adapter configured for seamless future
                  activation.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="font-mono text-slate-500">{item.state}</span>
                <span className="inline-flex items-center gap-1 text-slate-400">
                  <Lock className="w-3.5 h-3.5" /> Not Connected
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
