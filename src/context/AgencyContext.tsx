import React, { createContext, useContext, useEffect, useState } from 'react';
import { TODAY_STR } from '../data/seedData';
import {
  AgencyDatabaseSnapshot,
  agencyRepository,
  getDeletedIds,
  recordDeletedId,
} from '../repositories/agencyRepository';
import { PermissionService } from '../services/agencyServices';
import { SupabaseService } from '../services/supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';
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

export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

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
  password?: string;
  phone: string;
  industry: string;
  manager_id: string;
  totalValueBdt: number;
  website: string;
  notes: string;
}

export type QuickCreateMode =
  | 'project'
  | 'task'
  | 'lead'
  | 'client'
  | 'member'
  | 'department'
  | 'event';

interface AgencyContextValue {
  // Auth & Session
  currentUser: User | null;
  publicScreen: PublicScreen;
  setPublicScreen: (screen: PublicScreen) => void;
  loginWithCredentials: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signUpWithCredentials: (
    email: string,
    password: string,
    name: string,
    role?: Role,
    title?: string
  ) => Promise<{ ok: boolean; error?: string }>;
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
  quickCreateInitialMode: QuickCreateMode;
  openQuickCreate: (mode?: QuickCreateMode) => void;
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
  deleteTask: (taskId: string) => void;

  createLead: (input: CreateLeadInput) => void;
  updateLeadStatus: (leadId: string, status: LeadStatus) => void;
  convertLeadToClient: (leadId: string) => Client | null;
  deleteLead: (leadId: string) => void;

  createClient: (input: CreateClientInput) => Client;
  deleteClient: (clientId: string) => void;

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
  deleteDepartment: (departmentId: string) => void;
  createTeamMember: (
    name: string,
    email: string,
    role: 'MANAGER' | 'EMPLOYEE',
    title: string,
    departmentId: string,
    password?: string
  ) => void;
  deleteTeamMember: (memberId: string) => void;
  createCalendarEvent: (
    title: string,
    category: CalendarEvent['category'],
    date: string,
    timeLabel: string,
    projectId?: string,
    visibility?: 'Internal' | 'Client-visible'
  ) => void;
  deleteCalendarEvent: (eventId: string) => void;
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
  const [quickCreateInitialMode, setQuickCreateInitialMode] = useState<QuickCreateMode>('project');

  const openQuickCreate = (mode: QuickCreateMode = 'project') => {
    setQuickCreateInitialMode(mode);
    setQuickCreateOpen(true);
  };

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

