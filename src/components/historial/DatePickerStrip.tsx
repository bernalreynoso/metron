import React from 'react';
import { formatSpanishDate, getLocalDateString, getPastNDays, parseLocalDate } from '../../utils/dates';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerStripProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
}

export const DatePickerStrip: React.FC<DatePickerStripProps> = ({
  selectedDate,
  onSelectDate,
}) => {
  const todayStr = getLocalDateString();
  const pastDays = getPastNDays(14, todayStr);

  const handlePrevDay = () => {
    const dateObj = parseLocalDate(selectedDate);
    dateObj.setDate(dateObj.getDate() - 1);
    onSelectDate(getLocalDateString(dateObj));
  };

  const handleNextDay = () => {
    const dateObj = parseLocalDate(selectedDate);
    dateObj.setDate(dateObj.getDate() + 1);
    const nextStr = getLocalDateString(dateObj);
    if (nextStr <= todayStr) {
      onSelectDate(nextStr);
    }
  };

  return (
    <div className="bg-[#131315] border border-[#1e1e20] rounded-2xl p-4 space-y-4 shadow-lg">
      {/* Date Header & Nav Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-5 h-5 text-[#c5a059]" />
          <h2 className="text-sm font-bold text-[#e2e2e2] font-serif">
            {formatSpanishDate(selectedDate)}
          </h2>
          {selectedDate === todayStr && (
            <span className="text-[10px] uppercase tracking-wider bg-[#c5a059]/20 text-[#c5a059] px-2 py-0.5 rounded border border-[#c5a059]/30 font-mono">
              Hoy
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={handlePrevDay}
            className="p-1.5 rounded-lg bg-[#18181b] hover:bg-[#222225] text-[#e2e2e2] border border-[#28282b] transition-colors"
            aria-label="Día anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Date Picker Input */}
          <input
            id="history-date-picker"
            type="date"
            max={todayStr}
            value={selectedDate}
            onChange={(e) => e.target.value && onSelectDate(e.target.value)}
            className="bg-[#18181b] border border-[#28282b] rounded-lg px-2 py-1 text-xs text-[#e2e2e2] focus:outline-none focus:border-[#c5a059]"
          />

          <button
            onClick={handleNextDay}
            disabled={selectedDate >= todayStr}
            className="p-1.5 rounded-lg bg-[#18181b] hover:bg-[#222225] text-[#e2e2e2] border border-[#28282b] disabled:opacity-30 transition-colors"
            aria-label="Día siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Day Strip (Mobile-friendly) */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {pastDays.map((d) => {
          const isSelected = d === selectedDate;
          const isToday = d === todayStr;
          const dateObj = parseLocalDate(d);
          const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'narrow' }).toUpperCase();
          const dayNum = dateObj.getDate();

          return (
            <button
              key={d}
              onClick={() => onSelectDate(d)}
              className={`flex-shrink-0 w-11 py-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                isSelected
                  ? 'bg-[#c5a059] text-[#0c0c0d] font-bold border-[#c5a059] shadow-md scale-105'
                  : 'bg-[#0c0c0d] text-[#888888] border-[#1e1e20] hover:border-[#28282b] hover:text-[#e2e2e2]'
              }`}
            >
              <span className={`text-[10px] font-mono ${isSelected ? 'text-[#0c0c0d]' : 'text-[#666666]'}`}>
                {dayName}
              </span>
              <span className="text-sm font-bold font-mono">{dayNum}</span>
              {isToday && !isSelected && (
                <span className="w-1 h-1 rounded-full bg-[#c5a059] mt-1" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
