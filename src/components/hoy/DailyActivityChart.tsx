import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

export interface DayChartItem {
  dateStr: string;
  dayLabel: string; // e.g. "Lun 4" or "Hoy"
  recordedCount: number;
  totalActiveCount: number;
  isToday: boolean;
}

interface DailyActivityChartProps {
  days: DayChartItem[];
}

export const DailyActivityChart: React.FC<DailyActivityChartProps> = ({ days }) => {
  const [selectedDay, setSelectedDay] = useState<DayChartItem | null>(null);

  // Maximum scale value for chart height normalization (at least 1 to avoid divide by zero)
  const maxScale = Math.max(1, ...days.map((d) => Math.max(d.totalActiveCount, d.recordedCount)));

  return (
    <div className="bg-[#131315] border border-[#1e1e20] rounded-2xl p-4 md:p-5 shadow-xl space-y-3">
      <div className="flex items-center justify-between border-b border-[#1e1e20] pb-2.5">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-[#c5a059]" />
          <h3 className="text-xs font-bold text-[#e2e2e2] uppercase tracking-wider font-mono">
            Evolución de Actividades (7 días)
          </h3>
        </div>
        <span className="text-[10px] text-[#888888]">
          Actividades distintas registradas por día
        </span>
      </div>

      {/* Bars container */}
      <div className="pt-2 pb-1 flex items-end justify-between gap-2 sm:gap-4 h-36">
        {days.map((day) => {
          const heightPct = day.totalActiveCount > 0
            ? Math.round((day.recordedCount / maxScale) * 100)
            : 0;

          const isSelected = selectedDay?.dateStr === day.dateStr;

          return (
            <div
              key={day.dateStr}
              onClick={() => setSelectedDay(day)}
              className="flex-1 flex flex-col items-center justify-end h-full cursor-pointer group"
            >
              {/* Value label above bar */}
              <span
                className={`text-[10px] font-mono font-bold mb-1 transition-all ${
                  day.isToday
                    ? 'text-[#c5a059]'
                    : day.recordedCount > 0
                    ? 'text-[#e2e2e2]'
                    : 'text-[#555555]'
                }`}
              >
                {day.recordedCount}
              </span>

              {/* Bar track */}
              <div className="w-full max-w-[28px] sm:max-w-[36px] bg-[#18181b] border border-[#242427] rounded-t-lg h-full flex items-end overflow-hidden">
                <div
                  className={`w-full transition-all duration-500 rounded-t-md ${
                    day.isToday
                      ? 'bg-gradient-to-t from-[#c5a059] to-[#f3e1b9]'
                      : day.recordedCount > 0
                      ? 'bg-gradient-to-t from-[#2a2a2e] to-[#c5a059]/70 group-hover:to-[#c5a059]'
                      : 'bg-transparent'
                  } ${isSelected ? 'ring-2 ring-[#c5a059]' : ''}`}
                  style={{ height: `${Math.max(heightPct, day.recordedCount > 0 ? 8 : 0)}%` }}
                />
              </div>

              {/* Day label */}
              <span
                className={`text-[10px] font-medium mt-1.5 transition-colors ${
                  day.isToday
                    ? 'text-[#c5a059] font-bold'
                    : 'text-[#888888] group-hover:text-[#e2e2e2]'
                }`}
              >
                {day.dayLabel}
              </span>
            </div>
          );
        })}
      </div>

      {/* Selected Day Details Tooltip/Banner if tapped */}
      {selectedDay && (
        <div className="bg-[#18181b] border border-[#28282b] rounded-xl p-2.5 text-xs flex items-center justify-between transition-all">
          <span className="text-[#888888]">
            <strong className="text-[#e2e2e2] font-semibold">{selectedDay.dayLabel}</strong>:{' '}
            <span className="text-[#c5a059] font-mono font-bold">{selectedDay.recordedCount}</span>{' '}
            {selectedDay.recordedCount === 1 ? 'actividad registrada' : 'actividades registradas'}
          </span>
          <button
            type="button"
            onClick={() => setSelectedDay(null)}
            className="text-[10px] text-[#888888] hover:text-[#e2e2e2] underline"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
};
