import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileCheck2,
  FolderKanban,
  MessageSquare,
  Play,
  Plus,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAgency } from '../../context/AgencyContext';
import { TODAY_STR } from '../../data/seedData';
import {
  formatCurrency,
  PermissionService,
  ProjectHealthEngine,
  WorkloadEngine,
} from '../../services/agencyServices';
import { HorizontalDistributionBar, InteractiveAreaChart } from '../ui/Charts';
import {
  AvatarCircle,
  DueDateText,
  HealthIndicator,
  KpiCard,
  PageHeader,
  PriorityText,
  WorkloadBar,
} from '../ui/Primitives';

export const RoleOverviews: React.FC = () => {
  const {
    currentUser,
    snapshot,
    currency,
    navigateTo,
    openProjectDetail,
    openTaskDrawer,
    openEmployeeDetail,
    setQuickCreateOpen,
    setCopilotOpen,
    updateTaskStatus,
    decideApproval,
  } = useAgency();

  const [revisionModalApprovalId, setRevisionModalApprovalId] = useState<string | null>(null);
  const [revisionComment, setRevisionComment] = useState('');

  if (!currentUser) return null;

  // Shared derived metrics
  const visibleProjects = PermissionService.getVisibleProjects(currentUser, snapshot.projects);
  const activeProjects = visibleProjects.filter(
    (p) => p.status !== 'Completed' && p.status !== 'Cancelled'
  );
  const completedProjects = visibleProjects.filter((p) => p.status === 'Completed');

  const allHealths = visibleProjects.map((project) => ({
    project,
    health: ProjectHealthEngine.calculate(project, snapshot.tasks, snapshot.approvals),
  }));

  const atRiskOrCriticalProjects = allHealths.filter(
    (h) =>
      h.project.status !== 'Completed' &&
      (h.health.healthLabel === 'At Risk' || h.health.healthLabel === 'Critical')
  );

  const overdueTasksAll = snapshot.tasks.filter(
    (t) => t.status !== 'Completed' && t.due_date < TODAY_STR
  );

  const employees = snapshot.users.filter((u) => u.role === 'EMPLOYEE');
  const employeeWorkloads = employees.map((emp) =>
    WorkloadEngine.calculateForUser(emp, snapshot.tasks, snapshot.projects)
  );

  // ============================================================================
  // 1. FOUNDER EXECUTIVE COMMAND CENTER
  // ============================================================================
  if (currentUser.role === 'FOUNDER') {
    const paidAndSentRevenueBdt = snapshot.invoices
      .filter((i) => i.status === 'Paid' || i.status === 'Sent')
      .reduce((s, i) => s + i.amountBdt, 0);

    const openLeads = snapshot.leads.filter((l) => l.status !== 'Won' && l.status !== 'Lost');

    const revenueSeries = [
      { label: 'May', value: 2650000, secondaryValue: 1850000 },
      { label: 'Jun', value: 2980000, secondaryValue: 2010000 },
      { label: 'Jul', value: 3120000, secondaryValue: 2150000 },
      { label: 'Aug', value: 3490000, secondaryValue: 2290000 },
      { label: 'Sep', value: 3820000, secondaryValue: 2480000 },
      { label: 'Oct', value: paidAndSentRevenueBdt, secondaryValue: 2640000 },
    ];

    const statusSegments = [
      {
        label: 'Active Delivery',
        count: snapshot.projects.filter((p) => p.status === 'Active').length,
        colorClass: 'bg-indigo-500',
        dotColor: 'bg-indigo-500',
      },
      {
        label: 'Review & QA',
        count: snapshot.projects.filter((p) => p.status === 'Review').length,
        colorClass: 'bg-sky-500',
        dotColor: 'bg-sky-500',
      },
      {
        label: 'Client Approval',
        count: snapshot.projects.filter((p) => p.status === 'Client Approval').length,
        colorClass: 'bg-amber-500',
        dotColor: 'bg-amber-500',
      },
      {
        label: 'Planning',
        count: snapshot.projects.filter((p) => p.status === 'Planning').length,
        colorClass: 'bg-violet-500',
        dotColor: 'bg-violet-500',
      },
      {
        label: 'Completed',
        count: snapshot.projects.filter((p) => p.status === 'Completed').length,
        colorClass: 'bg-emerald-500',
        dotColor: 'bg-emerald-500',
      },
    ];

    return (
      <div className="space-y-8">
        <PageHeader
          title="Good morning. Here’s the state of your agency."
          subtitle="Executive command center across client retainers, delivery health, specialist capacity, and monthly financial velocity."
          actions={
            <>
              <button
                onClick={() => setCopilotOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Agency Copilot</span>
              </button>
              <button
                onClick={() => setQuickCreateOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Project</span>
              </button>
            </>
          }
        />

        {/* 8 Executive KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Total Projects"
            value={snapshot.projects.length}
            delta="+18.2%"
            deltaPositive
            subtext="Across 10 specialized departments"
            onClick={() => navigateTo('projects')}
          />
          <KpiCard
            label="Active Projects"
            value={activeProjects.length}
            delta="+12.5%"
            deltaPositive
            subtext={`${atRiskOrCriticalProjects.length} flagged for attention`}
            onClick={() => navigateTo('projects')}
          />
          <KpiCard
            label="Completed Projects"
            value={completedProjects.length}
            delta="98.4% SLA"
            deltaPositive
            subtext="Delivered on budget"
            onClick={() => navigateTo('projects')}
          />
          <KpiCard
            label="Monthly Revenue"
            value={formatCurrency(paidAndSentRevenueBdt, currency)}
            delta="+14.6%"
            deltaPositive
            subtext="vs previous month billing"
            onClick={() => navigateTo('finance')}
          />
          <KpiCard
            label="Total Clients"
            value={snapshot.clients.length}
            delta="+2 this Qtr"
            deltaPositive
            subtext="8 active retainers · 1 paused"
            onClick={() => navigateTo('clients')}
          />
          <KpiCard
            label="Active Leads"
            value={openLeads.length}
            delta={formatCurrency(
              openLeads.reduce((s, l) => s + l.potentialValueBdt, 0),
              currency
            )}
            deltaPositive
            subtext="Weighted pipeline opportunity"
            onClick={() => navigateTo('leads')}
          />
          <KpiCard
            label="Agency Team"
            value={snapshot.users.filter((u) => u.role !== 'CLIENT').length}
            delta="4 Managers"
            deltaPositive
            subtext={`${employees.length} execution specialists`}
            onClick={() => navigateTo('team')}
          />
          <KpiCard
            label="Overdue Tasks"
            value={overdueTasksAll.length}
            delta={overdueTasksAll.length > 0 ? 'Needs review' : 'On track'}
            deltaPositive={overdueTasksAll.length === 0}
            urgent={overdueTasksAll.length > 0}
            subtext="Click to inspect overdue items"
            onClick={() => navigateTo('tasks')}
          />
        </div>

        {/* Charts Row: Revenue Trend + Project Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Monthly Retainer Revenue vs Delivery Cost Trend
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  6-month trajectory across Paid Media, SEO, Web Dev, and Creative retainers
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                +14.6% MoM Growth
              </span>
            </div>
            <InteractiveAreaChart
              data={revenueSeries}
              primaryLabel="Gross Retainer Billing"
              secondaryLabel="Delivery Payroll & Ops"
              valuePrefix={currency === 'BDT' ? '৳' : '$'}
            />
          </div>

          <div className="lg:col-span-5 p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    Project Lifecycle Distribution
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Current breakdown across {snapshot.projects.length} workspaces
                  </p>
                </div>
                <button
                  onClick={() => navigateTo('projects')}
                  className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  View All
                </button>
              </div>
              <HorizontalDistributionBar segments={statusSegments} />
            </div>

            {/* Team Capacity Snapshot inside card */}
            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900 dark:text-white">
                  Specialist Capacity Watchlist
                </span>
                <button
                  onClick={() => navigateTo('team')}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Manage Workload
                </button>
              </div>
              <div className="space-y-2.5">
                {employeeWorkloads.slice(0, 3).map((w) => (
                  <div
                    key={w.user.id}
                    onClick={() => openEmployeeDetail(w.user.id)}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <AvatarCircle
                      initials={w.user.avatarInitials}
                      colorClass={w.user.avatarColor}
                      size="xs"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-indigo-500 truncate">
                          {w.user.name} ·{' '}
                          <span className="text-slate-400 font-normal">
                            {w.openTasksCount} tasks
                          </span>
                        </span>
                        <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
                          {w.utilizationPercent}%
                        </span>
                      </div>
                      <WorkloadBar
                        percent={w.utilizationPercent}
                        status={w.workloadStatus}
                        showLabel={false}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Project Health Engine Table */}
        <div className="rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Project Health & Delivery Telemetry
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Deterministically calculated from task completion, overdue blockers, and deadline proximity
              </p>
            </div>
            <button
              onClick={() => navigateTo('projects')}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <span>Open Full Project Board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/40">
                  <th className="py-3 px-5">Project & Client</th>
                  <th className="py-3 px-4">Manager & Dept</th>
                  <th className="py-3 px-4">Health Score</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-5 text-right">Budget</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 text-xs">
                {allHealths.slice(0, 7).map(({ project, health }) => {
                  const client = snapshot.clients.find((c) => c.id === project.client_id);
                  const manager = snapshot.users.find((u) => u.id === project.manager_id);
                  const dept = snapshot.departments.find((d) => d.id === project.department_id);

                  return (
                    <tr
                      key={project.id}
                      onClick={() => openProjectDetail(project.id)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {project.name}
                        </div>
                        <div className="mt-0.5 text-slate-500 flex items-center gap-1.5">
                          <span className="font-mono">{project.code}</span>
                          <span aria-hidden="true">·</span>
                          <span>{client?.company}</span>
                          <span aria-hidden="true">·</span>
                          <span>{project.status}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-slate-800 dark:text-slate-200 font-medium">
                          {manager?.name}
                        </div>
                        <div className="text-slate-500">{dept?.name}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <HealthIndicator
                          score={health.healthScore}
                          label={health.healthLabel}
                          reason={health.reason}
                        />
                        <div className="mt-0.5 text-[11px] text-slate-500 max-w-xs truncate">
                          {health.reason}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 w-36">
                        <div className="flex items-center justify-between font-mono tabular-nums mb-1">
                          <span>{health.progressPercent}%</span>
                          <span className="text-slate-400">
                            {health.completedTasks}/{health.totalTasks}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-indigo-500"
                            style={{ width: `${health.progressPercent}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <DueDateText
                          date={project.deadline}
                          completed={project.status === 'Completed'}
                        />
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono tabular-nums font-medium text-slate-900 dark:text-white whitespace-nowrap">
                        {formatCurrency(project.budgetBdt, currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Grid: Pending Approvals + Recent Audit Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Pending Approvals & Escalations
                </h3>
                <p className="text-xs text-slate-500">
                  Deliverables, budget requests, and client sign-offs
                </p>
              </div>
              <button
                onClick={() => navigateTo('approvals')}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Open Approval Center
              </button>
            </div>
            <div className="space-y-3">
              {snapshot.approvals
                .filter((a) => a.status === 'Pending')
                .slice(0, 4)
                .map((apr) => {
                  const reqUser = snapshot.users.find((u) => u.id === apr.requester_id);
                  return (
                    <div
                      key={apr.id}
                      className="p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {apr.title}
                        </div>
                        <div className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
                          <span>{apr.entityType}</span>
                          <span aria-hidden="true">·</span>
                          <span>Requested by {reqUser?.name}</span>
                          <span aria-hidden="true">·</span>
                          <PriorityText priority={apr.priority} />
                        </div>
                      </div>
                      <button
                        onClick={() => decideApproval(apr.id, 'Approved')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shrink-0"
                      >
                        Approve
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Live Organization Audit Stream
                </h3>
                <p className="text-xs text-slate-500">
                  Cross-role events recorded across projects, tasks, and clients
                </p>
              </div>
              <button
                onClick={() => navigateTo('activity')}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Full Audit Log
              </button>
            </div>
            <div className="space-y-3">
              {snapshot.activities.slice(0, 5).map((act) => {
                const actor = snapshot.users.find((u) => u.id === act.actor_id);
                return (
                  <div
                    key={act.id}
                    className="flex items-start gap-3 text-xs pb-3 border-b border-slate-100 dark:border-slate-800/60 last:border-none last:pb-0"
                  >
                    {actor && (
                      <AvatarCircle
                        initials={actor.avatarInitials}
                        colorClass={actor.avatarColor}
                        size="xs"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-800 dark:text-slate-200">
                        <span className="font-semibold">{actor?.name || 'System'}</span>{' '}
                        {act.action}{' '}
                        <span className="font-medium text-indigo-600 dark:text-indigo-400">
                          {act.targetName}
                        </span>
                      </div>
                      <div className="mt-0.5 text-slate-400 font-mono text-[11px]">
                        {act.created_at} {act.metadata ? `· ${act.metadata}` : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 2. MANAGER DELIVERY & TEAM WORKLOAD DASHBOARD
  // ============================================================================
  if (currentUser.role === 'MANAGER') {
    const myManagedProjects = snapshot.projects.filter(
      (p) => p.manager_id === currentUser.id || p.department_id === currentUser.department_id
    );
    const openTeamTasks = snapshot.tasks.filter((t) => t.status !== 'Completed');

    return (
      <div className="space-y-8">
        <PageHeader
          title="Good morning. Here’s what needs your attention."
          subtitle={`Delivery & capacity command for ${currentUser.name} (${currentUser.title}). Manage project velocity, balance specialist load, and clear QA bottlenecks.`}
          actions={
            <>
              <button
                onClick={() => navigateTo('team')}
                className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200"
              >
                Workload Matrix
              </button>
              <button
                onClick={() => setQuickCreateOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Assign Task / Project</span>
              </button>
            </>
          }
        />

        {/* 6 Manager KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <KpiCard
            label="Managed Projects"
            value={myManagedProjects.length}
            subtext={`${snapshot.projects.length} total agency-wide`}
            onClick={() => navigateTo('projects')}
          />
          <KpiCard
            label="Specialists"
            value={employees.length}
            subtext="Active execution team"
            onClick={() => navigateTo('team')}
          />
          <KpiCard
            label="Open Tasks"
            value={openTeamTasks.length}
            subtext="In active sprint queues"
            onClick={() => navigateTo('tasks')}
          />
          <KpiCard
            label="Overdue Tasks"
            value={overdueTasksAll.length}
            urgent={overdueTasksAll.length > 0}
            subtext="Needs immediate triage"
            onClick={() => navigateTo('tasks')}
          />
          <KpiCard
            label="Projects At Risk"
            value={atRiskOrCriticalProjects.length}
            urgent={atRiskOrCriticalProjects.length > 0}
            subtext="Blocker or SLA proximity"
            onClick={() => navigateTo('projects')}
          />
          <KpiCard
            label="Pending QA / Sign-Off"
            value={snapshot.approvals.filter((a) => a.status === 'Pending').length}
            subtext="Awaiting review"
            onClick={() => navigateTo('approvals')}
          />
        </div>

        {/* Dedicated Manager Deadline Risk View (Section 50) */}
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Deadline Risk & Escalation Radar
              </h2>
              <p className="text-xs text-slate-500">
                Active projects and sprint tasks grouped by delivery risk state
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">
              Safe · At Risk · Critical · Overdue
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Overdue Tasks Column */}
            <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/30 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-rose-600 dark:text-rose-400">
                <span>Overdue / Blocked Tasks</span>
                <span className="font-mono">{overdueTasksAll.length}</span>
              </div>
              <div className="space-y-2">
                {overdueTasksAll.map((t) => {
                  const owner = snapshot.users.find((u) => u.id === t.assigned_to);
                  return (
                    <div
                      key={t.id}
                      onClick={() => openTaskDrawer(t.id)}
                      className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-rose-500/50 text-xs space-y-1"
                    >
                      <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                        {t.title}
                      </div>
                      <div className="text-slate-500 flex items-center justify-between font-mono text-[11px]">
                        <span>{owner?.name.split(' ')[0]}</span>
                        <span className="text-rose-500">Due {t.due_date}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Critical Projects Column */}
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400">
                <span>Critical / At Risk Projects</span>
                <span className="font-mono">{atRiskOrCriticalProjects.length}</span>
              </div>
              <div className="space-y-2">
                {atRiskOrCriticalProjects.map(({ project, health }) => (
                  <div
                    key={project.id}
                    onClick={() => openProjectDetail(project.id)}
                    className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-amber-500/50 text-xs space-y-1"
                  >
                    <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                      {project.name}
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-2">{health.reason}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Due Today Tasks */}
            <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <span>Due Today (Oct 07)</span>
                <span className="font-mono">
                  {
                    snapshot.tasks.filter(
                      (t) => t.due_date === TODAY_STR && t.status !== 'Completed'
                    ).length
                  }
                </span>
              </div>
              <div className="space-y-2">
                {snapshot.tasks
                  .filter((t) => t.due_date === TODAY_STR && t.status !== 'Completed')
                  .map((t) => (
                    <div
                      key={t.id}
                      onClick={() => openTaskDrawer(t.id)}
                      className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer text-xs space-y-1"
                    >
                      <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                        {t.title}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {t.code} · {t.status}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Safe On-Track Projects */}
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span>Safe / On Schedule</span>
                <span className="font-mono">
                  {allHealths.filter((h) => h.health.healthLabel === 'Healthy').length}
                </span>
              </div>
              <div className="space-y-2">
                {allHealths
                  .filter((h) => h.health.healthLabel === 'Healthy')
                  .slice(0, 3)
                  .map(({ project, health }) => (
                    <div
                      key={project.id}
                      onClick={() => openProjectDetail(project.id)}
                      className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer text-xs space-y-1"
                    >
                      <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                        {project.name}
                      </div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                        {health.progressPercent}% complete · Due {project.deadline}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Team Workload & Client Communication */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Specialist Workload & Capacity Allocation
                </h3>
                <p className="text-xs text-slate-500">
                  Click any specialist to inspect assigned tasks or rebalance workload
                </p>
              </div>
              <button
                onClick={() => navigateTo('team')}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Full Team View
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {employeeWorkloads.slice(0, 6).map((w) => (
                <div
                  key={w.user.id}
                  onClick={() => openEmployeeDetail(w.user.id)}
                  className="p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40 cursor-pointer space-y-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <AvatarCircle
                      initials={w.user.avatarInitials}
                      colorClass={w.user.avatarColor}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {w.user.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {w.openTasksCount} active tasks · {w.estimatedActiveHours}h est.
                      </div>
                    </div>
                  </div>
                  <WorkloadBar
                    percent={w.utilizationPercent}
                    status={w.workloadStatus}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Recent Client & Team Threads
                </h3>
                <p className="text-xs text-slate-500">Latest messages requiring manager action</p>
              </div>
              <button
                onClick={() => navigateTo('messages')}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Open Inbox
              </button>
            </div>
            <div className="space-y-3">
              {snapshot.messages.slice(0, 4).map((msg) => {
                const sender = snapshot.users.find((u) => u.id === msg.sender_id);
                const prj = snapshot.projects.find((p) => p.id === msg.project_id);
                return (
                  <div
                    key={msg.id}
                    onClick={() => navigateTo('messages')}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 cursor-pointer space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {sender?.name}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {msg.visibility} · {msg.created_at}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 line-clamp-2">
                      {msg.content}
                    </p>
                    <div className="text-[11px] text-indigo-600 dark:text-indigo-400">
                      {prj?.code} · {prj?.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 3. EMPLOYEE EXECUTION WORKSPACE (Section 44)
  // ============================================================================
  if (currentUser.role === 'EMPLOYEE') {
    const myTasks = snapshot.tasks.filter((t) => t.assigned_to === currentUser.id);
    const myOpenTasks = myTasks.filter((t) => t.status !== 'Completed');
    const dueTodayTasks = myOpenTasks.filter((t) => t.due_date === TODAY_STR);
    const overdueMyTasks = myOpenTasks.filter((t) => t.due_date < TODAY_STR);
    const completedMyTasks = myTasks.filter((t) => t.status === 'Completed');
    const myTrackedHours = snapshot.timeEntries
      .filter((te) => te.user_id === currentUser.id)
      .reduce((s, te) => s + te.hours, 0);

    const nextPriorityTask =
      dueTodayTasks[0] || overdueMyTasks[0] || myOpenTasks[0] || myTasks[0];

    return (
      <div className="space-y-8">
        <PageHeader
          title="Here’s your work for today."
          subtitle={`Execution workspace for ${currentUser.name} (${currentUser.title}). Focus on today's deliverables, update task statuses, and track sprint hours.`}
          actions={
            <>
              <button
                onClick={() => navigateTo('time')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200"
              >
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>Log Hours ({myTrackedHours}h this wk)</span>
              </button>
              <button
                onClick={() => navigateTo('tasks')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                <span>Open Kanban Board</span>
              </button>
            </>
          }
        />

        {/* 6 Employee KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <KpiCard
            label="My Open Tasks"
            value={myOpenTasks.length}
            subtext="Assigned to you"
            onClick={() => navigateTo('tasks')}
          />
          <KpiCard
            label="Due Today"
            value={dueTodayTasks.length}
            urgent={dueTodayTasks.length > 0}
            subtext="Oct 07 target delivery"
            onClick={() => navigateTo('tasks')}
          />
          <KpiCard
            label="Overdue"
            value={overdueMyTasks.length}
            urgent={overdueMyTasks.length > 0}
            subtext="Requires status update"
            onClick={() => navigateTo('tasks')}
          />
          <KpiCard
            label="Active Projects"
            value={visibleProjects.length}
            subtext="Assigned project teams"
            onClick={() => navigateTo('projects')}
          />
          <KpiCard
            label="Completed Tasks"
            value={completedMyTasks.length}
            delta="100% QA pass"
            deltaPositive
            subtext="This sprint cycle"
            onClick={() => navigateTo('tasks')}
          />
          <KpiCard
            label="Tracked Hours"
            value={`${myTrackedHours}h`}
            subtext={`of ${currentUser.weeklyCapacityHours}h weekly target`}
            onClick={() => navigateTo('time')}
          />
        </div>

        {/* "What should I work on next?" Spotlight Card */}
        {nextPriorityTask && (
          <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-indigo-500/40 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <Play className="w-3.5 h-3.5" />
                <span>Recommended Next Focus · {nextPriorityTask.code}</span>
                <span aria-hidden="true">·</span>
                <PriorityText priority={nextPriorityTask.priority} />
                <span aria-hidden="true">·</span>
                <DueDateText
                  date={nextPriorityTask.due_date}
                  completed={nextPriorityTask.status === 'Completed'}
                />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                {nextPriorityTask.title}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {nextPriorityTask.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {nextPriorityTask.status !== 'In Progress' &&
                nextPriorityTask.status !== 'Completed' && (
                  <button
                    onClick={() => updateTaskStatus(nextPriorityTask.id, 'In Progress')}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                  >
                    Start Task (In Progress)
                  </button>
                )}
              {nextPriorityTask.status !== 'Completed' && (
                <button
                  onClick={() => updateTaskStatus(nextPriorityTask.id, 'Completed')}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  Mark Completed
                </button>
              )}
              <button
                onClick={() => openTaskDrawer(nextPriorityTask.id)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200"
              >
                Open Checklist & Details
              </button>
            </div>
          </div>
        )}

        {/* Employee Tasks Table + Assigned Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                My Assigned Tasks Queue ({myTasks.length})
              </h3>
              <button
                onClick={() => navigateTo('tasks')}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Open Kanban
              </button>
            </div>
            <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
              {myTasks.map((tsk) => {
                const prj = snapshot.projects.find((p) => p.id === tsk.project_id);
                return (
                  <div
                    key={tsk.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                  >
                    <div
                      onClick={() => openTaskDrawer(tsk.id)}
                      className="cursor-pointer min-w-0 flex-1"
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-indigo-600 dark:text-indigo-400 font-medium">
                          {tsk.code}
                        </span>
                        <span aria-hidden="true">·</span>
                        <PriorityText priority={tsk.priority} />
                        <span aria-hidden="true">·</span>
                        <DueDateText
                          date={tsk.due_date}
                          completed={tsk.status === 'Completed'}
                        />
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {tsk.title}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500 truncate">
                        {prj?.name}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={tsk.status}
                        onChange={(e) =>
                          updateTaskStatus(tsk.id, e.target.value as typeof tsk.status)
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200"
                      >
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Blocked">Blocked</option>
                        <option value="Review">Review</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              My Active Project Workspaces ({visibleProjects.length})
            </h3>
            <div className="space-y-3">
              {visibleProjects.map((prj) => {
                const health = ProjectHealthEngine.calculate(
                  prj,
                  snapshot.tasks,
                  snapshot.approvals
                );
                const mgr = snapshot.users.find((u) => u.id === prj.manager_id);
                return (
                  <div
                    key={prj.id}
                    onClick={() => openProjectDetail(prj.id)}
                    className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40 cursor-pointer space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                        {prj.code}
                      </span>
                      <span>Manager: {mgr?.name}</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {prj.name}
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span>Progress: {health.progressPercent}%</span>
                      <span>Due {prj.deadline}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500"
                        style={{ width: `${health.progressPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 4. CLIENT PORTAL HOME (Section 28 & 29 — Strict Permission Boundary)
  // ============================================================================
  const clientOrg = snapshot.clients.find((c) => c.id === currentUser.client_id);
  const clientApprovals = snapshot.approvals.filter(
    (a) => a.client_id === currentUser.client_id && a.visibility === 'Client-visible'
  );
  const pendingClientApprovals = clientApprovals.filter((a) => a.status === 'Pending');
  const clientFiles = snapshot.files.filter(
    (f) => f.client_id === currentUser.client_id && f.visibility === 'Client-visible'
  );
  const clientMessages = snapshot.messages.filter(
    (m) => m.client_id === currentUser.client_id && m.visibility === 'Client-visible'
  );

  const handleConfirmRevisionRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionModalApprovalId) return;
    decideApproval(
      revisionModalApprovalId,
      'Changes Requested',
      revisionComment.trim() || 'Requested copy/creative adjustments before final launch.'
    );
    setRevisionModalApprovalId(null);
    setRevisionComment('');
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Welcome back. Here’s your project progress."
        subtitle={`Dedicated Client Portal for ${clientOrg?.company || currentUser.name}. Review campaign milestones, approve deliverables, and access verified files.`}
        actions={
          <button
            onClick={() => navigateTo('messages')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Message Account Lead</span>
          </button>
        }
      />

      {/* Client Security & Permission Isolation Banner */}
      <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-4 text-xs text-emerald-700 dark:text-emerald-300">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>
            <strong>Client-Safe Workspace Active:</strong> Showing verified campaign progress,
            client-visible deliverables, and approved files for{' '}
            <strong>{clientOrg?.company}</strong>.
          </span>
        </div>
        <span className="font-mono hidden sm:inline">RBAC: CLIENT_SCOPE</span>
      </div>

      {/* Client Portal KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Active Campaigns"
          value={visibleProjects.length}
          subtext="Live with dedicated agency team"
          onClick={() => navigateTo('projects')}
        />
        <KpiCard
          label="Pending Your Approval"
          value={pendingClientApprovals.length}
          urgent={pendingClientApprovals.length > 0}
          subtext="Deliverables ready for sign-off"
          onClick={() => navigateTo('approvals')}
        />
        <KpiCard
          label="Approved Deliverables & Files"
          value={clientFiles.length}
          subtext="Available for instant download"
          onClick={() => navigateTo('files')}
        />
        <KpiCard
          label="Agency Thread Messages"
          value={clientMessages.length}
          subtext="Direct channel with Sarah Jenkins"
          onClick={() => navigateTo('messages')}
        />
      </div>

      {/* Pending Deliverable Approvals Section (Client Approval Workflow) */}
      <div className="p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Deliverables Ready for Your Sign-Off ({pendingClientApprovals.length})
            </h2>
            <p className="text-xs text-slate-500">
              Approve deliverables to move campaigns forward, or request specific revisions
            </p>
          </div>
          <button
            onClick={() => navigateTo('approvals')}
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            View All Approvals
          </button>
        </div>

        {pendingClientApprovals.length === 0 ? (
          <div className="p-6 rounded-lg bg-slate-50 dark:bg-slate-950 text-center text-xs text-slate-500">
            All submitted deliverables have been reviewed!
          </div>
        ) : (
          <div className="space-y-3">
            {pendingClientApprovals.map((apr) => {
              const prj = snapshot.projects.find((p) => p.id === apr.project_id);
              const requester = snapshot.users.find((u) => u.id === apr.requester_id);
              return (
                <div
                  key={apr.id}
                  className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        Awaiting Client Approval
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{prj?.name}</span>
                      <span aria-hidden="true">·</span>
                      <span>Submitted by {requester?.name}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {apr.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{apr.notes}</p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      onClick={() => decideApproval(apr.id, 'Approved')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Deliverable</span>
                    </button>
                    <button
                      onClick={() => setRevisionModalApprovalId(apr.id)}
                      className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200"
                    >
                      Request Changes
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Client Active Campaigns Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {visibleProjects.map((prj) => {
          const health = ProjectHealthEngine.calculate(
            prj,
            snapshot.tasks,
            snapshot.approvals
          );
          const mgr = snapshot.users.find((u) => u.id === prj.manager_id);
          const prjMilestones = snapshot.milestones.filter((m) => m.project_id === prj.id);

          return (
            <div
              key={prj.id}
              className="p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                    {prj.code} · {prj.projectType}
                  </span>
                  <span>Lead: {mgr?.name}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                  {prj.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {prj.description}
                </p>

                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                    <span>Overall Milestone Progress</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {health.progressPercent}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${health.progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Milestones list */}
                {prjMilestones.length > 0 && (
                  <div className="pt-3 space-y-1.5">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Campaign Milestones
                    </div>
                    {prjMilestones.map((ms) => (
                      <div
                        key={ms.id}
                        className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-none"
                      >
                        <span className="text-slate-700 dark:text-slate-300">{ms.title}</span>
                        <span className="font-mono text-[11px] text-slate-500">
                          {ms.status} · {ms.due_date}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-500">
                  Target Completion: {prj.deadline}
                </span>
                <button
                  onClick={() => openProjectDetail(prj.id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <span>Open Campaign Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Request Changes Modal */}
      {revisionModalApprovalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <form
            onSubmit={handleConfirmRevisionRequest}
            className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-4"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
              Request Deliverable Revisions
            </h3>
            <p className="text-xs text-slate-500">
              Specify the adjustments needed. Your feedback will immediately alert the assigned
              Account Manager and update the deliverable status.
            </p>
            <textarea
              rows={3}
              required
              value={revisionComment}
              onChange={(e) => setRevisionComment(e.target.value)}
              placeholder="e.g., Please update slide 4 headline copy and swap the hero product angle..."
              className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRevisionModalApprovalId(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
              >
                Submit Revision Request
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
