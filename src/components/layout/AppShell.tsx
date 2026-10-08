import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  User as UserIcon,
  Users,
  X,
} from 'lucide-react';
import { useAgency } from '../../context/AgencyContext';
import { NAVIGATION_BY_ROLE, PermissionService } from '../../services/agencyServices';
import { Role } from '../../types/domain';
import { CommandPaletteModal } from '../modals/CommandPaletteModal';
import { CopilotDrawer } from '../modals/CopilotDrawer';
import { QuickCreateAndProjectWizardModal } from '../modals/QuickCreateAndProjectWizardModal';
import { TaskDetailDrawer } from '../modals/TaskDetailDrawer';
import { AvatarCircle } from '../ui/Primitives';

const NAV_ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  overview: LayoutDashboard,
  projects: FolderKanban,
  leads: Briefcase,
  clients: Building2,
  tasks: CheckSquare,
  team: Users,
  departments: Layers,
  calendar: Calendar,
  time: Clock,
  messages: MessageSquare,
  files: FileText,
  approvals: ShieldCheck,
  analytics: BarChart3,
  reports: FileSpreadsheet,
  finance: CreditCard,
  invoices: CreditCard,
  activity: Activity,
  settings: Settings,
  profile: UserIcon,
};

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    currentUser,
    activeNav,
    selectedProjectId,
    navigateTo,
    quickSwitchRole,
    logout,
    snapshot,
    theme,
    toggleTheme,
    setCommandPaletteOpen,
    setCopilotOpen,
    setQuickCreateOpen,
    markNotificationRead,
    markAllNotificationsRead,
    openProjectDetail,
    toasts,
    dismissToast,
  } = useAgency();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  if (!currentUser) return null;

  const navItems = NAVIGATION_BY_ROLE[currentUser.role] || [];
  const visibleProjects = PermissionService.getVisibleProjects(
    currentUser,
    snapshot.projects
  );
  const visibleTasks = PermissionService.getVisibleTasks(
    currentUser,
    snapshot.tasks,
    snapshot.projects
  );

  // Notification filtering by role
  const myNotifications = snapshot.notifications.filter((n) => {
    if (currentUser.role === 'CLIENT') {
      return n.user_id === currentUser.id;
    }
    return (
      n.user_id === currentUser.id ||
      n.user_id === 'ALL_INTERNAL' ||
      (currentUser.role === 'FOUNDER' && n.user_id === 'usr_founder_01')
    );
  });

  const unreadCount = myNotifications.filter((n) => !n.read).length;

  const getBadgeValue = (badgeKey?: string): number | null => {
    if (!badgeKey) return null;
    if (badgeKey === 'projects') return visibleProjects.length;
    if (badgeKey === 'tasks')
      return visibleTasks.filter((t) => t.status !== 'Completed').length;
    if (badgeKey === 'approvals') {
      return snapshot.approvals.filter(
        (a) =>
          a.status === 'Pending' &&
          (currentUser.role !== 'CLIENT' ||
            (a.client_id === currentUser.client_id &&
              a.visibility === 'Client-visible'))
      ).length;
    }
    if (badgeKey === 'leads')
      return snapshot.leads.filter((l) => l.status !== 'Won' && l.status !== 'Lost')
        .length;
    if (badgeKey === 'messages') {
      return snapshot.messages.filter((m) =>
        currentUser.role === 'CLIENT'
          ? m.client_id === currentUser.client_id && m.visibility === 'Client-visible'
          : true
      ).length;
    }
    return null;
  };

  const activeProjectObj = selectedProjectId
    ? snapshot.projects.find((p) => p.id === selectedProjectId)
    : null;

  const currentNavLabel =
    navItems.find((item) => item.id === activeNav)?.label || 'Workspace';

  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80 select-none">
      {/* Brand & Collapse Header */}
      <div className="h-16 px-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2">
        <button
          onClick={() => {
            navigateTo('overview');
            if (isMobile) setMobileMenuOpen(false);
          }}
          className="flex items-center gap-2.5 text-left min-w-0"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-display font-bold text-sm flex items-center justify-center shrink-0">
            A
          </div>
          {(!sidebarCollapsed || isMobile) && (
            <div className="min-w-0">
              <div className="text-base font-bold tracking-tight text-slate-900 dark:text-white font-display leading-none">
                AgencyOS
              </div>
              <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">
                {currentUser.role} PORTAL
              </div>
            </div>
          )}
        </button>

        {!isMobile ? (
          <button
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label="Toggle sidebar width"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        ) : (
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {(['Operations', 'Delivery', 'Governance'] as const).map((sec) => {
          const secItems = navItems.filter((i) => i.section === sec);
          if (secItems.length === 0) return null;
          return (
            <div key={sec} className="space-y-1">
              {(!sidebarCollapsed || isMobile) && (
                <div className="px-2.5 pb-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                  {sec}
                </div>
              )}
              {secItems.map((item) => {
                const Icon = NAV_ICON_MAP[item.id] || LayoutDashboard;
                const isActive = activeNav === item.id;
                const badgeVal = getBadgeValue(item.badgeKey);

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigateTo(item.id);
                      if (isMobile) setMobileMenuOpen(false);
                    }}
                    title={sidebarCollapsed && !isMobile ? item.label : undefined}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className="w-4 h-4 shrink-0" />
                      {(!sidebarCollapsed || isMobile) && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </div>
                    {(!sidebarCollapsed || isMobile) &&
                      badgeVal !== null &&
                      badgeVal > 0 && (
                        <span
                          className={`text-[11px] font-mono tabular-nums ${
                            isActive
                              ? 'text-indigo-100'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {badgeVal}
                        </span>
                      )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Cross-Role Evaluator Switcher & Current User Footer */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3">
        {(!sidebarCollapsed || isMobile) && (
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>DEMO ROLE SWITCHER</span>
              <span>LIVE SYNC</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {(['FOUNDER', 'MANAGER', 'EMPLOYEE', 'CLIENT'] as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    quickSwitchRole(r);
                    if (isMobile) setMobileMenuOpen(false);
                  }}
                  className={`py-1 px-2 rounded text-[11px] font-semibold transition-colors ${
                    currentUser.role === r
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <AvatarCircle
              initials={currentUser.avatarInitials}
              colorClass={currentUser.avatarColor}
              size="sm"
            />
            {(!sidebarCollapsed || isMobile) && (
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {currentUser.name}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {currentUser.title}
                </div>
              </div>
            )}
          </div>
          {(!sidebarCollapsed || isMobile) && (
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-150 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="sticky top-0 h-screen">{renderSidebarContent(false)}</div>
      </aside>

      {/* Mobile Off-Canvas Sidebar */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex bg-slate-950/70 backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-72 h-full"
            onClick={(e) => e.stopPropagation()}
          >
            {renderSidebarContent(true)}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar (SaaS Dashboard Top Bar Contract: Breadcrumbs left, Global Search + Actions right) */}
        <header className="h-16 px-4 sm:px-8 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between gap-4">
          {/* Left: Mobile Menu Button + Breadcrumb Trail */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
              aria-label="Open navigation menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-xs sm:text-sm truncate">
              <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                /app/{currentUser.role.toLowerCase()}
              </span>
              <span className="text-slate-400">/</span>
              <button
                onClick={() => navigateTo(activeNav)}
                className="font-semibold text-slate-900 dark:text-white hover:underline truncate"
              >
                {currentNavLabel}
              </button>
              {activeProjectObj && (
                <>
                  <span className="text-slate-400">/</span>
                  <span className="font-mono text-xs text-slate-500 truncate">
                    {activeProjectObj.code}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right: Search, Quick Create, Copilot, Notifications, Theme, Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Global Search Trigger */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-500 dark:text-slate-400 hover:border-indigo-500/40 transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search workspace...</span>
              <kbd className="hidden md:inline font-mono text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-700">
                ⌘K
              </kbd>
            </button>

            {/* Quick Create Button */}
            {currentUser.role !== 'CLIENT' && (
              <button
                onClick={() => setQuickCreateOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Create</span>
              </button>
            )}

            {/* Copilot Trigger */}
            <button
              onClick={() => setCopilotOpen(true)}
              title="Agency Copilot"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-indigo-500" />
            </button>

            {/* Notification Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotifOpen((o) => !o);
                  setUserMenuOpen(false);
                }}
                title="Notifications"
                className="relative p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-mono font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-40 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Notifications ({unreadCount} unread)
                    </span>
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                    {myNotifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationRead(n.id);
                          setNotifOpen(false);
                          if (n.linkProject_id) {
                            openProjectDetail(n.linkProject_id);
                          }
                        }}
                        className={`p-3.5 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 space-y-1 ${
                          !n.read ? 'bg-indigo-500/5' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {n.title}
                          </span>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                          {n.description}
                        </p>
                        <div className="text-[10px] font-mono text-slate-400">
                          {n.created_at}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Switcher */}
            <button
              onClick={toggleTheme}
              title="Switch Dark / Light Mode"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setUserMenuOpen((o) => !o);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <AvatarCircle
                  initials={currentUser.avatarInitials}
                  colorClass={currentUser.avatarColor}
                  size="sm"
                />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-40 text-xs space-y-1">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {currentUser.name}
                    </div>
                    <div className="text-slate-500 truncate">{currentUser.email}</div>
                    <div className="font-mono text-[11px] text-indigo-500 mt-0.5">
                      Role: {currentUser.role}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigateTo(currentUser.role === 'FOUNDER' ? 'settings' : 'profile');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                  >
                    Account & Preferences
                  </button>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium"
                  >
                    Sign Out of AgencyOS
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Workspace Viewport */}
        <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-8 py-6 sm:py-8">
          {children}
        </main>
      </div>

      {/* Global Overlays & Drawers */}
      <CommandPaletteModal />
      <QuickCreateAndProjectWizardModal />
      <TaskDetailDrawer />
      <CopilotDrawer />

      {/* Toast Notification Stack (Section 58) */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto p-4 rounded-xl bg-slate-900 text-white border border-slate-700 shadow-xl flex items-start justify-between gap-3 text-xs"
          >
            <div>
              <div className="font-semibold">{t.title}</div>
              {t.description && (
                <div className="text-slate-300 mt-0.5 leading-relaxed">
                  {t.description}
                </div>
              )}
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
