import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  ActivityLog,
  AgencyFile,
  ApprovalItem,
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
  Role,
  Task,
  TimeEntry,
  User,
} from '../types/domain';
import { AgencyDatabaseSnapshot } from '../repositories/agencyRepository';

export interface AuthResult {
  ok: boolean;
  user?: User;
  error?: string;
}

export const SupabaseService = {
  /**
   * Real Supabase Authentication: sign in with email and password
   */
  async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    if (!isSupabaseConfigured) {
      return {
        ok: false,
        error: 'Supabase credentials are not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        return { ok: false, error: error.message };
      }

      if (!data.user) {
        return { ok: false, error: 'User account not found.' };
      }

      // Fetch profile from public.profiles table
      const profile = await this.fetchProfile(data.user.id, data.user.email || email);
      return { ok: true, user: profile };
    } catch (err: any) {
      return { ok: false, error: err.message || 'An unexpected authentication error occurred.' };
    }
  },

  /**
   * Real Supabase Authentication: sign up new user
   */
  async signUpWithEmail(
    email: string,
    password: string,
    name: string,
    role: Role = 'EMPLOYEE',
    title = 'Agency Specialist'
  ): Promise<AuthResult> {
    if (!isSupabaseConfigured) {
      return { ok: false, error: 'Supabase is not configured.' };
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            name,
            role,
            title,
          },
        },
      });

      if (error) {
        return { ok: false, error: error.message };
      }

      if (!data.user) {
        return { ok: false, error: 'User registration failed.' };
      }

      // Upsert profile in public.profiles table
      const avatarInitials = name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      const userRecord: User = {
        id: data.user.id,
        name,
        email: cleanEmail,
        phone: '+880 1700-000000',
        role,
        title,
        avatarInitials: avatarInitials || 'AG',
        avatarColor: '#6366f1',
        timezone: 'Asia/Dhaka',
        availability: 'Available',
        weeklyCapacityHours: 40,
        performanceScore: 92,
        joined_at: new Date().toISOString().split('T')[0],
      };

      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: cleanEmail,
        name,
        role,
        title,
        avatar_initials: avatarInitials,
        avatar_color: '#6366f1',
        timezone: 'Asia/Dhaka',
        availability: 'Available',
        weekly_capacity_hours: 40,
        performance_score: 92,
      });

      return { ok: true, user: userRecord };
    } catch (err: any) {
      return { ok: false, error: err.message || 'Registration failed.' };
    }
  },

  /**
   * Sign out current Supabase user
   */
  async signOut(): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
  },

  /**
   * Get current Supabase session on startup
   */
  async getCurrentSessionUser(): Promise<User | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) return null;
      return await this.fetchProfile(data.session.user.id, data.session.user.email || '');
    } catch {
      return null;
    }
  },

  /**
   * Fetch user profile from public.profiles or construct from auth user
   */
  async fetchProfile(userId: string, defaultEmail: string): Promise<User> {
    const defaultUser: User = {
      id: userId,
      name: defaultEmail.split('@')[0] || 'Agency Member',
      email: defaultEmail,
      phone: '+880 1711-000000',
      role: 'FOUNDER',
      title: 'Managing Partner',
      avatarInitials: (defaultEmail[0] || 'A').toUpperCase(),
      avatarColor: '#6366f1',
      timezone: 'Asia/Dhaka',
      availability: 'Available',
      weeklyCapacityHours: 40,
      performanceScore: 95,
      joined_at: '2026-01-01',
    };

    if (!isSupabaseConfigured) return defaultUser;

    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        return {
          id: data.id,
          name: data.name || defaultUser.name,
          email: data.email || defaultEmail,
          phone: data.phone || defaultUser.phone,
          role: (data.role as Role) || 'FOUNDER',
          title: data.title || defaultUser.title,
          department_id: data.department_id || undefined,
          client_id: data.client_id || undefined,
          avatarInitials: data.avatar_initials || defaultUser.avatarInitials,
          avatarColor: data.avatar_color || '#6366f1',
          timezone: data.timezone || 'Asia/Dhaka',
          availability: data.availability || 'Available',
          weeklyCapacityHours: Number(data.weekly_capacity_hours) || 40,
          performanceScore: Number(data.performance_score) || 90,
          joined_at: data.created_at ? data.created_at.split('T')[0] : '2026-01-01',
        };
      }
    } catch {
      // fallback
    }

    return defaultUser;
  },

  /**
   * Load entire database snapshot from Supabase tables
   */
  async loadSnapshotFromSupabase(): Promise<Partial<AgencyDatabaseSnapshot> | null> {
    if (!isSupabaseConfigured) return null;

    try {
      const [
        projectsRes,
        tasksRes,
        clientsRes,
        leadsRes,
        departmentsRes,
        messagesRes,
        filesRes,
        approvalsRes,
        activitiesRes,
        notificationsRes,
      ] = await Promise.all([
        supabase.from('projects').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
        supabase.from('tasks').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('departments').select('*').order('name', { ascending: true }),
        supabase.from('messages').select('*').order('created_at', { ascending: true }),
        supabase.from('files').select('*').order('created_at', { ascending: false }),
        supabase.from('approvals').select('*').order('created_at', { ascending: false }),
        supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(30),
      ]);

      const partialSnapshot: Partial<AgencyDatabaseSnapshot> = {};

      if (projectsRes.data && projectsRes.data.length > 0) {
        partialSnapshot.projects = projectsRes.data.map((p) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          description: p.description || '',
          objectives: Array.isArray(p.objectives) ? p.objectives : [],
          client_id: p.client_id || '',
          department_id: p.department_id || '',
          manager_id: p.manager_id || '',
          employee_ids: [],
          status: p.status,
          priority: p.priority,
          projectType: p.project_type || 'Paid Media & CRO Retainer',
          budgetBdt: Number(p.budget_bdt) || 0,
          spentBdt: Number(p.spent_bdt) || 0,
          start_date: p.start_date || '2026-10-08',
          deadline: p.deadline || '2026-11-20',
          created_at: p.created_at ? p.created_at.split('T')[0] : '2026-10-08',
          updated_at: p.updated_at ? p.updated_at.split('T')[0] : '2026-10-08',
          transferHistory: Array.isArray(p.transfer_history) ? p.transfer_history : [],
          customProgressPercent: typeof p.custom_progress_percent === 'number' ? p.custom_progress_percent : undefined,
        }));
      }

      if (tasksRes.data && tasksRes.data.length > 0) {
        partialSnapshot.tasks = tasksRes.data.map((t) => ({
          id: t.id,
          code: t.code,
          title: t.title,
          description: t.description || '',
          project_id: t.project_id,
          client_id: t.client_id || '',
          department_id: t.department_id || '',
          assigned_to: t.assigned_to || '',
          assigned_manager_id: t.assigned_manager_id || '',
          priority: t.priority,
          status: t.status,
          due_date: t.due_date,
          estimatedHours: Number(t.estimated_hours) || 0,
          actualHours: Number(t.actual_hours) || 0,
          tags: Array.isArray(t.tags) ? t.tags : [],
          checklist: Array.isArray(t.checklist) ? t.checklist : [],
          comments: Array.isArray(t.comments) ? t.comments : [],
          created_by: t.created_by || '',
          created_at: t.created_at ? t.created_at.split('T')[0] : '2026-10-08',
          updated_at: t.updated_at ? t.updated_at.split('T')[0] : '2026-10-08',
        }));
      }

      if (clientsRes.data && clientsRes.data.length > 0) {
        partialSnapshot.clients = clientsRes.data.map((c) => ({
          id: c.id,
          name: c.name,
          company: c.company,
          email: c.email || '',
          phone: c.phone || '',
          industry: c.industry || 'B2B SaaS',
          status: c.status,
          manager_id: c.manager_id || '',
          totalValueBdt: Number(c.total_value_bdt) || 0,
          joined_date: c.joined_date || '2026-10-08',
          website: c.website || '',
          notes: c.notes || '',
        }));
      }

      if (leadsRes.data && leadsRes.data.length > 0) {
        partialSnapshot.leads = leadsRes.data.map((l) => ({
          id: l.id,
          name: l.name,
          company: l.company,
          email: l.email || '',
          phone: l.phone || '',
          source: l.source || 'Inbound SEO',
          service: l.service || 'Paid Media',
          potentialValueBdt: Number(l.potential_value_bdt) || 0,
          status: l.status,
          assigned_manager_id: l.assigned_manager_id || '',
          created_at: l.created_at ? l.created_at.split('T')[0] : '2026-10-08',
          last_contact: l.last_contact ? l.last_contact.split('T')[0] : '2026-10-08',
          notes: l.notes || '',
        }));
      }

      if (messagesRes.data && messagesRes.data.length > 0) {
        partialSnapshot.messages = messagesRes.data.map((m) => ({
          id: m.id,
          project_id: m.project_id,
          client_id: m.client_id || '',
          sender_id: m.sender_id,
          channel: m.channel,
          visibility: m.visibility,
          content: m.content,
          mentions: Array.isArray(m.mentions) ? m.mentions : [],
          attachments: Array.isArray(m.attachments) ? m.attachments : [],
          unreadBy: Array.isArray(m.unread_by) ? m.unread_by : [],
          created_at: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:00',
        }));
      }

      return partialSnapshot;
    } catch (err) {
      console.error('[AgencyOS Supabase] Error fetching snapshot:', err);
      return null;
    }
  },

  /**
   * Realtime Channel Subscriptions for Messages, Tasks, Projects
   */
  subscribeToRealtimeEvents(
    onMessage: (msg: Message) => void,
    onTaskUpdate?: () => void,
    onProjectUpdate?: () => void
  ) {
    if (!isSupabaseConfigured) return () => {};

    const channel = supabase
      .channel('agency-realtime-room')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const m = payload.new;
          if (m) {
            onMessage({
              id: m.id,
              project_id: m.project_id,
              client_id: m.client_id || '',
              sender_id: m.sender_id,
              channel: m.channel,
              visibility: m.visibility,
              content: m.content,
              mentions: Array.isArray(m.mentions) ? m.mentions : [],
              attachments: Array.isArray(m.attachments) ? m.attachments : [],
              unreadBy: [],
              created_at: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          if (onTaskUpdate) onTaskUpdate();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        () => {
          if (onProjectUpdate) onProjectUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // ============================================================================
  // DATABASE PERSISTENCE MUTATIONS
  // ============================================================================

  async saveProject(project: Project): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('projects').upsert({
        id: project.id.includes('-') ? project.id : undefined,
        code: project.code,
        name: project.name,
        description: project.description,
        objectives: project.objectives,
        client_id: project.client_id.includes('-') ? project.client_id : null,
        department_id: project.department_id.includes('-') ? project.department_id : null,
        status: project.status,
        priority: project.priority,
        project_type: project.projectType,
        budget_bdt: project.budgetBdt,
        spent_bdt: project.spentBdt,
        start_date: project.start_date,
        deadline: project.deadline,
        custom_progress_percent: project.customProgressPercent,
      });
    } catch (e) {
      console.warn('[Supabase saveProject error]', e);
    }
  },

  async updateProjectProgress(projectId: string, progress: number): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      await supabase
        .from('projects')
        .update({ custom_progress_percent: progress, updated_at: new Date().toISOString() })
        .eq('id', projectId);
    } catch (e) {
      console.warn('[Supabase updateProjectProgress error]', e);
    }
  },

  async saveTask(task: Task): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('tasks').upsert({
        id: task.id.includes('-') ? task.id : undefined,
        code: task.code,
        title: task.title,
        description: task.description,
        project_id: task.project_id.includes('-') ? task.project_id : null,
        client_id: task.client_id.includes('-') ? task.client_id : null,
        department_id: task.department_id.includes('-') ? task.department_id : null,
        priority: task.priority,
        status: task.status,
        due_date: task.due_date,
        estimated_hours: task.estimatedHours,
        actual_hours: task.actualHours,
        tags: task.tags,
        checklist: task.checklist,
        comments: task.comments,
      });
    } catch (e) {
      console.warn('[Supabase saveTask error]', e);
    }
  },

  async saveMessage(message: Message): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('messages').insert({
        project_id: message.project_id.includes('-') ? message.project_id : null,
        client_id: message.client_id.includes('-') ? message.client_id : null,
        sender_id: message.sender_id.includes('-') ? message.sender_id : null,
        channel: message.channel,
        visibility: message.visibility,
        content: message.content,
        mentions: message.mentions,
        attachments: message.attachments,
      });
    } catch (e) {
      console.warn('[Supabase saveMessage error]', e);
    }
  },

  async saveClient(client: Client): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('clients').upsert({
        id: client.id.includes('-') ? client.id : undefined,
        name: client.name,
        company: client.company,
        email: client.email,
        phone: client.phone,
        industry: client.industry,
        status: client.status,
        total_value_bdt: client.totalValueBdt,
        website: client.website,
        notes: client.notes,
      });
    } catch (e) {
      console.warn('[Supabase saveClient error]', e);
    }
  },

  async saveLead(lead: Lead): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('leads').upsert({
        id: lead.id.includes('-') ? lead.id : undefined,
        name: lead.name,
        company: lead.company,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        service: lead.service,
        potential_value_bdt: lead.potentialValueBdt,
        status: lead.status,
        notes: lead.notes,
      });
    } catch (e) {
      console.warn('[Supabase saveLead error]', e);
    }
  },

  async saveDepartment(department: Department): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('departments').upsert({
        id: department.id.includes('-') ? department.id : undefined,
        name: department.name,
        code: department.code,
        description: department.description,
        monthly_budget_bdt: department.monthlyBudgetBdt,
      });
    } catch (e) {
      console.warn('[Supabase saveDepartment error]', e);
    }
  },

  async saveMember(member: User): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('profiles').upsert({
        id: member.id.includes('-') ? member.id : undefined,
        name: member.name,
        email: member.email,
        role: member.role,
        title: member.title,
        department_id: member.department_id?.includes('-') ? member.department_id : null,
      });
    } catch (e) {
      console.warn('[Supabase saveMember error]', e);
    }
  },

  async saveCalendarEvent(event: CalendarEvent): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('calendar_events').upsert({
        id: event.id.includes('-') ? event.id : undefined,
        title: event.title,
        category: event.category,
        date: event.date,
        time_label: event.timeLabel,
        project_id: event.project_id?.includes('-') ? event.project_id : null,
        visibility: event.visibility,
      });
    } catch (e) {
      console.warn('[Supabase saveCalendarEvent error]', e);
    }
  },

  async saveActivity(activity: ActivityLog): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('activity_logs').insert({
        action: activity.action,
        target_type: activity.targetType,
        target_name: activity.targetName,
        visibility: activity.visibility,
        metadata: activity.metadata,
      });
    } catch {
      // ignore
    }
  },

  async deleteProject(projectId: string, code?: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);
      if (isUUID) {
        await supabase.from('projects').delete().eq('id', projectId);
      }
      if (code) {
        await supabase.from('projects').delete().eq('code', code);
      }
    } catch (e) {
      console.warn('[Supabase deleteProject error]', e);
    }
  },

  async deleteTask(taskId: string, code?: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(taskId);
      if (isUUID) {
        await supabase.from('tasks').delete().eq('id', taskId);
      }
      if (code) {
        await supabase.from('tasks').delete().eq('code', code);
      }
    } catch (e) {
      console.warn('[Supabase deleteTask error]', e);
    }
  },

  async deleteClient(clientId: string, company?: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId);
      if (isUUID) {
        await supabase.from('clients').delete().eq('id', clientId);
      }
      if (company) {
        await supabase.from('clients').delete().eq('company', company);
      }
    } catch (e) {
      console.warn('[Supabase deleteClient error]', e);
    }
  },

  async deleteLead(leadId: string, company?: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(leadId);
      if (isUUID) {
        await supabase.from('leads').delete().eq('id', leadId);
      }
      if (company) {
        await supabase.from('leads').delete().eq('company', company);
      }
    } catch (e) {
      console.warn('[Supabase deleteLead error]', e);
    }
  },

  async deleteMember(memberId: string, email?: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(memberId);
      if (isUUID) {
        await supabase.from('profiles').delete().eq('id', memberId);
      }
      if (email) {
        await supabase.from('profiles').delete().eq('email', email);
      }
    } catch (e) {
      console.warn('[Supabase deleteMember error]', e);
    }
  },

  async deleteDepartment(departmentId: string, code?: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(departmentId);
      if (isUUID) {
        await supabase.from('departments').delete().eq('id', departmentId);
      }
      if (code) {
        await supabase.from('departments').delete().eq('code', code);
      }
    } catch (e) {
      console.warn('[Supabase deleteDepartment error]', e);
    }
  },

  async deleteCalendarEvent(eventId: string, title?: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
      if (isUUID) {
        await supabase.from('calendar_events').delete().eq('id', eventId);
      }
      if (title) {
        await supabase.from('calendar_events').delete().eq('title', title);
      }
    } catch (e) {
      console.warn('[Supabase deleteCalendarEvent error]', e);
    }
  },
};
