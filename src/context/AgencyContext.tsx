import React, { createContext, useContext, useEffect, useState } from 'react';
import { TODAY_STR } from '../data/seedData';
import { AgencyDatabaseSnapshot, agencyRepository } from '../repositories/agencyRepository';
import { PermissionService } from '../services/agencyServices';
import {
  AgencyFile,
  CalendarEvent,
  Client,
  Department,
  FileCategory,
  InvoiceStatus,
  Lead,
  LeadStatus,
  Permission,
  Priority,
  Project,
  ProjectStatus,
  Role,
  Task,
  TaskStatus,
  User,
} from '../types/domain';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

export type PublicScreen = 'home' | 'login';

interface CreateProjectInput {
  name: string;
  code?: string;
  client_id: string;
  department_id: string;
  manager_id: string;
  employee_ids: string[];
  priority: Priority;
  projectType: string;
  budgetBdt: number;
  start_date: string;
  deadline: string;
  description: string;
  objectives: string[];
  template_id?: string;
}

interface CreateTaskInput {
  title: string;
  description: string;
  project_id: string;
  assigned_to: string;
  priority: Priority;
  due_date: string;
  estimatedHours: number;
  tags: string[];
}

interface CreateLeadInput {
  name: string;
  company: string;
  email: string;
  phone: string;
  source: Lead['source'];
  service: string;
  potentialValueBdt: number;
  assigned_manager_id: string;
  notes: string;
}

interface CreateClientInput {
  name: string;
  company: string;
  email: string;
  phone: string;
  industry: string;
  manager_id: string;
  totalValueBdt: number;
  website: string;
  notes: string;
}

interface AgencyContextValue {
  // Auth & Session
  currentUser: User | null;
  publicScreen: PublicScreen;
  setPublicScreen: (screen: PublicScreen) => void;
  loginWithCredentials: (email: string, password: string) => { ok: boolean; error?: string };
  quickSwitchRole: (role: Role) => void;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;

  // Navigation & Active Workspace
  activeNav: string;
  selectedProjectId: string | null;
  selectedTaskId: string | null;
  selectedClientId: string | null;
  selectedEmployeeId: string | null;
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  isCopilotOpen: boolean;
  setCopilotOpen: (open: boolean) => void;
  isQuickCreateOpen: boolean;
  setQuickCreateOpen: (open: boolean) => void;
  navigateTo: (navId: string) => void;
  openProjectDetail: (projectId: string) => void;
  closeProjectDetail: () => void;
  openTaskDrawer: (taskId: string | null) => void;
  openClientDetail: (clientId: string | null) => void;
  openEmployeeDetail: (employeeId: string | null) => void;

  // Theme & Preferences
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  currency: 'BDT' | 'USD';
  toggleCurrency: () => void;

  // Data Snapshot
  snapshot: AgencyDatabaseSnapshot;

  // Toasts
  toasts: ToastMessage[];
  addToast: (title: string, description?: string, type?: ToastMessage['type']) => void;
  dismissToast: (id: string) => void;

  // Business Mutations
  createProject: (input: CreateProjectInput) => Project;
  updateProjectStatus: (projectId: string, status: ProjectStatus) => void;
  updateProjectProgress: (projectId: string, progressPercent: number, silent?: boolean) => void;
  resetProjectProgress: (projectId: string) => void;
  transferProject: (
    projectId: string,
    toManagerId: string,
    toDepartmentId: string,
    reason: string
  ) => void;
  updateProjectTeam: (projectId: string, employeeIds: string[]) => void;
  deleteProject: (projectId: string) => void;

  createTask: (input: CreateTaskInput) => Task;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  reassignTask: (taskId: string, assignedTo: string) => void;
  toggleTaskChecklist: (taskId: string, checklistId: string) => void;
  addTaskComment: (taskId: string, content: string) => void;

  createLead: (input: CreateLeadInput) => void;
  updateLeadStatus: (leadId: string, status: LeadStatus) => void;
  convertLeadToClient: (leadId: string) => Client | null;

  createClient: (input: CreateClientInput) => Client;

  decideApproval: (
    approvalId: string,
    decision: 'Approved' | 'Changes Requested' | 'Rejected',
    feedback?: string
  ) => void;

  sendMessage: (
    projectId: string,
    content: string,
    visibility: 'Internal' | 'Client-visible',
    channel?: 'Client Thread' | 'Internal Team' | 'Executive Escalation'
  ) => void;

  uploadFile: (
    projectId: string,
    name: string,
    category: FileCategory,
    visibility: 'Internal' | 'Client-visible',
    sizeLabel?: string
  ) => void;
  toggleFileVisibility: (fileId: string) => void;
  deleteFile: (fileId: string) => void;

  logTimeEntry: (taskId: string, hours: number, description: string, date?: string) => void;
  createDepartment: (name: string, code: string, description: string, managerId: string, budgetBdt: number) => void;
  createTeamMember: (
    name: string,
    email: string,
    role: 'MANAGER' | 'EMPLOYEE',
    title: string,
    departmentId: string
  ) => void;
  createCalendarEvent: (
    title: string,
    category: CalendarEvent['category'],
    date: string,
    timeLabel: string,
    projectId?: string,
    visibility?: 'Internal' | 'Client-visible'
  ) => void;
  updateInvoiceStatus: (invoiceId: string, status: InvoiceStatus) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  resetDemoEnvironment: () => void;
}

