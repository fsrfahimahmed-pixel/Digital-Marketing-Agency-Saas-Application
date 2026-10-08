import { TODAY_STR } from '../data/seedData';
import { AgencyDatabaseSnapshot } from '../repositories/agencyRepository';
import {
  ApprovalItem,
  HealthLabel,
  Permission,
  Project,
  Role,
  Task,
  User,
  WorkloadStatus,
} from '../types/domain';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  FOUNDER: [
    'view_dashboard',
    'manage_projects',
    'create_project',
    'edit_project',
    'transfer_project',
    'assign_project',
    'manage_employees',
    'manage_managers',
    'manage_clients',
    'manage_departments',
    'manage_tasks',
    'assign_tasks',
    'edit_own_tasks',
    'view_analytics',
    'view_finance',
    'manage_settings',
    'view_audit_logs',
    'send_client_message',
    'approve_project',
    'approve_deliverable',
    'view_client_project',
    'upload_project_file',
  ],
  MANAGER: [
    'view_dashboard',
    'manage_projects',
    'create_project',
    'edit_project',
    'assign_project',
    'manage_employees',
    'manage_clients',
    'manage_tasks',
    'assign_tasks',
    'edit_own_tasks',
    'view_analytics',
    'send_client_message',
    'approve_deliverable',
    'view_client_project',
    'upload_project_file',
  ],
  EMPLOYEE: [
    'view_dashboard',
    'edit_own_tasks',
    'view_analytics',
    'upload_project_file',
  ],
  CLIENT: [
    'view_dashboard',
    'send_client_message',
    'approve_project',
    'approve_deliverable',
    'view_client_project',
  ],
};

export interface NavItemConfig {
  id: string;
  label: string;
  section: 'Operations' | 'Delivery' | 'Governance';
  badgeKey?: 'projects' | 'tasks' | 'approvals' | 'leads' | 'messages';
  requiredPermission?: Permission;
}

export const NAVIGATION_BY_ROLE: Record<Role, NavItemConfig[]> = {
  FOUNDER: [
    { id: 'overview', label: 'Executive Overview', section: 'Operations' },
    { id: 'projects', label: 'Projects', section: 'Operations', badgeKey: 'projects' },
    { id: 'leads', label: 'Leads & CRM', section: 'Operations', badgeKey: 'leads' },
    { id: 'clients', label: 'Clients', section: 'Operations' },
    { id: 'tasks', label: 'Tasks & Kanban', section: 'Delivery', badgeKey: 'tasks' },
    { id: 'team', label: 'Team & Workload', section: 'Delivery' },
    { id: 'departments', label: 'Departments', section: 'Delivery' },
    { id: 'calendar', label: 'Calendar', section: 'Delivery' },
    { id: 'messages', label: 'Messages', section: 'Delivery', badgeKey: 'messages' },
    { id: 'files', label: 'Files & Assets', section: 'Delivery' },
    { id: 'approvals', label: 'Approval Center', section: 'Governance', badgeKey: 'approvals' },
    { id: 'analytics', label: 'Analytics', section: 'Governance' },
    { id: 'reports', label: 'Reports', section: 'Governance' },
    { id: 'finance', label: 'Finance & Invoices', section: 'Governance' },
    { id: 'activity', label: 'Audit & Activity', section: 'Governance' },
    { id: 'settings', label: 'Settings & Automation', section: 'Governance' },
  ],
  MANAGER: [
    { id: 'overview', label: 'Delivery Overview', section: 'Operations' },
    { id: 'projects', label: 'My Projects', section: 'Operations', badgeKey: 'projects' },
    { id: 'tasks', label: 'Team Tasks', section: 'Operations', badgeKey: 'tasks' },
    { id: 'team', label: 'Team & Workload', section: 'Delivery' },
    { id: 'leads', label: 'Lead Pipeline', section: 'Delivery', badgeKey: 'leads' },
    { id: 'clients', label: 'Clients', section: 'Delivery' },
    { id: 'calendar', label: 'Deadlines & Calendar', section: 'Delivery' },
    { id: 'approvals', label: 'Approvals & QA', section: 'Governance', badgeKey: 'approvals' },
    { id: 'messages', label: 'Messages', section: 'Governance', badgeKey: 'messages' },
    { id: 'files', label: 'Project Files', section: 'Governance' },
    { id: 'analytics', label: 'Delivery Analytics', section: 'Governance' },
    { id: 'reports', label: 'Reports', section: 'Governance' },
  ],
  EMPLOYEE: [
    { id: 'overview', label: 'My Workspace', section: 'Operations' },
    { id: 'tasks', label: 'My Tasks', section: 'Operations', badgeKey: 'tasks' },
    { id: 'projects', label: 'Assigned Projects', section: 'Operations', badgeKey: 'projects' },
    { id: 'time', label: 'Time Tracking', section: 'Delivery' },
    { id: 'calendar', label: 'My Calendar', section: 'Delivery' },
    { id: 'files', label: 'Project Files', section: 'Delivery' },
    { id: 'messages', label: 'Team Messages', section: 'Delivery', badgeKey: 'messages' },
    { id: 'profile', label: 'My Profile', section: 'Governance' },
  ],
  CLIENT: [
    { id: 'overview', label: 'Client Portal Home', section: 'Operations' },
    { id: 'projects', label: 'Active Campaigns', section: 'Operations', badgeKey: 'projects' },
    { id: 'approvals', label: 'Pending Approvals', section: 'Operations', badgeKey: 'approvals' },
    { id: 'files', label: 'Approved Deliverables', section: 'Delivery' },
    { id: 'messages', label: 'Agency Messages', section: 'Delivery', badgeKey: 'messages' },
    { id: 'invoices', label: 'Billing & Invoices', section: 'Governance' },
    { id: 'profile', label: 'Account Profile', section: 'Governance' },
  ],
};

