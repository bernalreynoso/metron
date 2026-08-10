import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Activity, ActivityDirection, ActivityType } from '../types';

const DEFAULT_ACTIVITIES_WITH_IDS = [
  {
    id: 'default_refresco',
    name: 'Tomar refresco',
    description: 'Registro de consumo de bebidas azucaradas o gaseosas.',
    icon: 'CupSoda',
    type: 'counter',
    direction: 'decrease',
    active: true,
    order: 1,
  },
  {
    id: 'default_leer',
    name: 'Leer',
    description: 'Lectura diaria de libros, artículos o documentos de valor.',
    icon: 'BookOpen',
    type: 'boolean',
    direction: 'increase',
    active: true,
    order: 2,
  },
  {
    id: 'default_dormir',
    name: 'Dormir temprano',
    description: 'Ir a descansar a una hora adecuada para asegurar recuperación.',
    icon: 'Moon',
    type: 'boolean',
    direction: 'increase',
    active: true,
    order: 3,
  },
  {
    id: 'default_trabajo',
    name: 'Llegar bien al trabajo',
    description: 'Cumplir con el horario y preparar la jornada con tranquilidad.',
    icon: 'Building',
    type: 'boolean',
    direction: 'compliance',
    active: true,
    order: 4,
  },
] as const;

export function subscribeActivities(
  userId: string,
  callback: (activities: Activity[]) => void,
  onError?: (error: Error) => void
) {
  const activitiesRef = collection(db, 'users', userId, 'activities');
  const q = query(activitiesRef, orderBy('order', 'asc'));

  return onSnapshot(
    q,
    async (snapshot) => {
      const activities: Activity[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Activity[];

      if (activities.length === 0 && !snapshot.metadata.hasPendingWrites) {
        // Seed default activities for new users idempotently with deterministic doc IDs
        await seedDefaultActivities(userId);
      } else {
        callback(activities);
      }
    },
    (error) => {
      console.error('Error loading activities:', error);
      if (onError) onError(error);
    }
  );
}

export async function seedDefaultActivities(userId: string) {
  const batch = writeBatch(db);
  DEFAULT_ACTIVITIES_WITH_IDS.forEach((act) => {
    const docRef = doc(db, 'users', userId, 'activities', act.id);
    batch.set(
      docRef,
      {
        name: act.name,
        description: act.description,
        icon: act.icon,
        type: act.type,
        direction: act.direction,
        active: act.active,
        order: act.order,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
  await batch.commit();
}

/**
 * Checks if an activity has any recorded data in Firestore to prevent type mutation.
 */
export async function hasActivityRecords(userId: string, activityId: string): Promise<boolean> {
  const recordsRef = collection(db, 'users', userId, 'records');
  const q = query(recordsRef, where('activityId', '==', activityId));
  const snap = await getDocs(q);
  return !snap.empty;
}

export async function createActivity(
  userId: string,
  activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>
) {
  const activitiesRef = collection(db, 'users', userId, 'activities');
  return await addDoc(activitiesRef, {
    ...activity,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateActivity(
  userId: string,
  activityId: string,
  updates: Partial<Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>>
) {
  const activityRef = doc(db, 'users', userId, 'activities', activityId);
  return await updateDoc(activityRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function toggleActivityActive(userId: string, activityId: string, active: boolean) {
  return await updateActivity(userId, activityId, { active });
}

export async function deleteActivityPermanently(userId: string, activityId: string) {
  const hasRecords = await hasActivityRecords(userId, activityId);
  if (hasRecords) {
    throw new Error(
      'No se puede eliminar permanentemente esta actividad porque posee registros históricos. Puedes desactivarla para ocultarla de la pantalla de hoy.'
    );
  }
  const activityRef = doc(db, 'users', userId, 'activities', activityId);
  return await deleteDoc(activityRef);
}
