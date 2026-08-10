import {
  Activity,
  ActivityRecord,
  BooleanMetrics,
  CheckpointMetrics,
  CounterMetrics,
  TrendStatus,
} from '../types';
import {
  formatLocalTime,
  formatMinutesToTime,
  getTimeInMinutesFromMidnight,
  calculateCircularAverageMinutes,
  parseTimestampToDate,
} from './dates';

/**
 * Calculates counter metrics for an activity given records map (date -> total value).
 */
export function calculateCounterMetrics(
  activity: Activity,
  recordsByDate: Record<string, number>,
  todayStr: string,
  currentPeriodDates: string[],
  previousPeriodDates: string[]
): CounterMetrics {
  const todayHasRecord = todayStr in recordsByDate && recordsByDate[todayStr] !== undefined;
  const todayValue = todayHasRecord ? recordsByDate[todayStr] : null;

  // Sum and recorded days for current period
  let currentTotal = 0;
  let currentDaysWithData = 0;
  for (const date of currentPeriodDates) {
    if (date in recordsByDate && recordsByDate[date] !== undefined) {
      currentTotal += recordsByDate[date];
      currentDaysWithData++;
    }
  }

  // Sum and recorded days for previous period
  let prevTotal = 0;
  let prevDaysWithData = 0;
  for (const date of previousPeriodDates) {
    if (date in recordsByDate && recordsByDate[date] !== undefined) {
      prevTotal += recordsByDate[date];
      prevDaysWithData++;
    }
  }

  // Averages per RECORDED DAY
  const currentPeriodAvg = currentDaysWithData > 0 ? currentTotal / currentDaysWithData : 0;
  const prevPeriodAvg = prevDaysWithData > 0 ? prevTotal / prevDaysWithData : 0;

  // Overall daily average among days with data
  const totalDaysRecorded = currentDaysWithData + prevDaysWithData;
  const dailyAvg = totalDaysRecorded > 0 ? (currentTotal + prevTotal) / totalDaysRecorded : 0;

  const hasComparisonData = currentDaysWithData >= 2 && prevDaysWithData >= 2;

  let percentChange: number | null = null;
  if (hasComparisonData) {
    if (prevPeriodAvg > 0) {
      percentChange = Math.round(((currentPeriodAvg - prevPeriodAvg) / prevPeriodAvg) * 100);
    } else {
      percentChange = null; // No comparable base when previous average was 0
    }
  }

  // Determine trend status
  let trend: TrendStatus = 'SIN DATOS SUFICIENTES';

  if (!hasComparisonData) {
    trend = 'SIN DATOS SUFICIENTES';
  } else if (Math.abs(currentPeriodAvg - prevPeriodAvg) < 0.05) {
    trend = 'ESTABLE';
  } else {
    const isIncreasing = currentPeriodAvg > prevPeriodAvg;
    if (activity.direction === 'increase' || activity.direction === 'compliance') {
      trend = isIncreasing ? 'MEJORANDO' : 'EMPEORANDO';
    } else {
      // decrease direction (e.g. fewer sodas is better)
      trend = isIncreasing ? 'EMPEORANDO' : 'MEJORANDO';
    }
  }

  return {
    todayValue,
    dailyAvg: Number(dailyAvg.toFixed(1)),
    currentPeriodTotal: currentTotal,
    prevPeriodTotal: prevTotal,
    currentPeriodAvg: Number(currentPeriodAvg.toFixed(1)),
    prevPeriodAvg: Number(prevPeriodAvg.toFixed(1)),
    currentDaysWithData,
    prevDaysWithData,
    totalDaysInPeriod: currentPeriodDates.length,
    percentChange,
    trend,
    hasComparisonData,
  };
}

/**
 * Calculates boolean metrics for an activity given boolean records map (date -> boolean | null).
 */
