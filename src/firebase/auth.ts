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
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
      email: user.email,
      photoURL: user.photoURL || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    await setDoc(
      userRef,
      {
        displayName: user.displayName || userSnap.data()?.displayName || 'Usuario',
        email: user.email,
        photoURL: user.photoURL || userSnap.data()?.photoURL || null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
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
  try {
    const credential = await signInWithPopup(auth, googleProvider);
    if (credential.user) {
      await syncUserProfile(credential.user);
    }
    return credential.user;
  } catch (err: any) {
    console.error('Google Auth error in firebase/auth:', {
      code: err?.code,
      message: err?.message,
      name: err?.name,
      customData: err?.customData,
    });
    throw err;
  }
}

export async function logout() {
  await firebaseSignOut(auth);
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}
