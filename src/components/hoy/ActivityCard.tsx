import React, { useState, useEffect } from 'react';
import { Activity } from '../../types';
import { IconRenderer } from '../common/IconRenderer';
import { Plus, Minus, Check, X } from 'lucide-react';

interface ActivityCardProps {
  activity: Activity;
  counterValue: number | null; // number or null (Sin registro)
  booleanValue: boolean | null; // true, false, or null (Sin registro)
  onIncrementCounter: (activityId: string) => void;
  onDecrementCounter: (activityId: string) => Promise<void> | void;
  onSetBoolean: (activityId: string, value: boolean | null) => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  counterValue,
  booleanValue,
  onIncrementCounter,
  onDecrementCounter,
  onSetBoolean,
}) => {
  // Local optimism state for snappy 16ms UI feedback
  const [localCounter, setLocalCounter] = useState<number | null>(counterValue);
  const [localBoolean, setLocalBoolean] = useState<boolean | null>(booleanValue);
  const [isDecrementing, setIsDecrementing] = useState(false);

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
      if (targetVal === false) {
        // Clicking NO when already NO -> returns to "Sin registro" (null)
        setLocalBoolean(null);
        onSetBoolean(activity.id, null);
      } else {
        // Clicking SÍ when already SÍ -> remains SÍ (PRUEBA 9 requirement)
        setLocalBoolean(true);
        onSetBoolean(activity.id, true);
      }
    } else {
      setLocalBoolean(targetVal);
      onSetBoolean(activity.id, targetVal);
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
    }
  };

  return (
    <div className="bg-[#131315] border border-[#1e1e20] rounded-2xl p-4 shadow-lg hover:border-[#c5a059]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Activity Details */}
      <div className="flex items-start space-x-3.5">
        <div className="w-11 h-11 rounded-xl bg-[#18181b] border border-[#1e1e20] flex items-center justify-center text-[#c5a059] shrink-0">
          <IconRenderer name={activity.icon} className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-semibold text-[#e2e2e2]">{activity.name}</h3>
            {getDirectionBadge()}
          </div>
          {activity.description && (
            <p className="text-xs text-[#888888] mt-0.5 line-clamp-1 font-light">{activity.description}</p>
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
        ) : (
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
        )}
      </div>
    </div>
  );
};
