import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { Header } from './components/common/Header';
import { Navigation } from './components/common/Navigation';
import { UpdateNotification } from './components/common/UpdateNotification';
import { EmptyState, LoadingSpinner } from './components/common/EmptyState';
import { HoyView } from './components/hoy/HoyView';
import { DailySummary } from './components/hoy/DailySummary';
import { DailyActivityChart, DayChartItem } from './components/hoy/DailyActivityChart';
import { SummaryCards } from './components/progreso/SummaryCards';
import { TrendsList } from './components/progreso/TrendsList';
import { ActivityDetailModal } from './components/progreso/ActivityDetailModal';
import { TrendCategoryModal } from './components/progreso/TrendCategoryModal';
import { DatePickerStrip } from './components/historial/DatePickerStrip';
import { HistoryRecordEditor } from './components/historial/HistoryRecordEditor';
import { ActivityList } from './components/actividades/ActivityList';

import { Activity, ActivityList as ActivityListType, ActivityRecord, ActiveTab } from './types';
import {
  formatSpanishDate,
  formatShortDate,
  getLocalDateString,
  getPastNDays,
  getComparisonPeriodDates,
} from './utils/dates';
import { calculateBooleanMetrics, calculateCheckpointMetrics, calculateCounterMetrics } from './utils/metrics';
import { isActivityCompletedToday } from './utils/activityStatus';
import {
  subscribeActivities,
  createActivity,
  updateActivity,
  toggleActivityActive,
  deleteActivityPermanently,
} from './services/activityService';
import {
  subscribeLists,
  createList,
  updateList,
  deleteListSafely,
} from './services/listService';
import {
  subscribeRecordsByDateRange,
  subscribeRecordsByDate,
  addCounterIncrement,
  addCounterDecrement,
  setCounterZeroRecord,
  clearCounterZeroRecord,
  setBooleanRecord,
  addCheckpointRecord,
  updateCheckpointRecordTime,
  deleteCheckpointRecord,
} from './services/recordService';

