/**
 * Date utility functions for local timezone safety in METRON.
 */

/**
 * Returns YYYY-MM-DD for a given Date in the specified timezone or user's LOCAL timezone.
 */
export function getLocalDateString(date: Date = new Date(), timezone?: string): string {
  if (timezone) {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const parts = formatter.formatToParts(date);
      const year = parts.find((p) => p.type === 'year')?.value;
      const month = parts.find((p) => p.type === 'month')?.value;
      const day = parts.find((p) => p.type === 'day')?.value;
      if (year && month && day) {
        return `${year}-${month}-${day}`;
      }
    } catch (e) {
      console.warn(`Invalid timezone "${timezone}", falling back to local:`, e);
    }
  }

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
export function getPastNDays(
  n: number,
  endDateStr: string = getLocalDateString(),
  timezone?: string
): string[] {
  const result: string[] = [];
  const baseDate = parseLocalDate(endDateStr);

  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - i);
    result.push(getLocalDateString(d, timezone));
  }
  return result;
}

/**
 * Returns date range strings for comparison:
 * e.g., current 7 days vs previous 7 days, or current 30 days vs previous 30 days.
 */
export function getComparisonPeriodDates(
  periodDays: number,
  endDateStr: string = getLocalDateString(),
  timezone?: string
): { currentPeriod: string[]; previousPeriod: string[] } {
  const currentPeriod = getPastNDays(periodDays, endDateStr, timezone);
  
  const baseDate = parseLocalDate(endDateStr);
  const prevPeriodEndDate = new Date(baseDate);
  prevPeriodEndDate.setDate(baseDate.getDate() - periodDays);
  
  const previousPeriod = getPastNDays(
    periodDays,
    getLocalDateString(prevPeriodEndDate, timezone),
    timezone
  );
  
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
export function getTimeInMinutesFromMidnight(timestampOrDate: any, timezone?: string): number {
  const date = parseTimestampToDate(timestampOrDate);
  if (timezone) {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
        hourCycle: 'h23',
      });
      const parts = formatter.formatToParts(date);
      const hourStr = parts.find((p) => p.type === 'hour')?.value ?? '0';
      const minuteStr = parts.find((p) => p.type === 'minute')?.value ?? '0';
      const hours = parseInt(hourStr, 10) % 24;
      const minutes = parseInt(minuteStr, 10);
      return hours * 60 + minutes;
    } catch (e) {
      console.warn(`Invalid timezone "${timezone}", falling back to local:`, e);
    }
  }
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * Formats a timestamp into local readable time (e.g. "4:03 PM" or "16:03").
 */
export function formatLocalTime(timestampOrDate: any, timezone?: string): string {
  if (!timestampOrDate) return 'Sin registrar';
  const date = parseTimestampToDate(timestampOrDate);
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...(timezone ? { timeZone: timezone } : {}),
  };
  return date.toLocaleTimeString('es-ES', options);
}

/**
 * Formats 24h time string HH:mm for HTML time input.
 */
export function formatTimeForInput(timestampOrDate: any, timezone?: string): string {
  const date = parseTimestampToDate(timestampOrDate);
  if (timezone) {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        hourCycle: 'h23',
      });
      const parts = formatter.formatToParts(date);
      const hours = parts.find((p) => p.type === 'hour')?.value.padStart(2, '0') ?? '00';
      const minutes = parts.find((p) => p.type === 'minute')?.value.padStart(2, '0') ?? '00';
      return `${hours}:${minutes}`;
    } catch (e) {
      console.warn(`Invalid timezone "${timezone}", falling back to local:`, e);
    }
  }
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

/**
 * Builds a Date object representing the given date string (YYYY-MM-DD) and time string (HH:mm)
 * in the specified IANA timezone (or local time if no timezone is provided).
 */
export function buildDateInTimezone(
  dateStr: string,
  timeStr: string,
  timezone?: string
): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);

  if (!timezone) {
    return new Date(year, month - 1, day, hours, minutes, 0, 0);
  }

  try {
    const targetUtc = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);
    const getOffset = (date: Date) => {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
        hourCycle: 'h23',
      });
      const parts = formatter.formatToParts(date);
      const y = parseInt(parts.find((p) => p.type === 'year')?.value ?? '0', 10);
      const m = parseInt(parts.find((p) => p.type === 'month')?.value ?? '1', 10);
      const d = parseInt(parts.find((p) => p.type === 'day')?.value ?? '1', 10);
      const h = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10) % 24;
      const min = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
      const s = parseInt(parts.find((p) => p.type === 'second')?.value ?? '0', 10);
      return Date.UTC(y, m - 1, d, h, min, s) - date.getTime();
    };

    let result = new Date(targetUtc - getOffset(new Date(targetUtc)));
    const offset2 = getOffset(result);
    result = new Date(targetUtc - offset2);
    return result;
  } catch (e) {
    console.warn(`Invalid timezone "${timezone}", falling back to local date construction:`, e);
    return new Date(year, month - 1, day, hours, minutes, 0, 0);
  }
}
