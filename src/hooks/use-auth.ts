'use client';

import { useState, useEffect, useContext } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
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
    const userData = userDoc.data() as User;
    // Firestore timestamp needs to be converted
    if (userData.createdAt && typeof userData.createdAt !== 'string') {
        // @ts-ignore
        userData.createdAt = userData.createdAt.toDate().toISOString();
    }
    return userData;
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
      
      let userProfile = await getUserProfile(firebaseUser.uid);

      if (!userProfile) {
        // If profile doesn't exist, this might be a first-time login
        // for a pre-existing auth user. Let's create a profile.
        const mockUser = MOCK_USERS.find(u => u.email === email);
        const userDocRef = doc(db, 'users', firebaseUser.uid);

        if (mockUser) {
            const { password, ...userToCreate } = mockUser;
            const newProfile: User = {
                ...userToCreate,
                id: firebaseUser.uid,
                createdAt: new Date(userToCreate.createdAt).toISOString()
            };
            await setDoc(userDocRef, { ...newProfile, createdAt: new Date(newProfile.createdAt) });
            userProfile = newProfile;
        } else {
             const newProfile: User = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || email.split('@')[0],
                email: firebaseUser.email!,
                role: 'user', // default role
                loginCount: 1,
                createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, { ...newProfile, createdAt: serverTimestamp() });
            userProfile = newProfile;
        }
      } else {
        // Profile exists, so just update login count
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        await updateDoc(userDocRef, {
            loginCount: (userProfile.loginCount || 0) + 1
        });
        userProfile.loginCount = (userProfile.loginCount || 0) + 1;
      }

      setUser(userProfile);
      return userProfile;

    } catch (error: any) {
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
            throw new Error('Invalid email or password.');
        }
        throw error;
    }
    finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return { user, loading, login, logout };
}
