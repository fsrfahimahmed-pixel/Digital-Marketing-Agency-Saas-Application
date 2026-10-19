import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Eye,
  EyeOff,
  FolderLock,
  Layers,
  Lock,
  Moon,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sun,
  UserCheck,
  Users,
  Workflow,
} from 'lucide-react';
import { useAgency } from '../../context/AgencyContext';

const ROLE_TIERS = [
  {
    role: 'FOUNDER',
    title: 'Founder & CEO Command',
    scope: 'Exclusive executive administration, CRM pipeline, agency-wide retainers, and client/staff credentials governance.',
    icon: Shield,
    color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200/50 dark:border-indigo-800/40',
  },
  {
    role: 'MANAGER',
    title: 'Department Head / VP',
    scope: 'Client campaign routing, team workload capacity, deliverable milestones, QA sign-off, and task allocation.',
    icon: Users,
    color: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border-sky-200/50 dark:border-sky-800/40',
  },
  {
    role: 'EMPLOYEE',
    title: 'Specialist Workspace',
    scope: 'Daily kanban sprint execution, time tracking, task checklists, and cross-department deliverable production.',
    icon: Briefcase,
    color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 border-teal-200/50 dark:border-teal-800/40',
  },
  {
    role: 'CLIENT',
    title: 'Client Stakeholder Portal',
    scope: 'Dedicated client-safe workspace for reviewing deliverables, providing revision feedback, and viewing invoices.',
    icon: UserCheck,
    color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200/50 dark:border-amber-800/40',
  },
];