export const PermissionService = {
  hasPermission(role: Role, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
  },

  canAccessProject(user: User, project: Project): boolean {
    if (user.role === 'FOUNDER') return true;
    if (user.role === 'MANAGER') {
      return project.manager_id === user.id || project.department_id === user.department_id;
    }
    if (user.role === 'EMPLOYEE') {
      return project.employee_ids.includes(user.id);
    }
    if (user.role === 'CLIENT') {
      return project.client_id === user.client_id;
    }
    return false;
  },

  canManageProject(user: User, project: Project): boolean {
    if (user.role === 'FOUNDER') return true;
    if (user.role === 'MANAGER' && project.manager_id === user.id) return true;
    return false;
  },

  getVisibleProjects(user: User, projects: Project[]): Project[] {
    if (user.role === 'FOUNDER') return projects;
    if (user.role === 'MANAGER') {
      // Managers see all projects they manage or in their department, plus visibility across agency delivery
      return projects;
    }
    if (user.role === 'EMPLOYEE') {
      return projects.filter((p) => p.employee_ids.includes(user.id));
    }
    if (user.role === 'CLIENT') {
      return projects.filter((p) => p.client_id === user.client_id);
    }
    return [];
  },

  getVisibleTasks(user: User, tasks: Task[], projects: Project[]): Task[] {
    if (user.role === 'FOUNDER' || user.role === 'MANAGER') return tasks;
    if (user.role === 'EMPLOYEE') {
      const myProjectIds = new Set(projects.filter((p) => p.employee_ids.includes(user.id)).map((p) => p.id));
      return tasks.filter((t) => t.assigned_to === user.id || myProjectIds.has(t.project_id));
    }
    return []; // Clients never see internal agency task boards
  },
};

export interface ProjectHealthMetrics {
  progressPercent: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  blockedTasks: number;
  pendingApprovals: number;
  daysUntilDeadline: number;
  healthScore: number;
  healthLabel: HealthLabel;
  reason: string;
}

