export type Role = 'FOUNDER' | 'MANAGER' | 'EMPLOYEE' | 'CLIENT';

export type Permission =
  | 'view_dashboard'
  | 'manage_projects'
  | 'create_project'
  | 'edit_project'
  | 'transfer_project'
  | 'assign_project'
  | 'manage_employees'
  | 'manage_managers'
  | 'manage_clients'
  | 'manage_departments'
  | 'manage_tasks'
  | 'assign_tasks'
  | 'edit_own_tasks'
  | 'view_analytics'
  | 'view_finance'
  | 'manage_settings'
  | 'view_audit_logs'
  | 'send_client_message'
  | 'approve_project'
  | 'approve_deliverable'
  | 'view_client_project'
  | 'upload_project_file';

export type WorkloadStatus = 'Underutilized' | 'Balanced' | 'Busy' | 'Overloaded';
export type AvailabilityStatus = 'Available' | 'Focused' | 'In Meeting' | 'Near Capacity' | 'On Leave';

export interface User {
  id: string;
  name: string;
  email: string;
  altEmail?: string;
  phone: string;
  role: Role;
  title: string;
  department_id?: string;
  manager_id?: string;
  client_id?: string;
  avatarInitials: string;
  avatarColor: string;
  timezone: string;
  availability: AvailabilityStatus;
  weeklyCapacityHours: number;
  performanceScore: number; // 0 - 100
  joined_at: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  manager_id: string;
  monthlyBudgetBdt: number;
  created_at: string;
}

export type ClientStatus = 'Lead' | 'Active' | 'Paused' | 'Completed' | 'Inactive';

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  industry: string;
  status: ClientStatus;
  manager_id: string;
  totalValueBdt: number;
  joined_date: string;
  website: string;
  notes: string; // Internal only
}

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: 'Inbound SEO' | 'Meta Ads' | 'Referral' | 'LinkedIn Outbound' | 'Strategic Partner' | 'Webinar';
  service: string;
  potentialValueBdt: number;
  status: LeadStatus;
  assigned_manager_id: string;
  created_at: string;
  last_contact: string;
  notes: string;
}

export type ProjectStatus =
  | 'Lead'
  | 'Planning'
  | 'Active'
  | 'Review'
  | 'Client Approval'
  | 'Completed'
  | 'On Hold'
  | 'Cancelled';

export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
export type HealthLabel = 'Healthy' | 'At Risk' | 'Critical';

export interface ProjectTransferRecord {
  id: string;
  project_id: string;
  from_manager_id: string;
  to_manager_id: string;
  from_department_id: string;
  to_department_id: string;
  reason: string;
  transferred_by: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  description: string;
  objectives: string[];
  client_id: string;
  department_id: string;
  manager_id: string;
  employee_ids: string[];
  status: ProjectStatus;
  priority: Priority;
  projectType: string;
  budgetBdt: number;
  spentBdt: number;
  start_date: string;
  deadline: string;
  created_at: string;
  updated_at: string;
  transferHistory: ProjectTransferRecord[];
  customProgressPercent?: number;
}

export type TaskStatus = 'Backlog' | 'To Do' | 'In Progress' | 'Blocked' | 'Review' | 'Completed';

