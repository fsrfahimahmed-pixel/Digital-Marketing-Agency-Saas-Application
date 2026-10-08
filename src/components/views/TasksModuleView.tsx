import React, { useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  FolderKanban,
  List,
  Plus,
  Search,
} from 'lucide-react';
import { useAgency } from '../../context/AgencyContext';
import { TODAY_STR } from '../../data/seedData';
import { PermissionService } from '../../services/agencyServices';
import {
  AvatarCircle,
  DueDateText,
  EmptyState,
  PageHeader,
  PriorityText,
} from '../ui/Primitives';
import { TaskStatus } from '../../types/domain';

const TASK_COLUMNS: TaskStatus[] = [
  'Backlog',
  'To Do',
  'In Progress',
  'Blocked',
  'Review',
  'Completed',
];

export const TasksModuleView: React.FC = () => {
  const {
    currentUser,
    snapshot,
    openTaskDrawer,
    setQuickCreateOpen,
    updateTaskStatus,
  } = useAgency();

  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'calendar'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [sliceFilter, setSliceFilter] = useState<'ALL' | 'TODAY' | 'OVERDUE' | 'COMPLETED'>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const visibleTasks = useMemo(() => {
    if (!currentUser) return [];
    return PermissionService.getVisibleTasks(
      currentUser,
      snapshot.tasks,
      snapshot.projects
    );
  }, [currentUser, snapshot.tasks, snapshot.projects]);

  if (!currentUser) return null;

  const isEmployee = currentUser.role === 'EMPLOYEE';
  const employees = snapshot.users.filter((u) => u.role === 'EMPLOYEE');

  const filteredTasks = visibleTasks.filter((t) => {
    if (isEmployee && assigneeFilter === 'ALL' && sliceFilter !== 'ALL') {
      if (t.assigned_to !== currentUser.id) return false;
    }
    if (assigneeFilter !== 'ALL' && t.assigned_to !== assigneeFilter) return false;

    if (sliceFilter === 'TODAY' && (t.due_date !== TODAY_STR || t.status === 'Completed')) {
      return false;
    }
    if (sliceFilter === 'OVERDUE' && (t.due_date >= TODAY_STR || t.status === 'Completed')) {
      return false;
    }
    if (sliceFilter === 'COMPLETED' && t.status !== 'Completed') {
      return false;
    }

    const q = searchQuery.trim().toLowerCase();
    if (
      q &&
      !t.title.toLowerCase().includes(q) &&
      !t.code.toLowerCase().includes(q)
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEmployee ? 'My Tasks & Execution Board' : 'Agency Tasks & Sprint Kanban'}
        subtitle="Drag and drop tasks across stages or click any task card to open its checklist, comments, and time log."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1 ${
                  viewMode === 'kanban'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500'
                }`}
              >
                <FolderKanban className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1 ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1 ${
                  viewMode === 'calendar'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Schedule</span>
              </button>
            </div>

            <button
              onClick={() => setQuickCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Task</span>
            </button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {[
            { id: 'ALL', label: 'All Tasks' },
            { id: 'TODAY', label: 'Due Today (Oct 07)' },
            { id: 'OVERDUE', label: 'Overdue' },
            { id: 'COMPLETED', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSliceFilter(tab.id as typeof sliceFilter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                sliceFilter === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          {!isEmployee && (
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
            >
              <option value="ALL">All Specialists</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          )}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
            />
          </div>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <EmptyState
          title="No tasks match this filter"
          description="Switch filter tabs or create a new task to populate the sprint board."
          actionLabel="Create Task"
          onAction={() => setQuickCreateOpen(true)}
        />
      ) : viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3.5 overflow-x-auto pb-2">
          {TASK_COLUMNS.map((colStatus) => {
            const colTasks = filteredTasks.filter((t) => t.status === colStatus);
            return (
              <div
                key={colStatus}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedTaskId) {
                    updateTaskStatus(draggedTaskId, colStatus);
                    setDraggedTaskId(null);
                  }
                }}
                className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex flex-col gap-2.5 min-h-[460px]"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 px-1">
                  <span>{colStatus}</span>
                  <span className="font-mono text-slate-400">{colTasks.length}</span>
                </div>

                <div className="space-y-2.5 flex-1">
                  {colTasks.map((tsk) => {
                    const assignee = snapshot.users.find((u) => u.id === tsk.assigned_to);
                    const prj = snapshot.projects.find((p) => p.id === tsk.project_id);

                    return (
                      <div
                        key={tsk.id}
                        draggable
                        onDragStart={() => setDraggedTaskId(tsk.id)}
                        onClick={() => openTaskDrawer(tsk.id)}
                        className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 cursor-pointer space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                            {tsk.code}
                          </span>
                          <PriorityText priority={tsk.priority} />
                        </div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white leading-snug">
                          {tsk.title}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {prj?.code} · {prj?.name}
                        </div>
                        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {assignee && (
                              <AvatarCircle
                                initials={assignee.avatarInitials}
                                colorClass={assignee.avatarColor}
                                size="xs"
                                title={assignee.name}
                              />
                            )}
                            <span className="text-[11px] text-slate-500 truncate max-w-[85px]">
                              {assignee?.name.split(' ')[0]}
                            </span>
                          </div>
                          <DueDateText
                            date={tsk.due_date}
                            completed={tsk.status === 'Completed'}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'list' ? (
        <div className="rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800/80 text-[11px] font-semibold text-slate-500 bg-slate-50/50 dark:bg-slate-950/40">
                <th className="py-3 px-5">Task</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Hours</th>
                <th className="py-3 px-5">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 text-xs">
              {filteredTasks.map((tsk) => {
                const assignee = snapshot.users.find((u) => u.id === tsk.assigned_to);
                const prj = snapshot.projects.find((p) => p.id === tsk.project_id);
                return (
                  <tr
                    key={tsk.id}
                    onClick={() => openTaskDrawer(tsk.id)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer"
                  >
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {tsk.title}
                      </div>
                      <div className="text-slate-500 font-mono text-[11px]">{tsk.code}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600 dark:text-slate-300">
                      {prj?.name}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {assignee && (
                          <AvatarCircle
                            initials={assignee.avatarInitials}
                            colorClass={assignee.avatarColor}
                            size="xs"
                          />
                        )}
                        <span>{assignee?.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={tsk.status}
                        onChange={(e) =>
                          updateTaskStatus(tsk.id, e.target.value as TaskStatus)
                        }
                        className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        {TASK_COLUMNS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <PriorityText priority={tsk.priority} />
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums">
                      {tsk.actualHours}h / {tsk.estimatedHours}h
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <DueDateText
                        date={tsk.due_date}
                        completed={tsk.status === 'Completed'}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
          {[...filteredTasks]
            .sort((a, b) => a.due_date.localeCompare(b.due_date))
            .map((tsk) => (
              <div
                key={tsk.id}
                onClick={() => openTaskDrawer(tsk.id)}
                className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 cursor-pointer text-xs"
              >
                <div>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                    {tsk.code}
                  </span>{' '}
                  · <strong className="text-slate-900 dark:text-white">{tsk.title}</strong>
                </div>
                <DueDateText
                  date={tsk.due_date}
                  completed={tsk.status === 'Completed'}
                />
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