export function calculateBooleanMetrics(
  activity: Activity,
  booleanRecordsByDate: Record<string, boolean | null>,
  todayStr: string,
  currentPeriodDates: string[],
  previousPeriodDates: string[]
): BooleanMetrics {
  const todayRecordExists = todayStr in booleanRecordsByDate && booleanRecordsByDate[todayStr] !== null;
  const todayValue = todayRecordExists ? booleanRecordsByDate[todayStr] : null;

  let currentTrueCount = 0;
  let currentRecordedDays = 0;
  for (const date of currentPeriodDates) {
    if (date in booleanRecordsByDate && booleanRecordsByDate[date] !== null) {
      currentRecordedDays++;
      if (booleanRecordsByDate[date] === true) {
        currentTrueCount++;
      }
    }
  }

  let prevTrueCount = 0;
  let prevRecordedDays = 0;
  for (const date of previousPeriodDates) {
    if (date in booleanRecordsByDate && booleanRecordsByDate[date] !== null) {
      prevRecordedDays++;
      if (booleanRecordsByDate[date] === true) {
        prevTrueCount++;
      }
    }
  }

  // Compliance calculated STRICTLY over recorded days
  const currentCompliance =
    currentRecordedDays > 0 ? Math.round((currentTrueCount / currentRecordedDays) * 100) : 0;
  const prevCompliance =
    prevRecordedDays > 0 ? Math.round((prevTrueCount / prevRecordedDays) * 100) : 0;

  const percentagePointsChange = currentCompliance - prevCompliance;
  const hasComparisonData = currentRecordedDays >= 2 && prevRecordedDays >= 2;

  let trend: TrendStatus = 'SIN DATOS SUFICIENTES';

  if (!hasComparisonData) {
    trend = 'SIN DATOS SUFICIENTES';
  } else if (Math.abs(percentagePointsChange) <= 2) {
    trend = 'ESTABLE';
  } else {
    const isIncreasing = currentCompliance > prevCompliance;
    if (activity.direction === 'decrease') {
      trend = isIncreasing ? 'EMPEORANDO' : 'MEJORANDO';
    } else {
      // increase or compliance
      trend = isIncreasing ? 'MEJORANDO' : 'EMPEORANDO';
    }
  }

  return {
    todayRecorded: todayRecordExists,
    todayValue,
    currentTrueCount,
    currentRecordedDays,
    prevTrueCount,
    prevRecordedDays,
    totalDaysInPeriod: currentPeriodDates.length,
    currentCompliance,
    prevCompliance,
    percentagePointsChange,
    trend,
    hasComparisonData,
  };
}

/**
 * Calculates checkpoint metrics given map of date -> array of checkpoint records.
 */
