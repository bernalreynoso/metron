import React, { useState, useMemo } from 'react';
import { Activity, ActivityRecord } from '../../types';
import { ActivityCard } from '../hoy/ActivityCard';
import { buildDateInTimezone, formatLocalTime, formatSpanishDate, formatTimeForInput } from '../../utils/dates';
import { useAuth } from '../../context/AuthContext';
import { Trash2, Clock, Check, X } from 'lucide-react';

interface HistoryRecordEditorProps {
  selectedDate: string;
  activities: Activity[];
  records: ActivityRecord[];
  onIncrementCounter: (activityId: string, date: string) => void;
  onDecrementCounter: (activityId: string, date: string) => void;
  onRegisterCounterZero?: (activityId: string, date: string) => Promise<void> | void;
  onClearCounterZero?: (activityId: string, date: string) => Promise<void> | void;
  onSetBoolean: (activityId: string, date: string, value: boolean | null) => void;
  onAddCheckpoint: (activityId: string, date: string) => Promise<void>;
  onEditCheckpointTime?: (recordId: string, newTime: Date) => Promise<void> | void;
  onDeleteCheckpoint?: (recordId: string) => Promise<void>;
}

export const HistoryRecordEditor: React.FC<HistoryRecordEditorProps> = ({
  selectedDate,
  activities,
  records,
  onIncrementCounter,
  onDecrementCounter,
  onRegisterCounterZero,
  onClearCounterZero,
  onSetBoolean,
  onAddCheckpoint,
  onEditCheckpointTime,
  onDeleteCheckpoint,
}) => {
  const { timezone } = useAuth();
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editTimeValue, setEditTimeValue] = useState<string>('');

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

  // Filter activities: (a) all active activities, plus (b) inactive activities that have records on this date
  const activitiesForSelectedDate = activities.filter((activity) => {
    if (activity.active) return true;
    const hasCounter = activity.id in counterMap;
    const hasBoolean = activity.id in booleanMap;
    const hasCheckpoint = (checkpointMap[activity.id] || []).length > 0;
    return hasCounter || hasBoolean || hasCheckpoint;
  });

  // Calculate missed activities (active, counter/boolean, increase/compliance direction, with no record on selectedDate)
  const missedActivities = useMemo(() => {
    return activities.filter((activity) => {
      if (!activity.active) return false;
      if (activity.type !== 'counter' && activity.type !== 'boolean') return false;
      if (activity.direction !== 'increase' && activity.direction !== 'compliance') return false;
      if (activity.type === 'counter') {
        return !(activity.id in counterMap);
      }
      if (activity.type === 'boolean') {
        return !(activity.id in booleanMap);
      }
      return false;
    });
  }, [activities, counterMap, booleanMap]);

  const missedActivityIds = useMemo(
    () => new Set(missedActivities.map((a) => a.id)),
    [missedActivities]
  );

  const handleStartEdit = (r: ActivityRecord) => {
    setEditingRecordId(r.id);
    setEditTimeValue(formatTimeForInput(r.timestamp, timezone));
  };

  const handleCancelEdit = () => {
    setEditingRecordId(null);
    setEditTimeValue('');
  };

  const handleSaveEdit = async (recordId: string) => {
    if (!editTimeValue) {
      handleCancelEdit();
      return;
    }
    if (onEditCheckpointTime) {
      const newDate = buildDateInTimezone(selectedDate, editTimeValue, timezone);
      await onEditCheckpointTime(recordId, newDate);
    }
    handleCancelEdit();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-[#1e1e20] pb-2">
        <h3 className="text-xs font-bold text-[#888888] uppercase tracking-wider font-mono">
          Registros del {formatSpanishDate(selectedDate)}
        </h3>
        <span className="text-[11px] text-[#666666]">
          {activitiesForSelectedDate.length}{' '}
          {activitiesForSelectedDate.length === 1 ? 'actividad' : 'actividades'}
        </span>
      </div>

      {/* Resumen de no realizadas */}
      {missedActivities.length > 0 && (
        <div className="flex items-start space-x-2 px-3 py-2 bg-[#1c1a14] border border-[#3d3420] rounded-xl text-xs text-[#c5a059]">
          <span className="shrink-0 select-none font-bold text-sm leading-none mt-0.5">⚠</span>
          <p className="leading-snug text-xs">
            <span className="font-semibold font-mono">
              {missedActivities.length} {missedActivities.length === 1 ? 'no realizada' : 'no realizadas'}:
            </span>{' '}
            <span className="text-[#d8c397]">
              {missedActivities.map((a) => a.name).join(', ')}
            </span>
          </p>
        </div>
      )}

      {activitiesForSelectedDate.length === 0 ? (
        <div className="bg-[#131315] border border-[#1e1e20] rounded-2xl p-8 text-center space-y-2 shadow-lg">
          <p className="text-sm font-semibold text-[#e2e2e2]">
            No hay actividades disponibles
          </p>
          <p className="text-xs text-[#888888]">
            No hay actividades activas ni registros históricos para esta fecha.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activitiesForSelectedDate.map((activity) => {
            const isMissed = missedActivityIds.has(activity.id);
            const counterValue = activity.id in counterMap ? counterMap[activity.id] : null;
            const booleanValue =
              activity.id in booleanMap ? booleanMap[activity.id] : null;
            const checkpointRecords = checkpointMap[activity.id] || [];

            return (
              <div
                key={`${selectedDate}-${activity.id}`}
                className={`space-y-2 transition-all ${
                  isMissed ? 'border-l-2 border-l-[#c5a059] pl-2' : ''
                }`}
              >
                <ActivityCard
                  activity={activity}
                  counterValue={counterValue}
                  booleanValue={booleanValue}
                  checkpointRecords={checkpointRecords}
                  onIncrementCounter={(actId) => onIncrementCounter(actId, selectedDate)}
                  onDecrementCounter={(actId) => onDecrementCounter(actId, selectedDate)}
                  onRegisterCounterZero={onRegisterCounterZero ? (actId) => onRegisterCounterZero(actId, selectedDate) : undefined}
                  onClearCounterZero={onClearCounterZero ? (actId) => onClearCounterZero(actId, selectedDate) : undefined}
                  onSetBoolean={(actId, val) => onSetBoolean(actId, selectedDate, val)}
                  onAddCheckpoint={(actId) => onAddCheckpoint(actId, selectedDate)}
                />

                {/* If Checkpoint activity, allow viewing/editing individual records */}
                {activity.type === 'checkpoint' && checkpointRecords.length > 0 && (
                  <div className="bg-[#0c0c0d] border border-[#1e1e20] rounded-xl p-3 ml-4 space-y-2.5">
                    <p className="text-[11px] font-semibold text-[#888888]">
                      Registros individuales de hora ({checkpointRecords.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {checkpointRecords.map((r) => {
                        const isEditing = editingRecordId === r.id;

                        return (
                          <div
                            key={r.id}
                            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#18181b] border border-[#28282b] text-xs font-mono text-[#e2e2e2]"
                          >
                            <Clock className="w-3.5 h-3.5 text-[#c5a059] shrink-0" />
                            {isEditing ? (
                              <div className="flex items-center space-x-1.5">
                                <input
                                  type="time"
                                  value={editTimeValue}
                                  onChange={(e) => setEditTimeValue(e.target.value)}
                                  className="bg-[#0c0c0d] border border-[#c5a059] rounded px-1.5 py-0.5 text-xs text-[#e2e2e2] font-mono focus:outline-none"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(r.id)}
                                  title="Guardar hora"
                                  className="p-1 hover:bg-[#1a2e1a] text-[#4ade80] rounded transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  title="Cancelar"
                                  className="p-1 hover:bg-[#2a1a1a] text-[#888888] hover:text-[#f87171] rounded transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <span
                                  onClick={() => onEditCheckpointTime && handleStartEdit(r)}
                                  className={`transition-colors ${
                                    onEditCheckpointTime
                                      ? 'cursor-pointer hover:text-[#c5a059] hover:underline underline-offset-2'
                                      : ''
                                  }`}
                                  title={onEditCheckpointTime ? 'Toca para editar hora' : undefined}
                                >
                                  {formatLocalTime(r.timestamp, timezone)}
                                </span>
                                {onDeleteCheckpoint && (
                                  <button
                                    onClick={() => onDeleteCheckpoint(r.id)}
                                    title="Eliminar este checkpoint"
                                    className="p-1 hover:bg-[#2a1a1a] text-[#888888] hover:text-[#f87171] rounded transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
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