export const PublicHomeAndLogin: React.FC = () => {
  const { loginWithCredentials, theme, toggleTheme } = useAgency();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState(false);
  const [activeFlowStep, setActiveFlowStep] = useState(0);

  const flowSteps = [
    {
      step: '01. Lead & CRM Intake',
      detail: 'Inbound leads are qualified, scored in BDT/USD value, and converted into structured Client accounts with credentials.',
    },
    {
      step: '02. Department & Manager Routing',
      detail: 'Projects are initialized from blueprints and routed to specialized Department Managers with team capacity matching.',
    },
    {
      step: '03. Specialist Task Execution',
      detail: 'Assigned specialists execute daily kanban tasks, time logs, and checklist items with SLA enforcement.',
    },
    {
      step: '04. Client Portal Sign-Off',
      detail: 'Deliverables pass internal QA to the client portal for stakeholder sign-off, revisions, and approval audit logs.',
    },
  ];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setForgotPasswordNotice(false);

    if (!email.trim()) {
      setErrorMsg('Please enter your authorized Gmail or corporate email address.');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Please enter your password or access token.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginWithCredentials(email, password);
      setIsLoading(false);
      if (!res.ok && res.error) {
        setErrorMsg(res.error);
      }
    } catch (err: unknown) {
      setIsLoading(false);
      setErrorMsg(err instanceof Error ? err.message : 'Authentication failed. Please verify your credentials.');
    }
  };

  const scrollToLogin = () => {
    const el = document.getElementById('login-panel');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      const input = document.getElementById('login-email') as HTMLInputElement | null;
      if (input) input.focus();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="flex items-center justify-between px-6 lg:px-12 py-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            OS
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight font-display text-slate-900 dark:text-white">
              AgencyOS
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-mono text-slate-400">
              v1.0 · Secure Role Gateway
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-600 dark:text-slate-400">
          <a
            href="#architecture"
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Operating Flow
          </a>
          <a
            href="#roles"
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Role Tiers
          </a>
          <a
            href="#security"
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Security & Governance
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={scrollToLogin}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors whitespace-nowrap shadow-xs"
          >
            Sign In to Workspace
          </button>
        </div>
      </header>

      {/* Main Split Gateway */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 lg:px-12 py-10 lg:py-14 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Architecture & Role Overview */}
        <div className="lg:col-span-7 space-y-8" id="architecture">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">
              <span>Digital Marketing Agency Operating System</span>
              <span aria-hidden="true">·</span>
              <span>Role-Based Access Control</span>
              <span aria-hidden="true">·</span>
              <span>TLS Encrypted</span>
            </div>

            <h1
              className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-slate-900 dark:text-white leading-[1.15] font-display"
              style={{ textWrap: 'balance' }}
            >
              Enterprise operating system for digital marketing agencies.
            </h1>

            <p className="text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Unified command for Founder executive governance, Department Managers, creative & media specialists, and client stakeholders with strict credential-based permission isolation.
            </p>
          </div>

          {/* Interactive Operational Pipeline Visualizer */}
          <div className="p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  End-to-End Agency Delivery Architecture
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Live workflow pipeline connecting client CRM intake to deliverable sign-offs
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-indigo-600 dark:text-indigo-400 font-medium">
                4 Role Portals · Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {flowSteps.map((item, idx) => {
                const isSelected = activeFlowStep === idx;
                return (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => setActiveFlowStep(idx)}
                    className={`text-left p-4 rounded-lg border transition-all duration-150 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-500/20'
                        : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.step}
                    </div>
                    <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.detail}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Operational Metrics Bar */}
            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Retainer Velocity</div>
                <div className="mt-1 text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  ৳28.7M+
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Service Units</div>
                <div className="mt-1 text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  10 Units
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Delivery SLA</div>
                <div className="mt-1 text-lg font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                  98.4%
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Security Model</div>
                <div className="mt-1 text-lg font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                  Strict RBAC
                </div>
              </div>
            </div>
          </div>

          {/* Role Architecture Matrix */}
          <div className="space-y-3" id="roles">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Permission-Isolated Role Tiers
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Authorized credentials required
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ROLE_TIERS.map((tier) => {
                const Icon = tier.icon;
                return (
                  <div
                    key={tier.role}
                    className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold border ${tier.color}`}>
                          <Icon className="w-3 h-3" />
                          {tier.role}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">Access Restricted</span>
                      </div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {tier.title}
                      </div>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {tier.scope}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Security & Deletion Policy Card */}
          <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2 text-xs text-slate-600 dark:text-slate-400" id="security">
            <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Permanent Credential Governance & Role Deletion Policy</span>
            </div>
            <p className="leading-relaxed">
              Founder has sole authority to onboard clients, employees, and managers with dedicated access passwords/tokens. If any client or staff member is removed by the Founder, their credentials and portal access are instantly revoked and deleted from the authentication directory.
            </p>
          </div>
        </div>

        {/* Right Column: Professional Authentication Portal */}
        <div className="lg:col-span-5" id="login-panel">
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/90 shadow-xl space-y-6">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50">
                  Role-Based Authentication
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  TLS 1.3 Secure
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display">
                Sign in to AgencyOS
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter your registered Gmail or work email address and password/token to access your role dashboard.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="font-medium">{errorMsg}</div>
              </div>
            )}

            {forgotPasswordNotice && (
              <div className="p-3.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/50 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-400" />
                <div className="leading-relaxed">
                  <strong>Password & Token Recovery:</strong> All account credentials are administered by the Founder. Please contact <strong>fsrfahimahmed@gmail.com</strong> to reissue your access password or token.
                </div>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Gmail / Work Email Address *
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="e.g. fsrfahimahmed@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Password / Access Token *
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotPasswordNotice(true)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Enter your password or token"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Remember session</span>
                </label>
                <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                  Encrypted Session
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                {isLoading ? (
                  <span>Authenticating Role...</span>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Credential Governance Footnote */}
            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <FolderLock className="w-3.5 h-3.5 text-indigo-500" />
                <span>Executive Governance & Role Routing:</span>
              </div>
              <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 leading-relaxed">
                <li>• <strong>Founder Account:</strong> Single authorized Founder (<code>fsrfahimahmed@gmail.com</code>).</li>
                <li>• <strong>Team & Clients:</strong> Registered with custom email and password/token directly in Founder Dashboard.</li>
                <li>• <strong>Revocation:</strong> Any deleted member or client loses login access immediately.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Clean Minimal Footer */}
      <footer className="mt-auto border-t border-slate-200/80 dark:border-slate-800/80 py-5 px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div>
          AgencyOS · Professional Digital Marketing Agency Operating System · Role-Based Enterprise Architecture
        </div>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Role-Isolated Portals
          </span>
          <span className="inline-flex items-center gap-1">
            <Workflow className="w-3.5 h-3.5 text-indigo-500" /> Real-time Synchronized State
          </span>
          <span className="inline-flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-sky-500" /> Repository Backed
          </span>
        </div>
      </footer>
    </div>
  );
};