  // Supabase Session Restoration and Realtime Subscription
  useEffect(() => {
    let unsubscribeRealtime = () => {};

    // 1. Restore real session on boot
    SupabaseService.getCurrentSessionUser().then((user) => {
      if (user) {
        setCurrentUser(user);
        try {
          localStorage.setItem(SESSION_KEY, user.id);
        } catch {
          // ignore
        }
      }
    });

    // 2. Load database snapshot from Supabase if tables exist
    SupabaseService.loadSnapshotFromSupabase().then((dbData) => {
      if (dbData) {
        const deleted = getDeletedIds();
        setSnapshot((prev) => {
          const supabaseTasks = (dbData.tasks || []).filter((t) => !deleted.has(t.id));
          const supabaseTaskIds = new Set(supabaseTasks.map((t) => t.id));
          const localOnlyTasks = prev.tasks.filter((t) => !deleted.has(t.id) && !supabaseTaskIds.has(t.id));
          const mergedTasks = supabaseTasks.length > 0 ? [...localOnlyTasks, ...supabaseTasks] : prev.tasks.filter((t) => !deleted.has(t.id));

          const supabaseProjects = (dbData.projects || []).filter((p) => !deleted.has(p.id));
          const supabaseProjectIds = new Set(supabaseProjects.map((p) => p.id));
          const localOnlyProjects = prev.projects.filter((p) => !deleted.has(p.id) && !supabaseProjectIds.has(p.id));
          const mergedProjects = supabaseProjects.length > 0 ? [...localOnlyProjects, ...supabaseProjects] : prev.projects.filter((p) => !deleted.has(p.id));

          const supabaseClients = (dbData.clients || []).filter((c) => !deleted.has(c.id));
          const supabaseClientIds = new Set(supabaseClients.map((c) => c.id));
          const localOnlyClients = prev.clients.filter((c) => !deleted.has(c.id) && !supabaseClientIds.has(c.id));
          const mergedClients = supabaseClients.length > 0 ? [...localOnlyClients, ...supabaseClients] : prev.clients.filter((c) => !deleted.has(c.id));

          const supabaseLeads = (dbData.leads || []).filter((l) => !deleted.has(l.id));
          const supabaseLeadIds = new Set(supabaseLeads.map((l) => l.id));
          const localOnlyLeads = prev.leads.filter((l) => !deleted.has(l.id) && !supabaseLeadIds.has(l.id));
          const mergedLeads = supabaseLeads.length > 0 ? [...localOnlyLeads, ...supabaseLeads] : prev.leads.filter((l) => !deleted.has(l.id));

          const next = {
            ...prev,
            projects: mergedProjects,
            tasks: mergedTasks,
            clients: mergedClients,
            leads: mergedLeads,
            messages: dbData.messages && dbData.messages.length > 0 ? dbData.messages : prev.messages,
          };
          agencyRepository.saveSnapshot(next);
          return next;
        });
      }
    });

    // 3. Realtime subscription for multi-user chat and task sync
    unsubscribeRealtime = SupabaseService.subscribeToRealtimeEvents(
      (newMsg) => {
        setSnapshot((prev) => {
          if (prev.messages.some((m) => m.id === newMsg.id)) return prev;
          return { ...prev, messages: [...prev.messages, newMsg] };
        });
      },
      () => {
        SupabaseService.loadSnapshotFromSupabase().then((data) => {
          if (data?.tasks) setSnapshot((prev) => ({ ...prev, tasks: data.tasks! }));
        });
      },
      () => {
        SupabaseService.loadSnapshotFromSupabase().then((data) => {
          if (data?.projects) setSnapshot((prev) => ({ ...prev, projects: data.projects! }));
        });
      }
    );

    return () => {
      unsubscribeRealtime();
    };
  }, []);

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

  const loginWithCredentials = async (
    email: string,
    password: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail) {
      return { ok: false, error: 'Please enter a valid Gmail or corporate email address.' };
    }
    if (!cleanPass) {
      return { ok: false, error: 'Please enter your password or access token.' };
    }

    const FOUNDER_EMAIL = 'fsrfahimahmed@gmail.com';
    const FOUNDER_PASS = '999888';

    // 1. Strict Founder Authentication Check (Single Founder Policy)
    if (cleanEmail === FOUNDER_EMAIL) {
      if (cleanPass !== FOUNDER_PASS) {
        return { ok: false, error: 'Invalid password. Founder credentials do not match.' };
      }

      let founder = snapshot.users.find(
        (u) => u.role === 'FOUNDER' || u.email.toLowerCase() === FOUNDER_EMAIL
      );

      if (!founder) {
        founder = {
          id: 'usr_founder_01',
          name: 'Fahim Ahmed',
          email: FOUNDER_EMAIL,
          altEmail: FOUNDER_EMAIL,
          phone: '+880 1711-999888',
          role: 'FOUNDER',
          title: 'Founder & CEO',
          password: FOUNDER_PASS,
          department_id: 'dept_001',
          avatarInitials: 'FA',
          avatarColor: 'bg-indigo-600 text-white',
          timezone: 'Asia/Dhaka (GMT+6)',
          availability: 'Available',
          weeklyCapacityHours: 45,
          performanceScore: 100,
          joined_at: TODAY_STR,
        };
        commitSnapshot((db) => {
          db.users = db.users.filter((u) => u.role !== 'FOUNDER');
          db.users.unshift(founder!);
          return db;
        });
      } else {
        // Guarantee latest fields
        founder = {
          ...founder,
          name: 'Fahim Ahmed',
          email: FOUNDER_EMAIL,
          role: 'FOUNDER',
          password: FOUNDER_PASS,
        };
      }

      setCurrentUser(founder);
      setActiveNav('overview');
      setSelectedProjectId(null);
      setSelectedTaskId(null);
      setSelectedClientId(null);
      setSelectedEmployeeId(null);

      try {
        localStorage.setItem(SESSION_KEY, founder.id);
      } catch {
        // ignore
      }

      addToast('Welcome, Founder', 'Authenticated as Fahim Ahmed (Executive Dashboard).', 'success');
      return { ok: true };
    }

