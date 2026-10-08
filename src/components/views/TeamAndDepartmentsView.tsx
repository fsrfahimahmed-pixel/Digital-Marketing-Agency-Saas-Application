import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Plus,
  Users,
} from 'lucide-react';
import { useAgency } from '../../context/AgencyContext';
import {
  formatCurrency,
  ProjectHealthEngine,
  WorkloadEngine,
} from '../../services/agencyServices';
import {
  AvatarCircle,
  DueDateText,
  KpiCard,
  PageHeader,
  PriorityText,
  WorkloadBar,
} from '../ui/Primitives';

export const TeamAndDepartmentsView: React.FC<{ initialSubTab?: 'specialists' | 'managers' | 'departments' }> = ({
  initialSubTab = 'specialists',
}) => {
  const {
    currentUser,
    snapshot,
    currency,
    selectedEmployeeId,
    openEmployeeDetail,
    openProjectDetail,
    openTaskDrawer,
    reassignTask,
    setQuickCreateOpen,
  } = useAgency();

  const [subTab, setSubTab] = useState<'specialists' | 'managers' | 'departments'>(
    initialSubTab
  );

  if (!currentUser) return null;

  const employees = snapshot.users.filter((u) => u.role === 'EMPLOYEE');
  const managers = snapshot.users.filter((u) => u.role === 'MANAGER');

  const workloads = employees.map((emp) =>
    WorkloadEngine.calculateForUser(emp, snapshot.tasks, snapshot.projects)
  );

  const overloadedList = workloads.filter((w) => w.utilizationPercent > 100);

  // ==========================================================================
  // EMPLOYEE DETAIL PAGE (Section 24)
  // ==========================================================================
  if (selectedEmployeeId) {
    const person = snapshot.users.find((u) => u.id === selectedEmployeeId);
    if (!person) {
      return (
        <button
          onClick={() => openEmployeeDetail(null)}
          className="text-xs text-indigo-500 hover:underline"
        >
          Back to Team Roster
        </button>
      );
    }

    const w = WorkloadEngine.calculateForUser(person, snapshot.tasks, snapshot.projects);
    const dept = snapshot.departments.find((d) => d.id === person.department_id);
    const mgr = snapshot.users.find((u) => u.id === person.manager_id);
    const assignedProjects = snapshot.projects.filter((p) =>
      p.employee_ids.includes(person.id)
    );
    const assignedTasks = snapshot.tasks.filter((t) => t.assigned_to === person.id);

    return (
      <div className="space-y-6">
        <button
          onClick={() => openEmployeeDetail(null)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Team & Capacity Directory</span>
        </button>

        <div className="p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <AvatarCircle
              initials={person.avatarInitials}
              colorClass={person.avatarColor}
              size="lg"
            />
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{person.role}</span>
                <span aria-hidden="true">·</span>
                <span>{dept?.name || 'Executive'}</span>
                <span aria-hidden="true">·</span>
                <span>{person.availability}</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display">
                {person.name}
              </h1>
              <p className="text-xs text-slate-500">
                {person.title} · {person.email} · Reports to {mgr?.name || 'Founder'}
              </p>
            </div>
          </div>

          <div className="w-full lg:w-72 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <WorkloadBar
              percent={w.utilizationPercent}
              status={w.workloadStatus}
            />
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>{w.estimatedActiveHours}h active est.</span>
              <span>{w.capacityHours}h weekly cap</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <KpiCard label="Assigned Projects" value={assignedProjects.length} />
          <KpiCard label="Open Tasks" value={w.openTasksCount} />
          <KpiCard label="Completed Tasks" value={w.completedTasksCount} />
          <KpiCard label="Quality Score" value={`${person.performanceScore}%`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Assigned Tasks & Load Rebalancing ({assignedTasks.length})
              </h2>
              <span className="text-xs text-slate-500">
                Reassign tasks to balance team capacity
              </span>
            </div>
            <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
              {assignedTasks.map((tsk) => (
                <div
                  key={tsk.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div
                    onClick={() => openTaskDrawer(tsk.id)}
                    className="cursor-pointer min-w-0 flex-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                        {tsk.code}
                      </span>
                      <PriorityText priority={tsk.priority} />
                      <span>· {tsk.status}</span>
                    </div>
                    <div className="mt-1 font-semibold text-slate-900 dark:text-white">
                      {tsk.title}
                    </div>
                    <DueDateText
                      date={tsk.due_date}
                      completed={tsk.status === 'Completed'}
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={tsk.assigned_to}
                      onChange={(e) => reassignTask(tsk.id, e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    >
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          Reassign → {emp.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Active Project Memberships ({assignedProjects.length})
            </h2>
            <div className="space-y-3">
              {assignedProjects.map((prj) => (
                <div
                  key={prj.id}
                  onClick={() => openProjectDetail(prj.id)}
                  className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 cursor-pointer text-xs space-y-1"
                >
                  <div className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                    {prj.code} · {prj.status}
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {prj.name}
                  </div>
                  <div className="text-slate-500 font-mono">Deadline: {prj.deadline}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team, Workload & Departments"
        subtitle="Monitor specialist capacity utilization, delivery managers, and department resource allocation."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setSubTab('specialists')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                  subTab === 'specialists'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500'
                }`}
              >
                Specialists & Workload ({employees.length})
              </button>
              <button
                onClick={() => setSubTab('managers')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                  subTab === 'managers'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500'
                }`}
              >
                Managers ({managers.length})
              </button>
              <button
                onClick={() => setSubTab('departments')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                  subTab === 'departments'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500'
                }`}
              >
                Departments ({snapshot.departments.length})
              </button>
            </div>

            {currentUser.role === 'FOUNDER' && (
              <button
                onClick={() => setQuickCreateOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Member / Dept</span>
              </button>
            )}
          </div>
        }
      />

      {/* Overloaded Capacity Warning Banner (Section 33) */}
      {overloadedList.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              <strong>Capacity Alert:</strong> {overloadedList[0].user.name} is at{' '}
              <strong>{overloadedList[0].utilizationPercent}%</strong> estimated weekly
              workload ({overloadedList[0].openTasksCount} active tasks). Click their card to
              reassign tasks.
            </span>
          </div>
          <button
            onClick={() => openEmployeeDetail(overloadedList[0].user.id)}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold shrink-0"
          >
            Rebalance Tasks
          </button>
        </div>
      )}

      {subTab === 'specialists' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workloads.map((w) => {
            const dept = snapshot.departments.find((d) => d.id === w.user.department_id);
            return (
              <div
                key={w.user.id}
                onClick={() => openEmployeeDetail(w.user.id)}
                className="p-5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/50 cursor-pointer space-y-4 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <AvatarCircle
                      initials={w.user.avatarInitials}
                      colorClass={w.user.avatarColor}
                      size="md"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {w.user.name}
                      </h3>
                      <p className="text-xs text-slate-500">{w.user.title}</p>
                      <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5">
                        {dept?.name} · {w.user.availability}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-500">
                    QA {w.user.performanceScore}%
                  </span>
                </div>

                <WorkloadBar
                  percent={w.utilizationPercent}
                  status={w.workloadStatus}
                />

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <div className="text-slate-400 text-[11px]">Projects</div>
                    <div className="font-mono font-semibold text-slate-900 dark:text-white">
                      {w.activeProjectsCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[11px]">Open Tasks</div>
                    <div className="font-mono font-semibold text-slate-900 dark:text-white">
                      {w.openTasksCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[11px]">Est. Load</div>
                    <div className="font-mono font-semibold text-slate-900 dark:text-white">
                      {w.estimatedActiveHours}h
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {subTab === 'managers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {managers.map((mgr) => {
            const managedProjects = snapshot.projects.filter(
              (p) => p.manager_id === mgr.id
            );
            const teamMembers = employees.filter((e) => e.manager_id === mgr.id);
            const dept = snapshot.departments.find((d) => d.id === mgr.department_id);
            const avgHealth =
              managedProjects.length > 0
                ? Math.round(
                    managedProjects.reduce(
                      (s, p) =>
                        s +
                        ProjectHealthEngine.calculate(
                          p,
                          snapshot.tasks,
                          snapshot.approvals
                        ).healthScore,
                      0
                    ) / managedProjects.length
                  )
                : 95;

            return (
              <div
                key={mgr.id}
                className="p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <AvatarCircle
                      initials={mgr.avatarInitials}
                      colorClass={mgr.avatarColor}
                      size="md"
                    />
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {mgr.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {mgr.title} · {dept?.name}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    Avg Health: {avgHealth}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <div className="text-slate-500">Projects Managed</div>
                    <div className="text-base font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
                      {managedProjects.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Direct Specialists</div>
                    <div className="text-base font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
                      {teamMembers.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Availability</div>
                    <div className="text-xs font-medium text-slate-900 dark:text-white mt-1">
                      {mgr.availability}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {subTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {snapshot.departments.map((dept) => {
            const mgr = snapshot.users.find((u) => u.id === dept.manager_id);
            const deptProjects = snapshot.projects.filter(
              (p) => p.department_id === dept.id
            );
            const deptStaff = snapshot.users.filter(
              (u) => u.department_id === dept.id
            );

            return (
              <div
                key={dept.id}
                className="p-5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                    {dept.code}
                  </span>
                  <span className="text-slate-500">Lead: {mgr?.name}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {dept.name}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {dept.description}
                </p>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span>{deptProjects.length} Projects</span>
                  <span>{deptStaff.length} Members</span>
                  <span>{formatCurrency(dept.monthlyBudgetBdt, currency)}/mo</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
