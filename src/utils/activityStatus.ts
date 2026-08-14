import { Activity, ActivityRecord } from '../types';

/**
 * Determines if an activity is considered "REALIZADA" (Completed) for today.
 *
 * Rules (METRON Part 16):
 * - Boolean (Sí/No):
 *   - 'Sí' (true) -> REALIZADA (Moves to Realizadas tab)
 *   - 'No' (false) -> PENDIENTE (Stays in Pending view for review)
 *   - 'Sin registro' (null) -> PENDIENTE
 *
 * - Checkpoint Single (checkpointMode === 'single'):
 *   - Registered (at least 1 timestamp today) -> REALIZADA
 *   - Sin registro -> PENDIENTE
 *
 * - Checkpoint Multiple (checkpointMode === 'multiple'):
 *   - Registered or Sin registro -> PENDIENTE (Stays available for logging more times)
 *
 * - Counter:
 *   - Any value or Sin registro -> PENDIENTE (Stays available for incrementing/decrementing)
 */
export function isActivityCompletedToday(
  act: Activity,
  todayBooleanMap: Record<string, boolean | null>,
  todayCheckpointMap: Record<string, ActivityRecord[]>
): boolean {
  if (act.type === 'boolean') {
    return todayBooleanMap[act.id] === true;
  }
  if (act.type === 'checkpoint') {
    if (act.checkpointMode === 'single') {
      const recs = todayCheckpointMap[act.id] || [];
      return recs.length > 0;
    }
    return false;
  }
  if (act.type === 'counter') {
    return false;
  }
  return false;
}
