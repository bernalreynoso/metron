import React, { useState, useMemo } from 'react';
import { Activity, ActivityList, ActivityRecord } from '../../types';
import { IconRenderer } from '../common/IconRenderer';
import { ActivityCard } from './ActivityCard';
import { isActivityCompletedToday } from '../../utils/activityStatus';
import {
  Search,
  X,
  ArrowLeft,
  Layers,
  CheckCircle2,
  Clock,
  Sparkles,
  Check,
  ListTodo,
} from 'lucide-react';

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
  onRegisterCounterZero?: (actId: string) => Promise<void> | void;
  onClearCounterZero?: (actId: string) => Promise<void> | void;
  onSetBoolean: (actId: string, val: boolean | null) => void;
  onAddCheckpoint: (actId: string) => void;
  onDeleteCheckpoint?: (recordId: string) => void;
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
  onRegisterCounterZero,
  onClearCounterZero,
  onSetBoolean,
  onAddCheckpoint,
  onDeleteCheckpoint,
  onNavigateToConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  // Active activities only
  const activeActivities = useMemo(() => {
    return activities.filter((a) => a.active);
  }, [activities]);

  // Separate active activities into pending vs completed today according to Part 16 rules
  const { pendingActivities, completedActivities } = useMemo(() => {
    const pending: Activity[] = [];
    const completed: Activity[] = [];

    activeActivities.forEach((act) => {
      if (isActivityCompletedToday(act, todayBooleanMap, todayCheckpointMap, todayCounterMap)) {
        completed.push(act);
      } else {
        pending.push(act);
      }
    });

    return { pendingActivities: pending, completedActivities: completed };
  }, [activeActivities, todayBooleanMap, todayCheckpointMap, todayCounterMap]);

  // Helper to compute stats for a specific list
  const getListStats = (listId: string | null) => {
    const listActs = activeActivities.filter((a) =>
      listId === 'unassigned' ? !a.listId : a.listId === listId
    );
    const completed = listActs.filter((a) =>
      isActivityCompletedToday(a, todayBooleanMap, todayCheckpointMap, todayCounterMap)
    ).length;
    const pending = listActs.length - completed;

    return {
      total: listActs.length,
      pending,
      completed,
    };
  };

  // Filtered displayed activities based on current tab, list, and search query
  const displayedActivities = useMemo(() => {
    let source = activeTab === 'pending' ? pendingActivities : completedActivities;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return source.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.description && a.description.toLowerCase().includes(q))
      );
    }

    if (selectedListId) {
      if (selectedListId === 'unassigned') {
        return source.filter((a) => !a.listId);
      }
      if (selectedListId === 'all') {
        return source;
      }
      return source.filter((a) => a.listId === selectedListId);
    }

    return source;
  }, [
    activeTab,
    pendingActivities,
    completedActivities,
    searchQuery,
    selectedListId,
  ]);

  const selectedListObj = useMemo(() => {
    if (!selectedListId || selectedListId === 'unassigned' || selectedListId === 'all')
      return null;
    return lists.find((l) => l.id === selectedListId) || null;
  }, [lists, selectedListId]);

  const unassignedStats = useMemo(() => getListStats('unassigned'), [
    activeActivities,
    todayBooleanMap,
    todayCheckpointMap,
  ]);

  return (
    <div className="space-y-5">
      {/* Date & Small Summary Header */}
      <div className="bg-[#131315] border border-[#1e1e20] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#c5a059] font-bold">
            REGISTRO DIARIO
          </p>
          <h2 className="text-lg font-bold text-[#e2e2e2] font-serif capitalize mt-0.5">
            {formattedTodayDate}
          </h2>
        </div>

        {/* Small Progress Badges */}
        <div className="flex items-center space-x-2">
          <div className="px-3 py-1.5 bg-[#18181b] border border-[#28282b] rounded-xl text-xs font-mono flex items-center space-x-2">
            <ListTodo className="w-4 h-4 text-[#f59e0b]" />
            <span className="text-[#888888]">Pendientes:</span>
            <span className="font-bold text-[#e2e2e2]">{pendingActivities.length}</span>
          </div>

          <div className="px-3 py-1.5 bg-[#18181b] border border-[#28282b] rounded-xl text-xs font-mono flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#4ade80]" />
            <span className="text-[#888888]">Realizadas:</span>
            <span className="font-bold text-[#4ade80]">{completedActivities.length}</span>
          </div>
        </div>
      </div>

      {/* Main Tab Switcher: [ PENDIENTES ] [ REALIZADAS ] */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#131315] border border-[#1e1e20] rounded-xl w-full sm:w-auto">
          <button
            type="button"
            id="tab-pending"
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'pending'
                ? 'bg-[#c5a059] text-[#0c0c0d] shadow-md'
                : 'text-[#888888] hover:text-[#e2e2e2]'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>PENDIENTES ({pendingActivities.length})</span>
          </button>

          <button
            type="button"
            id="tab-completed"
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'completed'
                ? 'bg-[#4ade80] text-[#0c0c0d] shadow-md'
                : 'text-[#888888] hover:text-[#e2e2e2]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>REALIZADAS ({completedActivities.length})</span>
          </button>
        </div>

        {/* Back to Lists Button if inside a specific list */}
        {selectedListId && !searchQuery && (
          <button
            type="button"
            onClick={() => setSelectedListId(null)}
            className="px-3 py-2 rounded-xl bg-[#18181b] hover:bg-[#222225] border border-[#28282b] text-xs text-[#c5a059] font-semibold flex items-center justify-center space-x-1.5 transition-all w-full sm:w-auto shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a Listas</span>
          </button>
        )}
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666666]" />
        <input
          type="text"
          placeholder={
            activeTab === 'pending'
              ? 'Buscar en actividades pendientes...'
              : 'Buscar en actividades realizadas hoy...'
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

      {/* =================================================== */}
      {/* TAB 1: PENDIENTES VIEW                              */}
      {/* =================================================== */}
      {activeTab === 'pending' && (
        <>
          {/* LEVEL 1: List Overview (when no search query and no list selected) */}
          {!searchQuery && !selectedListId ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#888888] uppercase tracking-wider font-mono flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#c5a059]" />
                  <span>Listas con Pendientes</span>
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
                  const { total, pending, completed } = getListStats(list.id);
                  if (total === 0) return null; // Skip empty lists if any

                  const isAllDone = total > 0 && pending === 0;

                  return (
                    <div
                      key={list.id}
                      onClick={() => setSelectedListId(list.id)}
                      className={`bg-[#131315] border rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.01] flex items-center justify-between group shadow-lg ${
                        isAllDone
                          ? 'border-[#4ade80]/30 bg-[#131315]/80 hover:border-[#4ade80]'
                          : 'border-[#1e1e20] hover:border-[#c5a059]'
                      }`}
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-colors shrink-0 ${
                            isAllDone
                              ? 'bg-[#1a2e1a] border-[#2d4a2d] text-[#4ade80]'
                              : 'bg-[#18181b] border-[#28282b] text-[#c5a059] group-hover:bg-[#c5a059] group-hover:text-[#0c0c0d]'
                          }`}
                        >
                          <IconRenderer name={list.icon} className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-[#e2e2e2] truncate group-hover:text-[#c5a059] transition-colors">
                            {list.name}
                          </h4>
                          <p className="text-xs text-[#888888] font-mono mt-0.5">
                            {pending === 0
                              ? 'Todo completado'
                              : `${pending} ${pending === 1 ? 'pendiente' : 'pendientes'}`}
                            {completed > 0 && ` · ${completed} realizada${completed === 1 ? '' : 's'}`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-3">
                        {isAllDone ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#1a2e1a] text-[#4ade80] border border-[#2d4a2d]">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>Listal</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#18181b] text-[#c5a059] border border-[#28282b]">
                            {pending} pendientes
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Unassigned Card if unassigned activities exist */}
                {unassignedStats.total > 0 && (
                  <div
                    onClick={() => setSelectedListId('unassigned')}
                    className={`bg-[#131315] border rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.01] flex items-center justify-between group shadow-lg ${
                      unassignedStats.pending === 0
                        ? 'border-[#4ade80]/30 hover:border-[#4ade80]'
                        : 'border-[#1e1e20] hover:border-[#c5a059]'
                    }`}
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
                          {unassignedStats.pending === 0
                            ? 'Todo completado'
                            : `${unassignedStats.pending} ${unassignedStats.pending === 1 ? 'pendiente' : 'pendientes'}`}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-3">
                      {unassignedStats.pending === 0 ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#1a2e1a] text-[#4ade80] border border-[#2d4a2d]">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Listo</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#18181b] text-[#888888] border border-[#28282b]">
                          {unassignedStats.pending} pendientes
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Option to view all pending activities without list filter */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setSelectedListId('all')}
                  className="text-xs text-[#888888] hover:text-[#c5a059] font-mono underline transition-colors"
                >
                  Ver todas las pendientes ({pendingActivities.length}) sin filtrar por lista
                </button>
              </div>
            </div>
          ) : (
            /* LEVEL 2: Inside a specific List or searching directly */
            <div className="space-y-3">
              {/* Header Title if inside a list */}
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
                          ? 'Todas las Actividades Pendientes'
                          : selectedListId === 'unassigned'
                          ? 'Pendientes Sin Lista'
                          : selectedListObj?.name}
                      </h3>
                      {selectedListObj?.description && (
                        <p className="text-[11px] text-[#888888] font-light">
                          {selectedListObj.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="text-xs text-[#c5a059] font-mono font-medium">
                    {displayedActivities.length}{' '}
                    {displayedActivities.length === 1 ? 'pendiente' : 'pendientes'}
                  </span>
                </div>
              )}

              {/* Activity Cards List */}
              {displayedActivities.length === 0 ? (
                <div className="bg-[#131315] border border-[#1e1e20] rounded-2xl p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#1a2e1a] border border-[#2d4a2d] text-[#4ade80] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-[#e2e2e2]">
                    {searchQuery
                      ? 'No hay pendientes que coincidan con la búsqueda'
                      : '¡No hay nada pendiente en esta lista!'}
                  </h4>
                  <p className="text-xs text-[#888888] max-w-sm mx-auto">
                    {searchQuery
                      ? 'Prueba ajustando el término de búsqueda.'
                      : 'Todas las actividades que tenían una meta fija hoy han sido completadas.'}
                  </p>
                  <div className="pt-1 flex items-center justify-center space-x-2">
                    {completedActivities.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('completed')}
                        className="px-3.5 py-1.5 bg-[#4ade80]/10 hover:bg-[#4ade80]/20 border border-[#4ade80]/40 text-[#4ade80] text-xs font-bold rounded-lg transition-all"
                      >
                        Ver Realizadas ({completedActivities.length})
                      </button>
                    )}
                    {selectedListId && (
                      <button
                        type="button"
                        onClick={() => setSelectedListId(null)}
                        className="px-3.5 py-1.5 bg-[#18181b] border border-[#28282b] hover:border-[#c5a059] text-[#c5a059] text-xs font-bold rounded-lg transition-all"
                      >
                        Volver a listas
                      </button>
                    )}
                  </div>
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
                      onRegisterCounterZero={onRegisterCounterZero ? () => onRegisterCounterZero(activity.id) : undefined}
                      onClearCounterZero={onClearCounterZero ? () => onClearCounterZero(activity.id) : undefined}
                      onSetBoolean={(val) => onSetBoolean(activity.id, val)}
                      onAddCheckpoint={() => onAddCheckpoint(activity.id)}
                      onDeleteCheckpoint={onDeleteCheckpoint}
                    />
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* =================================================== */}
      {/* TAB 2: REALIZADAS VIEW                              */}
      {/* =================================================== */}
      {activeTab === 'completed' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#1e1e20] pb-2">
            <div>
              <h3 className="text-sm font-bold text-[#e2e2e2] flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#4ade80]" />
                <span>Actividades Realizadas Hoy</span>
              </h3>
              <p className="text-xs text-[#888888] font-light mt-0.5">
                Acciones que ya cumplieron su propósito durante el día de hoy.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#4ade80]">
              {completedActivities.length} completadas
            </span>
          </div>

          {displayedActivities.length === 0 ? (
            <div className="bg-[#131315] border border-[#1e1e20] rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#18181b] border border-[#28282b] text-[#888888] flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#e2e2e2]">
                {searchQuery
                  ? 'No hay actividades realizadas que coincidan'
                  : 'Aún no has realizado actividades hoy'}
              </h4>
              <p className="text-xs text-[#888888] max-w-sm mx-auto">
                Conforme registres tus acciones en PENDIENTES, se moverán aquí automáticamente para despejar tu vista principal.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('pending')}
                className="mt-2 px-4 py-2 bg-[#c5a059] hover:bg-[#d4b068] text-[#0c0c0d] text-xs font-bold rounded-xl shadow-md transition-all"
              >
                Ir a Pendientes
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedActivities.map((activity) => {
                const counterVal =
                  activity.id in todayCounterMap ? todayCounterMap[activity.id] : null;
                const booleanVal =
                  activity.id in todayBooleanMap ? todayBooleanMap[activity.id] : null;
                const checkpointRecords = todayCheckpointMap[activity.id] || [];

                const listObj = lists.find((l) => l.id === activity.listId);

                return (
                  <div key={activity.id} className="relative">
                    {listObj && (
                      <div className="mb-1 pl-1 flex items-center space-x-1 text-[10px] text-[#888888] font-mono uppercase tracking-wider">
                        <IconRenderer name={listObj.icon} className="w-3 h-3 text-[#c5a059]" />
                        <span>{listObj.name}</span>
                      </div>
                    )}
                    <ActivityCard
                      activity={activity}
                      counterValue={counterVal}
                      booleanValue={booleanVal}
                      checkpointRecords={checkpointRecords}
                      onIncrementCounter={() => onIncrementCounter(activity.id)}
                      onDecrementCounter={() => onDecrementCounter(activity.id)}
                      onRegisterCounterZero={onRegisterCounterZero ? () => onRegisterCounterZero(activity.id) : undefined}
                      onClearCounterZero={onClearCounterZero ? () => onClearCounterZero(activity.id) : undefined}
                      onSetBoolean={(val) => onSetBoolean(activity.id, val)}
                      onAddCheckpoint={() => onAddCheckpoint(activity.id)}
                      onDeleteCheckpoint={onDeleteCheckpoint}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
