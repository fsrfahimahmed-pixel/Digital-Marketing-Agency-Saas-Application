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
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AgencyDatabaseSnapshot;
        if (parsed && typeof parsed === 'object') {
          return {
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
        }
      }
    } catch {
      // Fallback to seed snapshot if localStorage is restricted
    }
    // Filter initial snapshot by any recorded deletions
    return {
      ...initial,
      tasks: initial.tasks.filter((t) => !deleted.has(t.id)),
      projects: initial.projects.filter((p) => !deleted.has(p.id)),
      clients: initial.clients.filter((c) => !deleted.has(c.id)),
      leads: initial.leads.filter((l) => !deleted.has(l.id)),
      users: initial.users.filter((u) => !deleted.has(u.id)),
      departments: initial.departments.filter((d) => !deleted.has(d.id)),
      calendarEvents: initial.calendarEvents.filter((e) => !deleted.has(e.id)),
    };
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
