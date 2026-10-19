import {
  SEED_ACTIVITIES,
  SEED_APPROVALS,
  SEED_AUTOMATIONS,
  SEED_CALENDAR_EVENTS,
  SEED_CLIENTS,
  SEED_DELIVERABLES,
  SEED_DEPARTMENTS,
  SEED_FILES,
  SEED_INVOICES,
  SEED_LEADS,
  SEED_MESSAGES,
  SEED_MILESTONES,
  SEED_NOTIFICATIONS,
  SEED_PROJECTS,
  SEED_TASKS,
  SEED_TEMPLATES,
  SEED_TIME_ENTRIES,
  SEED_USERS,
} from '../data/seedData';
import {
  ActivityLog,
  AgencyFile,
  ApprovalItem,
  AutomationWorkflow,
  CalendarEvent,
  Client,
  Deliverable,
  Department,
  Invoice,
  Lead,
  Message,
  Milestone,
  NotificationItem,
  Project,
  ProjectTemplate,
  Task,
  TimeEntry,
  User,
} from '../types/domain';

export interface AgencyDatabaseSnapshot {
  users: User[];
  departments: Department[];
  clients: Client[];
  leads: Lead[];
  projects: Project[];
  tasks: Task[];
  milestones: Milestone[];
  deliverables: Deliverable[];
  approvals: ApprovalItem[];
  files: AgencyFile[];
  messages: Message[];
  notifications: NotificationItem[];
  calendarEvents: CalendarEvent[];
  timeEntries: TimeEntry[];
  invoices: Invoice[];
  activities: ActivityLog[];
  templates: ProjectTemplate[];
  automations: AutomationWorkflow[];
}

export interface IAgencyRepository {
  getSnapshot(): AgencyDatabaseSnapshot;
  saveSnapshot(snapshot: AgencyDatabaseSnapshot): void;
  resetToSeed(): AgencyDatabaseSnapshot;
}

const STORAGE_KEY = 'agencyos_v1_repository_state';
const DELETED_IDS_KEY = 'agencyos_deleted_ids_v1';

export function getDeletedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_IDS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {
    // ignore
  }
  return new Set();
}