export interface TaskChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface Task {
  id: string;
  code: string;
  title: string;
  description: string;
  project_id: string;
  client_id: string;
  department_id: string;
  assigned_to: string;
  assigned_manager_id: string;
  priority: Priority;
  status: TaskStatus;
  due_date: string;
  estimatedHours: number;
  actualHours: number;
  tags: string[];
  checklist: TaskChecklistItem[];
  comments: TaskComment[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  due_date: string;
  status: 'Completed' | 'Current' | 'Upcoming';
  weight: number;
}

export type DeliverableStatus =
  | 'Draft'
  | 'Internal Review'
  | 'Ready for Client'
  | 'Client Approved'
  | 'Changes Requested'
  | 'Final';

export interface Deliverable {
  id: string;
  project_id: string;
  client_id: string;
  title: string;
  description: string;
  category: 'Creative Deck' | 'Ad Campaign' | 'SEO Audit' | 'Web Build' | 'Video Master' | 'Performance Report';
  status: DeliverableStatus;
  due_date: string;
  owner_id: string;
  clientFeedback?: string;
  updated_at: string;
}

export interface ApprovalItem {
  id: string;
  title: string;
  entityType: 'Deliverable' | 'Budget' | 'Project Handoff' | 'Campaign Launch';
  entity_id: string;
  project_id: string;
  client_id: string;
  requester_id: string;
  targetRole: 'CLIENT' | 'FOUNDER' | 'MANAGER';
  priority: Priority;
  status: 'Pending' | 'Approved' | 'Changes Requested' | 'Rejected';
  visibility: 'Internal' | 'Client-visible';
  notes: string;
  feedback?: string;
  created_at: string;
  updated_at: string;
}

export type FileCategory = 'Briefs' | 'Contracts' | 'Designs' | 'Reports' | 'Videos' | 'Documents' | 'Deliverables';

export interface AgencyFile {
  id: string;
  project_id: string;
  client_id: string;
  name: string;
  fileType: string;
  sizeLabel: string;
  uploaded_by: string;
  category: FileCategory;
  visibility: 'Internal' | 'Client-visible';
  created_at: string;
}

export interface Message {
  id: string;
  project_id: string;
  client_id: string;
  sender_id: string;
  channel: 'Client Thread' | 'Internal Team' | 'Executive Escalation';
  visibility: 'Internal' | 'Client-visible';
  content: string;
  mentions: string[];
  attachments: string[];
  unreadBy: string[];
  created_at: string;
}

export type NotificationType =
  | 'NEW_PROJECT'
  | 'PROJECT_ASSIGNED'
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  | 'DEADLINE_APPROACHING'
  | 'DEADLINE_MISSED'
  | 'CLIENT_MESSAGE'
  | 'CLIENT_APPROVAL_REQUIRED'
  | 'MANAGER_COMMENT'
  | 'FOUNDER_ANNOUNCEMENT';

export interface NotificationItem {
  id: string;
  user_id: string; // Or 'ALL_INTERNAL' | 'FOUNDER'
  type: NotificationType;
  title: string;
  description: string;
  linkProject_id?: string;
  read: boolean;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  category: 'Project Deadline' | 'Task Deadline' | 'Client Meeting' | 'Internal Review' | 'Deliverable Milestone';
  date: string; // YYYY-MM-DD
  timeLabel: string;
  project_id?: string;
  client_id?: string;
  visibility: 'Internal' | 'Client-visible';
  attendee_ids: string[];
}

export interface TimeEntry {
  id: string;
  user_id: string;
  task_id: string;
  project_id: string;
  date: string;
  hours: number;
  description: string;
}

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';

export interface Invoice {
  id: string;
  code: string;
  client_id: string;
  project_id: string;
  amountBdt: number;
  currency: 'BDT' | 'USD';
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  itemsSummary: string;
}

export interface ActivityLog {
  id: string;
  actor_id: string;
  action: string;
  targetType: 'Project' | 'Task' | 'Client' | 'Lead' | 'Approval' | 'File' | 'Team';
  targetName: string;
  project_id?: string;
  client_id?: string;
  visibility: 'Internal' | 'Client-safe';
  metadata?: string;
  created_at: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  projectType: string;
  default_department_id: string;
  estimatedDurationDays: number;
  defaultBudgetBdt: number;
  description: string;
  defaultTasks: {
    title: string;
    estimatedHours: number;
    priority: Priority;
    tags: string[];
  }[];
  defaultMilestones: string[];
}

export type AutomationEventType =
  | 'PROJECT_CREATED'
  | 'PROJECT_ASSIGNED'
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  | 'DEADLINE_APPROACHING'
  | 'CLIENT_MESSAGE_RECEIVED'
  | 'CLIENT_APPROVAL_REQUIRED'
  | 'PROJECT_COMPLETED'
  | 'NEW_LEAD'
  | 'EMPLOYEE_ADDED'
  | 'MANAGER_ASSIGNED';

export interface AutomationWorkflow {
  id: string;
  name: string;
  trigger: AutomationEventType;
  actionSummary: string;
  targetChannel: 'In-App + Email' | 'Slack + In-App' | 'WhatsApp + Client Portal' | 'n8n Webhook';
  status: 'Ready for integration' | 'Simulated Active';
  lastRun: string;
  executionsCount: number;
}
