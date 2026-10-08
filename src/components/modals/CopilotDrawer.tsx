import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  X,
} from 'lucide-react';
import { useAgency } from '../../context/AgencyContext';
import { AiAssistantService } from '../../services/agencyServices';

export const CopilotDrawer: React.FC = () => {
  const {
    currentUser,
    isCopilotOpen,
    setCopilotOpen,
    snapshot,
    navigateTo,
    openProjectDetail,
  } = useAgency();

  if (!isCopilotOpen || !currentUser) return null;

  const insights = AiAssistantService.getInsights(currentUser, snapshot);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs"
      onClick={() => setCopilotOpen(false)}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Agency Copilot
              </h2>
              <p className="text-[11px] text-slate-500">
                Deterministic operational intelligence · Future LLM-Ready
              </p>
            </div>
          </div>
          <button
            onClick={() => setCopilotOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <div className="font-semibold text-indigo-600 dark:text-indigo-300 mb-1">
              What needs attention today?
            </div>
            Analyzed live repository state for <strong>{currentUser.name}</strong> (
            {currentUser.role}). All recommendations below derive directly from current project
            health, task deadlines, and specialist capacity.
          </div>

          <div className="space-y-3">
            {insights.map((item) => {
              const borderStyle =
                item.severity === 'critical'
                  ? 'border-rose-500/40 bg-rose-500/5'
                  : item.severity === 'warning'
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border ${borderStyle} space-y-2.5`}
                >
                  <div className="flex items-start gap-2">
                    {item.severity === 'critical' || item.severity === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    )}
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">
                      {item.title}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.detail}
                  </p>
                  <button
                    onClick={() => {
                      setCopilotOpen(false);
                      if (item.targetProjectId) {
                        openProjectDetail(item.targetProjectId);
                      } else {
                        navigateTo(item.targetNav);
                      }
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <span>{item.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>AiAssistantService Contract Active</span>
          <span className="font-mono">Phase 1 Deterministic Mode</span>
        </div>
      </div>
    </div>
  );
};