export function recordDeletedId(id: string): void {
  if (!id) return;
  try {
    const set = getDeletedIds();
    set.add(id);
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
}

function createInitialSnapshot(): AgencyDatabaseSnapshot {
  return {
    users: structuredClone(SEED_USERS),
    departments: structuredClone(SEED_DEPARTMENTS),
    clients: structuredClone(SEED_CLIENTS),
    leads: structuredClone(SEED_LEADS),
    projects: structuredClone(SEED_PROJECTS),
    tasks: structuredClone(SEED_TASKS),
    milestones: structuredClone(SEED_MILESTONES),
    deliverables: structuredClone(SEED_DELIVERABLES),
    approvals: structuredClone(SEED_APPROVALS),
    files: structuredClone(SEED_FILES),
    messages: structuredClone(SEED_MESSAGES),
    notifications: structuredClone(SEED_NOTIFICATIONS),
    calendarEvents: structuredClone(SEED_CALENDAR_EVENTS),
    timeEntries: structuredClone(SEED_TIME_ENTRIES),
    invoices: structuredClone(SEED_INVOICES),
    activities: structuredClone(SEED_ACTIVITIES),
    templates: structuredClone(SEED_TEMPLATES),
    automations: structuredClone(SEED_AUTOMATIONS),
  };
}

class MockAgencyRepository implements IAgencyRepository {
  private memorySnapshot: AgencyDatabaseSnapshot;

  constructor() {
    this.memorySnapshot = this.loadFromStorage();
  }

  private loadFromStorage(): AgencyDatabaseSnapshot {
    const initial = createInitialSnapshot();
    const deleted = getDeletedIds();
    let loaded: AgencyDatabaseSnapshot;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AgencyDatabaseSnapshot;
        if (parsed && typeof parsed === 'object') {
          loaded = {
            users: Array.isArray(parsed.users)
              ? parsed.users.filter((u) => !deleted.has(u.id))
              : initial.users,
            departments: Array.isArray(parsed.departments)
              ? parsed.departments.filter((d) => !deleted.has(d.id))
              : initial.departments,
            clients: Array.isArray(parsed.clients)
              ? parsed.clients.filter((c) => !deleted.has(c.id))
              : initial.clients,
            leads: Array.isArray(parsed.leads)
              ? parsed.leads.filter((l) => !deleted.has(l.id))
              : initial.leads,
            projects: Array.isArray(parsed.projects)
              ? parsed.projects.filter((p) => !deleted.has(p.id))
              : initial.projects,
            tasks: Array.isArray(parsed.tasks)
              ? parsed.tasks.filter((t) => !deleted.has(t.id))
              : initial.tasks,
            milestones: Array.isArray(parsed.milestones) ? parsed.milestones : initial.milestones,
            deliverables: Array.isArray(parsed.deliverables) ? parsed.deliverables : initial.deliverables,
            approvals: Array.isArray(parsed.approvals) ? parsed.approvals : initial.approvals,
            files: Array.isArray(parsed.files)
              ? parsed.files.filter((f) => !deleted.has(f.id))
              : initial.files,
            messages: Array.isArray(parsed.messages) ? parsed.messages : initial.messages,
            notifications: Array.isArray(parsed.notifications) ? parsed.notifications : initial.notifications,
            calendarEvents: Array.isArray(parsed.calendarEvents)
              ? parsed.calendarEvents.filter((e) => !deleted.has(e.id))
              : initial.calendarEvents,
            timeEntries: Array.isArray(parsed.timeEntries) ? parsed.timeEntries : initial.timeEntries,
            invoices: Array.isArray(parsed.invoices) ? parsed.invoices : initial.invoices,
            activities: Array.isArray(parsed.activities) ? parsed.activities : initial.activities,
            templates: Array.isArray(parsed.templates) ? parsed.templates : initial.templates,
            automations: Array.isArray(parsed.automations) ? parsed.automations : initial.automations,
          };
        } else {
          loaded = initial;
        }
      } else {
        loaded = initial;
      }
    } catch {
      loaded = initial;
    }

    // Filter by any recorded deletions
    loaded.tasks = loaded.tasks.filter((t) => !deleted.has(t.id));
    loaded.projects = loaded.projects.filter((p) => !deleted.has(p.id));
    loaded.clients = loaded.clients.filter((c) => !deleted.has(c.id));
    loaded.leads = loaded.leads.filter((l) => !deleted.has(l.id));
    loaded.users = loaded.users.filter((u) => !deleted.has(u.id));
    loaded.calendarEvents = loaded.calendarEvents.filter((e) => !deleted.has(e.id));

    // ALWAYS enforce the EXACT 5 standard agency departments requested by user:
    // 01 — Graphic Design (Graphic World)
    // 02 — Digital Marketing
    // 03 — Social Media Management
    // 04 — Creative Marketing
    // 05 — Shopifi
    loaded.departments = structuredClone(SEED_DEPARTMENTS);

    // Map any projects, tasks, or users with outdated or missing department IDs to valid 01-05 departments
    const validDeptIds = new Set(SEED_DEPARTMENTS.map((d) => d.id));
    const mapDeptId = (id: string | undefined): string => {
      if (!id || !validDeptIds.has(id)) {
        if (id === 'dept_006') return 'dept_005';
        if (id === 'dept_007') return 'dept_004';
        if (id === 'dept_008') return 'dept_001';
        if (id === 'dept_009') return 'dept_002';
        if (id === 'dept_010') return 'dept_003';
        return 'dept_001';
      }
      return id;
    };

    loaded.users = loaded.users.map((u) => ({
      ...u,
      department_id: u.department_id ? mapDeptId(u.department_id) : undefined,
    }));
    loaded.projects = loaded.projects.map((p) => ({
      ...p,
      department_id: mapDeptId(p.department_id),
    }));
    loaded.tasks = loaded.tasks.map((t) => ({
      ...t,
      department_id: t.department_id ? mapDeptId(t.department_id) : undefined,
    }));

    // Guarantee: ONLY ONE Founder - Fahim Ahmed (fsrfahimahmed@gmail.com, pass 999888)
    const founderUser: User = {
      id: 'usr_founder_01',
      name: 'Fahim Ahmed',
      email: 'fsrfahimahmed@gmail.com',
      altEmail: 'fsrfahimahmed@gmail.com',
      phone: '+880 1711-999888',
      role: 'FOUNDER',
      title: 'Founder & CEO',
      password: '999888',
      department_id: 'dept_001',
      avatarInitials: 'FA',
      avatarColor: 'bg-indigo-600 text-white',
      timezone: 'Asia/Dhaka (GMT+6)',
      availability: 'Available',
      weeklyCapacityHours: 45,
      performanceScore: 100,
      joined_at: '2023-01-01',
    };

    // Replace or insert founder
    const existingFounderIdx = loaded.users.findIndex(
      (u) => u.id === 'usr_founder_01' || u.role === 'FOUNDER' || u.email === 'fsrfahimahmed@gmail.com'
    );
    if (existingFounderIdx >= 0) {
      loaded.users[existingFounderIdx] = {
        ...loaded.users[existingFounderIdx],
        ...founderUser,
      };
    } else {
      loaded.users.unshift(founderUser);
    }

    // Strip any other user from being FOUNDER to guarantee single founder policy
    loaded.users = loaded.users.filter(
      (u) => u.role !== 'FOUNDER' || u.email.toLowerCase() === 'fsrfahimahmed@gmail.com'
    );

    // Provide default passwords for existing seeded users if not yet set
    loaded.users = loaded.users.map((u) => {
      if (u.role === 'FOUNDER') {
        return { ...u, email: 'fsrfahimahmed@gmail.com', password: '999888' };
      }
      if (!u.password) {
        if (u.role === 'MANAGER') return { ...u, password: 'manager123' };
        if (u.role === 'EMPLOYEE') return { ...u, password: 'employee123' };
        if (u.role === 'CLIENT') return { ...u, password: 'client123' };
      }
      return u;
    });

    return loaded;
  }

  public getSnapshot(): AgencyDatabaseSnapshot {
    return this.memorySnapshot;
  }

  public saveSnapshot(snapshot: AgencyDatabaseSnapshot): void {
    this.memorySnapshot = snapshot;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Ignore storage quota errors
    }
  }

  public resetToSeed(): AgencyDatabaseSnapshot {
    try {
      localStorage.removeItem(DELETED_IDS_KEY);
    } catch {
      // ignore
    }
    const fresh = createInitialSnapshot();
    this.saveSnapshot(fresh);
    return fresh;
  }
}

export const agencyRepository: IAgencyRepository = new MockAgencyRepository();