const AgencyContext = createContext<AgencyContextValue | undefined>(undefined);

const SESSION_KEY = 'agencyos_v1_session_user_id';
const THEME_KEY = 'agencyos_v1_theme';

export const AgencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [snapshot, setSnapshot] = useState<AgencyDatabaseSnapshot>(() =>
    agencyRepository.getSnapshot()
  );

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedUserId = localStorage.getItem(SESSION_KEY);
      if (savedUserId) {
        return agencyRepository.getSnapshot().users.find((u) => u.id === savedUserId) || null;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [publicScreen, setPublicScreen] = useState<PublicScreen>('home');
  const [activeNav, setActiveNav] = useState<string>('overview');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isCopilotOpen, setCopilotOpen] = useState(false);
  const [isQuickCreateOpen, setQuickCreateOpen] = useState(false);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return 'dark';
  });

  const [currency, setCurrency] = useState<'BDT' | 'USD'>('BDT');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Global keyboard shortcut Cmd/Ctrl + K for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (currentUser) {
          setCommandPaletteOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentUser]);

  const addToast = (
    title: string,
    description?: string,
    type: ToastMessage['type'] = 'success'
  ) => {
    const id = `tst_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const commitSnapshot = (updater: (prev: AgencyDatabaseSnapshot) => AgencyDatabaseSnapshot) => {
    setSnapshot((prev) => {
      const next = updater(structuredClone(prev));
      agencyRepository.saveSnapshot(next);
      return next;
    });
  };

  const loginWithCredentials = (email: string, password: string): { ok: boolean; error?: string } => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { ok: false, error: 'Please enter a valid agency or client email address.' };
    }
    if (!password || password.length < 4) {
      return { ok: false, error: 'Password must be at least 4 characters (demo password: demo1234).' };
    }

    const matchedUser = snapshot.users.find(
      (u) =>
        u.email.toLowerCase() === cleanEmail ||
        (u.altEmail && u.altEmail.toLowerCase() === cleanEmail)
    );

    if (!matchedUser) {
      return {
        ok: false,
        error:
          'Account not found. Use founder@demo-agency.com, manager@demo-agency.com, employee@demo-agency.com, or client@demo-agency.com.',
      };
    }

    setCurrentUser(matchedUser);
    setActiveNav('overview');
    setSelectedProjectId(null);
    setSelectedTaskId(null);
    setSelectedClientId(null);
    setSelectedEmployeeId(null);

    try {
      localStorage.setItem(SESSION_KEY, matchedUser.id);
    } catch {
      // ignore
    }

    addToast(
      `Authenticated as ${matchedUser.name}`,
      `Loaded ${matchedUser.role} portal workspace.`,
      'info'
    );
    return { ok: true };
  };

  const quickSwitchRole = (role: Role) => {
    const roleMap: Record<Role, string> = {
      FOUNDER: 'usr_founder_01',
      MANAGER: 'usr_mgr_01',
      EMPLOYEE: 'usr_emp_01',
      CLIENT: 'usr_cli_01',
    };
    const targetUser = snapshot.users.find((u) => u.id === roleMap[role]) || snapshot.users[0];
    setCurrentUser(targetUser);
    setActiveNav('overview');
    setSelectedProjectId(null);
    setSelectedTaskId(null);
    setSelectedClientId(null);
    setSelectedEmployeeId(null);
    try {
      localStorage.setItem(SESSION_KEY, targetUser.id);
    } catch {
      // ignore
    }
    addToast(
      `Switched to ${targetUser.role} Portal`,
      `Viewing AgencyOS as ${targetUser.name} (${targetUser.title}).`,
      'info'
    );
  };

  const logout = () => {
    setCurrentUser(null);
    setPublicScreen('login');
    setSelectedProjectId(null);
    setSelectedTaskId(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
    addToast('Signed out of AgencyOS', 'Your session has been securely closed.', 'info');
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!currentUser) return false;
    return PermissionService.hasPermission(currentUser.role, permission);
  };

  const navigateTo = (navId: string) => {
    setActiveNav(navId);
    setSelectedProjectId(null);
    setSelectedClientId(null);
    setSelectedEmployeeId(null);
  };

  const openProjectDetail = (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveNav('projects');
  };

  const closeProjectDetail = () => {
    setSelectedProjectId(null);
  };

  const openTaskDrawer = (taskId: string | null) => {
    setSelectedTaskId(taskId);
  };

  const openClientDetail = (clientId: string | null) => {
    setSelectedClientId(clientId);
    if (clientId) setActiveNav('clients');
  };

  const openEmployeeDetail = (employeeId: string | null) => {
    setSelectedEmployeeId(employeeId);
    if (employeeId) setActiveNav('team');
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleCurrency = () => {
    setCurrency((prev) => (prev === 'BDT' ? 'USD' : 'BDT'));
  };

  // --- Business Logic Mutations ---
  const createProject = (input: CreateProjectInput): Project => {
    const newId = `prj_${Date.now().toString(36)}`;
    const codeNum = 101 + snapshot.projects.length;
    const finalCode = input.code?.trim() || `PRJ-${codeNum}`;
    const newProject: Project = {
      id: newId,
      name: input.name,
      code: finalCode,
      description: input.description,
      objectives: input.objectives.length > 0 ? input.objectives : ['Deliver campaign KPIs on schedule'],
      client_id: input.client_id,
      department_id: input.department_id,
      manager_id: input.manager_id,
      employee_ids: input.employee_ids,
      status: 'Active',
      priority: input.priority,
      projectType: input.projectType,
      budgetBdt: input.budgetBdt,
      spentBdt: 0,
      start_date: input.start_date || TODAY_STR,
      deadline: input.deadline,
      created_at: TODAY_STR,
      updated_at: TODAY_STR,
      transferHistory: [],
    };

    commitSnapshot((db) => {
      db.projects.unshift(newProject);

      // If a template was selected, seed default tasks and milestones
      const tpl = input.template_id
        ? db.templates.find((t) => t.id === input.template_id)
        : undefined;

      if (tpl) {
        tpl.defaultTasks.forEach((dt, idx) => {
          const assignee =
            input.employee_ids[idx % Math.max(1, input.employee_ids.length)] || 'usr_emp_01';
          db.tasks.unshift({
            id: `tsk_${Date.now()}_${idx}`,
            code: `TSK-${401 + db.tasks.length + idx}`,
            title: dt.title,
            description: `Generated from ${tpl.name} blueprint for ${input.name}.`,
            project_id: newId,
            client_id: input.client_id,
            department_id: input.department_id,
            assigned_to: assignee,
            assigned_manager_id: input.manager_id,
            priority: dt.priority,
            status: idx === 0 ? 'In Progress' : 'To Do',
            due_date: input.deadline,
            estimatedHours: dt.estimatedHours,
            actualHours: 0,
            tags: dt.tags,
            checklist: [
              { id: `chk_${Date.now()}_1`, text: 'Complete discovery & initial setup', completed: false },
              { id: `chk_${Date.now()}_2`, text: 'Peer review & manager QA sign-off', completed: false },
            ],
            comments: [],
            created_by: currentUser?.id || 'usr_founder_01',
            created_at: TODAY_STR,
            updated_at: TODAY_STR,
          });
        });

        tpl.defaultMilestones.forEach((msTitle, idx) => {
          db.milestones.push({
            id: `ms_${Date.now()}_${idx}`,
            project_id: newId,
            title: msTitle,
            due_date: input.deadline,
            status: idx === 0 ? 'Current' : 'Upcoming',
            weight: Math.round(100 / tpl.defaultMilestones.length),
          });
        });
      }

      db.activities.unshift({
        id: `act_${Date.now()}`,
        actor_id: currentUser?.id || 'usr_founder_01',
        action: 'created new project workspace',
        targetType: 'Project',
        targetName: newProject.name,
        project_id: newId,
        client_id: input.client_id,
        visibility: 'Client-safe',
        metadata: `Assigned to manager ${db.users.find((u) => u.id === input.manager_id)?.name || 'Manager'}`,
        created_at: `${TODAY_STR} 11:15`,
      });

      db.notifications.unshift({
        id: `ntf_${Date.now()}`,
        user_id: input.manager_id,
        type: 'NEW_PROJECT',
        title: `New Project Assigned: ${newProject.name}`,
        description: `${currentUser?.name || 'Founder'} initialized ${newProject.code} and assigned delivery ownership.`,
        linkProject_id: newId,
        read: false,
        created_at: 'Just now',
      });

      return db;
    });

    addToast('Project Created', `${newProject.code} · ${newProject.name} is now live.`);
    return newProject;
  };

  const updateProjectStatus = (projectId: string, status: ProjectStatus) => {
    commitSnapshot((db) => {
      const prj = db.projects.find((p) => p.id === projectId);
      if (prj) {
        prj.status = status;
        prj.updated_at = TODAY_STR;
        db.activities.unshift({
          id: `act_${Date.now()}`,
          actor_id: currentUser?.id || 'usr_founder_01',
          action: `updated project status to ${status}`,
          targetType: 'Project',
          targetName: prj.name,
          project_id: prj.id,
          client_id: prj.client_id,
          visibility: 'Client-safe',
          created_at: `${TODAY_STR} 11:20`,
        });
      }
      return db;
    });
    addToast('Project Status Updated', `Project moved to ${status}.`);
  };

  const updateProjectProgress = (projectId: string, progressPercent: number, silent = false) => {
    const bounded = Math.max(0, Math.min(100, Math.round(progressPercent)));
    commitSnapshot((db) => {
      const prj = db.projects.find((p) => p.id === projectId);
      if (prj) {
        prj.customProgressPercent = bounded;
        prj.updated_at = TODAY_STR;
        if (bounded === 100 && prj.status !== 'Completed') {
          prj.status = 'Completed';
        } else if (bounded < 100 && prj.status === 'Completed') {
          prj.status = 'Active';
        }
        db.activities.unshift({
          id: `act_${Date.now()}`,
          actor_id: currentUser?.id || 'usr_emp_01',
          action: `updated project progress to ${bounded}%`,
          targetType: 'Project',
          targetName: prj.name,
          project_id: prj.id,
          client_id: prj.client_id,
          visibility: 'Client-safe',
          created_at: `${TODAY_STR} 12:00`,
        });
      }
      return db;
    });
    if (!silent) {
      addToast('Project Progress Updated', `Set completion to ${bounded}%.`);
    }
  };

  const resetProjectProgress = (projectId: string) => {
    commitSnapshot((db) => {
      const prj = db.projects.find((p) => p.id === projectId);
      if (prj) {
        delete prj.customProgressPercent;
        prj.updated_at = TODAY_STR;
        db.activities.unshift({
          id: `act_${Date.now()}`,
          actor_id: currentUser?.id || 'usr_emp_01',
          action: 'reset project progress to automated calculation',
          targetType: 'Project',
          targetName: prj.name,
          project_id: prj.id,
          client_id: prj.client_id,
          visibility: 'Client-safe',
          created_at: `${TODAY_STR} 12:00`,
        });
      }
      return db;
    });
    addToast('Project Progress Reset', 'Reverted back to automated task-based completion.');
  };

  const transferProject = (
    projectId: string,
    toManagerId: string,
    toDepartmentId: string,
    reason: string
  ) => {
    commitSnapshot((db) => {
      const prj = db.projects.find((p) => p.id === projectId);
      if (!prj) return db;

      const oldManager = db.users.find((u) => u.id === prj.manager_id);
      const newManager = db.users.find((u) => u.id === toManagerId);

      prj.transferHistory.unshift({
        id: `trf_${Date.now()}`,
        project_id: prj.id,
        from_manager_id: prj.manager_id,
        to_manager_id: toManagerId,
        from_department_id: prj.department_id,
        to_department_id: toDepartmentId,
        reason,
        transferred_by: currentUser?.id || 'usr_founder_01',
        created_at: TODAY_STR,
      });

      prj.manager_id = toManagerId;
      prj.department_id = toDepartmentId;
      prj.updated_at = TODAY_STR;

      db.activities.unshift({
        id: `act_${Date.now()}`,
        actor_id: currentUser?.id || 'usr_founder_01',
        action: 'transferred project ownership',
        targetType: 'Project',
        targetName: prj.name,
        project_id: prj.id,
        client_id: prj.client_id,
        visibility: 'Internal',
        metadata: `${oldManager?.name || 'Previous'} → ${newManager?.name || 'New Manager'} (${reason})`,
        created_at: `${TODAY_STR} 11:30`,
      });

      db.notifications.unshift({
        id: `ntf_${Date.now()}`,
        user_id: toManagerId,
        type: 'PROJECT_ASSIGNED',
        title: `Project Transferred to You: ${prj.code}`,
        description: `${prj.name} transferred from ${oldManager?.name}. Reason: ${reason}`,
        linkProject_id: prj.id,
        read: false,
        created_at: 'Just now',
      });

      return db;
    });
    addToast('Project Ownership Transferred', 'Audit log and manager notifications have been updated.');
  };

  const updateProjectTeam = (projectId: string, employeeIds: string[]) => {
    commitSnapshot((db) => {
      const prj = db.projects.find((p) => p.id === projectId);
      if (prj) {
        prj.employee_ids = employeeIds;
        prj.updated_at = TODAY_STR;
        db.activities.unshift({
          id: `act_${Date.now()}`,
          actor_id: currentUser?.id || 'usr_mgr_01',
          action: 'updated assigned project specialists',
          targetType: 'Project',
          targetName: prj.name,
          project_id: prj.id,
          client_id: prj.client_id,
          visibility: 'Internal',
          metadata: `${employeeIds.length} active specialists assigned`,
          created_at: `${TODAY_STR} 11:35`,
        });
      }
      return db;
    });
    addToast('Project Roster Updated', 'Team member assignments synced across portals.');
  };

  const deleteProject = (projectId: string) => {
    commitSnapshot((db) => {
      const prj = db.projects.find((p) => p.id === projectId);
      db.projects = db.projects.filter((p) => p.id !== projectId);
      db.tasks = db.tasks.filter((t) => t.project_id !== projectId);
      if (prj) {
        db.activities.unshift({
          id: `act_${Date.now()}`,
          actor_id: currentUser?.id || 'usr_founder_01',
          action: 'archived & removed project',
          targetType: 'Project',
          targetName: prj.name,
          visibility: 'Internal',
          created_at: `${TODAY_STR} 11:40`,
        });
      }
      return db;
    });
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);
    }
    addToast('Project Removed', 'Project and associated tasks were removed.', 'warning');
  };

  const createTask = (input: CreateTaskInput): Task => {
    const project = snapshot.projects.find((p) => p.id === input.project_id) || snapshot.projects[0];
    const newTask: Task = {
      id: `tsk_${Date.now()}`,
      code: `TSK-${401 + snapshot.tasks.length}`,
      title: input.title,
      description: input.description,
      project_id: project.id,
      client_id: project.client_id,
      department_id: project.department_id,
      assigned_to: input.assigned_to,
      assigned_manager_id: project.manager_id,
      priority: input.priority,
      status: 'To Do',
      due_date: input.due_date || TODAY_STR,
      estimatedHours: input.estimatedHours || 8,
      actualHours: 0,
      tags: input.tags.length > 0 ? input.tags : ['Execution'],
      checklist: [
        { id: `chk_${Date.now()}_a`, text: 'Review brief & specifications', completed: false },
        { id: `chk_${Date.now()}_b`, text: 'Submit deliverable for QA review', completed: false },
      ],
      comments: [],
      created_by: currentUser?.id || 'usr_mgr_01',
      created_at: TODAY_STR,
      updated_at: TODAY_STR,
    };

    commitSnapshot((db) => {
      db.tasks.unshift(newTask);
      const prj = db.projects.find((p) => p.id === project.id);
      if (prj && !prj.employee_ids.includes(input.assigned_to)) {
        prj.employee_ids.push(input.assigned_to);
      }

      const assignee = db.users.find((u) => u.id === input.assigned_to);
      db.activities.unshift({
        id: `act_${Date.now()}`,
        actor_id: currentUser?.id || 'usr_mgr_01',
        action: `assigned new task to ${assignee?.name || 'Specialist'}`,
        targetType: 'Task',
        targetName: newTask.title,
        project_id: project.id,
        client_id: project.client_id,
        visibility: 'Internal',
        created_at: `${TODAY_STR} 11:45`,
      });

      db.notifications.unshift({
        id: `ntf_${Date.now()}`,
        user_id: input.assigned_to,
        type: 'TASK_ASSIGNED',
        title: `New Task Assigned: ${newTask.code}`,
        description: `${newTask.title} (Due ${newTask.due_date})`,
        linkProject_id: project.id,
        read: false,
        created_at: 'Just now',
      });

      return db;
    });

    addToast('Task Assigned', `${newTask.code} assigned and synced to specialist queue.`);
    return newTask;
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    commitSnapshot((db) => {
      const task = db.tasks.find((t) => t.id === taskId);
      if (!task) return db;
      task.status = status;
      task.updated_at = TODAY_STR;

      db.activities.unshift({
        id: `act_${Date.now()}`,
        actor_id: currentUser?.id || task.assigned_to,
        action: status === 'Completed' ? 'completed task' : `moved task to ${status}`,
        targetType: 'Task',
        targetName: task.title,
        project_id: task.project_id,
        client_id: task.client_id,
        visibility: status === 'Completed' ? 'Client-safe' : 'Internal',
        created_at: `${TODAY_STR} 11:50`,
      });

      if (status === 'Completed') {
        db.notifications.unshift({
          id: `ntf_${Date.now()}`,
          user_id: task.assigned_manager_id,
          type: 'TASK_COMPLETED',
          title: `Task Completed: ${task.code}`,
          description: `${task.title} was marked completed. Project health score recalculated.`,
          linkProject_id: task.project_id,
          read: false,
          created_at: 'Just now',
        });
      }

      return db;
    });
    addToast('Task Status Updated', `Task moved to ${status}. Project progress recalculated.`);
  };

  const reassignTask = (taskId: string, assignedTo: string) => {
    commitSnapshot((db) => {
      const task = db.tasks.find((t) => t.id === taskId);
      if (!task) return db;
      const newOwner = db.users.find((u) => u.id === assignedTo);
      task.assigned_to = assignedTo;
      task.updated_at = TODAY_STR;

      db.activities.unshift({
        id: `act_${Date.now()}`,
        actor_id: currentUser?.id || 'usr_mgr_01',
        action: `reassigned task to ${newOwner?.name || 'Specialist'}`,
        targetType: 'Task',
        targetName: task.title,
        project_id: task.project_id,
        visibility: 'Internal',
        created_at: `${TODAY_STR} 11:55`,
      });
      return db;
    });
    addToast('Task Reassigned', 'Employee workload capacity recalculated.');
  };

  const toggleTaskChecklist = (taskId: string, checklistId: string) => {
    commitSnapshot((db) => {
      const task = db.tasks.find((t) => t.id === taskId);
      if (!task) return db;
      const item = task.checklist.find((c) => c.id === checklistId);
      if (item) {
        item.completed = !item.completed;
      }
      return db;
    });
  };

  const addTaskComment = (taskId: string, content: string) => {
    if (!content.trim()) return;
    commitSnapshot((db) => {
      const task = db.tasks.find((t) => t.id === taskId);
      if (!task) return db;
      task.comments.push({
        id: `cmt_${Date.now()}`,
        task_id: taskId,
        author_id: currentUser?.id || 'usr_emp_01',
        content: content.trim(),
        created_at: `${TODAY_STR} 12:00`,
      });
      return db;
    });
    addToast('Comment Added', 'Posted to task activity thread.');
  };

  const createLead = (input: CreateLeadInput) => {
    commitSnapshot((db) => {
      const newLead: Lead = {
        id: `ld_${Date.now()}`,
        name: input.name,
        company: input.company,
        email: input.email,
        phone: input.phone,
        source: input.source,
        service: input.service,
        potentialValueBdt: input.potentialValueBdt,
        status: 'New',
        assigned_manager_id: input.assigned_manager_id,
        created_at: TODAY_STR,
        last_contact: TODAY_STR,
        notes: input.notes,
      };
      db.leads.unshift(newLead);
      db.activities.unshift({
        id: `act_${Date.now()}`,
        actor_id: currentUser?.id || 'usr_founder_01',
        action: 'added new CRM lead',
        targetType: 'Lead',
        targetName: `${newLead.company} (${newLead.name})`,
        visibility: 'Internal',
        created_at: `${TODAY_STR} 12:05`,
      });
      return db;
    });
    addToast('Lead Added to Pipeline', `${input.company} entered CRM pipeline.`);
  };

  const updateLeadStatus = (leadId: string, status: LeadStatus) => {
    commitSnapshot((db) => {
      const lead = db.leads.find((l) => l.id === leadId);
      if (lead) {
        lead.status = status;
        lead.last_contact = TODAY_STR;
        db.activities.unshift({
          id: `act_${Date.now()}`,
          actor_id: currentUser?.id || 'usr_mgr_01',
          action: `moved lead stage to ${status}`,
          targetType: 'Lead',
          targetName: lead.company,
          visibility: 'Internal',
          created_at: `${TODAY_STR} 12:10`,
        });
      }
      return db;
    });
    addToast('Pipeline Stage Updated', `Lead moved to ${status}.`);
  };

  const convertLeadToClient = (leadId: string): Client | null => {
    const lead = snapshot.leads.find((l) => l.id === leadId);
    if (!lead) return null;

    const newClient: Client = {
      id: `cli_${Date.now()}`,
      name: lead.name,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      industry: lead.service,
      status: 'Active',
      manager_id: lead.assigned_manager_id,
      totalValueBdt: lead.potentialValueBdt,
      joined_date: TODAY_STR,
      website: `https://${lead.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      notes: `Converted from Won CRM Lead (${lead.source}). ${lead.notes}`,
    };

    commitSnapshot((db) => {
      const targetLead = db.leads.find((l) => l.id === leadId);
      if (targetLead) targetLead.status = 'Won';
      db.clients.unshift(newClient);

      db.activities.unshift({
        id: `act_${Date.now()}`,
        actor_id: currentUser?.id || 'usr_founder_01',
        action: 'converted Won Lead into Active Client',
        targetType: 'Client',
        targetName: newClient.company,
        client_id: newClient.id,
        visibility: 'Internal',
        created_at: `${TODAY_STR} 12:15`,
      });
      return db;
    });

    addToast('Lead Converted to Client', `${newClient.company} is now an active agency client!`);
    return newClient;
  };

  const createClient = (input: CreateClientInput): Client => {
    const newClient: Client = {
      id: `cli_${Date.now()}`,
      name: input.name,
      company: input.company,
      email: input.email,
      phone: input.phone,
      industry: input.industry,
      status: 'Active',
      manager_id: input.manager_id,
      totalValueBdt: input.totalValueBdt,
      joined_date: TODAY_STR,
      website: input.website || 'https://example.com',
      notes: input.notes,
    };

    commitSnapshot((db) => {
      db.clients.unshift(newClient);
      db.activities.unshift({
        id: `act_${Date.now()}`,
        actor_id: currentUser?.id || 'usr_founder_01',
        action: 'onboarded new client organization',
        targetType: 'Client',
        targetName: newClient.company,
        client_id: newClient.id,
        visibility: 'Internal',
        created_at: `${TODAY_STR} 12:20`,
      });
      return db;
    });

    addToast('Client Onboarded', `${newClient.company} added to active directory.`);
    return newClient;
  };

  const decideApproval = (
    approvalId: string,
    decision: 'Approved' | 'Changes Requested' | 'Rejected',
    feedback?: string
  ) => {
    commitSnapshot((db) => {
      const apr = db.approvals.find((a) => a.id === approvalId);
      if (!apr) return db;
      apr.status = decision;
      apr.feedback = feedback;
      apr.updated_at = TODAY_STR;

      const del = db.deliverables.find((d) => d.id === apr.entity_id);
      if (del) {
        del.status =
          decision === 'Approved'
            ? 'Client Approved'
            : decision === 'Changes Requested'
              ? 'Changes Requested'
              : 'Internal Review';
        if (feedback) del.clientFeedback = feedback;
        del.updated_at = TODAY_STR;
      }

      db.activities.unshift({
        id: `act_${Date.now()}`,
        actor_id: currentUser?.id || 'usr_cli_01',
        action:
          decision === 'Approved'
            ? 'approved deliverable'
            : decision === 'Changes Requested'
              ? 'requested revisions on deliverable'
              : 'rejected approval item',
        targetType: 'Approval',
        targetName: apr.title,
        project_id: apr.project_id,
        client_id: apr.client_id,
        visibility: 'Client-safe',
        metadata: feedback || `Status set to ${decision}`,
        created_at: `${TODAY_STR} 12:25`,
      });

      db.notifications.unshift({
        id: `ntf_${Date.now()}`,
        user_id: apr.requester_id,
        type: 'CLIENT_APPROVAL_REQUIRED',
        title: `Approval ${decision}: ${apr.title}`,
        description: feedback || `Reviewed by ${currentUser?.name || 'Reviewer'}.`,
        linkProject_id: apr.project_id,
        read: false,
        created_at: 'Just now',
      });

      return db;
    });

    addToast(
      `Deliverable ${decision}`,
      feedback ? `Note: "${feedback}"` : 'Status synced across Client and Agency portals.',
      decision === 'Approved' ? 'success' : 'warning'
    );
  };

  const sendMessage = (
    projectId: string,
    content: string,
    visibility: 'Internal' | 'Client-visible',
    channel: 'Client Thread' | 'Internal Team' | 'Executive Escalation' = 'Client Thread'
  ) => {
    if (!content.trim()) return;
    commitSnapshot((db) => {
      const prj = db.projects.find((p) => p.id === projectId) || db.projects[0];
      db.messages.push({
        id: `msg_${Date.now()}`,
        project_id: prj.id,
        client_id: prj.client_id,
        sender_id: currentUser?.id || 'usr_founder_01',
        channel: visibility === 'Internal' ? 'Internal Team' : channel,
        visibility,
        content: content.trim(),
        mentions: [],
        attachments: [],
        unreadBy: [],
        created_at: `${TODAY_STR} 12:30`,
      });

      db.activities.unshift({
        id: `act_${Date.now()}`,
        actor_id: currentUser?.id || 'usr_founder_01',
        action:
          visibility === 'Client-visible'
            ? 'posted message in Client Thread'
            : 'posted internal team note',
        targetType: 'Project',
        targetName: prj.name,
        project_id: prj.id,
        client_id: prj.client_id,
        visibility: visibility === 'Client-visible' ? 'Client-safe' : 'Internal',
        created_at: `${TODAY_STR} 12:30`,
      });

      return db;
    });
    addToast('Message Sent', visibility === 'Internal' ? 'Posted to internal team channel.' : 'Delivered to client thread.');
  };

  const uploadFile = (
    projectId: string,
    name: string,
    category: FileCategory,
    visibility: 'Internal' | 'Client-visible',
    sizeLabel = '6.4 MB'
  ) => {
    commitSnapshot((db) => {
      const prj = db.projects.find((p) => p.id === projectId) || db.projects[0];
      const ext = name.split('.').pop()?.toUpperCase() || 'PDF';
      const newFile: AgencyFile = {
        id: `fil_${Date.now()}`,
        project_id: prj.id,
        client_id: prj.client_id,
        name,
        fileType: ext,
        sizeLabel,
        uploaded_by: currentUser?.id || 'usr_mgr_01',
        category,
        visibility,
        created_at: TODAY_STR,
      };
      db.files.unshift(newFile);

      db.activities.unshift({
        id: `act_${Date.now()}`,
        actor_id: currentUser?.id || 'usr_mgr_01',
        action: `uploaded ${category.toLowerCase()} asset`,
        targetType: 'File',
        targetName: name,
        project_id: prj.id,
        client_id: prj.client_id,
        visibility: visibility === 'Client-visible' ? 'Client-safe' : 'Internal',
        created_at: `${TODAY_STR} 12:35`,
      });
      return db;
    });
    addToast('File Uploaded', `${name} added (${visibility}).`);
  };

  const toggleFileVisibility = (fileId: string) => {
    commitSnapshot((db) => {
      const f = db.files.find((item) => item.id === fileId);
      if (f) {
        f.visibility = f.visibility === 'Client-visible' ? 'Internal' : 'Client-visible';
      }
      return db;
    });
    addToast('File Visibility Updated', 'Client portal access permissions updated.');
  };

  const deleteFile = (fileId: string) => {
    commitSnapshot((db) => {
      db.files = db.files.filter((f) => f.id !== fileId);
      return db;
    });
    addToast('File Deleted', 'Asset removed from workspace.', 'info');
  };

  const logTimeEntry = (taskId: string, hours: number, description: string, date = TODAY_STR) => {
    commitSnapshot((db) => {
      const task = db.tasks.find((t) => t.id === taskId) || db.tasks[0];
      task.actualHours = Math.round((task.actualHours + hours) * 10) / 10;
      db.timeEntries.unshift({
        id: `tme_${Date.now()}`,
        user_id: currentUser?.id || 'usr_emp_01',
        task_id: task.id,
        project_id: task.project_id,
        date,
        hours,
        description: description || `Logged ${hours}h on ${task.code}`,
      });
      return db;
    });
    addToast('Time Logged', `${hours} hours recorded and added to task actuals.`);
  };

  const createDepartment = (
    name: string,
    code: string,
    description: string,
    managerId: string,
    budgetBdt: number
  ) => {
    commitSnapshot((db) => {
      const newDept: Department = {
        id: `dept_${Date.now()}`,
        name,
        code: code.toUpperCase(),
        description,
        manager_id: managerId,
        monthlyBudgetBdt: budgetBdt,
        created_at: TODAY_STR,
      };
      db.departments.push(newDept);
      return db;
    });
    addToast('Department Created', `${name} (${code.toUpperCase()}) is now active.`);
  };

  const createTeamMember = (
    name: string,
    email: string,
    role: 'MANAGER' | 'EMPLOYEE',
    title: string,
    departmentId: string
  ) => {
    const initials = name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    commitSnapshot((db) => {
      const dept = db.departments.find((d) => d.id === departmentId);
      const newUser: User = {
        id: `usr_${Date.now()}`,
        name,
        email,
        phone: '+880 1711-000000',
        role,
        title,
        department_id: departmentId,
        manager_id: dept?.manager_id || 'usr_mgr_01',
        avatarInitials: initials || 'AG',
        avatarColor: role === 'MANAGER' ? 'bg-indigo-600 text-white' : 'bg-teal-600 text-white',
        timezone: 'Asia/Dhaka (GMT+6)',
        availability: 'Available',
        weeklyCapacityHours: 40,
        performanceScore: 90,
        joined_at: TODAY_STR,
      };
      db.users.push(newUser);
      db.activities.unshift({
        id: `act_${Date.now()}`,
        actor_id: currentUser?.id || 'usr_founder_01',
        action: `added new ${role.toLowerCase()} to agency roster`,
        targetType: 'Team',
        targetName: `${name} (${title})`,
        visibility: 'Internal',
        created_at: `${TODAY_STR} 12:40`,
      });
      return db;
    });
    addToast('Team Member Added', `${name} joined as ${title}.`);
  };

  const createCalendarEvent = (
    title: string,
    category: CalendarEvent['category'],
    date: string,
    timeLabel: string,
    projectId?: string,
    visibility: 'Internal' | 'Client-visible' = 'Internal'
  ) => {
    commitSnapshot((db) => {
      const prj = projectId ? db.projects.find((p) => p.id === projectId) : undefined;
      db.calendarEvents.push({
        id: `cal_${Date.now()}`,
        title,
        category,
        date,
        timeLabel,
        project_id: projectId,
        client_id: prj?.client_id,
        visibility,
        attendee_ids: [currentUser?.id || 'usr_founder_01'],
      });
      return db;
    });
    addToast('Calendar Event Scheduled', `${title} scheduled for ${date}.`);
  };

  const updateInvoiceStatus = (invoiceId: string, status: InvoiceStatus) => {
    commitSnapshot((db) => {
      const inv = db.invoices.find((i) => i.id === invoiceId);
      if (inv) {
        inv.status = status;
      }
      return db;
    });
    addToast('Invoice Updated', `Invoice status marked as ${status}.`);
  };

  const markNotificationRead = (id: string) => {
    commitSnapshot((db) => {
      const n = db.notifications.find((item) => item.id === id);
      if (n) n.read = true;
      return db;
    });
  };

  const markAllNotificationsRead = () => {
    commitSnapshot((db) => {
      db.notifications.forEach((n) => {
        n.read = true;
      });
      return db;
    });
    addToast('Notifications Cleared', 'All notifications marked as read.', 'info');
  };

  const resetDemoEnvironment = () => {
    const fresh = agencyRepository.resetToSeed();
    setSnapshot(fresh);
    addToast('Demo Data Reset', 'Restored initial seeded agency state.', 'info');
  };

  return (
    <AgencyContext.Provider
      value={{
        currentUser,
        publicScreen,
        setPublicScreen,
        loginWithCredentials,
        quickSwitchRole,
        logout,
        hasPermission,
        activeNav,
        selectedProjectId,
        selectedTaskId,
        selectedClientId,
        selectedEmployeeId,
        isCommandPaletteOpen,
        setCommandPaletteOpen,
        isCopilotOpen,
        setCopilotOpen,
        isQuickCreateOpen,
        setQuickCreateOpen,
        navigateTo,
        openProjectDetail,
        closeProjectDetail,
        openTaskDrawer,
        openClientDetail,
        openEmployeeDetail,
        theme,
        toggleTheme,
        currency,
        toggleCurrency,
        snapshot,
        toasts,
        addToast,
        dismissToast,
        createProject,
        updateProjectStatus,
        updateProjectProgress,
        resetProjectProgress,
        transferProject,
        updateProjectTeam,
        deleteProject,
        createTask,
        updateTaskStatus,
        reassignTask,
        toggleTaskChecklist,
        addTaskComment,
        createLead,
        updateLeadStatus,
        convertLeadToClient,
        createClient,
        decideApproval,
        sendMessage,
        uploadFile,
        toggleFileVisibility,
        deleteFile,
        logTimeEntry,
        createDepartment,
        createTeamMember,
        createCalendarEvent,
        updateInvoiceStatus,
        markNotificationRead,
        markAllNotificationsRead,
        resetDemoEnvironment,
      }}
    >
      {children}
    </AgencyContext.Provider>
  );
};

export const useAgency = (): AgencyContextValue => {
  const ctx = useContext(AgencyContext);
  if (!ctx) {
    throw new Error('useAgency must be used within an AgencyProvider');
  }
  return ctx;
};
