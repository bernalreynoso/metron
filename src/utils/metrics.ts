import { Activity, BooleanMetrics, CounterMetrics, TrendStatus } from '../types';

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