export const ProjectHealthEngine = {
  calculate(
    project: Project,
    allTasks: Task[],
    allApprovals: ApprovalItem[]
  ): ProjectHealthMetrics {
    const projectTasks = allTasks.filter((t) => t.project_id === project.id);
    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter((t) => t.status === 'Completed').length;
    const inProgressTasks = projectTasks.filter((t) => t.status === 'In Progress' || t.status === 'Review').length;

    let progressPercent = 0;
    if (typeof project.customProgressPercent === 'number') {
      progressPercent = Math.max(0, Math.min(100, Math.round(project.customProgressPercent)));
    } else if (project.status === 'Completed') {
      progressPercent = 100;
    } else if (totalTasks > 0) {
      progressPercent = Math.round(((completedTasks + inProgressTasks * 0.45) / totalTasks) * 100);
      progressPercent = Math.min(98, Math.max(8, progressPercent));
    } else {
      progressPercent = project.status === 'Planning' ? 15 : 50;
    }

    const overdueTasks = projectTasks.filter(
      (t) => t.status !== 'Completed' && t.due_date < TODAY_STR
    ).length;

    const blockedTasks = projectTasks.filter((t) => t.status === 'Blocked').length;

    const pendingApprovals = allApprovals.filter(
      (a) => a.project_id === project.id && a.status === 'Pending'
    ).length;

    const todayMs = new Date(TODAY_STR).getTime();
    const deadlineMs = new Date(project.deadline).getTime();
    const daysUntilDeadline = Math.ceil((deadlineMs - todayMs) / (1000 * 60 * 60 * 24));

    let healthScore = 94;
    healthScore -= overdueTasks * 16;
    healthScore -= blockedTasks * 18;
    if (daysUntilDeadline <= 3 && project.status !== 'Completed') {
      healthScore -= 14;
    } else if (daysUntilDeadline <= 7 && progressPercent < 60 && project.status !== 'Completed') {
      healthScore -= 10;
    }
    if (project.spentBdt > project.budgetBdt * 0.92 && progressPercent < 80) {
      healthScore -= 8;
    }

    if (project.status === 'Completed') {
      healthScore = 98;
    }

    healthScore = Math.max(24, Math.min(99, healthScore));

    let healthLabel: HealthLabel = 'Healthy';
    if (healthScore < 65 || (blockedTasks > 0 && daysUntilDeadline <= 4)) {
      healthLabel = 'Critical';
    } else if (healthScore < 82 || overdueTasks > 0 || blockedTasks > 0) {
      healthLabel = 'At Risk';
    }

    let reason = 'All milestones and task velocity are tracking on schedule.';
    if (project.status === 'Completed') {
      reason = 'Delivered and signed off within target budget.';
    } else if (blockedTasks > 0 && overdueTasks > 0) {
      reason = `${blockedTasks} blocked task and ${overdueTasks} overdue item require immediate escalation.`;
    } else if (blockedTasks > 0) {
      reason = `${blockedTasks} blocked task is holding up downstream campaign launch.`;
    } else if (overdueTasks > 0) {
      reason = `${overdueTasks} overdue task (${daysUntilDeadline}d remaining until project deadline).`;
    } else if (pendingApprovals > 0 && daysUntilDeadline <= 7) {
      reason = `${pendingApprovals} deliverable approval awaiting sign-off before ${project.deadline}.`;
    }

    return {
      progressPercent,
      totalTasks,
      completedTasks,
      overdueTasks,
      blockedTasks,
      pendingApprovals,
      daysUntilDeadline,
      healthScore,
      healthLabel,
      reason,
    };
  },
};

export interface EmployeeWorkloadMetrics {
  user: User;
  openTasksCount: number;
  completedTasksCount: number;
  overdueTasksCount: number;
  activeProjectsCount: number;
  estimatedActiveHours: number;
  capacityHours: number;
  utilizationPercent: number;
  workloadStatus: WorkloadStatus;
}

export const WorkloadEngine = {
  calculateForUser(
    user: User,
    allTasks: Task[],
    allProjects: Project[]
  ): EmployeeWorkloadMetrics {
    const userTasks = allTasks.filter((t) => t.assigned_to === user.id);
    const openTasks = userTasks.filter((t) => t.status !== 'Completed');
    const completedTasksCount = userTasks.filter((t) => t.status === 'Completed').length;
    const overdueTasksCount = openTasks.filter((t) => t.due_date < TODAY_STR).length;
    const activeProjectsCount = allProjects.filter(
      (p) => p.employee_ids.includes(user.id) && p.status !== 'Completed'
    ).length;

    const estimatedActiveHours = openTasks.reduce(
      (sum, t) => sum + Math.max(2, t.estimatedHours - t.actualHours * 0.4),
      0
    );
    const capacityHours = user.weeklyCapacityHours || 40;
    // Scale to weekly load so demo numbers reflect realistic agency utilization
    const utilizationPercent = Math.round((estimatedActiveHours / (capacityHours * 0.65)) * 100);

    let workloadStatus: WorkloadStatus = 'Balanced';
    if (utilizationPercent > 100) {
      workloadStatus = 'Overloaded';
    } else if (utilizationPercent >= 82) {
      workloadStatus = 'Busy';
    } else if (utilizationPercent < 50) {
      workloadStatus = 'Underutilized';
    }

    return {
      user,
      openTasksCount: openTasks.length,
      completedTasksCount,
      overdueTasksCount,
      activeProjectsCount,
      estimatedActiveHours: Math.round(estimatedActiveHours * 10) / 10,
      capacityHours,
      utilizationPercent,
      workloadStatus,
    };
  },
};

