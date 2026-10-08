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
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AgencyDatabaseSnapshot;
        if (parsed && Array.isArray(parsed.projects) && Array.isArray(parsed.users)) {
          return parsed;
        }
      }
    } catch {
      // Fallback to seed snapshot if localStorage is restricted
    }
    return createInitialSnapshot();
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
    const fresh = createInitialSnapshot();
    this.saveSnapshot(fresh);
    return fresh;
  }
}

export const agencyRepository: IAgencyRepository = new MockAgencyRepository();
