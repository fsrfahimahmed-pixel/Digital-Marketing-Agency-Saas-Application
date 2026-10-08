import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Layers,
  Lock,
  Moon,
  ShieldCheck,
  Sun,
  Users,
  Workflow,
} from 'lucide-react';
import { useAgency } from '../../context/AgencyContext';
import { Role } from '../../types/domain';

const DEMO_ACCOUNTS: {
  role: Role;
  name: string;
  title: string;
  email: string;
  scope: string;
}[] = [
  {
    role: 'FOUNDER',
    name: 'Arian Chowdhury',
    title: 'Founder & Managing Partner',
    email: 'founder@demo-agency.com',
    scope: 'Full organization control, project transfers, CRM, finance & audit logs',
  },
  {
    role: 'MANAGER',
    name: 'Sarah Jenkins',
    title: 'VP of Performance & Growth',
    email: 'manager@demo-agency.com',
    scope: 'Project delivery, team workload balancing, task assignment & deadline risk',
  },
  {
    role: 'EMPLOYEE',
    name: 'Rafi Ahmed',
    title: 'Senior Paid Media Strategist',
    email: 'employee@demo-agency.com',
    scope: 'Daily execution workspace, kanban tasks, checklists & time tracking',
  },
  {
    role: 'CLIENT',
    name: 'Viktor Sterling',
    title: 'CMO, Apex Retail',
    email: 'client@demo-agency.com',
    scope: 'Client-safe campaign telemetry, deliverable approvals, files & invoices',
  },
];

