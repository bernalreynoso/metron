import { Activity, ActivityRecord } from '../types';

/**
 * Determines if an activity is considered "REALIZADA" (Completed) for today.
 *
 * Rules:
 * - Boolean (Sí/No):
 *   - 'Sí' (true) -> REALIZADA (Moves to Realizadas tab)
 *   - 'No' (false) -> PENDIENTE (Stays in Pending view for review)
 *   - 'Sin registro' (null) -> PENDIENTE
 *
 * - Checkpoint (Single or Multiple):
 *   - Registered (at least 1 timestamp today) -> REALIZADA
 *   - Sin registro (0 timestamps) -> PENDIENTE
 *
 * - Counter:
 *   - Registered (value is not null, including explicit 0) -> REALIZADA
 *   - Sin registro (null) -> PENDIENTE
 */
export function isActivityCompletedToday(
  act: Activity,
  todayBooleanMap: Record<string, boolean | null>,
  todayCheckpointMap: Record<string, ActivityRecord[]>,
  todayCounterMap?: Record<string, number | null>
): boolean {
  if (act.type === 'boolean') {
    return todayBooleanMap[act.id] === true;
  }
  if (act.type === 'checkpoint') {
    const recs = todayCheckpointMap[act.id] || [];
    return recs.length > 0;
  }
  if (act.type === 'counter') {
    if (!todayCounterMap) return false;
    const val = todayCounterMap[act.id];
    return val !== undefined && val !== null;
  }
  return false;
}