function MainApp() {
  const { user, timezone, isOnline, loading: authLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<ActiveTab>('hoy');
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [lists, setLists] = useState<ActivityListType[]>([]);
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [historyRecords, setHistoryRecords] = useState<ActivityRecord[]>([]);
  const [hasPendingWrites, setHasPendingWrites] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Today's logical local date string YYYY-MM-DD
  const [todayStr, setTodayStr] = useState<string>(() => getLocalDateString(new Date(), timezone));

  // Sync todayStr when timezone is loaded/updated
  useEffect(() => {
    setTodayStr(getLocalDateString(new Date(), timezone));
  }, [timezone]);

  // Filter for HOY tab: 'all' | 'pending' | 'completed'
  const [hoyFilter, setHoyFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Automatic Day Change Detection
  useEffect(() => {
    const checkDateChange = () => {
      const nowStr = getLocalDateString(new Date(), timezone);
      if (nowStr !== todayStr) {
        setTodayStr(nowStr);
      }
    };

    window.addEventListener('focus', checkDateChange);
    document.addEventListener('visibilitychange', checkDateChange);
    const timer = setInterval(checkDateChange, 60000);

    return () => {
      window.removeEventListener('focus', checkDateChange);
      document.removeEventListener('visibilitychange', checkDateChange);
      clearInterval(timer);
    };
  }, [todayStr, timezone]);

  // Re-verify date string on tab switch
  useEffect(() => {
    const nowStr = getLocalDateString(new Date(), timezone);
    if (nowStr !== todayStr) {
      setTodayStr(nowStr);
    }
  }, [currentTab, timezone]);

  // Selected date for HISTORIAL tab
  const [historyDate, setHistoryDate] = useState<string>(todayStr);

  // Selected activity for Detail Modal in PROGRESO tab
  const [selectedDetailActivity, setSelectedDetailActivity] = useState<Activity | null>(null);
  const [selectedTrendCategory, setSelectedTrendCategory] = useState<'improving' | 'worsening' | 'stable' | 'insufficient' | null>(null);

  // Subscribe to user's activities
  useEffect(() => {
    if (!user) {
      setActivities([]);
      setRecords([]);
      setHistoryRecords([]);
      setLoadingData(false);
      setDataError(null);
      return;
    }

    setLoadingData(true);
    setDataError(null);

    const unsubActivities = subscribeActivities(
      user.uid,
      (acts) => {
        setActivities(acts);
        setLoadingData(false);
      },
      (err) => {
        console.error('Error fetching activities:', err);
        setDataError('No pudimos cargar tus datos de actividades.');
        setLoadingData(false);
      }
    );

    const unsubLists = subscribeLists(
      user.uid,
      (l) => setLists(l),
      (err) => console.error('Error fetching lists:', err)
    );

    return () => {
      unsubActivities();
      unsubLists();
    };
  }, [user]);

  // Subscribe to user's records for past 185 days (supports 90-day comparison)
  useEffect(() => {
    if (!user) return;

    const past180Days = getPastNDays(185, todayStr, timezone);
    const startDate = past180Days[0];
    const endDate = todayStr;

    const unsubRecords = subscribeRecordsByDateRange(
      user.uid,
      startDate,
      endDate,
      (recs, metadata) => {
        setRecords(recs);
        if (metadata) {
          setHasPendingWrites(metadata.hasPendingWrites);
        }
      },
      (err) => {
        console.error('Error fetching records:', err);
        setDataError('No pudimos cargar tus registros de datos.');
      }
    );

    return () => unsubRecords();
  }, [user, todayStr, timezone]);

  // Subscribe directly to records for the selected historyDate in HISTORIAL tab
  useEffect(() => {
    if (!user) return;

    const unsubHistory = subscribeRecordsByDate(
      user.uid,
      historyDate,
      (recs) => {
        setHistoryRecords(recs);
      },
      (err) => {
        console.error('Error fetching history records:', err);
      }
    );

    return () => unsubHistory();
  }, [user, historyDate]);

  if (authLoading || (user && loadingData)) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <AuthModal />;
  }

  if (dataError) {
    return (
      <div className="min-h-screen bg-[#0c0c0d] flex items-center justify-center p-4 text-[#e2e2e2]">
        <div className="bg-[#131315] border border-[#1e1e20] rounded-2xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-950/50 border border-rose-800/50 text-[#f87171] flex items-center justify-center mx-auto">
            !
          </div>
          <h2 className="text-base font-bold text-[#e2e2e2] font-serif">No pudimos cargar tus datos</h2>
          <p className="text-xs text-[#888888] leading-relaxed">{dataError}</p>
          <button
            onClick={() => {
              setDataError(null);
              setLoadingData(true);
              window.location.reload();
            }}
            className="px-5 py-2.5 bg-[#c5a059] hover:bg-[#d4b068] text-[#0c0c0d] font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Active activities for HOY screen
  const activeActivities = activities.filter((a) => a.active);

  // Prepare records for today
  const todayCounterMap: Record<string, number> = {};
  const todayBooleanMap: Record<string, boolean | null> = {};
  const todayCheckpointMap: Record<string, ActivityRecord[]> = {};

  records.forEach((r) => {
    if (r.date === todayStr) {
      if (r.type === 'counter') {
        todayCounterMap[r.activityId] = (todayCounterMap[r.activityId] || 0) + Number(r.value);
      } else if (r.type === 'boolean') {
        todayBooleanMap[r.activityId] = r.value === true;
      } else if (r.type === 'checkpoint') {
        if (!todayCheckpointMap[r.activityId]) todayCheckpointMap[r.activityId] = [];
        todayCheckpointMap[r.activityId].push(r);
      }
    }
  });

  // Calculate HOY Summary Metrics
  let completedCount = 0;
  let pendingCount = 0;
  let notCompliedCount = 0;
  let checkpointsCountToday = 0;

  activeActivities.forEach((act) => {
    const isCompleted = isActivityCompletedToday(act, todayBooleanMap, todayCheckpointMap, todayCounterMap);
    if (isCompleted) {
      completedCount++;
    } else {
      pendingCount++;
    }

    if (act.type === 'boolean' && todayBooleanMap[act.id] === false) {
      notCompliedCount++;
    }

    if (act.type === 'checkpoint') {
      const recs = todayCheckpointMap[act.id] || [];
      checkpointsCountToday += recs.length;
    }
  });

  const totalActive = activeActivities.length;
  const compliancePct = totalActive > 0 ? Math.round((completedCount / totalActive) * 100) : 0;

  // Past 7 days (including today) for Daily Evolution Chart
  const past7Days = getPastNDays(7, todayStr, timezone);
  const dayChartItems: DayChartItem[] = past7Days.map((dStr) => {
    const isToday = dStr === todayStr;
    const dayLabel = isToday ? 'Hoy' : formatShortDate(dStr);

    // Count distinct activityIds in records for this date (active or inactive)
    const distinctRecordedActivityIds = new Set(
      records.filter((r) => r.date === dStr).map((r) => r.activityId)
    );
    const recordedForDay = distinctRecordedActivityIds.size;

    return {
      dateStr: dStr,
      dayLabel,
      recordedCount: recordedForDay,
      totalActiveCount: totalActive,
      isToday,
    };
  });

  // Filtered Activities for HOY view
  const filteredHoyActivities = activeActivities.filter((act) => {
    if (hoyFilter === 'all') return true;

    let isCompleted = false;
    let isPending = false;

    if (act.type === 'boolean') {
      const val = todayBooleanMap[act.id];
      if (val === true) {
        isCompleted = true;
      } else if (val === null || val === undefined) {
        isPending = true;
      }
      // Note: val === false is explicitly 'No', so it is neither completed nor pending
    } else if (act.type === 'counter') {
      if (act.id in todayCounterMap && todayCounterMap[act.id] !== null) {
        isCompleted = true;
      } else {
        isPending = true;
      }
    } else if (act.type === 'checkpoint') {
      const recs = todayCheckpointMap[act.id] || [];
      if (recs.length > 0) {
        isCompleted = true;
      } else {
        isPending = true;
      }
    }

    if (hoyFilter === 'pending') return isPending;
    if (hoyFilter === 'completed') return isCompleted;
    return true;
  });

  // Calculate Summary Categories & Counts for PROGRESO tab (7 days default)
  const { currentPeriod, previousPeriod } = getComparisonPeriodDates(7, todayStr, timezone);
  const improvingActivities: Activity[] = [];
  const worseningActivities: Activity[] = [];
  const stableActivities: Activity[] = [];
  const insufficientActivities: Activity[] = [];

  activeActivities.forEach((act) => {
    const counterMap: Record<string, number> = {};
    const booleanMap: Record<string, boolean | null> = {};
    const checkpointMap: Record<string, ActivityRecord[]> = {};

    records.forEach((r) => {
      if (r.activityId === act.id) {
        if (act.type === 'counter') {
          counterMap[r.date] = (counterMap[r.date] || 0) + Number(r.value);
        } else if (act.type === 'boolean') {
          booleanMap[r.date] = r.value === true;
        } else if (act.type === 'checkpoint') {
          if (!checkpointMap[r.date]) checkpointMap[r.date] = [];
          checkpointMap[r.date].push(r);
        }
      }
    });

    const trend =
      act.type === 'counter'
        ? calculateCounterMetrics(act, counterMap, todayStr, currentPeriod, previousPeriod).trend
        : act.type === 'boolean'
        ? calculateBooleanMetrics(act, booleanMap, todayStr, currentPeriod, previousPeriod).trend
        : calculateCheckpointMetrics(act, checkpointMap, todayStr, currentPeriod, previousPeriod, timezone).trend;

    if (trend === 'MEJORANDO') improvingActivities.push(act);
    else if (trend === 'EMPEORANDO') worseningActivities.push(act);
    else if (trend === 'ESTABLE') stableActivities.push(act);
    else insufficientActivities.push(act);
  });

  const improvingCount = improvingActivities.length;
  const worseningCount = worseningActivities.length;
  const stableCount = stableActivities.length;
  const insufficientCount = insufficientActivities.length;

  const getTrendCategoryData = (cat: 'improving' | 'worsening' | 'stable' | 'insufficient') => {
    switch (cat) {
      case 'improving':
        return { title: 'Actividades Mejorando', list: improvingActivities };
      case 'worsening':
        return { title: 'Actividades Empeorando', list: worseningActivities };
      case 'stable':
        return { title: 'Actividades Estables', list: stableActivities };
      case 'insufficient':
        return { title: 'Actividades Sin Datos Suficientes', list: insufficientActivities };
    }
  };

  // Action handlers
  const handleIncrement = (activityId: string, dateStr: string = todayStr) => {
    if (!user) return;
    addCounterIncrement(user.uid, activityId, dateStr);
  };

  const handleDecrement = (activityId: string, dateStr: string = todayStr) => {
    if (!user) return;
    addCounterDecrement(user.uid, activityId, dateStr);
  };

  const handleRegisterCounterZero = async (activityId: string, dateStr: string = todayStr) => {
    if (!user) return;
    await setCounterZeroRecord(user.uid, activityId, dateStr);
  };

  const handleClearCounterZero = async (activityId: string, dateStr: string = todayStr) => {
    if (!user) return;
    await clearCounterZeroRecord(user.uid, activityId, dateStr);
  };

  const handleSetBoolean = (activityId: string, dateStr: string = todayStr, val: boolean | null) => {
    if (!user) return;
    setBooleanRecord(user.uid, activityId, dateStr, val);
  };

  const handleAddCheckpoint = async (activityId: string, dateStr: string = todayStr) => {
    if (!user) return;
    await addCheckpointRecord(user.uid, activityId, dateStr);
  };

  const handleEditCheckpointTime = async (recordId: string, newTime: Date) => {
    if (!user) return;
    await updateCheckpointRecordTime(user.uid, recordId, newTime);
  };

  const handleDeleteCheckpoint = async (recordId: string) => {
    if (!user) return;
    await deleteCheckpointRecord(user.uid, recordId);
  };

  const handleCreateActivity = async (data: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    await createActivity(user.uid, data);
  };

  const handleUpdateActivity = async (activityId: string, updates: Partial<Activity>) => {
    if (!user) return;
    await updateActivity(user.uid, activityId, updates);
  };

  const handleToggleActive = async (activityId: string, active: boolean) => {
    if (!user) return;
    await toggleActivityActive(user.uid, activityId, active);
  };

  const handleDeleteActivityPermanently = async (activityId: string) => {
    if (!user) return;
    await deleteActivityPermanently(user.uid, activityId);
  };

  const handleCreateList = async (
    data: Omit<ActivityListType, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    if (!user) throw new Error('Usuario no autenticado');
    const ref = await createList(user.uid, data);
    return ref.id;
  };

  const handleUpdateList = async (listId: string, updates: Partial<ActivityListType>) => {
    if (!user) return;
    await updateList(user.uid, listId, updates);
  };

  const handleDeleteList = async (listId: string) => {
    if (!user) return;
    await deleteListSafely(user.uid, listId, activities);
  };

  return (
    <div className="min-h-screen bg-[#0c0c0d] bg-[radial-gradient(ellipse_at_top_right,_#1a1a1c_0%,_#0c0c0d_70%)] text-[#e2e2e2] flex flex-col font-sans pb-20 md:pb-8 selection:bg-[#c5a05933] selection:text-[#c5a059]">
      {/* App Header */}
      <Header currentTab={currentTab} hasPendingWrites={hasPendingWrites} />

      {/* Primary Sub-Navigation */}
      <Navigation currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {/* HOY TAB */}
        {currentTab === 'hoy' && (
          <div>
            {activeActivities.length === 0 ? (
              <EmptyState
                title="Sin actividades activas"
                description="Agrega o reactiva actividades para comenzar a registrar tu comportamiento."
                actionLabel="Ir a Actividades"
                onAction={() => setCurrentTab('actividades')}
              />
            ) : (
              <HoyView
                activities={activities}
                lists={lists}
                records={records}
                todayStr={todayStr}
                formattedTodayDate={formatSpanishDate(todayStr)}
                todayCounterMap={todayCounterMap}
                todayBooleanMap={todayBooleanMap}
                todayCheckpointMap={todayCheckpointMap}
                onIncrementCounter={(actId) => handleIncrement(actId, todayStr)}
                onDecrementCounter={(actId) => handleDecrement(actId, todayStr)}
                onRegisterCounterZero={(actId) => handleRegisterCounterZero(actId, todayStr)}
                onClearCounterZero={(actId) => handleClearCounterZero(actId, todayStr)}
                onSetBoolean={(actId, val) => handleSetBoolean(actId, todayStr, val)}
                onAddCheckpoint={(actId) => handleAddCheckpoint(actId, todayStr)}
                onDeleteCheckpoint={handleDeleteCheckpoint}
                onNavigateToConfig={() => setCurrentTab('actividades')}
              />
            )}
          </div>
        )}

        {/* PROGRESO TAB */}
        {currentTab === 'progreso' && (
          <div className="space-y-6">
            {/* Daily Summary */}
            <DailySummary
              dateFormatted={formatSpanishDate(todayStr)}
              totalActive={totalActive}
              completedCount={completedCount}
              pendingCount={pendingCount}
              notCompliedCount={notCompliedCount}
              checkpointsCount={checkpointsCountToday}
              compliancePct={compliancePct}
              activeFilter={hoyFilter}
              onSelectFilter={setHoyFilter}
            />

            {/* 7-Day Evolution Chart */}
            <DailyActivityChart days={dayChartItems} />

            {/* Overall Trends & Metrics */}
            <SummaryCards
              improvingCount={improvingCount}
              worseningCount={worseningCount}
              stableCount={stableCount}
              insufficientCount={insufficientCount}
              onSelectCategory={(cat) => setSelectedTrendCategory(cat)}
            />

            <TrendsList
              activities={activities}
              records={records}
              todayStr={todayStr}
              onSelectActivity={(act) => setSelectedDetailActivity(act)}
            />

            {selectedTrendCategory && (
              <TrendCategoryModal
                title={getTrendCategoryData(selectedTrendCategory).title}
                activities={getTrendCategoryData(selectedTrendCategory).list}
                onSelectActivity={(act) => {
                  setSelectedTrendCategory(null);
                  setSelectedDetailActivity(act);
                }}
                onClose={() => setSelectedTrendCategory(null)}
              />
            )}

            {selectedDetailActivity && (
              <ActivityDetailModal
                activity={selectedDetailActivity}
                records={records}
                todayStr={todayStr}
                onClose={() => setSelectedDetailActivity(null)}
              />
            )}
          </div>
        )}

        {/* HISTORIAL TAB */}
        {currentTab === 'historial' && (
          <div className="space-y-6">
            <DatePickerStrip
              selectedDate={historyDate}
              onSelectDate={setHistoryDate}
            />

            <HistoryRecordEditor
              selectedDate={historyDate}
              activities={activities}
              records={historyRecords}
              onIncrementCounter={handleIncrement}
              onDecrementCounter={handleDecrement}
              onRegisterCounterZero={handleRegisterCounterZero}
              onClearCounterZero={handleClearCounterZero}
              onSetBoolean={handleSetBoolean}
              onAddCheckpoint={handleAddCheckpoint}
              onEditCheckpointTime={handleEditCheckpointTime}
              onDeleteCheckpoint={handleDeleteCheckpoint}
            />
          </div>
        )}

        {/* ACTIVIDADES TAB */}
        {currentTab === 'actividades' && (
          <ActivityList
            activities={activities}
            lists={lists}
            records={records}
            onCreateActivity={handleCreateActivity}
            onUpdateActivity={handleUpdateActivity}
            onToggleActive={handleToggleActive}
            onDeleteActivity={handleDeleteActivityPermanently}
            onCreateList={handleCreateList}
            onUpdateList={handleUpdateList}
            onDeleteList={handleDeleteList}
          />
        )}
      </main>

      {/* Floating Update Notification */}
      <UpdateNotification />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
