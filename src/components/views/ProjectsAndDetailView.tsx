import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRightLeft,
  Calendar as CalendarIcon,
  CheckCircle2,
  FileText,
  FolderKanban,
  LayoutGrid,
  List,
  MessageSquare,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import { useAgency } from '../../context/AgencyContext';
import {
  formatCurrency,
  PermissionService,
  ProjectHealthEngine,
} from '../../services/agencyServices';
import {
  AvatarCircle,
  ConfirmModal,
  DueDateText,
  EmptyState,
  HealthIndicator,
  PageHeader,
  PriorityText,
} from '../ui/Primitives';
import { FileCategory, ProjectStatus } from '../../types/domain';

const KANBAN_COLUMNS: ProjectStatus[] = [
  'Planning',
  'Active',
  'Review',
  'Client Approval',
  'Completed',
];

type ProjectTab =
  | 'Overview'
  | 'Tasks'
  | 'Milestones'
  | 'Timeline'
  | 'Deliverables'
  | 'Approvals'
  | 'Files'
  | 'Messages'
  | 'Team'
  | 'Activity';

export const ProjectsAndDetailView: React.FC = () => {
  const {
    currentUser,
    snapshot,
    currency,
    selectedProjectId,
    openProjectDetail,
    closeProjectDetail,
    openTaskDrawer,
    setQuickCreateOpen,
    updateProjectStatus,
    updateProjectProgress,
    resetProjectProgress,
    transferProject,
    updateProjectTeam,
    deleteProject,
    decideApproval,
    sendMessage,
    uploadFile,
    toggleFileVisibility,
  } = useAgency();

  // Directory filters
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'kanban' | 'calendar'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [managerFilter, setManagerFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);

  // Detail state
  const [activeTab, setActiveTab] = useState<ProjectTab>('Overview');
  const [isTransferModalOpen, setTransferModalOpen] = useState(false);
  const [transferManagerId, setTransferManagerId] = useState('usr_mgr_02');
  const [transferDeptId, setTransferDeptId] = useState('dept_002');
  const [transferReason, setTransferReason] = useState('Workload balancing & phase handoff');
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Detail quick message / file upload
  const [msgInput, setMsgInput] = useState('');
  const [msgVisibility, setMsgVisibility] = useState<'Client-visible' | 'Internal'>('Client-visible');
  const [newFileName, setNewFileName] = useState('');
  const [newFileCategory, setNewFileCategory] = useState<FileCategory>('Deliverables');

  if (!currentUser) return null;

  const isClient = currentUser.role === 'CLIENT';
  const isFounder = currentUser.role === 'FOUNDER';
  const canManageProjects = isFounder || currentUser.role === 'MANAGER';

  const visibleProjects = useMemo(
    () => PermissionService.getVisibleProjects(currentUser, snapshot.projects),
    [currentUser, snapshot.projects]
  );

  // ==========================================================================
  // PROJECT DETAIL WORKSPACE (Section 18, 19, 20)
  // ==========================================================================
  if (selectedProjectId) {
    const project = visibleProjects.find((p) => p.id === selectedProjectId);
    if (!project) {
      return (
        <EmptyState
          title="Workspace Not Found or Restricted"
          description="The requested project workspace could not be found or is outside your role permissions."
          actionLabel="Back to Projects"
          onAction={closeProjectDetail}
        />
      );
    }

    const health = ProjectHealthEngine.calculate(project, snapshot.tasks, snapshot.approvals);
    const client = snapshot.clients.find((c) => c.id === project.client_id);
    const manager = snapshot.users.find((u) => u.id === project.manager_id);
    const department = snapshot.departments.find((d) => d.id === project.department_id);
    const projectTasks = snapshot.tasks.filter((t) => t.project_id === project.id);
    const projectMilestones = snapshot.milestones.filter((m) => m.project_id === project.id);
    const projectDeliverables = snapshot.deliverables.filter((d) => d.project_id === project.id);
    const projectApprovals = snapshot.approvals.filter(
      (a) =>
        a.project_id === project.id &&
        (!isClient || a.visibility === 'Client-visible')
    );
    const projectFiles = snapshot.files.filter(
      (f) =>
        f.project_id === project.id &&
        (!isClient || f.visibility === 'Client-visible')
    );
    const projectMessages = snapshot.messages.filter(
      (m) =>
        m.project_id === project.id &&
        (!isClient || m.visibility === 'Client-visible')
    );
    const projectActivities = snapshot.activities.filter(
      (act) =>
        act.project_id === project.id &&
        (!isClient || act.visibility === 'Client-safe')
    );

    const availableTabs: ProjectTab[] = isClient
      ? ['Overview', 'Milestones', 'Deliverables', 'Approvals', 'Files', 'Messages']
      : [
          'Overview',
          'Tasks',
          'Milestones',
          'Timeline',
          'Deliverables',
          'Approvals',
          'Files',
          'Messages',
          'Team',
          'Activity',
        ];

    const handleConfirmTransfer = (e: React.FormEvent) => {
      e.preventDefault();
      transferProject(project.id, transferManagerId, transferDeptId, transferReason);
      setTransferModalOpen(false);
    };

    const handleToggleSpecialistOnProject = (empId: string) => {
      const nextIds = project.employee_ids.includes(empId)
        ? project.employee_ids.filter((id) => id !== empId)
        : [...project.employee_ids, empId];
      updateProjectTeam(project.id, nextIds);
    };

    return (
      <div className="space-y-6">
        {/* Back Breadcrumb & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={closeProjectDetail}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Projects Directory</span>
          </button>

          <div className="flex items-center gap-2">
            {canManageProjects && (
              <select
                value={project.status}
                onChange={(e) =>
                  updateProjectStatus(project.id, e.target.value as ProjectStatus)
                }
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white"
              >
                <option value="Planning">Planning</option>
                <option value="Active">Active</option>
                <option value="Review">Review</option>
                <option value="Client Approval">Client Approval</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            )}

            {isFounder && (
              <button
                onClick={() => {
                  setTransferManagerId(project.manager_id);
                  setTransferDeptId(project.department_id);
                  setTransferModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Transfer Ownership</span>
              </button>
            )}

            {isFounder && (
              <button
                onClick={() => setDeleteConfirmOpen(true)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-rose-500 hover:bg-rose-500/10"
                title="Delete project"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Project Workspace Header Card */}
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                  {project.code}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {client?.company}
                </span>
                <span aria-hidden="true">·</span>
                <span>{department?.name}</span>
                <span aria-hidden="true">·</span>
                <PriorityText priority={project.priority} />
                <span aria-hidden="true">·</span>
                <span>Status: {project.status}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display">
                {project.name}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {project.description}
              </p>
            </div>

            <div className="flex flex-col sm:items-end gap-2 shrink-0">
              <HealthIndicator
                score={health.healthScore}
                label={health.healthLabel}
                reason={health.reason}
              />
              <DueDateText
                date={project.deadline}
                completed={project.status === 'Completed'}
              />
              {!isClient && (
                <div className="text-xs font-mono text-slate-500">
                  Budget: {formatCurrency(project.spentBdt, currency)} /{' '}
                  {formatCurrency(project.budgetBdt, currency)}
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar & Mouse Controls */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/70 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 dark:text-slate-400 font-sans font-medium">
                  Overall Delivery Progress ({health.completedTasks}/{health.totalTasks} tasks)
                </span>
                {typeof project.customProgressPercent === 'number' ? (
                  <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium">
                    Manual Override
                  </span>
                ) : (
                  <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-500 font-medium">
                    Automated
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                  {health.progressPercent}%
                </span>
                {!isClient && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Decrease 5% with mouse"
                      onClick={() =>
                        updateProjectProgress(
                          project.id,
                          Math.max(0, health.progressPercent - 5)
                        )
                      }
                      className="w-5 h-5 rounded flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold leading-none select-none cursor-pointer"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      title="Increase 5% with mouse"
                      onClick={() =>
                        updateProjectProgress(
                          project.id,
                          Math.min(100, health.progressPercent + 5)
                        )
                      }
                      className="w-5 h-5 rounded flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold leading-none select-none cursor-pointer"
                    >
                      +
                    </button>
                    {typeof project.customProgressPercent === 'number' && (
                      <button
                        type="button"
                        title="Reset to automated task calculation"
                        onClick={() => resetProjectProgress(project.id)}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline ml-1 cursor-pointer"
                      >
                        Reset Auto
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-2.5 flex-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    health.progressPercent === 100
                      ? 'bg-emerald-500'
                      : health.progressPercent >= 75
                      ? 'bg-indigo-600'
                      : health.progressPercent >= 35
                      ? 'bg-blue-600'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${health.progressPercent}%` }}
                />
              </div>
              {!isClient && (
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={health.progressPercent}
                  onChange={(e) =>
                    updateProjectProgress(project.id, Number(e.target.value))
                  }
                  title="Drag mouse slider to manually set project completion percentage"
                  aria-label="Adjust completion percentage"
                  className="w-28 sm:w-36 h-2 rounded-lg appearance-none cursor-grab active:cursor-grabbing bg-slate-200 dark:bg-slate-800 accent-indigo-600 focus:outline-none"
                />
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center gap-1 overflow-x-auto">
            {availableTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
              <div className="p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Key Campaign Objectives & Deliverables
                </h2>
                <ul className="space-y-2.5">
                  {project.objectives.map((obj, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Transfer History Log */}
              {!isClient && project.transferHistory.length > 0 && (
                <div className="p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Ownership Transfer History
                  </h3>
                  {project.transferHistory.map((trf) => {
                    const fromMgr = snapshot.users.find((u) => u.id === trf.from_manager_id);
                    const toMgr = snapshot.users.find((u) => u.id === trf.to_manager_id);
                    return (
                      <div
                        key={trf.id}
                        className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 text-xs space-y-1"
                      >
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {fromMgr?.name} → {toMgr?.name}
                        </div>
                        <div className="text-slate-600 dark:text-slate-400">
                          Reason: {trf.reason}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400">
                          Transferred on {trf.created_at}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Project Governance & Roster
                </h2>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Client Account</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {client?.company} ({client?.name})
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Delivery Manager</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {manager?.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Department</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {department?.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Timeline</span>
                    <span className="font-mono text-slate-900 dark:text-white">
                      {project.start_date} → {project.deadline}
                    </span>
                  </div>
                  <div className="pt-1">
                    <div className="text-slate-500 mb-2">
                      Assigned Specialists ({project.employee_ids.length})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.employee_ids.map((empId) => {
                        const emp = snapshot.users.find((u) => u.id === empId);
                        if (!emp) return null;
                        return (
                          <div
                            key={emp.id}
                            className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs"
                          >
                            <AvatarCircle
                              initials={emp.avatarInitials}
                              colorClass={emp.avatarColor}
                              size="xs"
                            />
                            <span className="font-medium text-slate-900 dark:text-white">
                              {emp.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TASKS */}
        {activeTab === 'Tasks' && !isClient && (
          <div className="rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Project Tasks ({projectTasks.length})
              </h2>
              <button
                onClick={() => setQuickCreateOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>
            <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
              {projectTasks.map((tsk) => {
                const assignee = snapshot.users.find((u) => u.id === tsk.assigned_to);
                return (
                  <div
                    key={tsk.id}
                    onClick={() => openTaskDrawer(tsk.id)}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                          {tsk.code}
                        </span>
                        <span aria-hidden="true">·</span>
                        <PriorityText priority={tsk.priority} />
                        <span aria-hidden="true">·</span>
                        <span>{tsk.status}</span>
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                        {tsk.title}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 text-xs">
                      <span className="text-slate-500">{assignee?.name}</span>
                      <DueDateText
                        date={tsk.due_date}
                        completed={tsk.status === 'Completed'}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3 & 4: MILESTONES & TIMELINE */}
        {(activeTab === 'Milestones' || activeTab === 'Timeline') && (
          <div className="p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Project Milestones & Delivery Timeline
            </h2>
            <div className="space-y-4">
              {projectMilestones.map((ms, idx) => (
                <div
                  key={ms.id}
                  className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                        ms.status === 'Completed'
                          ? 'bg-emerald-600 text-white'
                          : ms.status === 'Current'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {ms.title}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        Target Date: {ms.due_date} · Weight: {ms.weight}%
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {ms.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5 & 6: DELIVERABLES & APPROVALS */}
        {(activeTab === 'Deliverables' || activeTab === 'Approvals') && (
          <div className="space-y-4">
            <div className="p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Campaign Deliverables & Approval Queue
              </h2>
              {projectDeliverables.length === 0 && projectApprovals.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No deliverables registered for this project yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {projectApprovals.map((apr) => (
                    <div
                      key={apr.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="text-xs text-slate-500">
                          {apr.entityType} · Status:{' '}
                          <strong className="text-slate-900 dark:text-white">
                            {apr.status}
                          </strong>
                        </div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">
                          {apr.title}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {apr.notes}
                        </p>
                      </div>
                      {apr.status === 'Pending' && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => decideApproval(apr.id, 'Approved')}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              decideApproval(
                                apr.id,
                                'Changes Requested',
                                'Revisions requested from project workspace.'
                              )
                            }
                            className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium"
                          >
                            Request Changes
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: FILES */}
        {activeTab === 'Files' && (
          <div className="p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Project Files & Deliverables ({projectFiles.length})
                </h2>
                <p className="text-xs text-slate-500">
                  {isClient
                    ? 'Client-approved assets and reports'
                    : 'Manage internal vs client-visible project files'}
                </p>
              </div>
              {!isClient && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newFileName.trim()) return;
                    uploadFile(
                      project.id,
                      newFileName.trim(),
                      newFileCategory,
                      'Client-visible'
                    );
                    setNewFileName('');
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="Filename (e.g., Q4_Audit_Deck.pdf)"
                    className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs"
                  />
                  <select
                    value={newFileCategory}
                    onChange={(e) => setNewFileCategory(e.target.value as FileCategory)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs"
                  >
                    <option value="Deliverables">Deliverables</option>
                    <option value="Briefs">Briefs</option>
                    <option value="Designs">Designs</option>
                    <option value="Reports">Reports</option>
                  </select>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                  </button>
                </form>
              )}
            </div>

            <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
              {projectFiles.map((f) => (
                <div
                  key={f.id}
                  className="py-3 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-white truncate">
                        {f.name}
                      </div>
                      <div className="text-slate-500 font-mono text-[11px]">
                        {f.category} · {f.sizeLabel} · {f.created_at}
                      </div>
                    </div>
                  </div>
                  {!isClient && (
                    <button
                      onClick={() => toggleFileVisibility(f.id)}
                      className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 text-xs font-mono"
                    >
                      {f.visibility}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: MESSAGES */}
        {activeTab === 'Messages' && (
          <div className="p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Project Communication Thread
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {projectMessages.map((msg) => {
                const sender = snapshot.users.find((u) => u.id === msg.sender_id);
                return (
                  <div
                    key={msg.id}
                    className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                      msg.visibility === 'Internal'
                        ? 'bg-amber-500/5 border-amber-500/30'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {sender?.name} ({sender?.role})
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {msg.visibility} · {msg.created_at}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                );
              })}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!msgInput.trim()) return;
                sendMessage(
                  project.id,
                  msgInput,
                  isClient ? 'Client-visible' : msgVisibility
                );
                setMsgInput('');
              }}
              className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-200 dark:border-slate-800"
            >
              {!isClient && (
                <select
                  value={msgVisibility}
                  onChange={(e) =>
                    setMsgVisibility(e.target.value as 'Client-visible' | 'Internal')
                  }
                  className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs"
                >
                  <option value="Client-visible">Client-Visible Thread</option>
                  <option value="Internal">Internal Agency Note Only</option>
                </select>
              )}
              <input
                type="text"
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                placeholder="Write a project message..."
                className="flex-1 px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Send Message
              </button>
            </form>
          </div>
        )}

        {/* TAB 9: PROJECT TEAM */}
        {activeTab === 'Team' && !isClient && (
          <div className="p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Project Roster & Specialist Assignment
                </h2>
                <p className="text-xs text-slate-500">
                  Managers and Founders can toggle specialists assigned to this workspace
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {snapshot.users
                .filter((u) => u.role === 'EMPLOYEE')
                .map((emp) => {
                  const assigned = project.employee_ids.includes(emp.id);
                  return (
                    <div
                      key={emp.id}
                      className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                        assigned
                          ? 'border-indigo-500 bg-indigo-500/5'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <AvatarCircle
                          initials={emp.avatarInitials}
                          colorClass={emp.avatarColor}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {emp.name}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {emp.title}
                          </div>
                        </div>
                      </div>
                      {canManageProjects && (
                        <button
                          onClick={() => handleToggleSpecialistOnProject(emp.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                            assigned
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {assigned ? 'Assigned' : '+ Assign'}
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* TAB 10: ACTIVITY */}
        {activeTab === 'Activity' && (
          <div className="p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Project Audit & Activity Timeline
            </h2>
            <div className="space-y-3">
              {projectActivities.map((act) => {
                const actor = snapshot.users.find((u) => u.id === act.actor_id);
                return (
                  <div
                    key={act.id}
                    className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-100 dark:border-slate-800/60 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {actor?.name}
                      </span>{' '}
                      <span className="text-slate-600 dark:text-slate-300">
                        {act.action}
                      </span>{' '}
                      <span className="font-medium text-indigo-600 dark:text-indigo-400">
                        {act.targetName}
                      </span>
                      {act.metadata && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {act.metadata}
                        </div>
                      )}
                    </div>
                    <span className="font-mono text-[11px] text-slate-400 shrink-0">
                      {act.created_at}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ownership Transfer Modal (Section 20) */}
        {isTransferModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
            <form
              onSubmit={handleConfirmTransfer}
              className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-4"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                Transfer Project Ownership
              </h3>
              <p className="text-xs text-slate-500">
                Current Owner: <strong>{manager?.name}</strong> ({department?.name}). This
                action records an immutable audit log entry and notifies the incoming manager.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  New Delivery Manager
                </label>
                <select
                  value={transferManagerId}
                  onChange={(e) => setTransferManagerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs"
                >
                  {snapshot.users
                    .filter((u) => u.role === 'MANAGER')
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} — {m.title}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Target Department
                </label>
                <select
                  value={transferDeptId}
                  onChange={(e) => setTransferDeptId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs"
                >
                  {snapshot.departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Transfer Reason *
                </label>
                <input
                  type="text"
                  required
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        )}

        <ConfirmModal
          open={isDeleteConfirmOpen}
          title="Archive & Delete Project Workspace?"
          description={`Are you sure you want to delete "${project.name}"? Associated tasks will also be removed from active sprint boards.`}
          confirmLabel="Delete Project"
          danger
          onCancel={() => setDeleteConfirmOpen(false)}
          onConfirm={() => {
            setDeleteConfirmOpen(false);
            deleteProject(project.id);
          }}
        />
      </div>
    );
  }

  // ==========================================================================
  // PROJECTS DIRECTORY VIEW (List / Grid / Kanban / Calendar)
  // ==========================================================================
  const filteredProjects = visibleProjects.filter((p) => {
    const q = searchQuery.trim().toLowerCase();
    const client = snapshot.clients.find((c) => c.id === p.client_id);
    if (
      q &&
      !p.name.toLowerCase().includes(q) &&
      !p.code.toLowerCase().includes(q) &&
      !(client?.company.toLowerCase().includes(q) ?? false)
    ) {
      return false;
    }
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (deptFilter !== 'ALL' && p.department_id !== deptFilter) return false;
    if (managerFilter !== 'ALL' && p.manager_id !== managerFilter) return false;
    if (priorityFilter !== 'ALL' && p.priority !== priorityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={isClient ? 'Active Campaigns & Projects' : 'Projects & Delivery Workspaces'}
        subtitle={
          isClient
            ? 'Real-time milestone progress, deliverables, and campaign timelines for your organization.'
            : 'Filter across departments, managers, health scores, and move projects across delivery stages.'
        }
        actions={
          <div className="flex items-center gap-2">
            {/* Segmented View Switcher */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1 ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1 ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>
              {!isClient && (
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1 ${
                    viewMode === 'kanban'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  <FolderKanban className="w-3.5 h-3.5" />
                  <span>Kanban</span>
                </button>
              )}
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1 ${
                  viewMode === 'calendar'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Timeline</span>
              </button>
            </div>

            {canManageProjects && (
              <button
                onClick={() => setQuickCreateOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Project</span>
              </button>
            )}
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by name, code, client..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200"
        >
          <option value="ALL">All Statuses</option>
          <option value="Planning">Planning</option>
          <option value="Active">Active</option>
          <option value="Review">Review</option>
          <option value="Client Approval">Client Approval</option>
          <option value="Completed">Completed</option>
        </select>

        {!isClient && (
          <>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">All Departments</option>
              {snapshot.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={managerFilter}
              onChange={(e) => setManagerFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">All Managers</option>
              {snapshot.users
                .filter((u) => u.role === 'MANAGER')
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </>
        )}
      </div>

      {filteredProjects.length === 0 ? (
        <EmptyState
          title="No matching projects found"
          description="Adjust your search or status filters, or initialize a new project from an agency template."
          actionLabel={canManageProjects ? 'Create New Project' : undefined}
          onAction={canManageProjects ? () => setQuickCreateOpen(true) : undefined}
        />
      ) : viewMode === 'list' ? (
        <div className="rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800/80 text-[11px] font-semibold text-slate-500 bg-slate-50/50 dark:bg-slate-950/40">
                <th className="py-3 px-5">Project</th>
                <th className="py-3 px-4">Client & Department</th>
                <th className="py-3 px-4">Manager</th>
                <th className="py-3 px-4">Progress</th>
                {!isClient && <th className="py-3 px-4">Health</th>}
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-5">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 text-xs">
              {filteredProjects.map((prj) => {
                const health = ProjectHealthEngine.calculate(
                  prj,
                  snapshot.tasks,
                  snapshot.approvals
                );
                const client = snapshot.clients.find((c) => c.id === prj.client_id);
                const manager = snapshot.users.find((u) => u.id === prj.manager_id);
                const dept = snapshot.departments.find((d) => d.id === prj.department_id);

                return (
                  <tr
                    key={prj.id}
                    onClick={() => openProjectDetail(prj.id)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {prj.name}
                      </div>
                      <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                        {prj.code} · {prj.status} · {health.totalTasks} tasks
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {client?.company}
                      </div>
                      <div className="text-slate-500">{dept?.name}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {manager && (
                          <AvatarCircle
                            initials={manager.avatarInitials}
                            colorClass={manager.avatarColor}
                            size="xs"
                          />
                        )}
                        <span className="text-slate-800 dark:text-slate-200">
                          {manager?.name}
                        </span>
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
                          className="h-full bg-indigo-500"
                          style={{ width: `${health.progressPercent}%` }}
                        />
                      </div>
                    </td>
                    {!isClient && (
                      <td className="py-3.5 px-4">
                        <HealthIndicator
                          score={health.healthScore}
                          label={health.healthLabel}
                          reason={health.reason}
                        />
                      </td>
                    )}
                    <td className="py-3.5 px-4">
                      <PriorityText priority={prj.priority} />
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <DueDateText
                        date={prj.deadline}
                        completed={prj.status === 'Completed'}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((prj) => {
            const health = ProjectHealthEngine.calculate(
              prj,
              snapshot.tasks,
              snapshot.approvals
            );
            const client = snapshot.clients.find((c) => c.id === prj.client_id);
            const manager = snapshot.users.find((u) => u.id === prj.manager_id);

            return (
              <div
                key={prj.id}
                onClick={() => openProjectDetail(prj.id)}
                className="p-5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/50 cursor-pointer flex flex-col justify-between gap-4 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      {prj.code} · {client?.company}
                    </span>
                    <PriorityText priority={prj.priority} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {prj.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{prj.description}</p>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono mb-1">
                      <span>{prj.status}</span>
                      <span>{health.progressPercent}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500"
                        style={{ width: `${health.progressPercent}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{manager?.name}</span>
                    {!isClient ? (
                      <HealthIndicator
                        score={health.healthScore}
                        label={health.healthLabel}
                        compact
                      />
                    ) : (
                      <DueDateText date={prj.deadline} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'kanban' ? (
        /* PROJECT KANBAN BOARD WITH DRAG-AND-DROP (Section 95) */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-2">
          {KANBAN_COLUMNS.map((colStatus) => {
            const colProjects = filteredProjects.filter((p) => p.status === colStatus);
            return (
              <div
                key={colStatus}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedProjectId && canManageProjects) {
                    updateProjectStatus(draggedProjectId, colStatus);
                    setDraggedProjectId(null);
                  }
                }}
                className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex flex-col gap-3 min-h-[420px]"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 px-1">
                  <span>{colStatus}</span>
                  <span className="font-mono text-slate-400">{colProjects.length}</span>
                </div>

                <div className="space-y-2.5 flex-1">
                  {colProjects.map((prj) => {
                    const health = ProjectHealthEngine.calculate(
                      prj,
                      snapshot.tasks,
                      snapshot.approvals
                    );
                    const client = snapshot.clients.find((c) => c.id === prj.client_id);
                    return (
                      <div
                        key={prj.id}
                        draggable={canManageProjects}
                        onDragStart={() => setDraggedProjectId(prj.id)}
                        onClick={() => openProjectDetail(prj.id)}
                        className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 cursor-pointer space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                            {prj.code}
                          </span>
                          <PriorityText priority={prj.priority} />
                        </div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white leading-snug">
                          {prj.name}
                        </div>
                        <div className="text-[11px] text-slate-500">{client?.company}</div>
                        <div className="h-1 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-indigo-500"
                            style={{ width: `${health.progressPercent}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <HealthIndicator
                            score={health.healthScore}
                            label={health.healthLabel}
                            compact
                          />
                          <span className="font-mono text-slate-400">{prj.deadline}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TIMELINE / CALENDAR SCHEDULE VIEW */
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Chronological Campaign Delivery Schedule
          </h3>
          <div className="space-y-3">
            {[...filteredProjects]
              .sort((a, b) => a.deadline.localeCompare(b.deadline))
              .map((prj) => {
                const health = ProjectHealthEngine.calculate(
                  prj,
                  snapshot.tasks,
                  snapshot.approvals
                );
                return (
                  <div
                    key={prj.id}
                    onClick={() => openProjectDetail(prj.id)}
                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {prj.name}
                      </div>
                      <div className="text-slate-500 font-mono mt-0.5">
                        Window: {prj.start_date} → {prj.deadline} ({prj.status})
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono">{health.progressPercent}%</span>
                      <DueDateText
                        date={prj.deadline}
                        completed={prj.status === 'Completed'}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
