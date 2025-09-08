'use client';

import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/components/auth-provider';
import { MOCK_USERS, type User } from '@/lib/auth';

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

export function useAuthHook(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('m-health-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage', error);
      localStorage.removeItem('m-health-user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    // Simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const foundUser = MOCK_USERS.find(
          (u) => u.email === email && u.password === password
        );
        if (foundUser) {
          const userToStore = {
            id: foundUser.id,
            name: foundUser.name,
            email: foundUser.email,
            role: foundUser.role,
            // loginCount and createdAt are not part of the user session object
          };
          localStorage.setItem('m-health-user', JSON.stringify(userToStore));
          setUser(userToStore as User);
          setLoading(false);
          resolve(userToStore as User);
        } else {
          setLoading(false);
          reject(new Error('Invalid email or password.'));
        }
      }, 500);
    });
  };

  const logout = () => {
    localStorage.removeItem('m-health-user');
    setUser(null);
  };

  return { user, loading, login, logout };
}
