import React, { useState } from 'react';

export interface AreaPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  formattedValue?: string;
}

export const InteractiveAreaChart: React.FC<{
  data: AreaPoint[];
  height?: number;
  primaryLabel?: string;
  secondaryLabel?: string;
  valuePrefix?: string;
  valueSuffix?: string;
}> = ({
  data,
  height = 210,
  primaryLabel = 'Revenue',
  secondaryLabel,
  valuePrefix = '৳',
  valueSuffix = '',
}) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => Math.max(d.value, d.secondaryValue || 0)), 1) * 1.12;
  const width = 640;
  const padX = 28;
  const padY = 20;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const points = data.map((d, i) => {
    const x = padX + (i / Math.max(1, data.length - 1)) * innerW;
    const y = padY + innerH - (d.value / maxVal) * innerH;
    const y2 =
      d.secondaryValue !== undefined
        ? padY + innerH - (d.secondaryValue / maxVal) * innerH
        : undefined;
    return { x, y, y2, raw: d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padY + innerH} L ${points[0].x} ${padY + innerH} Z`;

  const secondaryLinePath =
    secondaryLabel && points.every((p) => p.y2 !== undefined)
      ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y2}`).join(' ')
      : null;

  return (
    <div className="relative w-full select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="agencyAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal subtle grid lines */}
        {[0.2, 0.5, 0.8].map((ratio, idx) => {
          const yPos = padY + innerH * ratio;
          return (
            <line
              key={idx}
              x1={padX}
              x2={width - padX}
              y1={yPos}
              y2={yPos}
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-800/80"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
          );
        })}

        <path d={areaPath} fill="url(#agencyAreaGrad)" />
        <path
          d={linePath}
          fill="none"
          stroke="#6366f1"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {secondaryLinePath && (
          <path
            d={secondaryLinePath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="4 4"
            strokeLinecap="round"
          />
        )}

        {points.map((p, idx) => (
          <g key={p.raw.label}>
            <rect
              x={p.x - innerW / data.length / 2}
              y={0}
              width={innerW / data.length}
              height={height}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoverIdx(idx)}
            />
            {hoverIdx === idx && (
              <line
                x1={p.x}
                x2={p.x}
                y1={padY}
                y2={padY + innerH}
                stroke="#6366f1"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            )}
            <circle
              cx={p.x}
              cy={p.y}
              r={hoverIdx === idx ? 5 : 3.2}
              className="fill-indigo-500 stroke-white dark:stroke-slate-900 transition-all"
              strokeWidth="2"
            />
            <text
              x={p.x}
              y={height - 2}
              textAnchor="middle"
              className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono tabular-nums"
            >
              {p.raw.label}
            </text>
          </g>
        ))}
      </svg>

      {hoverIdx !== null && points[hoverIdx] && (
        <div className="mt-2 flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/90 text-xs">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {points[hoverIdx].raw.label}
          </span>
          <div className="flex items-center gap-4 font-mono tabular-nums">
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
              {primaryLabel}:{' '}
              {points[hoverIdx].raw.formattedValue ||
                `${valuePrefix}${points[hoverIdx].raw.value.toLocaleString()}${valueSuffix}`}
            </span>
            {secondaryLabel && points[hoverIdx].raw.secondaryValue !== undefined && (
              <span className="text-emerald-600 dark:text-emerald-400">
                {secondaryLabel}: {valuePrefix}
                {points[hoverIdx].raw.secondaryValue?.toLocaleString()}
                {valueSuffix}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const HorizontalDistributionBar: React.FC<{
  segments: { label: string; count: number; colorClass: string; dotColor: string }[];
}> = ({ segments }) => {
  const total = segments.reduce((s, item) => s + item.count, 0) || 1;
  return (
    <div className="space-y-3">
      <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 p-0.5 gap-0.5">
        {segments.map((seg) => {
          const pct = Math.round((seg.count / total) * 100);
          if (seg.count === 0) return null;
          return (
            <div
              key={seg.label}
              style={{ width: `${Math.max(4, pct)}%` }}
              className={`${seg.colorClass} h-full first:rounded-l-full last:rounded-r-full transition-all duration-300`}
              title={`${seg.label}: ${seg.count} (${pct}%)`}
            />
          );
        })}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
        {segments.map((seg) => {
          const pct = Math.round((seg.count / total) * 100);
          return (
            <div
              key={seg.label}
              className="flex items-center justify-between text-xs py-1 px-2 rounded-md bg-slate-50 dark:bg-slate-800/40"
            >
              <div className="flex items-center gap-2 truncate">
                <span className={`w-2 h-2 rounded-full shrink-0 ${seg.dotColor}`} />
                <span className="text-slate-600 dark:text-slate-300 truncate">{seg.label}</span>
              </div>
              <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-white ml-2">
                {seg.count} <span className="text-slate-400 font-normal">({pct}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
