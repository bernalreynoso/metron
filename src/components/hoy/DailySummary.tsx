import React from 'react';
import { CheckCircle2, Clock, AlertCircle, TrendingUp } from 'lucide-react';

interface DailySummaryProps {
  dateFormatted: string;
  totalActive: number;
  completedCount: number;
  pendingCount: number;
  notCompliedCount: number;
  checkpointsCount: number;
  compliancePct: number;
  activeFilter: 'all' | 'pending' | 'completed';
  onSelectFilter: (filter: 'all' | 'pending' | 'completed') => void;
}

export const DailySummary: React.FC<DailySummaryProps> = ({
  dateFormatted,
  totalActive,
  completedCount,
  pendingCount,
  notCompliedCount,
  checkpointsCount,
  compliancePct,
  activeFilter,
  onSelectFilter,
}) => {
  return (
    <div className="bg-[#131315] border border-[#1e1e20] rounded-2xl p-4 md:p-5 shadow-xl space-y-4">
      {/* Date & Overall Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e1e20] pb-3">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#c5a059] font-bold">
            Resumen Diario
          </span>
          <h2 className="text-lg font-bold text-[#e2e2e2] font-serif capitalize">
            {dateFormatted}
          </h2>
        </div>
        <div className="flex items-center space-x-2 bg-[#18181b] border border-[#28282b] px-3 py-1.5 rounded-xl shrink-0 w-fit">
          <TrendingUp className="w-4 h-4 text-[#c5a059]" />
          <span className="text-xs font-semibold text-[#888888]">Cumplimiento:</span>
          <span className="text-sm font-bold font-mono text-[#c5a059]">{compliancePct}%</span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Realizadas */}
        <div className="bg-[#18181b]/80 border border-[#242427] rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#4ade80]">
            <span className="text-[11px] font-medium text-[#888888]">Realizadas</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-bold font-mono text-[#e2e2e2]">{completedCount}</span>
              <span className="text-xs text-[#888888] font-mono">/ {totalActive}</span>
            </div>
            {notCompliedCount > 0 && (
              <span className="text-[10px] text-[#f87171] font-mono font-medium">
                {notCompliedCount} no
              </span>
            )}
          </div>
        </div>

        {/* Pendientes */}
        <div className="bg-[#18181b]/80 border border-[#242427] rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#f59e0b]">
            <span className="text-[11px] font-medium text-[#888888]">Pendientes</span>
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold font-mono text-[#e2e2e2]">{pendingCount}</span>
          </div>
        </div>

        {/* Checkpoints */}
        <div className="bg-[#18181b]/80 border border-[#242427] rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#c5a059]">
            <span className="text-[11px] font-medium text-[#888888]">Checkpoints</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold font-mono text-[#e2e2e2]">{checkpointsCount}</span>
          </div>
        </div>

        {/* Cumplimiento Global */}
        <div className="bg-[#18181b]/80 border border-[#242427] rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#c5a059]">
            <span className="text-[11px] font-medium text-[#888888]">Progreso</span>
            <span className="text-[10px] font-mono text-[#c5a059] font-bold">HOY</span>
          </div>
          <div className="mt-2 w-full space-y-1.5">
            <span className="text-xl font-bold font-mono text-[#c5a059]">{compliancePct}%</span>
            <div className="w-full bg-[#0c0c0d] h-1.5 rounded-full overflow-hidden border border-[#28282b]">
              <div
                className="bg-gradient-to-r from-[#c5a059] to-[#e6c88b] h-full transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, compliancePct))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Selector */}
      <div className="flex items-center space-x-1.5 pt-1 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => onSelectFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            activeFilter === 'all'
              ? 'bg-[#c5a059] text-[#0c0c0d] shadow-md font-bold'
              : 'bg-[#18181b] text-[#888888] hover:text-[#e2e2e2] border border-[#242427]'
          }`}
        >
          Todas ({totalActive})
        </button>
        <button
          type="button"
          onClick={() => onSelectFilter('pending')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            activeFilter === 'pending'
              ? 'bg-[#c5a059] text-[#0c0c0d] shadow-md font-bold'
              : 'bg-[#18181b] text-[#888888] hover:text-[#e2e2e2] border border-[#242427]'
          }`}
        >
          Pendientes ({pendingCount})
        </button>
        <button
          type="button"
          onClick={() => onSelectFilter('completed')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            activeFilter === 'completed'
              ? 'bg-[#c5a059] text-[#0c0c0d] shadow-md font-bold'
              : 'bg-[#18181b] text-[#888888] hover:text-[#e2e2e2] border border-[#242427]'
          }`}
        >
          Realizadas ({completedCount})
        </button>
      </div>
    </div>
  );
};
