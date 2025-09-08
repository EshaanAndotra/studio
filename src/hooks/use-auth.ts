'use client';

import { useState, useEffect, useContext } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseAuthUser,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { AuthContext } from '@/components/auth-provider';
import { MOCK_USERS, type User } from '@/lib/auth';
import { auth, db } from '@/lib/firebase';

export type UseAuthReturn = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
};

export function useAuth(): UseAuthReturn {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

async function getUserProfile(uid: string): Promise<User | null> {
  const userDocRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userDocRef);
  if (userDoc.exists()) {
    return userDoc.data() as User;
  }
  // This part is for seeding the mock user data into Firestore
  const mockUser = MOCK_USERS.find((u) => u.id === uid);
  if (mockUser) {
    const { password, ...userToCreate } = mockUser;
    await setDoc(userDocRef, { ...userToCreate, createdAt: serverTimestamp() });
    return mockUser as User;
  }

  return null;
}

export function useAuthHook(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userProfile = await getUserProfile(firebaseUser.uid);
        setUser(userProfile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      // Seed mock data for initial login
      const mockUser = MOCK_USERS.find(u => u.email === email);
      if(mockUser && mockUser.id !== firebaseUser.uid) {
        // This is a bit of a hack to link mock user ID to firebase UID
        // In a real app, user creation would handle this.
         const userDocRef = doc(db, 'users', firebaseUser.uid);
         const { password, ...userToCreate } = mockUser;
         await setDoc(userDocRef, { ...userToCreate, id: firebaseUser.uid, createdAt: new Date(userToCreate.createdAt) });
      }


      const userProfile = await getUserProfile(firebaseUser.uid);
      if (!userProfile) {
        throw new Error('User profile not found.');
      }
      setUser(userProfile);
      return userProfile;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return { user, loading, login, logout };
}
