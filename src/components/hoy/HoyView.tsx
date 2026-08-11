import React, { useState, useMemo } from 'react';
import { Activity, ActivityList, ActivityRecord } from '../../types';
import { IconRenderer } from '../common/IconRenderer';
import { ActivityCard } from './ActivityCard';
import { Search, X, ArrowLeft, Layers, CheckCircle2, Circle, Clock, Sparkles } from 'lucide-react';

interface HoyViewProps {
  activities: Activity[];
  lists: ActivityList[];
  records: ActivityRecord[];
  todayStr: string;
  formattedTodayDate: string; // e.g. "Lunes, 11 de Agosto"
  todayCounterMap: Record<string, number | null>;
  todayBooleanMap: Record<string, boolean | null>;
  todayCheckpointMap: Record<string, ActivityRecord[]>;
  onIncrementCounter: (actId: string) => void;
  onDecrementCounter: (actId: string) => void;
  onSetBoolean: (actId: string, val: boolean) => void;
  onAddCheckpoint: (actId: string) => void;
  onNavigateToConfig?: () => void;
}

export const HoyView: React.FC<HoyViewProps> = ({
  activities,
  lists,
  records,
  todayStr,
  formattedTodayDate,
  todayCounterMap,
  todayBooleanMap,
  todayCheckpointMap,
  onIncrementCounter,
  onDecrementCounter,
  onSetBoolean,
  onAddCheckpoint,
  onNavigateToConfig,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const activeActivities = useMemo(() => {
    return activities.filter((a) => a.active);
  }, [activities]);

  // Helper to determine if an activity is completed today
  const isActivityCompletedToday = (act: Activity): boolean => {
    if (act.type === 'boolean') {
      return todayBooleanMap[act.id] === true;
    }
    if (act.type === 'counter') {
      const val = todayCounterMap[act.id];
      return typeof val === 'number' && val > 0;
    }
    if (act.type === 'checkpoint') {
      const recs = todayCheckpointMap[act.id] || [];
      return recs.length > 0;
    }
    return false;
  };

  // Compute progress for a specific list ID (or 'unassigned')
  const getListProgress = (listId: string | null) => {
    const listActs = activeActivities.filter((a) =>
      listId === 'unassigned' ? !a.listId : a.listId === listId
    );
    const completed = listActs.filter((a) => isActivityCompletedToday(a)).length;
    return {
      total: listActs.length,
      completed,
    };
  };

  // Filtered activities when inside a list or searching
  const displayedActivities = useMemo(() => {
    let result = activeActivities;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.description && a.description.toLowerCase().includes(q))
      );
    } else if (selectedListId) {
      if (selectedListId === 'unassigned') {
        result = result.filter((a) => !a.listId);
      } else {
        result = result.filter((a) => a.listId === selectedListId);
      }
    }

    // Status filter
    if (filter === 'pending') {
      result = result.filter((a) => !isActivityCompletedToday(a));
    } else if (filter === 'completed') {
      result = result.filter((a) => isActivityCompletedToday(a));
    }

    return result;
  }, [activeActivities, searchQuery, selectedListId, filter, todayBooleanMap, todayCounterMap, todayCheckpointMap]);

  const selectedListObj = useMemo(() => {
    if (!selectedListId || selectedListId === 'unassigned') return null;
    return lists.find((l) => l.id === selectedListId) || null;
  }, [lists, selectedListId]);

  // Unassigned activities count
  const unassignedCount = useMemo(() => {
    return activeActivities.filter((a) => !a.listId).length;
  }, [activeActivities]);

  return (
    <div className="space-y-5">
      {/* Date Header */}
      <div className="bg-[#131315] border border-[#1e1e20] rounded-2xl p-4 flex items-center justify-between shadow-lg">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#c5a059] font-semibold">
            REGISTRO DIARIO
          </p>
          <h2 className="text-base font-bold text-[#e2e2e2] font-serif capitalize">
            {formattedTodayDate}
          </h2>
        </div>
        <div className="px-3 py-1 bg-[#18181b] border border-[#28282b] rounded-xl text-xs text-[#888888] font-mono flex items-center space-x-1.5">
          <Clock className="w-3.5 h-3.5 text-[#c5a059]" />
          <span>{activeActivities.length} activas</span>
        </div>
      </div>

      {/* Search and Filters Header */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666666]" />
          <input
            type="text"
            placeholder={
              selectedListObj
                ? `Buscar dentro de "${selectedListObj.name}"...`
                : 'Buscar actividad rápida...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#131315] border border-[#1e1e20] rounded-xl py-2.5 pl-10 pr-10 text-xs text-[#e2e2e2] placeholder-[#666666] focus:outline-none focus:border-[#c5a059] transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#888888] hover:text-[#e2e2e2]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                filter === 'all'
                  ? 'bg-[#c5a059] text-[#0c0c0d] font-bold shadow-md'
                  : 'bg-[#131315] text-[#888888] hover:text-[#e2e2e2] border border-[#1e1e20]'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                filter === 'pending'
                  ? 'bg-[#c5a059] text-[#0c0c0d] font-bold shadow-md'
                  : 'bg-[#131315] text-[#888888] hover:text-[#e2e2e2] border border-[#1e1e20]'
              }`}
            >
              Pendientes
            </button>
            <button
              type="button"
              onClick={() => setFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                filter === 'completed'
                  ? 'bg-[#c5a059] text-[#0c0c0d] font-bold shadow-md'
                  : 'bg-[#131315] text-[#888888] hover:text-[#e2e2e2] border border-[#1e1e20]'
              }`}
            >
              Realizadas
            </button>
          </div>

          {selectedListId && !searchQuery && (
            <button
              type="button"
              onClick={() => setSelectedListId(null)}
              className="px-2.5 py-1.5 rounded-lg bg-[#18181b] hover:bg-[#222225] border border-[#28282b] text-xs text-[#c5a059] font-medium flex items-center space-x-1 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a listas</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}

      {/* CASE A: User is viewing List Overview (searchQuery is empty AND selectedListId is null) */}
      {!searchQuery && !selectedListId ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#888888] uppercase tracking-wider font-mono flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-[#c5a059]" />
              <span>Elige una Lista para Registrar</span>
            </h3>
            {lists.length === 0 && onNavigateToConfig && (
              <button
                type="button"
                onClick={onNavigateToConfig}
                className="text-xs text-[#c5a059] hover:underline font-mono"
              >
                + Crear listas
              </button>
            )}
          </div>

          {/* Grid of Lists */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lists.map((list) => {
              const { total, completed } = getListProgress(list.id);
              const isAllDone = total > 0 && completed === total;

              return (
                <div
                  key={list.id}
                  onClick={() => setSelectedListId(list.id)}
                  className={`bg-[#131315] border rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.01] flex items-center justify-between group shadow-lg ${
                    isAllDone
                      ? 'border-[#4ade80]/40 hover:border-[#4ade80]'
                      : 'border-[#1e1e20] hover:border-[#c5a059]'
                  }`}
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-[#18181b] border border-[#28282b] flex items-center justify-center text-[#c5a059] group-hover:bg-[#c5a059] group-hover:text-[#0c0c0d] transition-colors shrink-0">
                      <IconRenderer name={list.icon} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-[#e2e2e2] truncate group-hover:text-[#c5a059] transition-colors">
                        {list.name}
                      </h4>
                      {list.description ? (
                        <p className="text-xs text-[#888888] truncate font-light mt-0.5">
                          {list.description}
                        </p>
                      ) : (
                        <p className="text-xs text-[#888888] font-mono mt-0.5">
                          {total} {total === 1 ? 'actividad' : 'actividades'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                        isAllDone
                          ? 'bg-[#1a2e1a] text-[#4ade80] border border-[#2d4a2d]'
                          : completed > 0
                          ? 'bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/30'
                          : 'bg-[#18181b] text-[#888888] border border-[#28282b]'
                      }`}
                    >
                      {completed} / {total} hoy
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Unassigned Activities Card */}
            {unassignedCount > 0 && (
              <div
                onClick={() => setSelectedListId('unassigned')}
                className="bg-[#131315] border border-[#1e1e20] hover:border-[#c5a059] rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.01] flex items-center justify-between group shadow-lg"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[#18181b] border border-[#28282b] flex items-center justify-center text-[#888888] group-hover:bg-[#c5a059] group-hover:text-[#0c0c0d] transition-colors shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-[#e2e2e2] truncate group-hover:text-[#c5a059] transition-colors">
                      Sin Lista
                    </h4>
                    <p className="text-xs text-[#888888] font-mono mt-0.5">
                      {unassignedCount} {unassignedCount === 1 ? 'actividad' : 'actividades'}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-3">
                  {(() => {
                    const { total, completed } = getListProgress('unassigned');
                    return (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#18181b] text-[#888888] border border-[#28282b]">
                        {completed} / {total} hoy
                      </span>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Quick Option to view all activities directly */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setSelectedListId('all')}
              className="text-xs text-[#888888] hover:text-[#c5a059] font-mono underline transition-colors"
            >
              Ver todas las actividades sin filtrar por lista
            </button>
          </div>
        </div>
      ) : (
        /* CASE B: User is inside a specific List or searching directly */
        <div className="space-y-3">
          {/* List Title Header if inside a list */}
          {selectedListId && !searchQuery && (
            <div className="flex items-center justify-between border-b border-[#1e1e20] pb-2">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#18181b] border border-[#28282b] flex items-center justify-center text-[#c5a059]">
                  <IconRenderer
                    name={selectedListObj ? selectedListObj.icon : 'Sparkles'}
                    className="w-4 h-4"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#e2e2e2]">
                    {selectedListId === 'all'
                      ? 'Todas las Actividades'
                      : selectedListId === 'unassigned'
                      ? 'Actividades Sin Lista'
                      : selectedListObj?.name}
                  </h3>
                  {selectedListObj?.description && (
                    <p className="text-[11px] text-[#888888] font-light">
                      {selectedListObj.description}
                    </p>
                  )}
                </div>
              </div>

              <span className="text-xs text-[#888888] font-mono font-medium">
                {displayedActivities.length}{' '}
                {displayedActivities.length === 1 ? 'actividad' : 'actividades'}
              </span>
            </div>
          )}

          {/* Activity Cards List */}
          {displayedActivities.length === 0 ? (
            <div className="bg-[#131315] border border-[#1e1e20] rounded-2xl p-6 text-center space-y-2">
              <p className="text-sm font-semibold text-[#e2e2e2]">
                No hay actividades en este estado
              </p>
              <p className="text-xs text-[#888888]">
                Prueba cambiando el filtro de estado o la búsqueda.
              </p>
              {filter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className="mt-2 px-3 py-1.5 bg-[#18181b] border border-[#28282b] hover:border-[#c5a059] text-[#c5a059] text-xs font-bold rounded-lg transition-all"
                >
                  Ver todas
                </button>
              )}
            </div>
          ) : (
            displayedActivities.map((activity) => {
              const counterVal =
                activity.id in todayCounterMap ? todayCounterMap[activity.id] : null;
              const booleanVal =
                activity.id in todayBooleanMap ? todayBooleanMap[activity.id] : null;
              const checkpointRecords = todayCheckpointMap[activity.id] || [];

              return (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  counterValue={counterVal}
                  booleanValue={booleanVal}
                  checkpointRecords={checkpointRecords}
                  onIncrementCounter={() => onIncrementCounter(activity.id)}
                  onDecrementCounter={() => onDecrementCounter(activity.id)}
                  onSetBoolean={(val) => onSetBoolean(activity.id, val)}
                  onAddCheckpoint={() => onAddCheckpoint(activity.id)}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
