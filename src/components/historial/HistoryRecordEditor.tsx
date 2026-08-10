import React from 'react';
import { Activity, ActivityRecord } from '../../types';
import { ActivityCard } from '../hoy/ActivityCard';
import { formatSpanishDate } from '../../utils/dates';

interface HistoryRecordEditorProps {
  selectedDate: string;
  activities: Activity[];
  records: ActivityRecord[];
  onIncrementCounter: (activityId: string, date: string) => void;
  onDecrementCounter: (activityId: string, date: string) => void;
  onSetBoolean: (activityId: string, date: string, value: boolean | null) => void;
}

export const HistoryRecordEditor: React.FC<HistoryRecordEditorProps> = ({
  selectedDate,
  activities,
  records,
  onIncrementCounter,
  onDecrementCounter,
  onSetBoolean,
}) => {
  // Aggregate records for selected date
  const counterMap: Record<string, number> = {};
  const booleanMap: Record<string, boolean | null> = {};

  records.forEach((r) => {
    if (r.date === selectedDate) {
      if (r.type === 'counter') {
        counterMap[r.activityId] = (counterMap[r.activityId] || 0) + Number(r.value);
      } else {
        booleanMap[r.activityId] = r.value === true;
      }
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-[#1e1e20] pb-2">
        <h3 className="text-xs font-bold text-[#888888] uppercase tracking-wider font-mono">
          Registros del {formatSpanishDate(selectedDate)}
        </h3>
        <span className="text-[11px] text-[#666666]">Edición de datos de fecha</span>
      </div>

      <div className="space-y-3">
        {activities.map((activity) => {
          const counterValue = activity.id in counterMap ? counterMap[activity.id] : null;
          const booleanValue =
            activity.id in booleanMap ? booleanMap[activity.id] : null;

          return (
            <ActivityCard
              key={`${selectedDate}-${activity.id}`}
              activity={activity}
              counterValue={counterValue}
              booleanValue={booleanValue}
              onIncrementCounter={(actId) => onIncrementCounter(actId, selectedDate)}
              onDecrementCounter={(actId) => onDecrementCounter(actId, selectedDate)}
              onSetBoolean={(actId, val) => onSetBoolean(actId, selectedDate, val)}
            />
          );
        })}
      </div>
    </div>
  );
};
