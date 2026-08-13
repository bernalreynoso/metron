import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { logout as apiLogout, syncUserProfile } from '../firebase/auth';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  timezone: string;
  loading: boolean;
  logoutUser: () => Promise<void>;
}

const defaultTimezone =
  typeof Intl !== 'undefined' && Intl.DateTimeFormat
    ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    : 'UTC';

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  timezone: defaultTimezone,
  loading: true,
  logoutUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubSnapshot: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('METRON AUTH 5: onAuthStateChanged detectó usuario:', currentUser?.uid || 'null');
      setUser(currentUser);

      if (unsubSnapshot) {
        unsubSnapshot();
        unsubSnapshot = null;
      }

      if (currentUser) {
        try {
          await syncUserProfile(currentUser);
        } catch (err) {
          console.error('Error syncing user profile:', err);
        }

        const userRef = doc(db, 'users', currentUser.uid);
        unsubSnapshot = onSnapshot(
          userRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setUserProfile({
                uid: currentUser.uid,
                displayName: data.displayName || currentUser.displayName || null,
                email: data.email || currentUser.email || null,
                photoURL: data.photoURL || currentUser.photoURL || null,
                timezone: data.timezone || defaultTimezone,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
              });
            }
          },
          (error) => {
            console.error('Error listening to user profile:', error);
          }
        );
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubSnapshot) {
        unsubSnapshot();
      }
    };
  }, []);

  const logoutUser = async () => {
    await apiLogout();
  };

  const timezone = userProfile?.timezone || defaultTimezone;

  return (
    <AuthContext.Provider value={{ user, userProfile, timezone, loading, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
