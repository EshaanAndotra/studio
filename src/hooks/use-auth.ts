'use client';

import { useState, useEffect, useContext } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { AuthContext } from '@/components/auth-provider';
import { type User } from '@/lib/auth';
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
    const userData = userDoc.data();
    // Firestore timestamp needs to be converted
    return {
      id: userDoc.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      loginCount: userData.loginCount,
      createdAt: userData.createdAt.toDate().toISOString(),
    };
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
        // If profile doesn't exist, create it in Firestore.
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const newProfile: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || email.split('@')[0],
            email: firebaseUser.email!,
            role: email === 'admin@mhealth.com' ? 'admin' : 'user', // Assign role based on email for seeding
            loginCount: 1,
            createdAt: new Date().toISOString(),
        };
        // Use serverTimestamp() for Firestore, but keep ISO string for the object
        await setDoc(userDocRef, { ...newProfile, createdAt: serverTimestamp() });
        userProfile = newProfile;
        
      } else {
        // Profile exists, so just update login count
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const newLoginCount = (userProfile.loginCount || 0) + 1;
        await updateDoc(userDocRef, {
            loginCount: newLoginCount,
        });
        userProfile.loginCount = newLoginCount;
      }

      setUser(userProfile);
      return userProfile;

    } catch (error: any) {
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            throw new Error('Invalid email or password.');
        }
        if (error.code === 'auth/too-many-requests') {
            throw new Error('Too many login attempts. Please try again later.');
        }
        // Rethrow other errors
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
