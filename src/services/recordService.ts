import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
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
import { ActivityRecord } from '../types';

/**
 * Subscribes to all records of a user for a given date range (or all records if range omitted).
 */
export function subscribeRecordsByDateRange(
  userId: string,
  startDate: string,
  endDate: string,
  callback: (records: ActivityRecord[]) => void,
  onError?: (error: Error) => void
) {
  const recordsRef = collection(db, 'users', userId, 'records');
  const q = query(
    recordsRef,
    where('date', '>=', startDate),
    where('date', '<=', endDate)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const records: ActivityRecord[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as ActivityRecord[];
      callback(records);
    },
    (error) => {
      console.error('Error fetching records:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Subscribes to records for a single specific date directly from Firestore.
 */
export function subscribeRecordsByDate(
  userId: string,
  date: string,
  callback: (records: ActivityRecord[]) => void,
  onError?: (error: Error) => void
) {
  const recordsRef = collection(db, 'users', userId, 'records');
  const q = query(recordsRef, where('date', '==', date));

  return onSnapshot(
    q,
    (snapshot) => {
      const records: ActivityRecord[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as ActivityRecord[];
      callback(records);
    },
    (error) => {
      console.error('Error fetching records for date:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Adds a counter increment event (+1).
 */
export async function addCounterIncrement(userId: string, activityId: string, date: string) {
  const recordsRef = collection(db, 'users', userId, 'records');
  return await addDoc(recordsRef, {
    activityId,
    date,
    type: 'counter',
    value: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Handles counter decrement (-1) safely by removing the latest positive record for that date
 * and ensuring the total counter value never drops below 0.
 */
export async function addCounterDecrement(userId: string, activityId: string, date: string) {
  const recordsRef = collection(db, 'users', userId, 'records');
  const q = query(
    recordsRef,
    where('activityId', '==', activityId),
    where('date', '==', date)
  );
  const snap = await getDocs(q);

  if (snap.empty) return;

  // Calculate current net total
  let currentTotal = 0;
  snap.docs.forEach((d) => {
    currentTotal += Number(d.data().value || 0);
  });

  if (currentTotal <= 0) {
    // Cannot decrement below 0
    return;
  }

  // Filter positive docs with value = 1
  const positiveDocs = snap.docs.filter((d) => Number(d.data().value) === 1);
  if (positiveDocs.length === 0) return;

  // Sort by createdAt / updatedAt timestamp ascending
  positiveDocs.sort((a, b) => {
    const dataA = a.data();
    const dataB = b.data();
    const getTime = (data: any) => {
      if (data.createdAt?.toMillis && typeof data.createdAt.toMillis === 'function') {
        return data.createdAt.toMillis();
      }
      if (data.updatedAt?.toMillis && typeof data.updatedAt.toMillis === 'function') {
        return data.updatedAt.toMillis();
      }
      return Date.now();
    };
    return getTime(dataA) - getTime(dataB);
  });

  // Delete the latest positive record (last item after sorting)
  const docToDelete = positiveDocs[positiveDocs.length - 1];
  return await deleteDoc(doc(db, 'users', userId, 'records', docToDelete.id));
}

/**
 * Sets an explicit counter record with value 0 for a specific activity and date.
 * Uses a deterministic doc ID: `${activityId}_${date}_zero`.
 * If the record already exists, updates it without duplicating.
 */
export async function setCounterZeroRecord(
  userId: string,
  activityId: string,
  date: string
) {
  const docId = `${activityId}_${date}_zero`;
  const docRef = doc(db, 'users', userId, 'records', docId);

  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return await updateDoc(docRef, {
      value: 0,
      updatedAt: serverTimestamp(),
    });
  } else {
    return await setDoc(docRef, {
      activityId,
      date,
      type: 'counter',
      value: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

/**
 * Clears the explicit counter record with value 0 for a specific activity and date if it exists.
 */
export async function clearCounterZeroRecord(
  userId: string,
  activityId: string,
  date: string
) {
  const docId = `${activityId}_${date}_zero`;
  const docRef = doc(db, 'users', userId, 'records', docId);
  return await deleteDoc(docRef);
}

/**
 * Sets boolean record value for a specific activity and date using a deterministic doc ID.
 * Document ID format: `${activityId}_${date}`
 * If value is null, deletes record (returns to "unrecorded" / "Sin registro").
 * Preserves createdAt when modifying an existing document.
 */
export async function setBooleanRecord(
  userId: string,
  activityId: string,
  date: string,
  value: boolean | null
) {
  const docId = `${activityId}_${date}`;
  const docRef = doc(db, 'users', userId, 'records', docId);

  if (value === null) {
    // Delete record for this activity and date if it exists
    return await deleteDoc(docRef);
  }

  const snap = await getDoc(docRef);
  if (snap.exists()) {
    // Existing record: preserve createdAt and update value + updatedAt
    return await updateDoc(docRef, {
      value,
      updatedAt: serverTimestamp(),
    });
  } else {
    // New record: set initial fields including createdAt
    return await setDoc(docRef, {
      activityId,
      date,
      type: 'boolean',
      value,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

/**
 * Clears all records for a specific activity and date (used in History editing).
 */
export async function clearRecordsForActivityAndDate(
  userId: string,
  activityId: string,
  date: string
) {
  const recordsRef = collection(db, 'users', userId, 'records');
  const q = query(
    recordsRef,
    where('activityId', '==', activityId),
    where('date', '==', date)
  );
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  return await batch.commit();
}

/**
 * Adds a checkpoint record with serverTimestamp() or a custom Date timestamp.
 */
export async function addCheckpointRecord(
  userId: string,
  activityId: string,
  date: string,
  customTimestamp?: Date
) {
  const recordsRef = collection(db, 'users', userId, 'records');
  return await addDoc(recordsRef, {
    activityId,
    date,
    type: 'checkpoint',
    timestamp: customTimestamp || serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Updates an existing checkpoint record's timestamp (e.g. editing time in History).
 */
export async function updateCheckpointRecordTime(
  userId: string,
  recordId: string,
  newTimestamp: Date
) {
  const recordRef = doc(db, 'users', userId, 'records', recordId);
  return await updateDoc(recordRef, {
    timestamp: newTimestamp,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Deletes a single specific checkpoint record.
 */
export async function deleteCheckpointRecord(userId: string, recordId: string) {
  const recordRef = doc(db, 'users', userId, 'records', recordId);
  return await deleteDoc(recordRef);
}
