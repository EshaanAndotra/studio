'use client';

import { useState, useEffect, useContext } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
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
  signUp: (name: string, email: string, password: string, role: 'user' | 'admin') => Promise<User>;
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
      createdAt: userData.createdAt?.toDate().toISOString() ?? new Date().toISOString(),
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

      if (userProfile) {
        // Profile exists, so update login count
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const newLoginCount = (userProfile.loginCount || 0) + 1;
        await updateDoc(userDocRef, {
            loginCount: newLoginCount,
        });
        userProfile.loginCount = newLoginCount;
      } else {
        // This case is unlikely if signUp is used, but as a fallback:
         userProfile = await createUserProfile(firebaseUser, firebaseUser.displayName || email.split('@')[0], 'user', 1);
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
        throw new Error(error.message || 'An unknown error occurred during login.');
    }
    finally {
      setLoading(false);
    }
  };

  const signUp = async (name: string, email: string, password: string, role: 'user' | 'admin'): Promise<User> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update Firebase Auth profile
      await updateProfile(firebaseUser, { displayName: name });

      // Create user profile in Firestore
      const userProfile = await createUserProfile(firebaseUser, name, role);
      
      setUser(userProfile);
      return userProfile;

    } catch (error: any)
{
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered. Please sign in or use a different email.');
      }
      if (error.code === 'auth/weak-password') {
        throw new Error('The password is too weak. Please use at least 6 characters.');
      }
      throw new Error(error.message || 'An unknown error occurred during sign up.');
    } finally {
      setLoading(false);
    }
  }

  const createUserProfile = async (firebaseUser: FirebaseUser, name: string, role: 'user' | 'admin', initialLoginCount = 1): Promise<User> => {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const newUserProfile: User = {
          id: firebaseUser.uid,
          name: name,
          email: firebaseUser.email!,
          role: role,
          loginCount: initialLoginCount,
          createdAt: new Date().toISOString(),
      };
      // Use serverTimestamp() for Firestore, but keep ISO string for the local object
      await setDoc(userDocRef, { ...newUserProfile, createdAt: serverTimestamp(), lastLogin: serverTimestamp() });
      return newUserProfile;
  }

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return { user, loading, login, signUp, logout };
}
