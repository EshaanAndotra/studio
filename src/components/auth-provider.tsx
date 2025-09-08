'use client';

import { createContext, type ReactNode } from 'react';
import { useAuthHook, type UseAuthReturn } from '@/hooks/use-auth';

export const AuthContext = createContext<UseAuthReturn | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthHook();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}
