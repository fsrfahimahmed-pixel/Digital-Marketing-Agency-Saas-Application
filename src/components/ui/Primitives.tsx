import React from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FolderOpen,
  ShieldAlert,
} from 'lucide-react';
import { HealthLabel, Priority, WorkloadStatus } from '../../types/domain';

export const AvatarCircle: React.FC<{
  initials: string;
  colorClass?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  title?: string;
}> = ({ initials, colorClass = 'bg-indigo-600 text-white', size = 'sm', title }) => {
  const sizeMap = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };
  return (
    <div
      title={title}
      className={`${sizeMap[size]} ${colorClass} rounded-full font-semibold flex items-center justify-center shrink-0 select-none tracking-tight shadow-xs`}
    >
      {initials}
    </div>
  );
};

export const KpiCard: React.FC<{
  label: string;
  value: string | number;
  delta?: string;
  deltaPositive?: boolean;
  subtext?: string;
  onClick?: () => void;
  urgent?: boolean;
}> = ({ label, value, delta, deltaPositive = true, subtext, onClick, urgent }) => {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group p-5 rounded-xl bg-white dark:bg-slate-900/90 border transition-all duration-150 ${
        urgent
          ? 'border-rose-500/40 dark:border-rose-500/40'
          : 'border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40 dark:hover:border-indigo-500/40'
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {label}
        </span>
        {delta && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-mono tabular-nums font-medium ${
              deltaPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {deltaPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5" />
            )}
            {delta}
          </span>
        )}
      </div>
      <div className="mt-2.5 flex items-baseline justify-between gap-2">
        <span className="text-2xl font-semibold tracking-tight font-mono tabular-nums text-slate-900 dark:text-white">
          {value}
        </span>
      </div>
      {subtext && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 truncate">
          {subtext}
        </p>
      )}
    </div>
  );
};

export const HealthIndicator: React.FC<{
  score: number;
  label: HealthLabel;
  reason?: string;
  compact?: boolean;
}> = ({ score, label, reason, compact }) => {
  const colorStyles =
    label === 'Healthy'
      ? 'text-emerald-600 dark:text-emerald-400'
      : label === 'At Risk'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-rose-600 dark:text-rose-400';

  const Icon =
    label === 'Healthy' ? CheckCircle2 : label === 'At Risk' ? AlertTriangle : ShieldAlert;

  return (
    <div className="group relative inline-flex items-center gap-1.5" title={reason}>
      <Icon className={`w-3.5 h-3.5 shrink-0 ${colorStyles}`} />
      <span className={`text-xs font-medium whitespace-nowrap ${colorStyles}`}>
        {label}
      </span>
      <span className="text-xs text-slate-400 dark:text-slate-500" aria-hidden="true">
        ·
      </span>
      <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
        {score}%
      </span>
      {!compact && reason && (
        <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute bottom-full left-0 mb-2 w-64 p-2.5 rounded-lg bg-slate-900 text-slate-100 text-xs border border-slate-700 shadow-lg z-30">
          <div className="font-semibold mb-0.5">
            Health Score: {score}/100 ({label})
          </div>
          <div className="text-slate-300 leading-relaxed">{reason}</div>
        </div>
      )}
    </div>
  );
};

export const PriorityText: React.FC<{ priority: Priority }> = ({ priority }) => {
  const map: Record<Priority, string> = {
    Critical: 'text-rose-600 dark:text-rose-400 font-semibold',
    High: 'text-amber-600 dark:text-amber-400 font-medium',
    Medium: 'text-sky-600 dark:text-sky-400 font-medium',
    Low: 'text-slate-500 dark:text-slate-400',
  };
  return <span className={`text-xs whitespace-nowrap ${map[priority]}`}>{priority}</span>;
};

export const WorkloadBar: React.FC<{
  percent: number;
  status: WorkloadStatus;
  showLabel?: boolean;
}> = ({ percent, status, showLabel = true }) => {
  const barColor =
    status === 'Overloaded'
      ? 'bg-rose-500'
      : status === 'Busy'
        ? 'bg-amber-500'
        : status === 'Balanced'
          ? 'bg-emerald-500'
          : 'bg-sky-500';

  const textColor =
    status === 'Overloaded'
      ? 'text-rose-600 dark:text-rose-400'
      : status === 'Busy'
        ? 'text-amber-600 dark:text-amber-400'
        : status === 'Balanced'
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-sky-600 dark:text-sky-400';

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className={`font-medium ${textColor}`}>{status}</span>
          <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
            {percent}%
          </span>
        </div>
      )}
      <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-200 ${barColor}`}
          style={{ width: `${Math.min(100, Math.max(6, percent))}%` }}
        />
      </div>
    </div>
  );
};

export const PageHeader: React.FC<{
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}> = ({ title, subtitle, actions }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800/80">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-display">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
};

export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ title, description, actionLabel, onAction }) => {
  return (
    <div className="py-14 px-6 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
      <div className="w-10 h-10 rounded-lg bg-slate-200/70 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-500 dark:text-slate-400">
        <FolderOpen className="w-5 h-5" />
      </div>
      <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">
        {title}
      </h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors whitespace-nowrap"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export const ConfirmModal: React.FC<{
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  danger = true,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          {title}
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-xs font-medium text-white transition-colors ${
              danger
                ? 'bg-rose-600 hover:bg-rose-500'
                : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export const SkeletonRow: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, idx) => (
      <div
        key={idx}
        className="h-12 w-full rounded-lg bg-slate-200/60 dark:bg-slate-800/60 animate-pulse"
      />
    ))}
  </div>
);

export const DueDateText: React.FC<{ date: string; completed?: boolean }> = ({
  date,
  completed,
}) => {
  const isOverdue = !completed && date < '2026-10-07';
  const isToday = !completed && date === '2026-10-07';
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-mono tabular-nums whitespace-nowrap ${
        isOverdue
          ? 'text-rose-600 dark:text-rose-400 font-medium'
          : isToday
            ? 'text-amber-600 dark:text-amber-400 font-medium'
            : 'text-slate-600 dark:text-slate-400'
      }`}
    >
      <Clock className="w-3 h-3 shrink-0" />
      {isToday ? 'Today (Oct 07)' : date}
      {isOverdue && ' · Overdue'}
    </span>
  );
};