export interface CopilotInsight {
  id: string;
  severity: 'critical' | 'warning' | 'info' | 'positive';
  title: string;
  detail: string;
  actionLabel: string;
  targetNav: string;
  targetProjectId?: string;
}

export const AiAssistantService = {
  getInsights(user: User, snapshot: AgencyDatabaseSnapshot): CopilotInsight[] {
    const insights: CopilotInsight[] = [];

    if (user.role === 'CLIENT') {
      const myApprovals = snapshot.approvals.filter(
        (a) => a.client_id === user.client_id && a.status === 'Pending' && a.visibility === 'Client-visible'
      );
      if (myApprovals.length > 0) {
        insights.push({
          id: 'cop_cli_1',
          severity: 'warning',
          title: `${myApprovals.length} deliverables awaiting your sign-off`,
          detail: `Approving "${myApprovals[0].title}" unlocks the next scheduled launch milestone.`,
          actionLabel: 'Review Approvals',
          targetNav: 'approvals',
        });
      }
      insights.push({
        id: 'cop_cli_2',
        severity: 'positive',
        title: 'Campaign velocity is tracking ahead of Q4 benchmark',
        detail: 'All active milestones for your organization have real-time telemetry enabled.',
        actionLabel: 'View Campaigns',
        targetNav: 'projects',
      });
      return insights;
    }

    // Internal roles
    const projectHealths = snapshot.projects
      .filter((p) => p.status !== 'Completed')
      .map((p) => ({
        project: p,
        health: ProjectHealthEngine.calculate(p, snapshot.tasks, snapshot.approvals),
      }));

    const atRiskProjects = projectHealths.filter(
      (ph) => ph.health.healthLabel === 'Critical' || ph.health.healthLabel === 'At Risk'
    );

    if (atRiskProjects.length > 0) {
      insights.push({
        id: 'cop_1',
        severity: 'critical',
        title: `${atRiskProjects.length} projects have active deadline or blocker risk`,
        detail: `${atRiskProjects[0].project.name} (${atRiskProjects[0].health.healthScore}/100 health): ${atRiskProjects[0].health.reason}`,
        actionLabel: 'Inspect Project',
        targetNav: 'projects',
        targetProjectId: atRiskProjects[0].project.id,
      });
    }

    const employees = snapshot.users.filter((u) => u.role === 'EMPLOYEE');
    const workloads = employees.map((e) =>
      WorkloadEngine.calculateForUser(e, snapshot.tasks, snapshot.projects)
    );
    const overloaded = workloads.filter((w) => w.utilizationPercent > 100);

    if (overloaded.length > 0 && (user.role === 'FOUNDER' || user.role === 'MANAGER')) {
      insights.push({
        id: 'cop_2',
        severity: 'warning',
        title: `${overloaded.length} specialist above weekly workload capacity`,
        detail: `${overloaded[0].user.name} is at ${overloaded[0].utilizationPercent}% estimated load (${overloaded[0].openTasksCount} active tasks). Consider balancing tasks.`,
        actionLabel: 'Open Workload View',
        targetNav: 'team',
      });
    }

    const pendingApprovals = snapshot.approvals.filter((a) => a.status === 'Pending');
    if (pendingApprovals.length > 0) {
      insights.push({
        id: 'cop_3',
        severity: 'info',
        title: `${pendingApprovals.length} deliverables & budgets pending sign-off`,
        detail: 'Clearing internal and client review queues will accelerate Q4 campaign launches.',
        actionLabel: 'Open Approval Center',
        targetNav: 'approvals',
      });
    }

    const overdueTasks = snapshot.tasks.filter(
      (t) => t.status !== 'Completed' && t.due_date < TODAY_STR
    );
    if (overdueTasks.length > 0) {
      insights.push({
        id: 'cop_4',
        severity: 'warning',
        title: `${overdueTasks.length} overdue tasks across active sprints`,
        detail: `Includes high-priority items on FinEdge and Nova Healthcare accounts.`,
        actionLabel: 'Review Tasks',
        targetNav: 'tasks',
      });
    }

    return insights;
  },
};

export function formatCurrency(amountBdt: number, currency: 'BDT' | 'USD' = 'BDT'): string {
  if (currency === 'USD') {
    const usd = Math.round(amountBdt / 120);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(usd);
  }
  return `৳${new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(amountBdt)}`;
}
