import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { Header } from './components/common/Header';
import { Navigation } from './components/common/Navigation';
import { EmptyState, LoadingSpinner } from './components/common/EmptyState';
import { ActivityCard } from './components/hoy/ActivityCard';
import { SummaryCards } from './components/progreso/SummaryCards';
import { TrendsList } from './components/progreso/TrendsList';
import { ActivityDetailModal } from './components/progreso/ActivityDetailModal';
import { DatePickerStrip } from './components/historial/DatePickerStrip';
import { HistoryRecordEditor } from './components/historial/HistoryRecordEditor';
import { ActivityList } from './components/actividades/ActivityList';

import { Activity, ActivityRecord, ActiveTab } from './types';
import { formatSpanishDate, getLocalDateString, getPastNDays, getComparisonPeriodDates } from './utils/dates';
import { calculateBooleanMetrics, calculateCounterMetrics } from './utils/metrics';
import {
  subscribeActivities,
  createActivity,
  updateActivity,
  toggleActivityActive,
} from './services/activityService';
import {
  subscribeRecordsByDateRange,
  subscribeRecordsByDate,
  addCounterIncrement,
  addCounterDecrement,
  setBooleanRecord,
} from './services/recordService';

function MainApp() {
  const { user, loading: authLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<ActiveTab>('hoy');
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [historyRecords, setHistoryRecords] = useState<ActivityRecord[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Today's logical local date string YYYY-MM-DD
  const todayStr = getLocalDateString();

  // Selected date for HISTORIAL tab
  const [historyDate, setHistoryDate] = useState<string>(todayStr);

  // Selected activity for Detail Modal in PROGRESO tab
  const [selectedDetailActivity, setSelectedDetailActivity] = useState<Activity | null>(null);

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

    return () => unsubActivities();
  }, [user]);

  // Subscribe to user's records for past 185 days (supports 90-day comparison)
  useEffect(() => {
    if (!user) return;

    const past180Days = getPastNDays(185, todayStr);
    const startDate = past180Days[0];
    const endDate = todayStr;

    const unsubRecords = subscribeRecordsByDateRange(
      user.uid,
      startDate,
      endDate,
      (recs) => {
        setRecords(recs);
      },
      (err) => {
        console.error('Error fetching records:', err);
        setDataError('No pudimos cargar tus registros de datos.');
      }
    );

    return () => unsubRecords();
  }, [user, todayStr]);

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

  records.forEach((r) => {
    if (r.date === todayStr) {
      if (r.type === 'counter') {
        todayCounterMap[r.activityId] = (todayCounterMap[r.activityId] || 0) + Number(r.value);
      } else {
        todayBooleanMap[r.activityId] = r.value === true;
      }
    }
  });

  // Calculate Summary Counts for PROGRESO tab (7 days default)
  const { currentPeriod, previousPeriod } = getComparisonPeriodDates(7, todayStr);
  let improvingCount = 0;
  let worseningCount = 0;
  let stableCount = 0;
  let insufficientCount = 0;

  activeActivities.forEach((act) => {
    const counterMap: Record<string, number> = {};
    const booleanMap: Record<string, boolean | null> = {};

    records.forEach((r) => {
      if (r.activityId === act.id) {
        if (act.type === 'counter') {
          counterMap[r.date] = (counterMap[r.date] || 0) + Number(r.value);
        } else {
          booleanMap[r.date] = r.value === true;
        }
      }
    });

    const trend =
      act.type === 'counter'
        ? calculateCounterMetrics(act, counterMap, todayStr, currentPeriod, previousPeriod).trend
        : calculateBooleanMetrics(act, booleanMap, todayStr, currentPeriod, previousPeriod).trend;

    if (trend === 'MEJORANDO') improvingCount++;
    else if (trend === 'EMPEORANDO') worseningCount++;
    else if (trend === 'ESTABLE') stableCount++;
    else insufficientCount++;
  });

  // Action handlers
  const handleIncrement = (activityId: string, dateStr: string = todayStr) => {
    if (!user) return;
    addCounterIncrement(user.uid, activityId, dateStr);
  };

  const handleDecrement = (activityId: string, dateStr: string = todayStr) => {
    if (!user) return;
    addCounterDecrement(user.uid, activityId, dateStr);
  };

  const handleSetBoolean = (activityId: string, dateStr: string = todayStr, val: boolean | null) => {
    if (!user) return;
    setBooleanRecord(user.uid, activityId, dateStr, val);
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

  return (
    <div className="min-h-screen bg-[#0c0c0d] bg-[radial-gradient(ellipse_at_top_right,_#1a1a1c_0%,_#0c0c0d_70%)] text-[#e2e2e2] flex flex-col font-sans pb-20 md:pb-8 selection:bg-[#c5a05933] selection:text-[#c5a059]">
      {/* App Header */}
      <Header currentTab={currentTab} />

      {/* Primary Sub-Navigation */}
      <Navigation currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {/* HOY TAB */}
        {currentTab === 'hoy' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#1e1e20] pb-3">
              <div>
                <h2 className="text-base font-bold text-[#e2e2e2] font-serif tracking-wide">Registros de Hoy</h2>
                <p className="text-xs text-[#888888] font-light">{formatSpanishDate(todayStr)}</p>
              </div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#c5a059] bg-[#c5a059]/10 px-2.5 py-1 rounded-lg border border-[#c5a059]/30">
                Respuesta Inmediata
              </span>
            </div>

            {activeActivities.length === 0 ? (
              <EmptyState
                title="Sin actividades activas"
                description="Agrega o reactiva actividades para comenzar a registrar tu comportamiento."
                actionLabel="Ir a Actividades"
                onAction={() => setCurrentTab('actividades')}
              />
            ) : (
              <div className="space-y-3">
                {activeActivities.map((activity) => {
                  const counterVal = activity.id in todayCounterMap ? todayCounterMap[activity.id] : null;
                  const booleanVal =
                    activity.id in todayBooleanMap ? todayBooleanMap[activity.id] : null;

                  return (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      counterValue={counterVal}
                      booleanValue={booleanVal}
                      onIncrementCounter={(actId) => handleIncrement(actId, todayStr)}
                      onDecrementCounter={(actId) => handleDecrement(actId, todayStr)}
                      onSetBoolean={(actId, val) => handleSetBoolean(actId, todayStr, val)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PROGRESO TAB */}
        {currentTab === 'progreso' && (
          <div className="space-y-6">
            <SummaryCards
              improvingCount={improvingCount}
              worseningCount={worseningCount}
              stableCount={stableCount}
              insufficientCount={insufficientCount}
            />

            <TrendsList
              activities={activities}
              records={records}
              todayStr={todayStr}
              onSelectActivity={(act) => setSelectedDetailActivity(act)}
            />

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
              activities={activities.filter((a) => a.active || historyRecords.some((r) => r.activityId === a.id))}
              records={historyRecords}
              onIncrementCounter={handleIncrement}
              onDecrementCounter={handleDecrement}
              onSetBoolean={handleSetBoolean}
            />
          </div>
        )}

        {/* ACTIVIDADES TAB */}
        {currentTab === 'actividades' && (
          <ActivityList
            activities={activities}
            records={records}
            onCreateActivity={handleCreateActivity}
            onUpdateActivity={handleUpdateActivity}
            onToggleActive={handleToggleActive}
          />
        )}
      </main>
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
