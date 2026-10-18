import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  MessageSquare,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { useAgency } from '../../context/AgencyContext';
import { AvatarCircle, DueDateText, PriorityText } from '../ui/Primitives';
import { TaskStatus } from '../../types/domain';

const TASK_STATUSES: TaskStatus[] = [
  'Backlog',
  'To Do',
  'In Progress',
  'Blocked',
  'Review',
  'Completed',
];

export const TaskDetailDrawer: React.FC = () => {
  const {
    currentUser,
    selectedTaskId,
    openTaskDrawer,
    snapshot,
    updateTaskStatus,
    reassignTask,
    toggleTaskChecklist,
    addTaskComment,
    deleteTask,
    logTimeEntry,
    openProjectDetail,
  } = useAgency();

  const [commentText, setCommentText] = useState('');
  const [logHours, setLogHours] = useState(1.5);
  const [logNote, setLogNote] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!selectedTaskId || !currentUser) return null;

  const task = snapshot.tasks.find((t) => t.id === selectedTaskId);
  if (!task) return null;

  const project = snapshot.projects.find((p) => p.id === task.project_id);
  const client = snapshot.clients.find((c) => c.id === task.client_id);
  const assignee = snapshot.users.find((u) => u.id === task.assigned_to);
  const employees = snapshot.users.filter((u) => u.role === 'EMPLOYEE');

  const canReassign = currentUser.role === 'FOUNDER' || currentUser.role === 'MANAGER';
  const completedChecks = task.checklist.filter((c) => c.completed).length;
  const checkPct =
    task.checklist.length > 0
      ? Math.round((completedChecks / task.checklist.length) * 100)
      : task.status === 'Completed'
        ? 100
        : 45;

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addTaskComment(task.id, commentText);
    setCommentText('');
  };

  const handleLogTime = (e: React.FormEvent) => {
    e.preventDefault();
    if (logHours <= 0) return;
    logTimeEntry(task.id, logHours, logNote || `Executed ${task.title}`);
    setLogNote('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/65 backdrop-blur-xs"
      onClick={() => openTaskDrawer(null)}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {task.code}
            </span>
            <span aria-hidden="true">·</span>
            <span>{client?.company || 'Client'}</span>
            <span aria-hidden="true">·</span>
            <PriorityText priority={task.priority} />
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 transition-colors"
              title="Delete Task"
              aria-label="Delete Task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => openTaskDrawer(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Banner */}
        {showDeleteConfirm && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex flex-col gap-2.5">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-rose-800 dark:text-rose-300">
                  Delete task {task.code}?
                </span>
                <p className="text-rose-700 dark:text-rose-400 mt-0.5">
                  This will permanently remove "{task.title}" and its checklist items from the workspace.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteTask(task.id);
                  openTaskDrawer(null);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-2xs"
              >
                Yes, Delete Task
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Workspace Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-snug font-display">
              {task.title}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {task.description}
            </p>
            {project && (
              <button
                onClick={() => {
                  openTaskDrawer(null);
                  openProjectDetail(project.id);
                }}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <span>
                  Project: {project.code} · {project.name}
                </span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status & Ownership Grid */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-500 mb-1">Execution Status</label>
              <select
                value={task.status}
                onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 font-medium text-slate-900 dark:text-white"
              >
                {TASK_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 mb-1">Assigned Specialist</label>
              {canReassign ? (
                <select
                  value={task.assigned_to}
                  onChange={(e) => reassignTask(task.id, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 font-medium text-slate-900 dark:text-white"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-2 py-1.5">
                  {assignee && (
                    <AvatarCircle
                      initials={assignee.avatarInitials}
                      colorClass={assignee.avatarColor}
                      size="xs"
                    />
                  )}
                  <span className="font-medium text-slate-900 dark:text-white">
                    {assignee?.name}
                  </span>
                </div>
              )}
            </div>

            <div>
              <span className="block text-slate-500 mb-1">Target Due Date</span>
              <DueDateText date={task.due_date} completed={task.status === 'Completed'} />
            </div>

            <div>
              <span className="block text-slate-500 mb-1">Time Budget vs Actual</span>
              <span className="font-mono tabular-nums text-slate-900 dark:text-white font-medium">
                {task.actualHours}h logged / {task.estimatedHours}h est.
              </span>
            </div>
          </div>

          {/* Interactive Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900 dark:text-white">
                Deliverable Checklist ({completedChecks}/{task.checklist.length})
              </span>
              <span className="font-mono tabular-nums text-slate-500">{checkPct}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-200"
                style={{ width: `${checkPct}%` }}
              />
            </div>

            <div className="space-y-2 pt-1">
              {task.checklist.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleTaskChecklist(task.id, item.id)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-left text-xs transition-colors"
                >
                  {item.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span
                    className={
                      item.completed
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-800 dark:text-slate-200 font-medium'
                    }
                  >
                    {item.text}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Time Entry */}
          <form
            onSubmit={handleLogTime}
            className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 space-y-3"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                Log Execution Hours
              </span>
              <span className="font-mono text-slate-500">Syncs to Workload & Timesheet</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step={0.5}
                min={0.5}
                max={24}
                value={logHours}
                onChange={(e) => setLogHours(Number(e.target.value))}
                className="w-20 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white"
              />
              <input
                type="text"
                value={logNote}
                onChange={(e) => setLogNote(e.target.value)}
                placeholder="Work summary note..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium whitespace-nowrap"
              >
                + Log Time
              </button>
            </div>
          </form>

          {/* Comments Thread */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
              <span>Internal Task Comments ({task.comments.length})</span>
            </div>

            <div className="space-y-2.5">
              {task.comments.length === 0 ? (
                <p className="text-xs text-slate-500">No comments yet on this task.</p>
              ) : (
                task.comments.map((cmt) => {
                  const author = snapshot.users.find((u) => u.id === cmt.author_id);
                  return (
                    <div
                      key={cmt.id}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {author?.name || 'Team Member'}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">
                          {cmt.created_at}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        {cmt.content}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handlePostComment} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write an update or @mention manager..."
                className="flex-1 px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
                aria-label="Send comment"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Task Management Danger Zone */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Task Management</div>
              <div className="text-[11px] text-slate-400">Permanently delete this task and clean up references</div>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/80 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Task</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
