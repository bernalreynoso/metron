import React from 'react';
import { Activity, ActivityRecord, TrendStatus } from '../../types';
import { IconRenderer } from '../common/IconRenderer';
import {
  formatLocalTime,
  formatShortDate,
  getPastNDays,
  getTimeInMinutesFromMidnight,
  calculateCircularAverageMinutes,
  formatMinutesToTime,
  parseTimestampToDate,
} from '../../utils/dates';
import { calculateBooleanMetrics, calculateCheckpointMetrics, calculateCounterMetrics } from '../../utils/metrics';
import { useAuth } from '../../context/AuthContext';
import { X, TrendingUp, TrendingDown, Minus, Activity as ActivityIcon, Clock } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface ActivityDetailModalProps {
  activity: Activity;
  records: ActivityRecord[];
  todayStr: string;
  onClose: () => void;
}

export const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  activity,
  records,
  todayStr,
  onClose,
}) => {
  const { timezone } = useAuth();
  const last30Days = getPastNDays(30, todayStr, timezone);
  const prev30Days = getPastNDays(30, last30Days[0], timezone);

  // Aggregate records for last 30 days
  const counterMap: Record<string, number> = {};
  const booleanMap: Record<string, boolean | null> = {};
  const checkpointMap: Record<string, ActivityRecord[]> = {};

  records.forEach((r) => {
    if (r.activityId === activity.id) {
      if (activity.type === 'counter') {
        counterMap[r.date] = (counterMap[r.date] || 0) + Number(r.value);
      } else if (activity.type === 'boolean') {
        booleanMap[r.date] = r.value === true;
      } else if (activity.type === 'checkpoint') {
        if (!checkpointMap[r.date]) checkpointMap[r.date] = [];
        checkpointMap[r.date].push(r);
      }
    }
  });

  const counterMetrics =
    activity.type === 'counter'
      ? calculateCounterMetrics(activity, counterMap, todayStr, last30Days, prev30Days)
      : null;

  const booleanMetrics =
    activity.type === 'boolean'
      ? calculateBooleanMetrics(activity, booleanMap, todayStr, last30Days, prev30Days)
      : null;

  const checkpointMetrics =
    activity.type === 'checkpoint'
      ? calculateCheckpointMetrics(activity, checkpointMap, todayStr, last30Days, prev30Days, timezone)
      : null;

  const trend: TrendStatus = counterMetrics
    ? counterMetrics.trend
    : booleanMetrics
    ? booleanMetrics.trend
    : checkpointMetrics!.trend;

  // Prepare chart data for last 14 days
  const chartData = last30Days.slice(-14).map((date) => {
    const formatted = formatShortDate(date);
    if (activity.type === 'counter') {
      const hasRecord = date in counterMap && counterMap[date] !== undefined;
      return { date: formatted, valor: hasRecord ? counterMap[date] : null };
    } else if (activity.type === 'boolean') {
      const val = booleanMap[date];
      return {
        date: formatted,
        valor: val === true ? 1 : val === false ? 0 : null,
        state: val === true ? 'Sí' : val === false ? 'No' : 'Sin reg',
      };
    } else {
      const dayCheckpoints = checkpointMap[date] || [];
      if (dayCheckpoints.length === 0) {
        return { date: formatted, valor: null, label: 'Sin registro' };
      }
      const sorted = [...dayCheckpoints].sort(
        (a, b) => parseTimestampToDate(a.timestamp).getTime() - parseTimestampToDate(b.timestamp).getTime()
      );
      const mode = activity.checkpointMode || 'single';
      const minutesList = sorted.map((r) => getTimeInMinutesFromMidnight(r.timestamp, timezone));
      let targetMinutes: number;
      let formattedTime: string;

      if (mode === 'single') {
        const lastRecord = sorted[sorted.length - 1];
        targetMinutes = getTimeInMinutesFromMidnight(lastRecord.timestamp, timezone);
        formattedTime = formatLocalTime(lastRecord.timestamp, timezone);
      } else {
        targetMinutes = calculateCircularAverageMinutes(minutesList) ?? 0;
        formattedTime = formatMinutesToTime(targetMinutes);
      }

      const hoursDecimal = Number((targetMinutes / 60).toFixed(1));
      return { date: formatted, valor: hoursDecimal, label: formattedTime };
    }
  });

  const getTrendBadge = (status: TrendStatus) => {
    switch (status) {
      case 'MEJORANDO':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#1a2e1a] border border-[#2d4a2d] text-[#4ade80]">
            <TrendingUp className="w-4 h-4" />
            <span>↑ MEJORANDO</span>
          </span>
        );
      case 'EMPEORANDO':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#2a1a1a] border border-[#4a2d2d] text-[#f87171]">
            <TrendingDown className="w-4 h-4" />
            <span>↓ EMPEORANDO</span>
          </span>
        );
      case 'ESTABLE':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#18181b] border border-[#28282b] text-[#888888]">
            <Minus className="w-4 h-4" />
            <span>→ ESTABLE</span>
          </span>
        );
      case 'SIN DATOS SUFICIENTES':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#18181b] border border-[#28282b] text-[#666666]">
            <ActivityIcon className="w-4 h-4" />
            <span>SIN DATOS SUFICIENTES</span>
          </span>
        );
    }
  };

  const getDirectionLabel = (direction: string) => {
    switch (direction) {
      case 'increase':
        return 'Aumentar';
      case 'decrease':
        return 'Reducir';
      case 'compliance':
        return 'Cumplir';
      case 'earlier':
        return 'Más temprano';
      case 'later':
        return 'Más tarde';
      case 'neutral':
      default:
        return 'Neutral';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0c0c0d]/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#131315] border border-[#1e1e20] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-auto text-[#e2e2e2]">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#1e1e20] flex items-center justify-between bg-[#080809]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#18181b] border border-[#1e1e20] flex items-center justify-center text-[#c5a059] shrink-0">
              <IconRenderer name={activity.icon} className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#e2e2e2] font-serif">{activity.name}</h2>
              <p className="text-xs text-[#888888] font-light">Evolución de los últimos 30 días</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#18181b] hover:bg-[#222225] text-[#888888] hover:text-[#e2e2e2] border border-[#28282b] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Trend Badge Banner */}
          <div className="flex items-center justify-between p-4 bg-[#0c0c0d] border border-[#1e1e20] rounded-xl">
            <div>
              <p className="text-xs text-[#888888] uppercase tracking-wider font-mono">Estado Actual</p>
              <div className="mt-1">{getTrendBadge(trend)}</div>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#888888]">Dirección</p>
              <p className="text-xs font-semibold text-[#c5a059] uppercase tracking-wider font-mono">
                {getDirectionLabel(activity.direction)}
              </p>
            </div>
          </div>

          {/* Key Metrics Grid */}
          {activity.type === 'counter' && counterMetrics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-[#0c0c0d] border border-[#1e1e20] rounded-lg">
                <p className="text-[11px] text-[#888888]">Hoy</p>
                <p className="text-lg font-bold font-mono text-[#c5a059]">
                  {counterMetrics.todayValue === null ? (
                    <span className="text-xs font-semibold text-[#888888]">Sin registro</span>
                  ) : (
                    counterMetrics.todayValue
                  )}
                </p>
              </div>
              <div className="p-3 bg-[#0c0c0d] border border-[#1e1e20] rounded-lg">
                <p className="text-[11px] text-[#888888]">Promedio en días reg.</p>
                <p className="text-lg font-bold font-mono text-[#e2e2e2]">{counterMetrics.currentPeriodAvg}/día</p>
              </div>
              <div className="p-3 bg-[#0c0c0d] border border-[#1e1e20] rounded-lg">
                <p className="text-[11px] text-[#888888]">Días registrados</p>
                <p className="text-lg font-bold font-mono text-[#e2e2e2]">
                  {counterMetrics.currentDaysWithData}/{counterMetrics.totalDaysInPeriod}
                </p>
              </div>
              <div className="p-3 bg-[#0c0c0d] border border-[#1e1e20] rounded-lg">
                <p className="text-[11px] text-[#888888]">Cambio de periodo</p>
                <p className="text-lg font-bold font-mono text-[#e2e2e2]">
                  {!counterMetrics.hasComparisonData
                    ? 'Sin datos suf.'
                    : counterMetrics.percentChange === null
                    ? 'Sin base comp.'
                    : counterMetrics.percentChange > 0
                    ? `+${counterMetrics.percentChange}%`
                    : `${counterMetrics.percentChange}%`}
                </p>
              </div>
            </div>
          )}

          {activity.type === 'boolean' && booleanMetrics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-[#0c0c0d] border border-[#1e1e20] rounded-lg">
                <p className="text-[11px] text-[#888888]">Hoy</p>
                <p className="text-sm font-bold text-[#c5a059]">
                  {booleanMetrics.todayValue === true
                    ? 'Sí'
                    : booleanMetrics.todayValue === false
                    ? 'No'
                    : 'Sin registro'}
                </p>
              </div>
              <div className="p-3 bg-[#0c0c0d] border border-[#1e1e20] rounded-lg">
                <p className="text-[11px] text-[#888888]">Cumplimiento (días reg.)</p>
                <p className="text-lg font-bold font-mono text-[#e2e2e2]">{booleanMetrics.currentCompliance}%</p>
              </div>
              <div className="p-3 bg-[#0c0c0d] border border-[#1e1e20] rounded-lg">
                <p className="text-[11px] text-[#888888]">Días registrados</p>
                <p className="text-lg font-bold font-mono text-[#e2e2e2]">
                  {booleanMetrics.currentRecordedDays}/{booleanMetrics.totalDaysInPeriod}
                </p>
              </div>
              <div className="p-3 bg-[#0c0c0d] border border-[#1e1e20] rounded-lg">
                <p className="text-[11px] text-[#888888]">Cambio p.p.</p>
                <p className="text-lg font-bold font-mono text-[#e2e2e2]">
                  {!booleanMetrics.hasComparisonData
                    ? 'Sin datos suf.'
                    : booleanMetrics.percentagePointsChange > 0
                    ? `+${booleanMetrics.percentagePointsChange} pp`
                    : `${booleanMetrics.percentagePointsChange} pp`}
                </p>
              </div>
            </div>
          )}

          {activity.type === 'checkpoint' && checkpointMetrics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-[#0c0c0d] border border-[#1e1e20] rounded-lg">
                <p className="text-[11px] text-[#888888]">Hoy</p>
                <p className="text-sm font-bold font-mono text-[#c5a059]">
                  {checkpointMetrics.todayLastFormattedTime || 'Sin registro'}
                </p>
              </div>
              <div className="p-3 bg-[#0c0c0d] border border-[#1e1e20] rounded-lg">
                <p className="text-[11px] text-[#888888]">Hora promedio</p>
                <p className="text-lg font-bold font-mono text-[#e2e2e2]">
                  {checkpointMetrics.avgFormattedTime || '--:--'}
                </p>
              </div>
              <div className="p-3 bg-[#0c0c0d] border border-[#1e1e20] rounded-lg">
                <p className="text-[11px] text-[#888888]">Más temprano / Más tarde</p>
                <p className="text-xs font-bold font-mono text-[#e2e2e2]">
                  {checkpointMetrics.earliestFormattedTime || '--:--'} / {checkpointMetrics.latestFormattedTime || '--:--'}
                </p>
              </div>
              <div className="p-3 bg-[#0c0c0d] border border-[#1e1e20] rounded-lg">
                <p className="text-[11px] text-[#888888]">Días registrados</p>
                <p className="text-lg font-bold font-mono text-[#e2e2e2]">
                  {checkpointMetrics.currentDaysWithData}/{checkpointMetrics.totalDaysInPeriod}
                </p>
              </div>
            </div>
          )}

          {/* Evolution Chart */}
          <div>
            <h3 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3 font-mono">
              {activity.type === 'checkpoint'
                ? 'Hora de registro (Horas del día, últimos 14 días)'
                : 'Registro diario (Últimos 14 días)'}
            </h3>
            <div className="h-56 w-full bg-[#0c0c0d] border border-[#1e1e20] rounded-xl p-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e20" vertical={false} />
                  <XAxis dataKey="date" stroke="#666666" fontSize={10} tickLine={false} />
                  <YAxis
                    stroke="#666666"
                    fontSize={10}
                    tickLine={false}
                    allowDecimals={false}
                    domain={activity.type === 'checkpoint' ? [0, 24] : [0, 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#131315',
                      borderColor: '#28282b',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#e2e2e2',
                    }}
                  />
                  <Bar
                    dataKey="valor"
                    fill="#c5a059"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
