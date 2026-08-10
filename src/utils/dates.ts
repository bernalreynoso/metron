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
