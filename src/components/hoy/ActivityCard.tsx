import React, { useState, useEffect } from 'react';
import { Activity, ActivityRecord } from '../../types';
import { IconRenderer } from '../common/IconRenderer';
import { Plus, Minus, Check, X, Clock } from 'lucide-react';
import { formatLocalTime } from '../../utils/dates';

interface ActivityCardProps {
  activity: Activity;
  counterValue: number | null; // number or null (Sin registro)
  booleanValue: boolean | null; // true, false, or null (Sin registro)
  checkpointRecords?: ActivityRecord[];
  onIncrementCounter: (activityId: string) => void;
  onDecrementCounter: (activityId: string) => Promise<void> | void;
  onSetBoolean: (activityId: string, value: boolean | null) => void;
  onAddCheckpoint?: (activityId: string) => Promise<void> | void;
  onDeleteCheckpoint?: (recordId: string) => Promise<void> | void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  counterValue,
  booleanValue,
  checkpointRecords = [],
  onIncrementCounter,
  onDecrementCounter,
  onSetBoolean,
  onAddCheckpoint,
  onDeleteCheckpoint,
}) => {
  // Local optimism state for snappy 16ms UI feedback
  const [localCounter, setLocalCounter] = useState<number | null>(counterValue);
  const [localBoolean, setLocalBoolean] = useState<boolean | null>(booleanValue);
  const [isDecrementing, setIsDecrementing] = useState(false);
  const [isRegisteringCheckpoint, setIsRegisteringCheckpoint] = useState(false);

  useEffect(() => {
    setLocalCounter(counterValue);
  }, [counterValue]);

  useEffect(() => {
    setLocalBoolean(booleanValue);
  }, [booleanValue]);

  const handlePlus = () => {
    setLocalCounter((prev) => (prev === null ? 1 : prev + 1));
    onIncrementCounter(activity.id);
  };

  const handleMinus = async () => {
    if (localCounter === null || localCounter <= 0 || isDecrementing) return;
    setIsDecrementing(true);
    try {
      const nextVal = Math.max(0, localCounter - 1);
      setLocalCounter(nextVal);
      await onDecrementCounter(activity.id);
    } finally {
      setIsDecrementing(false);
    }
  };

  const handleBooleanClick = (targetVal: boolean) => {
    if (localBoolean === targetVal) {
      // Clicking the same option again toggles off to "Sin registro" (null)
      setLocalBoolean(null);
      onSetBoolean(activity.id, null);
    } else {
      setLocalBoolean(targetVal);
      onSetBoolean(activity.id, targetVal);
    }
  };

  const handleCheckpointClick = async () => {
    if (!onAddCheckpoint || isRegisteringCheckpoint) return;
    setIsRegisteringCheckpoint(true);
    try {
      await onAddCheckpoint(activity.id);
    } finally {
      setIsRegisteringCheckpoint(false);
    }
  };

  const getDirectionBadge = () => {
    switch (activity.direction) {
      case 'decrease':
        return <span className="text-[10px] text-[#c5a059]/80 font-mono tracking-wider">Reducir</span>;
      case 'increase':
        return <span className="text-[10px] text-emerald-400/80 font-mono tracking-wider">Aumentar</span>;
      case 'compliance':
        return <span className="text-[10px] text-sky-400/80 font-mono tracking-wider">Cumplir</span>;
      case 'earlier':
        return <span className="text-[10px] text-amber-400/80 font-mono tracking-wider">Más temprano</span>;
      case 'later':
        return <span className="text-[10px] text-indigo-400/80 font-mono tracking-wider">Más tarde</span>;
      case 'neutral':
        return <span className="text-[10px] text-slate-400/80 font-mono tracking-wider">Neutral</span>;
    }
  };

  const getStatusBadge = () => {
    if (activity.type === 'boolean') {
      if (localBoolean === true) {
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#1a2e1a] text-[#4ade80] border border-[#2d4a2d] flex items-center space-x-1 shrink-0">
            <Check className="w-3 h-3 stroke-[3]" />
            <span>Realizada</span>
          </span>
        );
      }
      if (localBoolean === false) {
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#2a1a1a] text-[#f87171] border border-[#4a2d2d] flex items-center space-x-1 shrink-0">
            <X className="w-3 h-3 stroke-[3]" />
            <span>No realizada</span>
          </span>
        );
      }
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#18181b] text-[#888888] border border-[#28282b] border-dashed shrink-0">
          Sin registro
        </span>
      );
    }

    if (activity.type === 'counter') {
      if (localCounter !== null) {
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#1a2e1a] text-[#4ade80] border border-[#2d4a2d] flex items-center space-x-1 shrink-0">
            <Check className="w-3 h-3 stroke-[3]" />
            <span>Registrada</span>
          </span>
        );
      }
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#18181b] text-[#888888] border border-[#28282b] border-dashed shrink-0">
          Sin registro
        </span>
      );
    }

    if (activity.type === 'checkpoint') {
      if (checkpointRecords.length > 0) {
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#1a2e1a] text-[#4ade80] border border-[#2d4a2d] flex items-center space-x-1 shrink-0">
            <Check className="w-3 h-3 stroke-[3]" />
            <span>{checkpointRecords.length === 1 ? 'Registrada' : `${checkpointRecords.length} registros`}</span>
          </span>
        );
      }
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#18181b] text-[#888888] border border-[#28282b] border-dashed shrink-0">
          Sin registro
        </span>
      );
    }

    return null;
  };

  return (
    <div className="bg-[#131315] border border-[#1e1e20] rounded-2xl p-4 shadow-lg hover:border-[#c5a059]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Activity Details */}
      <div className="flex items-start space-x-3.5">
        <div className="w-11 h-11 rounded-xl bg-[#18181b] border border-[#1e1e20] flex items-center justify-center text-[#c5a059] shrink-0">
          <IconRenderer name={activity.icon} className="w-5 h-5" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-[#e2e2e2]">{activity.name}</h3>
            {getDirectionBadge()}
            {getStatusBadge()}
          </div>
          {activity.description && (
            <p className="text-xs text-[#888888] mt-0.5 line-clamp-1 font-light">{activity.description}</p>
          )}

          {/* If Checkpoint, render recorded times under name if any */}
          {activity.type === 'checkpoint' && checkpointRecords.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {checkpointRecords.map((r) => (
                <span
                  key={r.id}
                  className="px-2 py-0.5 rounded-md bg-[#1c1a16] border border-[#c5a059]/30 text-[#c5a059] font-mono text-[11px] font-semibold flex items-center space-x-1.5"
                >
                  <Clock className="w-3 h-3 text-[#c5a059]/80" />
                  <span>{formatLocalTime(r.timestamp)}</span>
                  {onDeleteCheckpoint && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCheckpoint(r.id);
                      }}
                      title="Eliminar registro"
                      className="ml-0.5 text-[#888888] hover:text-[#f87171] transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="flex items-center justify-end">
        {activity.type === 'counter' ? (
          <div className="flex items-center space-x-3 bg-[#0c0c0d] border border-[#1e1e20] rounded-xl p-1.5">
            <button
              id={`minus-btn-${activity.id}`}
              onClick={handleMinus}
              disabled={localCounter === null || localCounter <= 0 || isDecrementing}
              aria-label={`Disminuir ${activity.name}`}
              className="w-10 h-10 rounded-lg bg-[#18181b] hover:bg-[#222225] border border-[#28282b] flex items-center justify-center text-[#e2e2e2] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Minus className="w-4 h-4" />
            </button>

            <span className="min-w-20 px-1 text-center font-mono text-[#c5a059] flex items-center justify-center">
              {localCounter === null ? (
                <span className="text-[11px] font-semibold text-[#888888]">Sin registro</span>
              ) : (
                <span className="text-lg font-bold">{localCounter}</span>
              )}
            </span>

            <button
              id={`plus-btn-${activity.id}`}
              onClick={handlePlus}
              aria-label={`Aumentar ${activity.name}`}
              className="w-10 h-10 rounded-lg bg-[#c5a059] hover:bg-[#d4b068] text-[#0c0c0d] font-bold flex items-center justify-center active:scale-95 shadow-md transition-all"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        ) : activity.type === 'boolean' ? (
          <div className="flex items-center space-x-2 bg-[#0c0c0d] border border-[#1e1e20] rounded-xl p-1.5">
            <button
              id={`bool-yes-${activity.id}`}
              onClick={() => handleBooleanClick(true)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 active:scale-95 ${
                localBoolean === true
                  ? 'bg-[#1a2e1a] text-[#4ade80] border border-[#2d4a2d] shadow-md'
                  : 'bg-[#18181b] text-[#888888] hover:text-[#e2e2e2] border border-[#28282b]'
              }`}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>SÍ</span>
            </button>

            <button
              id={`bool-no-${activity.id}`}
              onClick={() => handleBooleanClick(false)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 active:scale-95 ${
                localBoolean === false
                  ? 'bg-[#2a1a1a] text-[#f87171] border border-[#4a2d2d] shadow-md'
                  : 'bg-[#18181b] text-[#888888] hover:text-[#e2e2e2] border border-[#28282b]'
              }`}
            >
              <X className="w-3.5 h-3.5 stroke-[3]" />
              <span>NO</span>
            </button>
          </div>
        ) : (
          /* Checkpoint Control */
          <div className="flex items-center space-x-2 bg-[#0c0c0d] border border-[#1e1e20] rounded-xl p-1.5">
            {checkpointRecords.length === 0 ? (
              <button
                id={`checkpoint-btn-${activity.id}`}
                onClick={handleCheckpointClick}
                disabled={isRegisteringCheckpoint}
                className="px-4 py-2.5 bg-[#c5a059] hover:bg-[#d4b068] text-[#0c0c0d] font-bold text-xs rounded-lg shadow-md transition-all flex items-center space-x-2 active:scale-95 disabled:opacity-50"
              >
                <Clock className="w-4 h-4 stroke-[2.5]" />
                <span>REGISTRAR HORA</span>
              </button>
            ) : (activity.checkpointMode || 'single') === 'single' ? (
              <div className="px-3.5 py-2 bg-[#1a2e1a] text-[#4ade80] border border-[#2d4a2d] font-bold text-xs rounded-lg flex items-center space-x-1.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>REGISTRADO HOY</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  id={`checkpoint-btn-again-${activity.id}`}
                  onClick={handleCheckpointClick}
                  disabled={isRegisteringCheckpoint}
                  className="px-3.5 py-2 bg-[#18181b] hover:bg-[#222225] text-[#c5a059] border border-[#c5a059]/40 font-bold text-xs rounded-lg shadow-md transition-all flex items-center space-x-1.5 active:scale-95 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>REGISTRAR DE NUEVO</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
