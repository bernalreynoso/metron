import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { ActivityList, Activity } from '../types';

export function subscribeLists(
  userId: string,
  callback: (lists: ActivityList[]) => void,
  onError?: (error: Error) => void
) {
  const listsRef = collection(db, 'users', userId, 'lists');
  const q = query(listsRef, orderBy('order', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const lists: ActivityList[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as ActivityList[];
      callback(lists);
    },
    (error) => {
      console.error('Error loading lists:', error);
      if (onError) onError(error);
    }
  );
}

export async function createList(
  userId: string,
  listData: Omit<ActivityList, 'id' | 'createdAt' | 'updatedAt'>
) {
  const listsRef = collection(db, 'users', userId, 'lists');
  return await addDoc(listsRef, {
    ...listData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateList(
  userId: string,
  listId: string,
  updates: Partial<Omit<ActivityList, 'id' | 'createdAt' | 'updatedAt'>>
) {
  const listRef = doc(db, 'users', userId, 'lists', listId);
  return await updateDoc(listRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteListSafely(
  userId: string,
  listId: string,
  activities: Activity[],
  updateActivityFn: (actId: string, updates: Partial<Activity>) => Promise<void>
) {
  // First, unassign any activity that belongs to this list
  const activitiesInList = activities.filter((a) => a.listId === listId);
  for (const act of activitiesInList) {
    await updateActivityFn(act.id, { listId: null });
  }

  // Then delete the list document
  const listRef = doc(db, 'users', userId, 'lists', listId);
  return await deleteDoc(listRef);
}

export const PRESET_LIST_SUGGESTIONS = [
  { name: 'Transporte', icon: 'Bus', description: 'Traslados, transporte público, trayectos' },
  { name: 'Casa', icon: 'Home', description: 'Rutinas del hogar y tareas domésticas' },
  { name: 'Trabajo', icon: 'Briefcase', description: 'Jornada laboral y oficina' },
  { name: 'Escuela', icon: 'GraduationCap', description: 'Estudio, clases y aprendizaje' },
  { name: 'Ejercicio', icon: 'Dumbbell', description: 'Entrenamiento, deporte y actividad física' },
  { name: 'Alimentación', icon: 'Utensils', description: 'Comidas, hidratación y nutrición' },
  { name: 'Salud', icon: 'Heart', description: 'Cuidado personal, medicamentos y bienestar' },
  { name: 'Finanzas', icon: 'DollarSign', description: 'Gastos, ahorro y presupuestos' },
  { name: 'Desarrollo personal', icon: 'Brain', description: 'Lectura, hábitos y crecimiento' },
  { name: 'Espiritualidad', icon: 'Sparkles', description: 'Meditación, reflexión y calma' },
];