    // 2. Client, Employee, and Manager Role-Based Authentication
    const deleted = getDeletedIds();

    // Check in users
    let targetUser = snapshot.users.find(
      (u) =>
        u.email.toLowerCase() === cleanEmail ||
        (u.altEmail && u.altEmail.toLowerCase() === cleanEmail)
    );

    // If not found in users, check if a registered client exists in snapshot.clients
    if (!targetUser) {
      const targetClient = snapshot.clients.find(
        (c) => c.email.toLowerCase() === cleanEmail
      );
      if (targetClient && !deleted.has(targetClient.id)) {
        if (targetClient.password && targetClient.password !== cleanPass) {
          return { ok: false, error: 'Invalid password or access token for this client account.' };
        }
        const initials =
          targetClient.name
            .split(' ')
            .map((p) => p[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'CL';
        targetUser = {
          id: `usr_cli_${targetClient.id}`,
          name: targetClient.name,
          email: targetClient.email.toLowerCase(),
          phone: targetClient.phone,
          role: 'CLIENT',
          title: `${targetClient.company} Client Portal`,
          client_id: targetClient.id,
          avatarInitials: initials,
          avatarColor: 'bg-slate-700 text-white',
          timezone: 'Asia/Dhaka (GMT+6)',
          availability: 'Available',
          weeklyCapacityHours: 0,
          performanceScore: 100,
          joined_at: TODAY_STR,
          password: targetClient.password || cleanPass,
        };
        commitSnapshot((db) => {
          if (!db.users.some((u) => u.id === targetUser!.id)) {
            db.users.push(targetUser!);
          }
          return db;
        });
      }
    }

    if (!targetUser) {
      return {
        ok: false,
        error: 'Invalid credentials. No active user account found with this email.',
      };
    }

    // Verify deletion status
    if (deleted.has(targetUser.id) || (targetUser.client_id && deleted.has(targetUser.client_id))) {
      return {
        ok: false,
        error: 'This account has been deleted by the Founder. Access revoked.',
      };
    }

    // Single founder rule: no other user can authenticate as FOUNDER
    if (targetUser.role === 'FOUNDER') {
      return {
        ok: false,
        error: 'Invalid founder account. Single founder policy active.',
      };
    }

    // Verify Password / Token
    const expectedPassword = targetUser.password;
    if (expectedPassword) {
      if (expectedPassword !== cleanPass) {
        return { ok: false, error: 'Invalid password or access token for this account.' };
      }
    } else {
      const validSeedPasswords = ['demo1234', '123456', `${targetUser.role.toLowerCase()}123`];
      if (!validSeedPasswords.includes(cleanPass)) {
        return { ok: false, error: 'Invalid password. Please check your credentials.' };
      }
    }

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
      `Authenticated as ${targetUser.name}`,
      `Role-based access: ${targetUser.role} Dashboard active.`,
      'success'
    );
    return { ok: true };
  };

  const signUpWithCredentials = async (
    email: string,
    password: string,
    name: string,
    role: Role = 'EMPLOYEE',
    title = 'Agency Specialist'
  ): Promise<{ ok: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !name.trim()) {
      return { ok: false, error: 'Please provide full name and valid email address.' };
    }
    if (!password || password.length < 6) {
      return { ok: false, error: 'Password must be at least 6 characters.' };
    }

    const regResult = await SupabaseService.signUpWithEmail(cleanEmail, password, name.trim(), role, title);
    if (!regResult.ok || !regResult.user) {
      return { ok: false, error: regResult.error || 'Registration failed.' };
    }

    const newUser = regResult.user;
    setCurrentUser(newUser);
    setActiveNav('overview');
    try {
      localStorage.setItem(SESSION_KEY, newUser.id);
    } catch {
      // ignore
    }

    commitSnapshot((db) => {
      if (!db.users.some((u) => u.id === newUser.id)) {
        db.users.unshift(newUser);
      }
      return db;
    });

