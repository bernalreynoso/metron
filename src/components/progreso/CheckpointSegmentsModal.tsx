import React from 'react';
import { Activity, CheckpointSegmentsAnalysis } from '../../types';
import { IconRenderer } from '../common/IconRenderer';
import { formatShortDate } from '../../utils/dates';
import { X, Clock, Award, AlertTriangle, Layers, Timer, Route } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface CheckpointSegmentsModalProps {
  activity: Activity;
  analysis: CheckpointSegmentsAnalysis;
  onClose: () => void;
}

export const CheckpointSegmentsModal: React.FC<CheckpointSegmentsModalProps> = ({
  activity,
  analysis,
  onClose,
}) => {
  const { segments, longestSegmentIndex, mostInconsistentSegmentIndex, totalDaysAnalyzed } = analysis;

  // Total journey calculations
  const validSegmentsWithAvg = segments.filter((s) => s.avgMinutes !== null);
  const totalAvgMinutes = validSegmentsWithAvg.reduce((acc, s) => acc + (s.avgMinutes || 0), 0);
  const roundedTotalAvg = Math.round(totalAvgMinutes);

  let formattedTotalAvg = '—';
  if (validSegmentsWithAvg.length > 0) {
    if (roundedTotalAvg >= 60) {
      const hours = Math.floor(roundedTotalAvg / 60);
      const mins = roundedTotalAvg % 60;
      formattedTotalAvg = `${hours}h ${mins}min (${roundedTotalAvg} min)`;
    } else {
      formattedTotalAvg = `${roundedTotalAvg} min`;
    }
  }

  const validMinSegments = segments.filter((s) => s.minMinutes !== null);
  const totalMinMinutes = validMinSegments.reduce((acc, s) => acc + (s.minMinutes || 0), 0);
  const validMaxSegments = segments.filter((s) => s.maxMinutes !== null);
  const totalMaxMinutes = validMaxSegments.reduce((acc, s) => acc + (s.maxMinutes || 0), 0);

  const hasRangeData = validMinSegments.length === segments.length && validMaxSegments.length === segments.length && segments.length > 0;
  const formattedRange = hasRangeData ? `${totalMinMinutes} min – ${totalMaxMinutes} min` : null;

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
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-[#e2e2e2] font-serif">{activity.name}</h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-[#1c1917] text-[#c5a059] border border-[#302a22]">
                  Tramos
                </span>
              </div>
              <p className="text-xs text-[#888888] font-light">
                Análisis de duración entre checkpoints ({totalDaysAnalyzed} días analizados)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#18181b] hover:bg-[#222225] text-[#888888] hover:text-[#e2e2e2] border border-[#28282b] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
          {segments.length === 0 ? (
            <div className="text-center py-10 px-4 bg-[#0c0c0d] border border-[#1e1e20] rounded-xl space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#18181b] border border-[#28282b] flex items-center justify-center mx-auto text-[#888888]">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#e2e2e2]">Sin tramos suficientes</h3>
              <p className="text-xs text-[#888888] max-w-md mx-auto leading-relaxed">
                Para calcular la duración de los tramos necesitas registrar al menos 2 checkpoints en un mismo día dentro del periodo analizado.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Total Route Summary Card */}
              <div className="bg-gradient-to-br from-[#18181b] to-[#121214] border border-[#c5a059]/40 rounded-xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Route className="w-4 h-4 text-[#c5a059]" />
                      <span className="text-xs font-bold text-[#e2e2e2] uppercase tracking-wider">
                        Tiempo total promedio del recorrido
                      </span>
                    </div>
                    <p className="text-xs text-[#888888] font-light">
                      Suma de los {segments.length} {segments.length === 1 ? 'tramo analizado' : 'tramos analizados'}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-2xl sm:text-3xl font-bold font-mono text-[#c5a059] block">
                      {formattedTotalAvg}
                    </span>
                    {formattedRange && (
                      <span className="text-xs text-[#a1a1aa] font-mono block mt-0.5">
                        Rango: <strong className="text-[#e2e2e2] font-semibold">{formattedRange}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Individual Segments */}
              {segments.map((seg) => {
                const isLongest = seg.segmentIndex === longestSegmentIndex;
                const isMostInconsistent = seg.segmentIndex === mostInconsistentSegmentIndex;

                let cardBorder = 'border-[#1e1e20]';
                if (isLongest && isMostInconsistent) {
                  cardBorder = 'border-[#c5a059] shadow-[0_0_15px_rgba(197,160,89,0.15)]';
                } else if (isLongest) {
                  cardBorder = 'border-[#c5a059]';
                } else if (isMostInconsistent) {
                  cardBorder = 'border-[#7f1d1d]';
                }

                // Prepare chart data for this segment
                const segmentChartData = seg.dailyDurations.map((d) => ({
                  date: formatShortDate(d.date),
                  duracion: d.minutes,
                }));

                return (
                  <div
                    key={seg.segmentIndex}
                    className={`bg-[#0c0c0d] border ${cardBorder} rounded-xl p-4 transition-all space-y-4`}
                  >
                    {/* Header of Segment */}
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-bold text-[#e2e2e2] font-mono">{seg.label}</h3>
                          <span className="text-[11px] text-[#888888] font-mono">
                            ({seg.daysWithData} {seg.daysWithData === 1 ? 'día con dato' : 'días con datos'})
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {isLongest && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#261f10] border border-[#c5a059] text-[#facc15]">
                              <Award className="w-3 h-3 text-[#facc15] shrink-0" />
                              <span>Tramo más largo en promedio</span>
                            </span>
                          )}
                          {isMostInconsistent && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2a1414] border border-[#ef4444]/60 text-[#f87171]">
                              <AlertTriangle className="w-3 h-3 text-[#f87171] shrink-0" />
                              <span>Tramo más variable / inconsistente</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xl font-bold font-mono text-[#c5a059] block">
                          {seg.formattedAvg || '—'}
                        </span>
                        <span className="text-[10px] text-[#888888] uppercase tracking-wider block">
                          Promedio
                        </span>
                      </div>
                    </div>

                    {/* Stats Grid: Min, Max */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#18181b]">
                      <div className="bg-[#131315] border border-[#1e1e20] p-2.5 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-[#888888] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#666666]" /> Mínimo
                          </span>
                          <span className="text-xs font-bold font-mono text-[#e2e2e2]">
                            {seg.minMinutes !== null ? `${seg.minMinutes} min` : '—'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-[#131315] border border-[#1e1e20] p-2.5 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-[#888888] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#666666]" /> Máximo
                          </span>
                          <span className="text-xs font-bold font-mono text-[#e2e2e2]">
                            {seg.maxMinutes !== null ? `${seg.maxMinutes} min` : '—'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Segment Daily Chart */}
                    {segmentChartData.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <p className="text-[11px] text-[#888888] font-mono">Historial diario del tramo (minutos):</p>
                        <div className="h-32 w-full bg-[#131315] border border-[#1e1e20] rounded-lg p-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={segmentChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e20" vertical={false} />
                              <XAxis dataKey="date" stroke="#666666" fontSize={9} tickLine={false} />
                              <YAxis stroke="#666666" fontSize={9} tickLine={false} allowDecimals={false} />
                              <Tooltip
                                formatter={(value: any) => [`${value} min`, 'Duración']}
                                contentStyle={{
                                  backgroundColor: '#131315',
                                  borderColor: '#28282b',
                                  borderRadius: '8px',
                                  fontSize: '11px',
                                  color: '#e2e2e2',
                                }}
                              />
                              <Bar
                                dataKey="duracion"
                                fill={isLongest ? '#c5a059' : '#888888'}
                                radius={[3, 3, 0, 0]}
                                maxBarSize={24}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
