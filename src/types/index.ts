export type ActivityType = 'counter' | 'boolean' | 'checkpoint';

export type CheckpointMode = 'single' | 'multiple';

export type ActivityDirection =
  | 'increase'
  | 'decrease'
  | 'compliance'
  | 'earlier'
  | 'later'
  | 'neutral';

export interface ActivityList {
  id: string;
  name: string;
  description?: string;
  icon: string;
  order: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface Activity {
  id: string;
  name: string;
  description?: string;
  icon: string;
  type: ActivityType;
  direction: ActivityDirection;
  checkpointMode?: CheckpointMode;
  listId?: string | null;
  active: boolean;
  order: number;
  createdAt: any;
  updatedAt: any;
}

export interface ActivityRecord {
  id: string;
  activityId: string;
  date: string; // YYYY-MM-DD local
  type: ActivityType;
  value?: number | boolean | null; // 1 or -1 for counter, boolean for boolean
  timestamp?: any; // Firebase Timestamp or Date/millis/string for checkpoint
  createdAt: any;
  updatedAt: any;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  timezone?: string;
  createdAt?: any;
  updatedAt?: any;
}

export type TrendStatus = 'MEJORANDO' | 'EMPEORANDO' | 'ESTABLE' | 'SIN DATOS SUFICIENTES';

export type DayOverDayTrend = 'MEJORANDO' | 'EMPEORANDO' | 'ESTABLE' | 'SIN DATOS';

export interface CounterMetrics {
  todayValue: number | null;
  dailyAvg: number; // average per recorded day
  currentPeriodTotal: number;
  prevPeriodTotal: number;
  currentPeriodAvg: number; // avg per recorded day in current period
  prevPeriodAvg: number; // avg per recorded day in prev period
  currentDaysWithData: number; // days actually recorded in current period
  prevDaysWithData: number; // days actually recorded in prev period
  totalDaysInPeriod: number;
  percentChange: number | null;
  trend: TrendStatus;
  hasComparisonData: boolean;
  dayOverDayTrend?: {
    status: DayOverDayTrend;
    latestDate: string;
    latestValue: number;
    previousDate: string;
    previousValue: number;
  } | null;
}

export interface BooleanMetrics {
  todayRecorded: boolean; // has user recorded for today
  todayValue: boolean | null; // true (Sí), false (No), null (unrecorded)
  currentTrueCount: number; // affirmative days (Sí)
  currentRecordedDays: number; // days with explicit record (Sí or No)
  prevTrueCount: number;
  prevRecordedDays: number;
  totalDaysInPeriod: number; // e.g. 7 or 30 or 90
  currentCompliance: number; // percentage based on RECORDED days
  prevCompliance: number;
  percentagePointsChange: number;
  trend: TrendStatus;
  hasComparisonData: boolean;
  dayOverDayTrend?: {
    status: DayOverDayTrend;
    latestDate: string;
    latestValue: number;
    previousDate: string;
    previousValue: number;
  } | null;
}

export interface CheckpointMetrics {
  todayRecordsCount: number;
  todayLastFormattedTime: string | null;
  todayAllFormattedTimes: string[];
  avgFormattedTime: string | null;
  earliestFormattedTime: string | null;
  latestFormattedTime: string | null;
  currentPeriodAvgMinutes: number | null;
  prevPeriodAvgMinutes: number | null;
  currentDaysWithData: number;
  prevDaysWithData: number;
  totalDaysInPeriod: number;
  minuteDiff: number | null;
  trend: TrendStatus;
  hasComparisonData: boolean;
}

export type PeriodRange = '7d' | '30d' | '90d';

export type ActiveTab = 'hoy' | 'progreso' | 'historial' | 'actividades';