    addToast(
      'Account Created Successfully',
      `Welcome to AgencyOS, ${newUser.name}!`,
      'success'
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
    SupabaseService.signOut().catch(() => {});
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
    const newId = generateUUID();
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
            id: generateUUID(),
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
              { id: generateUUID(), text: 'Complete discovery & initial setup', completed: false },
              { id: generateUUID(), text: 'Peer review & manager QA sign-off', completed: false },
            ],
            comments: [],
            created_by: currentUser?.id || 'usr_founder_01',
            created_at: TODAY_STR,
            updated_at: TODAY_STR,
          });
        });

        tpl.defaultMilestones.forEach((msTitle, idx) => {
          db.milestones.push({
            id: generateUUID(),
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
    SupabaseService.saveProject(newProject).catch(() => {});
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
    SupabaseService.updateProjectProgress(projectId, bounded).catch(() => {});
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
    recordDeletedId(projectId);
    let prjToDelete: Project | undefined;
    commitSnapshot((db) => {
      prjToDelete = db.projects.find((p) => p.id === projectId);
      db.projects = db.projects.filter((p) => p.id !== projectId);
      const tasksToRemove = db.tasks.filter((t) => t.project_id === projectId);
      tasksToRemove.forEach((t) => recordDeletedId(t.id));
      db.tasks = db.tasks.filter((t) => t.project_id !== projectId);
      if (prjToDelete) {
        db.activities.unshift({
          id: generateUUID(),
          actor_id: currentUser?.id || 'usr_founder_01',
          action: 'archived & removed project',
          targetType: 'Project',
          targetName: prjToDelete.name,
          visibility: 'Internal',
          created_at: `${TODAY_STR} 11:40`,
        });
      }
      return db;
    });
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);
    }
    SupabaseService.deleteProject(projectId, prjToDelete?.code).catch(() => {});
    addToast('Project Removed', `Project ${prjToDelete?.code || ''} and its tasks were removed.`, 'warning');
  };

  const createTask = (input: CreateTaskInput): Task => {
    let project = snapshot.projects.find((p) => p.id === input.project_id) || snapshot.projects[0];
    let createdFallbackProject: Project | null = null;

    if (!project) {
      // If there are no projects in the workspace, auto-create a default operations project
      const fallbackClientId = snapshot.clients[0]?.id || 'cli_001';
      const fallbackDeptId = snapshot.departments[0]?.id || 'dept_001';
      const fallbackManagerId =
        snapshot.users.find((u) => u.role === 'MANAGER' || u.role === 'FOUNDER')?.id ||
        currentUser?.id ||
        'usr_founder_01';

      createdFallbackProject = {
        id: generateUUID(),
        name: 'General Agency Operations',
        code: 'PRJ-101',
        description: 'Agency sprint tasks and client execution workspace',
        objectives: ['Complete delivery sprints on schedule', 'Maintain client satisfaction'],
        client_id: fallbackClientId,
        department_id: fallbackDeptId,
        manager_id: fallbackManagerId,
        employee_ids: [input.assigned_to || currentUser?.id || 'usr_emp_01'],
        status: 'Active',
        priority: 'High',
        projectType: 'General Retainer',
        budgetBdt: 150000,
        spentBdt: 0,
        start_date: TODAY_STR,
        deadline: '2026-12-31',
        created_at: TODAY_STR,
        updated_at: TODAY_STR,
        transferHistory: [],
      };
      project = createdFallbackProject;
    }

    const newTask: Task = {
      id: generateUUID(),
      code: `TSK-${401 + snapshot.tasks.length}`,
      title: input.title,
      description: input.description,
      project_id: project.id,
      client_id: project.client_id,
      department_id: project.department_id,
      assigned_to: input.assigned_to || currentUser?.id || 'usr_emp_01',
      assigned_manager_id: project.manager_id,
      priority: input.priority,
      status: 'To Do',
      due_date: input.due_date || TODAY_STR,
      estimatedHours: input.estimatedHours || 8,
      actualHours: 0,
      tags: input.tags.length > 0 ? input.tags : ['Execution'],
      checklist: [
        { id: generateUUID(), text: 'Review brief & specifications', completed: false },
        { id: generateUUID(), text: 'Submit deliverable for QA review', completed: false },
      ],
      comments: [],
      created_by: currentUser?.id || 'usr_mgr_01',
      created_at: TODAY_STR,
      updated_at: TODAY_STR,
    };

    commitSnapshot((db) => {
      if (createdFallbackProject) {
        db.projects.unshift(createdFallbackProject);
      }
      db.tasks.unshift(newTask);
      const prj = db.projects.find((p) => p.id === project.id);
      if (prj && !prj.employee_ids.includes(newTask.assigned_to)) {
        prj.employee_ids.push(newTask.assigned_to);
      }

      const assignee = db.users.find((u) => u.id === newTask.assigned_to);
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
        user_id: newTask.assigned_to,
        type: 'TASK_ASSIGNED',
        title: `New Task Assigned: ${newTask.code}`,
        description: `${newTask.title} (Due ${newTask.due_date})`,
        linkProject_id: project.id,
        read: false,
        created_at: 'Just now',
      });

      return db;
    });

    if (createdFallbackProject) {
      SupabaseService.saveProject(createdFallbackProject).catch(() => {});
    }

    addToast('Task Assigned', `${newTask.code} assigned and synced to specialist queue.`);
    SupabaseService.saveTask(newTask).catch(() => {});
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

  const deleteTask = (taskId: string) => {
    recordDeletedId(taskId);
    let taskToDelete: Task | undefined;
    commitSnapshot((db) => {
      taskToDelete = db.tasks.find((t) => t.id === taskId);
      db.tasks = db.tasks.filter((t) => t.id !== taskId);
      if (taskToDelete) {
        db.activities.unshift({
          id: generateUUID(),
          actor_id: currentUser?.id || 'usr_founder_01',
          action: 'deleted task',
          targetType: 'Task',
          targetName: taskToDelete.title,
          project_id: taskToDelete.project_id,
          client_id: taskToDelete.client_id,
          visibility: 'Internal',
          created_at: `${TODAY_STR} 12:00`,
        });
      }
      return db;
    });
    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
    }
    SupabaseService.deleteTask(taskId, taskToDelete?.code).catch(() => {});
    addToast('Task Deleted', `Task ${taskToDelete?.code || ''} removed from workspace & database.`, 'warning');
  };

  const createLead = (input: CreateLeadInput) => {
    const newLead: Lead = {
      id: generateUUID(),
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

    commitSnapshot((db) => {
      db.leads.unshift(newLead);
      db.activities.unshift({
        id: generateUUID(),
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
    SupabaseService.saveLead(newLead).catch(() => {});
  };

  const updateLeadStatus = (leadId: string, status: LeadStatus) => {
    commitSnapshot((db) => {
      const lead = db.leads.find((l) => l.id === leadId);
      if (lead) {
        lead.status = status;
        lead.last_contact = TODAY_STR;
        db.activities.unshift({
          id: generateUUID(),
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
      id: generateUUID(),
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
        id: generateUUID(),
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
    SupabaseService.saveClient(newClient).catch(() => {});
    return newClient;
  };

  const deleteLead = (leadId: string) => {
    recordDeletedId(leadId);
    let leadToDelete: Lead | undefined;
    commitSnapshot((db) => {
      leadToDelete = db.leads.find((l) => l.id === leadId);
      db.leads = db.leads.filter((l) => l.id !== leadId);
      if (leadToDelete) {
        db.activities.unshift({
          id: generateUUID(),
          actor_id: currentUser?.id || 'usr_founder_01',
          action: 'removed CRM lead',
          targetType: 'Lead',
          targetName: leadToDelete.company,
          visibility: 'Internal',
          created_at: `${TODAY_STR} 12:20`,
        });
      }
      return db;
    });
    SupabaseService.deleteLead(leadId, leadToDelete?.company).catch(() => {});
    addToast('Lead Removed', `${leadToDelete?.company || 'Lead'} removed from pipeline & database.`, 'info');
  };

  const createClient = (input: CreateClientInput): Client => {
    const cleanEmail = input.email.trim().toLowerCase();
    const clientPass = input.password?.trim() || `client-${Date.now().toString().slice(-4)}`;

    const newClient: Client = {
      id: generateUUID(),
      name: input.name.trim(),
      company: input.company.trim(),
      email: cleanEmail,
      phone: input.phone.trim() || '+880 1711-555555',
      industry: input.industry,
      status: 'Active',
      manager_id: input.manager_id,
      totalValueBdt: input.totalValueBdt,
      joined_date: TODAY_STR,
      website: input.website || 'https://example.com',
      notes: input.notes,
      password: clientPass,
    };

    const initials =
      input.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'CL';

    // Provision matching User with CLIENT role so client can log in
    const clientUser: User = {
      id: `usr_cli_${newClient.id}`,
      name: input.name.trim(),
      email: cleanEmail,
      phone: input.phone.trim() || '+880 1711-555555',
      role: 'CLIENT',
      title: `${input.company.trim()} Client Stakeholder`,
      client_id: newClient.id,
      password: clientPass,
      avatarInitials: initials,
      avatarColor: 'bg-slate-700 text-white',
      timezone: 'Asia/Dhaka (GMT+6)',
      availability: 'Available',
      weeklyCapacityHours: 0,
      performanceScore: 100,
      joined_at: TODAY_STR,
    };

    commitSnapshot((db) => {
      db.clients.unshift(newClient);
      // Remove any existing user with same email to avoid collisions
      db.users = db.users.filter((u) => u.email.toLowerCase() !== cleanEmail);
      db.users.unshift(clientUser);

      db.activities.unshift({
        id: generateUUID(),
        actor_id: currentUser?.id || 'usr_founder_01',
        action: 'onboarded new client organization with credentials',
        targetType: 'Client',
        targetName: newClient.company,
        client_id: newClient.id,
        visibility: 'Internal',
        created_at: `${TODAY_STR} 12:20`,
      });
      return db;
    });

    addToast(
      'Client Onboarded',
      `${newClient.company} onboarded with portal access (${cleanEmail}). Password/token registered.`,
      'success'
    );
    SupabaseService.saveClient(newClient).catch(() => {});
    return newClient;
  };

  const deleteClient = (clientId: string) => {
    recordDeletedId(clientId);
    let clientToDelete: Client | undefined;
    commitSnapshot((db) => {
      clientToDelete = db.clients.find((c) => c.id === clientId);
      db.clients = db.clients.filter((c) => c.id !== clientId);

      // Permanently remove and revoke credentials for this client's user account
      const clientUsers = db.users.filter(
        (u) =>
          u.client_id === clientId ||
          (clientToDelete && u.email.toLowerCase() === clientToDelete.email.toLowerCase())
      );
      clientUsers.forEach((u) => recordDeletedId(u.id));
      db.users = db.users.filter(
        (u) =>
          u.client_id !== clientId &&
          (!clientToDelete || u.email.toLowerCase() !== clientToDelete.email.toLowerCase())
      );

      // Remove associated projects and their tasks
      const deletedProjectIds = new Set(
        db.projects.filter((p) => p.client_id === clientId).map((p) => p.id)
      );
      deletedProjectIds.forEach((pid) => recordDeletedId(pid));
      db.projects = db.projects.filter((p) => p.client_id !== clientId);
      const tasksToRemove = db.tasks.filter(
        (t) => t.client_id === clientId || deletedProjectIds.has(t.project_id)
      );
      tasksToRemove.forEach((t) => recordDeletedId(t.id));
      db.tasks = db.tasks.filter(
        (t) => t.client_id !== clientId && !deletedProjectIds.has(t.project_id)
      );
      if (clientToDelete) {
        db.activities.unshift({
          id: generateUUID(),
          actor_id: currentUser?.id || 'usr_founder_01',
          action: 'removed client account and revoked credentials',
          targetType: 'Client',
          targetName: clientToDelete.company,
          visibility: 'Internal',
          created_at: `${TODAY_STR} 12:25`,
        });
      }
      return db;
    });
    if (selectedClientId === clientId) {
      setSelectedClientId(null);
    }
    SupabaseService.deleteClient(clientId, clientToDelete?.company).catch(() => {});
    addToast(
      'Client & Credentials Deleted',
      `${clientToDelete?.company || 'Client'} removed. Portal access permanently revoked.`,
      'info'
    );
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
      const prjId = prj?.id || projectId || 'prj_general';
      const prjClientId = prj?.client_id || snapshot.clients[0]?.id || 'cli_001';
      const prjName = prj?.name || 'Workspace';

      db.messages.push({
        id: `msg_${Date.now()}`,
        project_id: prjId,
        client_id: prjClientId,
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
        targetName: prjName,
        project_id: prjId,
        client_id: prjClientId,
        visibility: visibility === 'Client-visible' ? 'Client-safe' : 'Internal',
        created_at: `${TODAY_STR} 12:30`,
      });

      return db;
    });
    addToast('Message Sent', visibility === 'Internal' ? 'Posted to internal team channel.' : 'Delivered to client thread.');
    const targetPrj = snapshot.projects.find((p) => p.id === projectId) || snapshot.projects[0];
    SupabaseService.saveMessage({
      id: `msg_${Date.now()}`,
      project_id: targetPrj?.id || projectId,
      client_id: targetPrj?.client_id || '',
      sender_id: currentUser?.id || 'usr_founder_01',
      channel: visibility === 'Internal' ? 'Internal Team' : channel,
      visibility,
      content: content.trim(),
      mentions: [],
      attachments: [],
      unreadBy: [],
      created_at: new Date().toISOString(),
    }).catch(() => {});
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
      const prjId = prj?.id || projectId || 'prj_general';
      const prjClientId = prj?.client_id || snapshot.clients[0]?.id || 'cli_001';
      const ext = name.split('.').pop()?.toUpperCase() || 'PDF';
      const newFile: AgencyFile = {
        id: `fil_${Date.now()}`,
        project_id: prjId,
        client_id: prjClientId,
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
        project_id: prjId,
        client_id: prjClientId,
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
      if (!task) return db;
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
    const newDept: Department = {
      id: generateUUID(),
      name,
      code: code.toUpperCase(),
      description,
      manager_id: managerId,
      monthlyBudgetBdt: budgetBdt,
      created_at: TODAY_STR,
    };
    commitSnapshot((db) => {
      db.departments.push(newDept);
      return db;
    });
    SupabaseService.saveDepartment(newDept).catch(() => {});
    addToast('Department Created', `${name} (${code.toUpperCase()}) is now active.`);
  };

  const deleteDepartment = (departmentId: string) => {
    recordDeletedId(departmentId);
    let deptToDelete: Department | undefined;
    commitSnapshot((db) => {
      deptToDelete = db.departments.find((d) => d.id === departmentId);
      db.departments = db.departments.filter((d) => d.id !== departmentId);
      const fallbackDeptId = db.departments[0]?.id || 'dept_001';
      db.users = db.users.map((u) =>
        u.department_id === departmentId ? { ...u, department_id: fallbackDeptId } : u
      );
      db.projects = db.projects.map((p) =>
        p.department_id === departmentId ? { ...p, department_id: fallbackDeptId } : p
      );
      if (deptToDelete) {
        db.activities.unshift({
          id: generateUUID(),
          actor_id: currentUser?.id || 'usr_founder_01',
          action: 'removed department',
          targetType: 'Team',
          targetName: deptToDelete.name,
          visibility: 'Internal',
          created_at: `${TODAY_STR} 12:45`,
        });
      }
      return db;
    });
    SupabaseService.deleteDepartment(departmentId, deptToDelete?.code).catch(() => {});
    addToast('Department Deleted', `${deptToDelete?.name || 'Department'} removed from organization & database.`, 'warning');
  };

  const createTeamMember = (
    name: string,
    email: string,
    role: 'MANAGER' | 'EMPLOYEE',
    title: string,
    departmentId: string,
    password?: string
  ) => {
    const cleanEmail = email.trim().toLowerCase();
    const userPass = password?.trim() || `${role.toLowerCase()}-${Date.now().toString().slice(-4)}`;
    const initials = name
      .trim()
      .split(' ')
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'AG';

    let newUser: User;
    commitSnapshot((db) => {
      const dept = db.departments.find((d) => d.id === departmentId);
      newUser = {
        id: generateUUID(),
        name: name.trim(),
        email: cleanEmail,
        phone: '+880 1711-000000',
        role,
        title: title.trim(),
        department_id: departmentId,
        manager_id: dept?.manager_id || 'usr_mgr_01',
        avatarInitials: initials,
        avatarColor: role === 'MANAGER' ? 'bg-indigo-600 text-white' : 'bg-teal-600 text-white',
        timezone: 'Asia/Dhaka (GMT+6)',
        availability: 'Available',
        weeklyCapacityHours: 40,
        performanceScore: 90,
        joined_at: TODAY_STR,
        password: userPass,
      };
      // Prevent duplicate emails
      db.users = db.users.filter((u) => u.email.toLowerCase() !== cleanEmail);
      db.users.push(newUser);
      db.activities.unshift({
        id: generateUUID(),
        actor_id: currentUser?.id || 'usr_founder_01',
        action: `added new ${role.toLowerCase()} with credentials to agency roster`,
        targetType: 'Team',
        targetName: `${name} (${title})`,
        visibility: 'Internal',
        created_at: `${TODAY_STR} 12:40`,
      });
      return db;
    });
    if (newUser!) {
      SupabaseService.saveMember(newUser).catch(() => {});
    }
    addToast(
      'Team Member Added',
      `${name} registered as ${role} (${cleanEmail}). Login credentials active.`,
      'success'
    );
  };

  const deleteTeamMember = (memberId: string) => {
    recordDeletedId(memberId);
    let memberToDelete: User | undefined;
    commitSnapshot((db) => {
      memberToDelete = db.users.find((u) => u.id === memberId);
      db.users = db.users.filter((u) => u.id !== memberId);
      const fallbackAssignee =
        db.users.find((u) => u.role === 'FOUNDER' || u.role === 'MANAGER')?.id || 'usr_founder_01';
      db.tasks = db.tasks.map((t) =>
        t.assigned_to === memberId ? { ...t, assigned_to: fallbackAssignee } : t
      );
      db.projects = db.projects.map((p) => ({
        ...p,
        employee_ids: p.employee_ids.filter((id) => id !== memberId),
      }));
      if (memberToDelete) {
        db.activities.unshift({
          id: generateUUID(),
          actor_id: currentUser?.id || 'usr_founder_01',
          action: 'removed team member and revoked credentials',
          targetType: 'Team',
          targetName: memberToDelete.name,
          visibility: 'Internal',
          created_at: `${TODAY_STR} 12:50`,
        });
      }
      return db;
    });
    if (selectedEmployeeId === memberId) {
      setSelectedEmployeeId(null);
    }
    SupabaseService.deleteMember(memberId, memberToDelete?.email).catch(() => {});
    addToast(
      'Member Removed',
      `${memberToDelete?.name || 'Member'} removed from agency roster. Login credentials permanently revoked.`,
      'info'
    );
  };

  const createCalendarEvent = (
    title: string,
    category: CalendarEvent['category'],
    date: string,
    timeLabel: string,
    projectId?: string,
    visibility: 'Internal' | 'Client-visible' = 'Internal'
  ) => {
    let newEvt: CalendarEvent;
    commitSnapshot((db) => {
      const prj = projectId ? db.projects.find((p) => p.id === projectId) : undefined;
      newEvt = {
        id: generateUUID(),
        title,
        category,
        date,
        timeLabel,
        project_id: projectId,
        client_id: prj?.client_id,
        visibility,
        attendee_ids: [currentUser?.id || 'usr_founder_01'],
      };
      db.calendarEvents.push(newEvt);
      return db;
    });
    if (newEvt!) {
      SupabaseService.saveCalendarEvent(newEvt).catch(() => {});
    }
    addToast('Calendar Event Scheduled', `${title} scheduled for ${date}.`);
  };

  const deleteCalendarEvent = (eventId: string) => {
    recordDeletedId(eventId);
    let eventToDelete: CalendarEvent | undefined;
    commitSnapshot((db) => {
      eventToDelete = db.calendarEvents.find((e) => e.id === eventId);
      db.calendarEvents = db.calendarEvents.filter((e) => e.id !== eventId);
      return db;
    });
    SupabaseService.deleteCalendarEvent(eventId, eventToDelete?.title).catch(() => {});
    addToast('Event Removed', 'Calendar event removed from schedule & database.', 'info');
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
        signUpWithCredentials,
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
        quickCreateInitialMode,
        openQuickCreate,
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
        deleteTask,
        createLead,
        updateLeadStatus,
        convertLeadToClient,
        deleteLead,
        createClient,
        deleteClient,
        decideApproval,
        sendMessage,
        uploadFile,
        toggleFileVisibility,
        deleteFile,
        logTimeEntry,
        createDepartment,
        deleteDepartment,
        createTeamMember,
        deleteTeamMember,
        createCalendarEvent,
        deleteCalendarEvent,
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
