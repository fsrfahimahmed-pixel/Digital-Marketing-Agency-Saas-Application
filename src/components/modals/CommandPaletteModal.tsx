import React, { useMemo, useState } from 'react';
import {
  Briefcase,
  CheckSquare,
  FileText,
  FolderKanban,
  Plus,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useAgency } from '../../context/AgencyContext';
import { PermissionService } from '../../services/agencyServices';

export const CommandPaletteModal: React.FC = () => {
  const {
    currentUser,
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    snapshot,
    navigateTo,
    openProjectDetail,
    openTaskDrawer,
    openClientDetail,
    openEmployeeDetail,
    setQuickCreateOpen,
    setCopilotOpen,
  } = useAgency();

  const [query, setQuery] = useState('');

  const visibleProjects = useMemo(() => {
    if (!currentUser) return [];
    return PermissionService.getVisibleProjects(currentUser, snapshot.projects);
  }, [currentUser, snapshot.projects]);

  const visibleTasks = useMemo(() => {
    if (!currentUser) return [];
    return PermissionService.getVisibleTasks(currentUser, snapshot.tasks, snapshot.projects);
  }, [currentUser, snapshot.tasks, snapshot.projects]);

  if (!isCommandPaletteOpen || !currentUser) return null;

  const q = query.trim().toLowerCase();

  const matchedProjects = visibleProjects
    .filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.projectType.toLowerCase().includes(q)
    )
    .slice(0, 4);

  const matchedTasks = visibleTasks
    .filter(
      (t) =>
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q)
    )
    .slice(0, 4);

  const matchedClients =
    currentUser.role === 'FOUNDER' || currentUser.role === 'MANAGER'
      ? snapshot.clients
          .filter(
            (c) =>
              !q ||
              c.company.toLowerCase().includes(q) ||
              c.name.toLowerCase().includes(q)
          )
          .slice(0, 3)
      : [];

  const matchedPeople =
    currentUser.role !== 'CLIENT'
      ? snapshot.users
          .filter(
            (u) =>
              u.role !== 'CLIENT' &&
              (!q ||
                u.name.toLowerCase().includes(q) ||
                u.title.toLowerCase().includes(q))
          )
          .slice(0, 3)
      : [];

  const matchedFiles = snapshot.files
    .filter((f) => {
      if (currentUser.role === 'CLIENT') {
        return f.client_id === currentUser.client_id && f.visibility === 'Client-visible';
      }
      return true;
    })
    .filter((f) => !q || f.name.toLowerCase().includes(q))
    .slice(0, 3);

  const closeAndRun = (fn: () => void) => {
    setCommandPaletteOpen(false);
    setQuery('');
    fn();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 bg-slate-950/70 backdrop-blur-xs p-4"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div
        className="w-full max-w-2xl rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, tasks, clients, specialists, files, or run a command..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <button
            onClick={() => setCommandPaletteOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Grouped Results */}
        <div className="max-h-[65vh] overflow-y-auto p-3 space-y-5">
          {/* Quick Actions */}
          <div>
            <div className="px-2.5 pb-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
              Quick Actions & Navigation
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {currentUser.role !== 'CLIENT' && (
                <button
                  onClick={() => closeAndRun(() => setQuickCreateOpen(true))}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                >
                  <Plus className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Open Quick Create (+ Project, Task, Lead)</span>
                </button>
              )}
              <button
                onClick={() => closeAndRun(() => setCopilotOpen(true))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
              >
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Ask Agency Copilot: What needs attention?</span>
              </button>
              <button
                onClick={() => closeAndRun(() => navigateTo('projects'))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
              >
                <FolderKanban className="w-4 h-4 text-sky-500 shrink-0" />
                <span>Go to Projects Workspace</span>
              </button>
              <button
                onClick={() => closeAndRun(() => navigateTo('approvals'))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
              >
                <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Go to Approval Center</span>
              </button>
            </div>
          </div>

          {/* Projects */}
          {matchedProjects.length > 0 && (
            <div>
              <div className="px-2.5 pb-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
                Projects ({matchedProjects.length})
              </div>
              <div className="space-y-1">
                {matchedProjects.map((prj) => (
                  <button
                    key={prj.id}
                    onClick={() => closeAndRun(() => openProjectDetail(prj.id))}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FolderKanban className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="text-xs font-mono text-slate-400 shrink-0">
                        {prj.code}
                      </span>
                      <span className="text-xs font-medium text-slate-900 dark:text-white truncate">
                        {prj.name}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 shrink-0">{prj.status}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {matchedTasks.length > 0 && (
            <div>
              <div className="px-2.5 pb-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
                Tasks ({matchedTasks.length})
              </div>
              <div className="space-y-1">
                {matchedTasks.map((tsk) => (
                  <button
                    key={tsk.id}
                    onClick={() => closeAndRun(() => openTaskDrawer(tsk.id))}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-xs font-mono text-slate-400 shrink-0">
                        {tsk.code}
                      </span>
                      <span className="text-xs font-medium text-slate-900 dark:text-white truncate">
                        {tsk.title}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-slate-500 shrink-0">
                      {tsk.status} · {tsk.due_date}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clients */}
          {matchedClients.length > 0 && (
            <div>
              <div className="px-2.5 pb-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
                Clients ({matchedClients.length})
              </div>
              <div className="space-y-1">
                {matchedClients.map((cli) => (
                  <button
                    key={cli.id}
                    onClick={() => closeAndRun(() => openClientDetail(cli.id))}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Briefcase className="w-4 h-4 text-sky-500 shrink-0" />
                      <span className="text-xs font-medium text-slate-900 dark:text-white truncate">
                        {cli.company}
                      </span>
                      <span className="text-xs text-slate-400 truncate">· {cli.name}</span>
                    </div>
                    <span className="text-xs text-slate-500 shrink-0">{cli.industry}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Team */}
          {matchedPeople.length > 0 && (
            <div>
              <div className="px-2.5 pb-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
                Agency Team ({matchedPeople.length})
              </div>
              <div className="space-y-1">
                {matchedPeople.map((person) => (
                  <button
                    key={person.id}
                    onClick={() => closeAndRun(() => openEmployeeDetail(person.id))}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Users className="w-4 h-4 text-violet-500 shrink-0" />
                      <span className="text-xs font-medium text-slate-900 dark:text-white truncate">
                        {person.name}
                      </span>
                      <span className="text-xs text-slate-400 truncate">· {person.title}</span>
                    </div>
                    <span className="text-xs text-slate-500 shrink-0">{person.role}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {matchedFiles.length > 0 && (
            <div>
              <div className="px-2.5 pb-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
                Files & Deliverables ({matchedFiles.length})
              </div>
              <div className="space-y-1">
                {matchedFiles.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => closeAndRun(() => navigateTo('files'))}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="text-xs font-medium text-slate-900 dark:text-white truncate">
                        {file.name}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-slate-500 shrink-0">
                      {file.sizeLabel} · {file.visibility}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Role-Scoped Global Search ({currentUser.role})</span>
          <span className="font-mono">ESC to close · Ctrl/Cmd + K</span>
        </div>
      </div>
    </div>
  );
};
