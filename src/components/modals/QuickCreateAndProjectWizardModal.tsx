import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  CheckSquare,
  FolderPlus,
  Hash,
  Layers,
  Plus,
  Sparkles,
  UserPlus,
  X,
} from 'lucide-react';
import { useAgency } from '../../context/AgencyContext';
import { formatCurrency } from '../../services/agencyServices';
import { Priority } from '../../types/domain';

type CreateMode =
  | 'project'
  | 'task'
  | 'lead'
  | 'client'
  | 'member'
  | 'department'
  | 'event';

export const QuickCreateAndProjectWizardModal: React.FC = () => {
  const {
    currentUser,
    isQuickCreateOpen,
    setQuickCreateOpen,
    snapshot,
    currency,
    addToast,
    createProject,
    createTask,
    createLead,
    createClient,
    createTeamMember,
    createDepartment,
    createCalendarEvent,
    openProjectDetail,
  } = useAgency();

  const [mode, setMode] = useState<CreateMode>('project');
  const [wizardStep, setWizardStep] = useState<number>(1);

  // Project Wizard State
  const [prjSerialNumber, setPrjSerialNumber] = useState(
    () => `PRJ-${101 + snapshot.projects.length}`
  );
  const [prjClientId, setPrjClientId] = useState(snapshot.clients[0]?.id || 'cli_001');
  const [isAddingNewClient, setIsAddingNewClient] = useState(false);
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientIndustry, setNewClientIndustry] = useState('B2B SaaS & Tech');

  const [prjTemplateId, setPrjTemplateId] = useState<string>('tpl_001');
  const [prjName, setPrjName] = useState('');
  const [prjType, setPrjType] = useState('Paid Media & CRO Retainer');
  const [prjPriority, setPrjPriority] = useState<Priority>('High');
  const [prjDescription, setPrjDescription] = useState(
    'Full-funnel acquisition, creative iteration, and conversion engineering.'
  );
  const [prjObjectiveText, setPrjObjectiveText] = useState(
    'Achieve 4.0x blended ROAS within 45 days\nDeliver 24 modular ad variations'
  );
  const [prjDeptId, setPrjDeptId] = useState(snapshot.departments[2]?.id || 'dept_003');
  const [prjManagerId, setPrjManagerId] = useState('usr_mgr_01');
  const [prjEmployeeIds, setPrjEmployeeIds] = useState<string[]>(['usr_emp_01', 'usr_emp_02']);
  const [prjBudget, setPrjBudget] = useState(1500000);
  const [prjStartDate, setPrjStartDate] = useState('2026-10-08');
  const [prjDeadline, setPrjDeadline] = useState('2026-11-20');

  // Task State
  const [tskTitle, setTskTitle] = useState('');
  const [tskProjectId, setTskProjectId] = useState(snapshot.projects[0]?.id || 'prj_001');
  const [tskAssignee, setTskAssignee] = useState('usr_emp_01');
  const [tskPriority, setTskPriority] = useState<Priority>('High');
  const [tskDueDate, setTskDueDate] = useState('2026-10-14');
  const [tskEstHours, setTskEstHours] = useState(8);
  const [tskDesc, setTskDesc] = useState('');

  // Lead State
  const [ldCompany, setLdCompany] = useState('');
  const [ldName, setLdName] = useState('');
  const [ldEmail, setLdEmail] = useState('');
  const [ldService, setLdService] = useState('Paid Media & D2C CRO');
  const [ldValue, setLdValue] = useState(2400000);
  const [ldManagerId, setLdManagerId] = useState('usr_mgr_01');

  // Client State
  const [cliCompany, setCliCompany] = useState('');
  const [cliName, setCliName] = useState('');
  const [cliEmail, setCliEmail] = useState('');
  const [cliIndustry, setCliIndustry] = useState('B2B SaaS & Enterprise');
  const [cliValue, setCliValue] = useState(3200000);

  // Member State
  const [memName, setMemName] = useState('');
  const [memEmail, setMemEmail] = useState('');
  const [memRole, setMemRole] = useState<'EMPLOYEE' | 'MANAGER'>('EMPLOYEE');
  const [memTitle, setMemTitle] = useState('Performance Marketing Specialist');
  const [memDeptId, setMemDeptId] = useState('dept_003');

  // Dept State
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptDesc, setDeptDesc] = useState('');

  // Event State
  const [evtTitle, setEvtTitle] = useState('');
  const [evtDate, setEvtDate] = useState('2026-10-10');
  const [evtTime, setEvtTime] = useState('15:00 - 16:00');

  if (!isQuickCreateOpen || !currentUser) return null;

  const managers = snapshot.users.filter((u) => u.role === 'MANAGER');
  const employees = snapshot.users.filter((u) => u.role === 'EMPLOYEE');

  const canCreateProject = currentUser.role === 'FOUNDER' || currentUser.role === 'MANAGER';
  const canCreateLead = currentUser.role === 'FOUNDER' || currentUser.role === 'MANAGER';
  const canCreateFounderOnly = currentUser.role === 'FOUNDER';

  const handleApplyTemplate = (tplId: string) => {
    setPrjTemplateId(tplId);
    const tpl = snapshot.templates.find((t) => t.id === tplId);
    if (tpl) {
      setPrjType(tpl.projectType);
      setPrjDeptId(tpl.default_department_id);
      setPrjBudget(tpl.defaultBudgetBdt);
      setPrjDescription(tpl.description);
    }
  };

  const toggleEmployeeSelection = (empId: string) => {
    setPrjEmployeeIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleSaveInlineClient = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newClientCompany.trim() || !newClientName.trim()) {
      addToast(
        'Client Information Missing',
        'Please enter both company name and contact person name.',
        'warning'
      );
      return;
    }
    const created = createClient({
      name: newClientName.trim(),
      company: newClientCompany.trim(),
      email:
        newClientEmail.trim() ||
        `contact@${newClientCompany.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      phone: newClientPhone.trim() || '+880 1700-000000',
      industry: newClientIndustry,
      manager_id: prjManagerId || 'usr_mgr_01',
      totalValueBdt: prjBudget || 1500000,
      website: `https://${newClientCompany.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      notes: 'Added directly from Project Creation Wizard.',
    });
    setPrjClientId(created.id);
    setIsAddingNewClient(false);
    setNewClientCompany('');
    setNewClientName('');
    setNewClientEmail('');
    setNewClientPhone('');
    addToast(
      'Client Saved & Selected',
      `${created.company} has been added and selected for this project.`,
      'success'
    );
  };

  const handleFinishProjectWizard = () => {
    const clientObj = snapshot.clients.find((c) => c.id === prjClientId);
    const finalName =
      prjName.trim() || `${prjType} — ${clientObj?.company || 'Client'}`;
    const finalCode =
      prjSerialNumber.trim() || `PRJ-${101 + snapshot.projects.length}`;
    const created = createProject({
      name: finalName,
      code: finalCode,
      client_id: prjClientId,
      department_id: prjDeptId,
      manager_id: prjManagerId,
      employee_ids: prjEmployeeIds,
      priority: prjPriority,
      projectType: prjType,
      budgetBdt: prjBudget,
      start_date: prjStartDate,
      deadline: prjDeadline,
      description: prjDescription,
      objectives: prjObjectiveText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      template_id: prjTemplateId || undefined,
    });
    setQuickCreateOpen(false);
    setWizardStep(1);
    setPrjName('');
    setPrjSerialNumber(`PRJ-${102 + snapshot.projects.length}`);
    openProjectDetail(created.id);
  };

  const handleCreateTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tskTitle.trim()) return;
    createTask({
      title: tskTitle.trim(),
      description: tskDesc.trim() || 'Assigned via AgencyOS Quick Create.',
      project_id: tskProjectId,
      assigned_to: currentUser.role === 'EMPLOYEE' ? currentUser.id : tskAssignee,
      priority: tskPriority,
      due_date: tskDueDate,
      estimatedHours: tskEstHours,
      tags: ['Sprint Execution'],
    });
    setTskTitle('');
    setTskDesc('');
    setQuickCreateOpen(false);
  };

  const handleCreateLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ldCompany.trim() || !ldName.trim()) return;
    createLead({
      name: ldName.trim(),
      company: ldCompany.trim(),
      email: ldEmail.trim() || 'contact@company.com',
      phone: '+880 1711-000000',
      source: 'Inbound SEO',
      service: ldService,
      potentialValueBdt: ldValue,
      assigned_manager_id: ldManagerId,
      notes: 'Qualified inbound agency lead.',
    });
    setLdCompany('');
    setLdName('');
    setQuickCreateOpen(false);
  };

  const handleCreateClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliCompany.trim() || !cliName.trim()) return;
    createClient({
      name: cliName.trim(),
      company: cliCompany.trim(),
      email: cliEmail.trim() || 'client@company.com',
      phone: '+880 1711-555555',
      industry: cliIndustry,
      manager_id: 'usr_mgr_01',
      totalValueBdt: cliValue,
      website: `https://${cliCompany.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      notes: 'Onboarded via AgencyOS Client Onboarding flow.',
    });
    setCliCompany('');
    setCliName('');
    setQuickCreateOpen(false);
  };

  const handleCreateMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memName.trim() || !memEmail.trim()) return;
    createTeamMember(memName.trim(), memEmail.trim(), memRole, memTitle, memDeptId);
    setMemName('');
    setMemEmail('');
    setQuickCreateOpen(false);
  };

  const handleCreateDepartmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim() || !deptCode.trim()) return;
    createDepartment(deptName.trim(), deptCode.trim(), deptDesc.trim(), 'usr_mgr_01', 600000);
    setDeptName('');
    setDeptCode('');
    setQuickCreateOpen(false);
  };

  const handleCreateEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evtTitle.trim()) return;
    createCalendarEvent(evtTitle.trim(), 'Client Meeting', evtDate, evtTime, snapshot.projects[0]?.id, 'Client-visible');
    setEvtTitle('');
    setQuickCreateOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={() => setQuickCreateOpen(false)}
    >
      <div
        className="w-full max-w-3xl rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Mode Selector Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
              AgencyOS Quick Create & Smart Onboarding
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Role-scoped entity creation ({currentUser.role} permissions active)
            </p>
          </div>
          <button
            onClick={() => setQuickCreateOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Entity Mode Tabs */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto">
          {canCreateProject && (
            <button
              type="button"
              onClick={() => setMode('project')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                mode === 'project'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <FolderPlus className="w-3.5 h-3.5" />
              Smart Project Wizard
            </button>
          )}
          <button
            type="button"
            onClick={() => setMode('task')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              mode === 'task'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            New Task
          </button>
          {canCreateLead && (
            <>
              <button
                type="button"
                onClick={() => setMode('lead')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  mode === 'lead'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                New Lead
              </button>
              <button
                type="button"
                onClick={() => setMode('client')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  mode === 'client'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Onboard Client
              </button>
            </>
          )}
          {canCreateFounderOnly && (
            <>
              <button
                type="button"
                onClick={() => setMode('member')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  mode === 'member'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Team Member
              </button>
              <button
                type="button"
                onClick={() => setMode('department')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  mode === 'department'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                New Department
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setMode('event')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              mode === 'event'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Calendar Event
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6">
          {/* 1. SMART MULTI-STEP PROJECT CREATION FLOW */}
          {mode === 'project' && canCreateProject && (
            <div className="space-y-6">
              {/* Stepper Bar */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { s: 1, title: '1. Client & Template' },
                  { s: 2, title: '2. Project Scope' },
                  { s: 3, title: '3. Dept, Manager & Team' },
                  { s: 4, title: '4. Timeline & Review' },
                ].map((item) => (
                  <button
                    key={item.s}
                    type="button"
                    onClick={() => setWizardStep(item.s)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium text-left border transition-colors ${
                      wizardStep === item.s
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300'
                        : wizardStep > item.s
                          ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    {item.title}
                  </button>
                ))}
              </div>

              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-3.5">
                    {/* Project Serial Number / Code (Manual Entry by Founder) */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>Project Serial Number / SL (প্রজেক্টের ইউনিক সিরিয়াল নম্বর)</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-medium">
                            Founder Manual Entry
                          </span>
                        </label>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Unique Identifier
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={prjSerialNumber}
                          onChange={(e) => setPrjSerialNumber(e.target.value)}
                          placeholder="e.g., PRJ-108, SL-001, AGENCY-2026-01"
                          className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Founder এখানে ম্যানুয়ালি নিজের পছন্দমতো প্রজেক্ট সিরিয়াল নম্বর (SL Number) লিখতে পারবেন। এই সিরিয়াল নম্বর দিয়ে প্রজেক্টটি তৈরি হবে।
                      </p>
                    </div>

                    {/* Client Account Dropdown & Inline Save */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Select Client Account (ক্লায়েন্ট নির্বাচন করুন)
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsAddingNewClient((prev) => !prev)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>
                            {isAddingNewClient
                              ? 'Cancel (বিদ্যমান তালিকা)'
                              : '+ Add New Client (নতুন ক্লায়েন্ট যোগ করুন)'}
                          </span>
                        </button>
                      </div>

                      <select
                        value={isAddingNewClient ? '__NEW_CLIENT__' : prjClientId}
                        onChange={(e) => {
                          if (e.target.value === '__NEW_CLIENT__') {
                            setIsAddingNewClient(true);
                          } else {
                            setIsAddingNewClient(false);
                            setPrjClientId(e.target.value);
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
                      >
                        <option value="__NEW_CLIENT__">
                          + Add New Client (নতুন ক্লায়েন্টের নাম ম্যানুয়ালি লিখে সেভ করুন)...
                        </option>
                        {snapshot.clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.company} — {c.name} ({c.industry})
                          </option>
                        ))}
                      </select>

                      {/* Inline New Client Creation Form */}
                      {isAddingNewClient && (
                        <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/80 space-y-3 mt-2 shadow-xs">
                          <div className="flex items-center justify-between pb-1 border-b border-indigo-100 dark:border-indigo-900/50">
                            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                              <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                              Save New Client Profile (নতুন ক্লায়েন্টের তথ্য ম্যানুয়ালি লিখে সেভ করুন)
                            </span>
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400">
                              Will save to client directory
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Company / Brand Name (কোম্পানি / ব্র্যান্ডের নাম) *
                              </label>
                              <input
                                type="text"
                                value={newClientCompany}
                                onChange={(e) => setNewClientCompany(e.target.value)}
                                placeholder="e.g., TechFlow Digital Ltd."
                                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Contact Person Name (যোগাযোগকারী ব্যক্তির নাম) *
                              </label>
                              <input
                                type="text"
                                value={newClientName}
                                onChange={(e) => setNewClientName(e.target.value)}
                                placeholder="e.g., Tanvir Ahmed"
                                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Email Address (ইমেইল)
                              </label>
                              <input
                                type="email"
                                value={newClientEmail}
                                onChange={(e) => setNewClientEmail(e.target.value)}
                                placeholder="e.g., contact@techflow.com"
                                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Industry (ইন্ডাস্ট্রি)
                              </label>
                              <select
                                value={newClientIndustry}
                                onChange={(e) => setNewClientIndustry(e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              >
                                <option value="B2B SaaS & Tech">B2B SaaS & Tech</option>
                                <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                                <option value="Healthcare & Wellness">Healthcare & Wellness</option>
                                <option value="Real Estate & PropTech">Real Estate & PropTech</option>
                                <option value="Financial Services & Fintech">
                                  Financial Services & Fintech
                                </option>
                                <option value="Education & EdTech">Education & EdTech</option>
                                <option value="Hospitality & Travel">Hospitality & Travel</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setIsAddingNewClient(false)}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveInlineClient()}
                              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs cursor-pointer"
                            >
                              Save & Select Client (সংরক্ষণ করুন)
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Choose Agency Blueprint Template (Auto-seeds Default Tasks & Milestones)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {snapshot.templates.map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => handleApplyTemplate(tpl.id)}
                          className={`p-3.5 rounded-xl border text-left transition-all ${
                            prjTemplateId === tpl.id
                              ? 'border-indigo-500 bg-indigo-500/10'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white">
                            <span>{tpl.name}</span>
                            <span className="font-mono text-indigo-500">
                              {tpl.defaultTasks.length} tasks
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                            {tpl.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Project Name
                      </label>
                      <input
                        type="text"
                        value={prjName}
                        onChange={(e) => setPrjName(e.target.value)}
                        placeholder="e.g., Q4 Search & Conversion Expansion — Apex Retail"
                        className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Priority Level
                      </label>
                      <select
                        value={prjPriority}
                        onChange={(e) => setPrjPriority(e.target.value as Priority)}
                        className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Executive Summary & Scope
                    </label>
                    <textarea
                      rows={2}
                      value={prjDescription}
                      onChange={(e) => setPrjDescription(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Key Measurable Objectives (One per line)
                    </label>
                    <textarea
                      rows={3}
                      value={prjObjectiveText}
                      onChange={(e) => setPrjObjectiveText(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Primary Department
                      </label>
                      <select
                        value={prjDeptId}
                        onChange={(e) => setPrjDeptId(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
                      >
                        {snapshot.departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Delivery Manager
                      </label>
                      <select
                        value={prjManagerId}
                        onChange={(e) => setPrjManagerId(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
                      >
                        {managers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} — {m.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Assign Execution Specialists ({prjEmployeeIds.length} selected)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                      {employees.map((emp) => {
                        const checked = prjEmployeeIds.includes(emp.id);
                        return (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => toggleEmployeeSelection(emp.id)}
                            className={`flex items-center justify-between p-2.5 rounded-lg border text-xs text-left transition-colors ${
                              checked
                                ? 'border-indigo-500 bg-indigo-500/10 text-slate-900 dark:text-white'
                                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <div>
                              <div className="font-semibold">{emp.name}</div>
                              <div className="text-[11px] text-slate-500">{emp.title}</div>
                            </div>
                            {checked && <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 4 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Kickoff Date
                      </label>
                      <input
                        type="date"
                        value={prjStartDate}
                        onChange={(e) => setPrjStartDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Target Delivery Deadline
                      </label>
                      <input
                        type="date"
                        value={prjDeadline}
                        onChange={(e) => setPrjDeadline(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Project Budget (BDT)
                      </label>
                      <input
                        type="number"
                        step={50000}
                        value={prjBudget}
                        onChange={(e) => setPrjBudget(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Review Summary Box */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <div className="font-semibold text-slate-900 dark:text-white text-sm">
                      Pre-Launch Verification Summary
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                      <div>
                        <span className="text-slate-500">Project SL No:</span>{' '}
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {prjSerialNumber || `PRJ-${101 + snapshot.projects.length}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Client:</span>{' '}
                        <span className="font-medium text-slate-900 dark:text-white">
                          {snapshot.clients.find((c) => c.id === prjClientId)?.company}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Department:</span>{' '}
                        <span className="font-medium text-slate-900 dark:text-white">
                          {snapshot.departments.find((d) => d.id === prjDeptId)?.name}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Manager:</span>{' '}
                        <span className="font-medium text-slate-900 dark:text-white">
                          {snapshot.users.find((u) => u.id === prjManagerId)?.name}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Budget:</span>{' '}
                        <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                          {formatCurrency(prjBudget, currency)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Specialists:</span>{' '}
                        <span className="font-mono text-slate-900 dark:text-white">
                          {prjEmployeeIds.length} assigned
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Auto-Tasks:</span>{' '}
                        <span className="font-mono text-emerald-600 dark:text-emerald-400">
                          {snapshot.templates.find((t) => t.id === prjTemplateId)?.defaultTasks
                            .length || 0}{' '}
                          blueprint tasks
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Wizard Footer Controls */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  disabled={wizardStep === 1}
                  onClick={() => setWizardStep((s) => Math.max(1, s - 1))}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Previous Step
                </button>
                {wizardStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep((s) => Math.min(4, s + 1))}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    Continue
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinishProjectWizard}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Initialize Project & Tasks
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 2. NEW TASK FORM */}
          {mode === 'task' && (
            <form onSubmit={handleCreateTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={tskTitle}
                  onChange={(e) => setTskTitle(e.target.value)}
                  placeholder="e.g., Launch Retargeting Carousel Ad Set #3"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Target Project
                  </label>
                  <select
                    value={tskProjectId}
                    onChange={(e) => setTskProjectId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
                  >
                    {snapshot.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} · {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Assign Specialist
                  </label>
                  <select
                    disabled={currentUser.role === 'EMPLOYEE'}
                    value={currentUser.role === 'EMPLOYEE' ? currentUser.id : tskAssignee}
                    onChange={(e) => setTskAssignee(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white disabled:opacity-60"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.title})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={tskPriority}
                    onChange={(e) => setTskPriority(e.target.value as Priority)}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={tskDueDate}
                    onChange={(e) => setTskDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={tskEstHours}
                    onChange={(e) => setTskEstHours(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Execution Notes & Acceptance Criteria
                </label>
                <textarea
                  rows={2}
                  value={tskDesc}
                  onChange={(e) => setTskDesc(e.target.value)}
                  placeholder="Specify deliverable format, UTM conventions, or staging URL..."
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Create & Assign Task
                </button>
              </div>
            </form>
          )}

          {/* 3. NEW LEAD FORM */}
          {mode === 'lead' && canCreateLead && (
            <form onSubmit={handleCreateLeadSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={ldCompany}
                    onChange={(e) => setLdCompany(e.target.value)}
                    placeholder="e.g., Meridian Retail Group"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Decision Maker Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={ldName}
                    onChange={(e) => setLdName(e.target.value)}
                    placeholder="e.g., Nadia Rahman"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={ldEmail}
                    onChange={(e) => setLdEmail(e.target.value)}
                    placeholder="nadia@meridian.com"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Service Interest
                  </label>
                  <input
                    type="text"
                    value={ldService}
                    onChange={(e) => setLdService(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Estimated Deal Value (BDT)
                  </label>
                  <input
                    type="number"
                    step={100000}
                    value={ldValue}
                    onChange={(e) => setLdValue(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Assign Account Manager
                </label>
                <select
                  value={ldManagerId}
                  onChange={(e) => setLdManagerId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
                >
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Add Lead to CRM Pipeline
                </button>
              </div>
            </form>
          )}

          {/* 4. CLIENT ONBOARDING FLOW */}
          {mode === 'client' && canCreateLead && (
            <form onSubmit={handleCreateClientSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Client Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={cliCompany}
                    onChange={(e) => setCliCompany(e.target.value)}
                    placeholder="e.g., Stellar Health Systems"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Primary Stakeholder Contact *
                  </label>
                  <input
                    type="text"
                    required
                    value={cliName}
                    onChange={(e) => setCliName(e.target.value)}
                    placeholder="e.g., Dr. Selena Vance"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Stakeholder Email
                  </label>
                  <input
                    type="email"
                    value={cliEmail}
                    onChange={(e) => setCliEmail(e.target.value)}
                    placeholder="selena@stellarhealth.com"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Industry Vertical
                  </label>
                  <input
                    type="text"
                    value={cliIndustry}
                    onChange={(e) => setCliIndustry(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Annual Contract Value (BDT)
                  </label>
                  <input
                    type="number"
                    step={100000}
                    value={cliValue}
                    onChange={(e) => setCliValue(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Complete Client Onboarding
                </button>
              </div>
            </form>
          )}

          {/* 5. ADD TEAM MEMBER */}
          {mode === 'member' && canCreateFounderOnly && (
            <form onSubmit={handleCreateMemberSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={memName}
                    onChange={(e) => setMemName(e.target.value)}
                    placeholder="e.g., Imran Hossain"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Agency Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={memEmail}
                    onChange={(e) => setMemEmail(e.target.value)}
                    placeholder="imran@demo-agency.com"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Role Level
                  </label>
                  <select
                    value={memRole}
                    onChange={(e) => setMemRole(e.target.value as 'EMPLOYEE' | 'MANAGER')}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
                  >
                    <option value="EMPLOYEE">Specialist (Employee)</option>
                    <option value="MANAGER">Department Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={memTitle}
                    onChange={(e) => setMemTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Department
                  </label>
                  <select
                    value={memDeptId}
                    onChange={(e) => setMemDeptId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
                  >
                    {snapshot.departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Add to Agency Roster
                </button>
              </div>
            </form>
          )}

          {/* 6. NEW DEPARTMENT */}
          {mode === 'department' && canCreateFounderOnly && (
            <form onSubmit={handleCreateDepartmentSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                    placeholder="e.g., Influencer & PR Partnerships"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Short Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={deptCode}
                    onChange={(e) => setDeptCode(e.target.value)}
                    placeholder="PR"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white font-mono uppercase"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Mandate & Description
                </label>
                <input
                  type="text"
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  placeholder="Creator contracts, media placements, and brand collaborations."
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Create Department
                </button>
              </div>
            </form>
          )}

          {/* 7. NEW CALENDAR EVENT */}
          {mode === 'event' && (
            <form onSubmit={handleCreateEventSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Event / Milestone Title *
                </label>
                <input
                  type="text"
                  required
                  value={evtTitle}
                  onChange={(e) => setEvtTitle(e.target.value)}
                  placeholder="e.g., Q4 ROAS Executive Review Call"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={evtDate}
                    onChange={(e) => setEvtDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Time Slot
                  </label>
                  <input
                    type="text"
                    value={evtTime}
                    onChange={(e) => setEvtTime(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Schedule Event
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
