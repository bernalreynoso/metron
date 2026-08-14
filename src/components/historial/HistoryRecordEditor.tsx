import React from 'react';
import { Activity, ActivityRecord } from '../../types';
import { ActivityCard } from '../hoy/ActivityCard';
import { formatLocalTime, formatSpanishDate } from '../../utils/dates';
import { useAuth } from '../../context/AuthContext';
import { Trash2, Clock } from 'lucide-react';

interface HistoryRecordEditorProps {
  selectedDate: string;
  activities: Activity[];
  records: ActivityRecord[];
  onIncrementCounter: (activityId: string, date: string) => void;
  onDecrementCounter: (activityId: string, date: string) => void;
  onSetBoolean: (activityId: string, date: string, value: boolean | null) => void;
  onAddCheckpoint: (activityId: string, date: string) => Promise<void>;
  onDeleteCheckpoint?: (recordId: string) => Promise<void>;
}

export const HistoryRecordEditor: React.FC<HistoryRecordEditorProps> = ({
  selectedDate,
  activities,
  records,
  onIncrementCounter,
  onDecrementCounter,
  onSetBoolean,
  onAddCheckpoint,
  onDeleteCheckpoint,
}) => {
  const { timezone } = useAuth();
  // Aggregate records for selected date
  const counterMap: Record<string, number> = {};
  const booleanMap: Record<string, boolean | null> = {};
  const checkpointMap: Record<string, ActivityRecord[]> = {};

  records.forEach((r) => {
    if (r.date === selectedDate) {
      if (r.type === 'counter') {
        counterMap[r.activityId] = (counterMap[r.activityId] || 0) + Number(r.value);
      } else if (r.type === 'boolean') {
        booleanMap[r.activityId] = r.value === true;
      } else if (r.type === 'checkpoint') {
        if (!checkpointMap[r.activityId]) checkpointMap[r.activityId] = [];
        checkpointMap[r.activityId].push(r);
      }
    }
  });

  // Filter activities to ONLY those that have records for this specific date
  const activitiesWithRecordsOnDate = activities.filter((activity) => {
    const hasCounter = activity.id in counterMap;
    const hasBoolean = activity.id in booleanMap;
    const hasCheckpoint = (checkpointMap[activity.id] || []).length > 0;
    return hasCounter || hasBoolean || hasCheckpoint;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-[#1e1e20] pb-2">
        <h3 className="text-xs font-bold text-[#888888] uppercase tracking-wider font-mono">
          Registros del {formatSpanishDate(selectedDate)}
        </h3>
        <span className="text-[11px] text-[#666666]">
          {activitiesWithRecordsOnDate.length}{' '}
          {activitiesWithRecordsOnDate.length === 1 ? 'actividad con registro' : 'actividades con registro'}
        </span>
      </div>

      {activitiesWithRecordsOnDate.length === 0 ? (
        <div className="bg-[#131315] border border-[#1e1e20] rounded-2xl p-8 text-center space-y-2 shadow-lg">
          <p className="text-sm font-semibold text-[#e2e2e2]">
            No hay registros para este día
          </p>
          <p className="text-xs text-[#888888]">
            Selecciona otra fecha en la barra superior para consultar la actividad histórica registrada.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activitiesWithRecordsOnDate.map((activity) => {
            const counterValue = activity.id in counterMap ? counterMap[activity.id] : null;
            const booleanValue =
              activity.id in booleanMap ? booleanMap[activity.id] : null;
            const checkpointRecords = checkpointMap[activity.id] || [];

            return (
              <div key={`${selectedDate}-${activity.id}`} className="space-y-2">
                <ActivityCard
                  activity={activity}
                  counterValue={counterValue}
                  booleanValue={booleanValue}
                  checkpointRecords={checkpointRecords}
                  onIncrementCounter={(actId) => onIncrementCounter(actId, selectedDate)}
                  onDecrementCounter={(actId) => onDecrementCounter(actId, selectedDate)}
                  onSetBoolean={(actId, val) => onSetBoolean(actId, selectedDate, val)}
                  onAddCheckpoint={(actId) => onAddCheckpoint(actId, selectedDate)}
                />

                {/* If Checkpoint activity and has records for this date, allow deleting individual records */}
                {activity.type === 'checkpoint' && checkpointRecords.length > 0 && onDeleteCheckpoint && (
                  <div className="bg-[#0c0c0d] border border-[#1e1e20] rounded-xl p-3 ml-4 space-y-2">
                    <p className="text-[11px] font-semibold text-[#888888]">
                      Registros individuales de hora ({checkpointRecords.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {checkpointRecords.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#18181b] border border-[#28282b] text-xs font-mono text-[#e2e2e2]"
                        >
                          <Clock className="w-3.5 h-3.5 text-[#c5a059]" />
                          <span>{formatLocalTime(r.timestamp, timezone)}</span>
                          <button
                            onClick={() => onDeleteCheckpoint(r.id)}
                            title="Eliminar este checkpoint"
                            className="p-1 hover:bg-[#2a1a1a] text-[#888888] hover:text-[#f87171] rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