export const PublicHomeAndLogin: React.FC = () => {
  const { loginWithCredentials, quickSwitchRole, theme, toggleTheme, addToast } = useAgency();

  const [email, setEmail] = useState('founder@demo-agency.com');
  const [password, setPassword] = useState('demo1234');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [activeFlowStep, setActiveFlowStep] = useState(0);

  const flowSteps = [
    {
      step: '01. Lead & CRM Intake',
      detail: 'Inbound leads are qualified, scored in BDT/USD value, and converted into structured Client accounts.',
    },
    {
      step: '02. Department & Manager Routing',
      detail: 'Projects are initialized from agency blueprints and assigned to specialized Department Managers.',
    },
    {
      step: '03. Specialist Task Execution',
      detail: 'Managers balance specialist capacity and assign tasks with checklists, time logs, and SLA dates.',
    },
    {
      step: '04. Client Portal Sign-Off',
      detail: 'Deliverables move through internal QA to client-safe approval workflows with full audit history.',
    },
  ];

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);
    setTimeout(() => {
      const res = loginWithCredentials(email, password);
      setIsLoading(false);
      if (!res.ok && res.error) {
        setErrorMsg(res.error);
      }
    }, 180);
  };

  const handleSelectAccount = (acctEmail: string) => {
    setEmail(acctEmail);
    setPassword('demo1234');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Bar Contract: 3 Zones (Single Brand Element — 4 Nav Links — Primary Actions) */}
      <header className="flex items-center justify-between px-6 lg:px-12 py-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <a
          href="#top"
          onClick={(e) => e.preventDefault()}
          className="text-xl font-bold tracking-tight font-display text-slate-900 dark:text-white"
        >
          AgencyOS
        </a>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-400">
          <a
            href="#architecture"
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Operating Flow
          </a>
          <a
            href="#portals"
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Role Portals
          </a>
          <a
            href="#security"
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Governance
          </a>
          <a
            href="#login-panel"
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Demo Access
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
            onClick={() => quickSwitchRole('FOUNDER')}
            className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors whitespace-nowrap"
          >
            Launch Command Center
          </button>
        </div>
      </header>

      {/* Main Split Workspace Gateway */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 lg:px-12 py-10 lg:py-14 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Agency Operating System Architecture & Live Interactive Preview */}
        <div className="lg:col-span-7 space-y-8" id="architecture">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-medium text-indigo-600 dark:text-indigo-400">
              <span>Digital Marketing Agency Operating System</span>
              <span aria-hidden="true">·</span>
              <span>Demo Environment</span>
              <span aria-hidden="true">·</span>
              <span>Multi-Role RBAC</span>
            </div>

            <h1
              className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-slate-900 dark:text-white leading-[1.15] font-display"
              style={{ textWrap: 'balance' }}
            >
              Centralized command for agency delivery, client approvals, and team capacity.
            </h1>

            <p className="text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Connect executive governance, department managers, creative & performance specialists,
              and client stakeholders inside one permission-isolated operating system.
            </p>
          </div>

          {/* Interactive Operational Pipeline Visualizer */}
          <div className="p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  End-to-End Agency Delivery Architecture
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select any stage to inspect how mutations propagate across role portals
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                10 Active Campaigns · 4 Portals
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
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                        : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">
                      {item.step}
                    </div>
                    <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.detail}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Key Operational Metrics Bar */}
            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Active Retainers</div>
                <div className="mt-1 text-lg font-semibold font-mono tabular-nums text-slate-900 dark:text-white">
                  ৳28.7M
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Departments</div>
                <div className="mt-1 text-lg font-semibold font-mono tabular-nums text-slate-900 dark:text-white">
                  10 Units
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Delivery Health</div>
                <div className="mt-1 text-lg font-semibold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                  88.4%
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Client Visibility</div>
                <div className="mt-1 text-lg font-semibold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                  RBAC Isolated
                </div>
              </div>
            </div>
          </div>

          {/* Instant Role Selector Matrix */}
          <div className="space-y-3" id="portals">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                One-Click Role Portal Simulation (Or Autofill Login Form)
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Shared live repository state across all 4 roles
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEMO_ACCOUNTS.map((acct) => (
                <div
                  key={acct.role}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        {acct.role} PORTAL
                      </span>
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {acct.email}
                      </span>
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                      {acct.name} ·{' '}
                      <span className="font-normal text-slate-500 dark:text-slate-400">
                        {acct.title}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {acct.scope}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    <button
                      type="button"
                      onClick={() => handleSelectAccount(acct.email)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
                    >
                      Fill Credentials
                    </button>
                    <button
                      type="button"
                      onClick={() => quickSwitchRole(acct.role)}
                      className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors whitespace-nowrap"
                    >
                      Enter {acct.role.charAt(0) + acct.role.slice(1).toLowerCase()} Portal
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Card */}
        <div className="lg:col-span-5" id="login-panel">
          <div className="p-6 sm:p-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/90 shadow-lg space-y-6">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  Workspace Authentication
                </span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  Password: demo1234
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display">
                Sign in to AgencyOS
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter your agency or client portal email address to resolve role permissions.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-300">
                {errorMsg}
              </div>
            )}

            {forgotPasswordSent && (
              <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  Demo mode password reset instructions simulated for <strong>{email}</strong>. Use
                  password <code>demo1234</code>.
                </span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Work or Client Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="founder@demo-agency.com"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotPasswordSent(true)}
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
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
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
                  <span>Keep session active for 14 days</span>
                </label>
                <span className="text-slate-400 dark:text-slate-500 font-mono">TLS 1.3 Ready</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? 'Resolving Role & Session...' : 'Sign In to Workspace'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white dark:bg-slate-900 text-slate-400">
                  Single Sign-On Architecture
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                addToast(
                  'Google Workspace OAuth Ready',
                  'OAuth adapter is isolated for Phase 2 integration. Use Demo Accounts above for immediate access.',
                  'info'
                )
              }
              className="w-full py-2.5 px-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-2"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Continue with Google Workspace (Integration Ready — Demo Mode)</span>
            </button>

            {/* Quick Role Pills inside login box */}
            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2" id="security">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Quick-Fill Demo Credentials:
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((acct) => (
                  <button
                    key={acct.role}
                    type="button"
                    onClick={() => handleSelectAccount(acct.email)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border text-left transition-colors truncate ${
                      email === acct.email
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {acct.role}: {acct.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Clean Minimal Footer */}
      <footer className="mt-auto border-t border-slate-200/80 dark:border-slate-800/80 py-5 px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div>
          AgencyOS · Standalone Digital Marketing Agency Operating System (Phase 1 Repository Architecture)
        </div>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Role-Isolated Portals
          </span>
          <span className="inline-flex items-center gap-1">
            <Workflow className="w-3.5 h-3.5 text-indigo-500" /> Event Bus Ready
          </span>
          <span className="inline-flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-sky-500" /> Mock Repository Active
          </span>
        </div>
      </footer>
    </div>
  );
};
