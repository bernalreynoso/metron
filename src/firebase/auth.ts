import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from './config';

export async function syncUserProfile(user: User) {
  if (!user) return;
  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    const detectedTimezone =
      typeof Intl !== 'undefined' && Intl.DateTimeFormat
        ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
        : 'UTC';

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
        email: user.email,
        photoURL: user.photoURL || null,
        timezone: detectedTimezone,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const data = userSnap.data();
      const updates: Record<string, any> = {
        displayName: user.displayName || data?.displayName || 'Usuario',
        email: user.email,
        photoURL: user.photoURL || data?.photoURL || null,
        updatedAt: serverTimestamp(),
      };

      // Si el usuario aún no tiene guardada una zona horaria, se establece la detectada
      if (!data?.timezone) {
        updates.timezone = detectedTimezone;
      }

      await setDoc(userRef, updates, { merge: true });
    }
  } catch (err: any) {
    console.error('Firestore profile sync error:', {
      code: err?.code,
      message: err?.message,
      name: err?.name,
    });
  }
}

export async function registerWithEmail(email: string, pass: string, displayName: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName && credential.user) {
    await updateProfile(credential.user, { displayName });
  }
  await syncUserProfile(credential.user);
  return credential.user;
}

export async function loginWithEmail(email: string, pass: string) {
  const credential = await signInWithEmailAndPassword(auth, email, pass);
  await syncUserProfile(credential.user);
  return credential.user;
}

export async function loginWithGoogle() {
  console.log('METRON AUTH 1: iniciando Google popup');
  const credential = await signInWithPopup(auth, googleProvider);
  console.log('METRON AUTH 2: popup completado', {
    uid: credential.user?.uid
  });
  if (credential.user) {
    console.log('METRON AUTH 3: usuario recibido', credential.user.uid);
    console.log('METRON AUTH 4: sincronización de perfil');
    await syncUserProfile(credential.user);
  } else {
    console.warn('METRON AUTH 3: sin usuario en credential');
  }
  return credential.user;
}

export async function logout() {
  await firebaseSignOut(auth);
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}
