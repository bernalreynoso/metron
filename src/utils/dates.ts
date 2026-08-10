/**
 * Date utility functions for local timezone safety in METRON.
 */

/**
 * Returns YYYY-MM-DD for a given Date in the user's LOCAL timezone.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses YYYY-MM-DD string into a local Date object.
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Formats YYYY-MM-DD into readable Spanish format, e.g., "Domingo, 9 de Agosto".
 */
export function formatSpanishDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = parseLocalDate(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  };
  const formatted = date.toLocaleDateString('es-ES', options);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/**
 * Returns an array of YYYY-MM-DD date strings for the past N days ending at `endDateStr`.
 */
export function getPastNDays(n: number, endDateStr: string = getLocalDateString()): string[] {
  const result: string[] = [];
  const baseDate = parseLocalDate(endDateStr);

  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - i);
    result.push(getLocalDateString(d));
  }
  return result;
}

/**
 * Returns date range strings for comparison:
 * e.g., current 7 days vs previous 7 days, or current 30 days vs previous 30 days.
 */
export function getComparisonPeriodDates(
  periodDays: number,
  endDateStr: string = getLocalDateString()
): { currentPeriod: string[]; previousPeriod: string[] } {
  const currentPeriod = getPastNDays(periodDays, endDateStr);
  
  const baseDate = parseLocalDate(endDateStr);
  const prevPeriodEndDate = new Date(baseDate);
  prevPeriodEndDate.setDate(baseDate.getDate() - periodDays);
  
  const previousPeriod = getPastNDays(periodDays, getLocalDateString(prevPeriodEndDate));
  
  return { currentPeriod, previousPeriod };
}

/**
 * Formats a short day/month for charts, e.g. "9 Ago", "10 Ago".
 */
export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = parseLocalDate(dateStr);
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${date.getDate()} ${monthNames[date.getMonth()]}`;
}

/**
 * Extracts JS Date object safely from Firestore Timestamp, Date, number, or string.
 */
export function parseTimestampToDate(timestampOrDate: any): Date {
  if (!timestampOrDate) return new Date();
  if (timestampOrDate?.toDate && typeof timestampOrDate.toDate === 'function') {
    return timestampOrDate.toDate();
  }
  if (timestampOrDate?.seconds !== undefined) {
    return new Date(timestampOrDate.seconds * 1000);
  }
  if (timestampOrDate instanceof Date) {
    return timestampOrDate;
  }
  if (typeof timestampOrDate === 'number') {
    return new Date(timestampOrDate);
  }
  if (typeof timestampOrDate === 'string') {
    const parsed = new Date(timestampOrDate);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

/**
 * Returns time in minutes from midnight (0 - 1439) for a given timestamp or Date.
 */
export function getTimeInMinutesFromMidnight(timestampOrDate: any): number {
  const date = parseTimestampToDate(timestampOrDate);
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * Formats a timestamp into local readable time (e.g. "4:03 PM" or "16:03").
 */
export function formatLocalTime(timestampOrDate: any): string {
  if (!timestampOrDate) return 'Sin registrar';
  const date = parseTimestampToDate(timestampOrDate);
  return date.toLocaleTimeString('es-ES', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Formats 24h time string HH:mm for HTML time input.
 */
export function formatTimeForInput(timestampOrDate: any): string {
  const date = parseTimestampToDate(timestampOrDate);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Converts total minutes from midnight into formatted local time (e.g. "4:03 PM").
 */
export function formatMinutesToTime(totalMinutes: number): string {
  const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.toLocaleTimeString('es-ES', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Calculates the circular average of time-of-day minutes (0-1439).
 * Correctly handles midnight crossing (e.g. 23:50, 00:10, 00:30 => ~00:10).
 */
export function calculateCircularAverageMinutes(minutesList: number[]): number | null {
  if (minutesList.length === 0) return null;
  let sumSin = 0;
  let sumCos = 0;
  for (const m of minutesList) {
    const angle = (m * 2 * Math.PI) / 1440;
    sumSin += Math.sin(angle);
    sumCos += Math.cos(angle);
  }
  let avgAngle = Math.atan2(sumSin, sumCos);
  if (avgAngle < 0) {
    avgAngle += 2 * Math.PI;
  }
  const avgMinutes = Math.round((avgAngle * 1440) / (2 * Math.PI)) % 1440;
  return avgMinutes;
}