export function calculateCheckpointMetrics(
  activity: Activity,
  checkpointRecordsByDate: Record<string, ActivityRecord[]>,
  todayStr: string,
  currentPeriodDates: string[],
  previousPeriodDates: string[]
): CheckpointMetrics {
  const rawTodayRecords = checkpointRecordsByDate[todayStr] || [];
  const todayRecords = [...rawTodayRecords].sort(
    (a, b) => parseTimestampToDate(a.timestamp).getTime() - parseTimestampToDate(b.timestamp).getTime()
  );
  const todayRecordsCount = todayRecords.length;
  const todayAllFormattedTimes = todayRecords.map((r) => formatLocalTime(r.timestamp));
  const todayLastFormattedTime =
    todayAllFormattedTimes.length > 0
      ? todayAllFormattedTimes[todayAllFormattedTimes.length - 1]
      : null;

  const mode = activity.checkpointMode || 'single';

  // Extract minutes from midnight for current period
  const currentMinutesList: number[] = [];
  let currentDaysWithData = 0;

  for (const date of currentPeriodDates) {
    const rawDayRecords = checkpointRecordsByDate[date] || [];
    if (rawDayRecords.length > 0) {
      currentDaysWithData++;
      const sortedDayRecords = [...rawDayRecords].sort(
        (a, b) => parseTimestampToDate(a.timestamp).getTime() - parseTimestampToDate(b.timestamp).getTime()
      );
      if (mode === 'single') {
        // Use ONLY the LAST checkpoint record of the day as primary daily value
        const lastRecord = sortedDayRecords[sortedDayRecords.length - 1];
        currentMinutesList.push(getTimeInMinutesFromMidnight(lastRecord.timestamp));
      } else {
        // Multiple mode: include all checkpoint records of the day
        sortedDayRecords.forEach((r) => {
          currentMinutesList.push(getTimeInMinutesFromMidnight(r.timestamp));
        });
      }
    }
  }

  // Extract minutes from midnight for previous period
  const prevMinutesList: number[] = [];
  let prevDaysWithData = 0;

  for (const date of previousPeriodDates) {
    const rawDayRecords = checkpointRecordsByDate[date] || [];
    if (rawDayRecords.length > 0) {
      prevDaysWithData++;
      const sortedDayRecords = [...rawDayRecords].sort(
        (a, b) => parseTimestampToDate(a.timestamp).getTime() - parseTimestampToDate(b.timestamp).getTime()
      );
      if (mode === 'single') {
        // Use ONLY the LAST checkpoint record of the day as primary daily value
        const lastRecord = sortedDayRecords[sortedDayRecords.length - 1];
        prevMinutesList.push(getTimeInMinutesFromMidnight(lastRecord.timestamp));
      } else {
        // Multiple mode: include all checkpoint records of the day
        sortedDayRecords.forEach((r) => {
          prevMinutesList.push(getTimeInMinutesFromMidnight(r.timestamp));
        });
      }
    }
  }

  let avgFormattedTime: string | null = null;
  let earliestFormattedTime: string | null = null;
  let latestFormattedTime: string | null = null;
  let currentPeriodAvgMinutes: number | null = null;
  let prevPeriodAvgMinutes: number | null = null;

  if (currentMinutesList.length > 0) {
    const earliestMin = Math.min(...currentMinutesList);
    const latestMin = Math.max(...currentMinutesList);
    currentPeriodAvgMinutes = calculateCircularAverageMinutes(currentMinutesList);

    earliestFormattedTime = formatMinutesToTime(earliestMin);
    latestFormattedTime = formatMinutesToTime(latestMin);
    if (currentPeriodAvgMinutes !== null) {
      avgFormattedTime = formatMinutesToTime(currentPeriodAvgMinutes);
    }
  }

  if (prevMinutesList.length > 0) {
    prevPeriodAvgMinutes = calculateCircularAverageMinutes(prevMinutesList);
  }

  const hasComparisonData = currentDaysWithData >= 2 && prevDaysWithData >= 2;
  let minuteDiff: number | null = null;
  let trend: TrendStatus = 'SIN DATOS SUFICIENTES';

  if (
    hasComparisonData &&
    currentPeriodAvgMinutes !== null &&
    prevPeriodAvgMinutes !== null
  ) {
    // Circular signed difference in minutes (-720 to +720)
    minuteDiff =
      (((currentPeriodAvgMinutes - prevPeriodAvgMinutes + 720) % 1440 + 1440) % 1440) - 720;

    if (Math.abs(minuteDiff) <= 5) {
      trend = 'ESTABLE';
    } else {
      const isEarlier = minuteDiff < 0;
      if (activity.direction === 'earlier' || activity.direction === 'decrease') {
        trend = isEarlier ? 'MEJORANDO' : 'EMPEORANDO';
      } else if (activity.direction === 'later' || activity.direction === 'increase') {
        trend = isEarlier ? 'EMPEORANDO' : 'MEJORANDO';
      } else {
        trend = 'ESTABLE';
      }
    }
  }

  return {
    todayRecordsCount,
    todayLastFormattedTime,
    todayAllFormattedTimes,
    avgFormattedTime,
    earliestFormattedTime,
    latestFormattedTime,
    currentPeriodAvgMinutes,
    prevPeriodAvgMinutes,
    currentDaysWithData,
    prevDaysWithData,
    totalDaysInPeriod: currentPeriodDates.length,
    minuteDiff,
    trend,
    hasComparisonData,
  };
}
