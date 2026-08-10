import React, { useState } from 'react';
import { Activity, ActivityRecord, PeriodRange, TrendStatus } from '../../types';
import { IconRenderer } from '../common/IconRenderer';
import { calculateBooleanMetrics, calculateCounterMetrics } from '../../utils/metrics';
import { getComparisonPeriodDates, getPastNDays } from '../../utils/dates';
import { TrendingUp, TrendingDown, Minus, Activity as ActivityIcon, ChevronRight } from 'lucide-react';

interface TrendsListProps {
  activities: Activity[];
  records: ActivityRecord[];
  todayStr: string;
  onSelectActivity: (activity: Activity) => void;
}

export const TrendsList: React.FC<TrendsListProps> = ({
  activities,
  records,
  todayStr,
  onSelectActivity,
}) => {
  const [period, setPeriod] = useState<PeriodRange>('7d');

  const daysCount = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const { currentPeriod, previousPeriod } = getComparisonPeriodDates(daysCount, todayStr);

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex items-center justify-between border-b border-[#1e1e20] pb-3">
        <h2 className="text-xs font-bold text-[#888888] uppercase tracking-wider font-mono">
          Análisis por Actividad
        </h2>
        <div className="flex items-center space-x-1 bg-[#131315] border border-[#1e1e20] rounded-lg p-1">
          {(['7d', '30d', '90d'] as PeriodRange[]).map((p) => (
            <button
              key={p}
              id={`period-btn-${p}`}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                period === p
                  ? 'bg-[#c5a059] text-[#0c0c0d] font-bold shadow-sm'
                  : 'text-[#888888] hover:text-[#e2e2e2]'
              }`}
            >
              {p === '7d' ? '7 Días' : p === '30d' ? '30 Días' : '90 Días'}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Trend Cards */}
      <div className="space-y-3">
        {activities.map((activity) => {
          // Compute records maps for this activity
          const counterMap: Record<string, number> = {};
          const booleanMap: Record<string, boolean | null> = {};

          records.forEach((r) => {
            if (r.activityId === activity.id) {
              if (activity.type === 'counter') {
                counterMap[r.date] = (counterMap[r.date] || 0) + Number(r.value);
              } else {
                booleanMap[r.date] = r.value === true;
              }
            }
          });

          const counterMetrics =
            activity.type === 'counter'
              ? calculateCounterMetrics(activity, counterMap, todayStr, currentPeriod, previousPeriod)
              : null;

          const booleanMetrics =
            activity.type === 'boolean'
              ? calculateBooleanMetrics(activity, booleanMap, todayStr, currentPeriod, previousPeriod)
              : null;

          const trend: TrendStatus = counterMetrics ? counterMetrics.trend : booleanMetrics!.trend;

          const renderTrendBadge = () => {
            switch (trend) {
              case 'MEJORANDO':
                return (
                  <span className="inline-flex items-center space-x-1 text-xs font-bold text-[#4ade80] bg-[#1a2e1a] border border-[#2d4a2d] px-2.5 py-0.5 rounded-full">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>MEJORA</span>
                  </span>
                );
              case 'EMPEORANDO':
                return (
                  <span className="inline-flex items-center space-x-1 text-xs font-bold text-[#f87171] bg-[#2a1a1a] border border-[#4a2d2d] px-2.5 py-0.5 rounded-full">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>EMPEORA</span>
                  </span>
                );
              case 'ESTABLE':
                return (
                  <span className="inline-flex items-center space-x-1 text-xs font-medium text-[#888888] bg-[#18181b] border border-[#28282b] px-2.5 py-0.5 rounded-full">
                    <Minus className="w-3.5 h-3.5" />
                    <span>ESTABLE</span>
                  </span>
                );
              case 'SIN DATOS SUFICIENTES':
                return (
                  <span className="inline-flex items-center space-x-1 text-[11px] text-[#666666] bg-[#0c0c0d] border border-[#1e1e20] px-2.5 py-0.5 rounded-full">
                    <span>Sin datos suf.</span>
                  </span>
                );
            }
          };

          return (
            <div
              key={activity.id}
              onClick={() => onSelectActivity(activity)}
              className={`bg-[#131315] border border-[#1e1e20] rounded-2xl p-4 hover:border-[#c5a059]/40 cursor-pointer transition-all flex items-center justify-between group shadow-lg ${
                !activity.active ? 'opacity-70' : ''
              }`}
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#18181b] border border-[#1e1e20] flex items-center justify-center text-[#c5a059] shrink-0">
                  <IconRenderer name={activity.icon} className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-semibold text-[#e2e2e2] group-hover:text-[#c5a059] transition-colors">
                      {activity.name}
                    </h3>
                    {!activity.active && (
                      <span className="text-[10px] font-mono text-[#f87171] bg-[#2a1a1a] px-1.5 py-0.5 rounded border border-[#4a2d2d]">
                        INACTIVA
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#888888] mt-0.5 flex flex-wrap items-center gap-x-2 font-light">
                    {activity.type === 'counter' && counterMetrics ? (
                      <>
                        <span>Eventos: <strong className="text-[#e2e2e2] font-mono">{counterMetrics.currentPeriodTotal}</strong> ({counterMetrics.currentDaysWithData}/{counterMetrics.totalDaysInPeriod} días)</span>
                        <span>•</span>
                        <span>Prom: <strong className="text-[#e2e2e2] font-mono">{counterMetrics.currentPeriodAvg}/día reg.</strong></span>
                      </>
                    ) : booleanMetrics ? (
                      <>
                        <span>Sí: <strong className="text-[#e2e2e2] font-mono">{booleanMetrics.currentTrueCount}/{booleanMetrics.currentRecordedDays}</strong> (Reg: {booleanMetrics.currentRecordedDays}/{booleanMetrics.totalDaysInPeriod}d)</span>
                        <span>•</span>
                        <span>Cumplimiento: <strong className="text-[#e2e2e2] font-mono">{booleanMetrics.currentCompliance}%</strong></span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                {renderTrendBadge()}
                <ChevronRight className="w-4 h-4 text-[#666666] group-hover:text-[#e2e2e2] transition-colors" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
