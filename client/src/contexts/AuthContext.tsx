import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppSession, getSession, clearSession, saveSession } from '@/lib/store';

interface AuthContextType {
  session: AppSession | null;
  setSession: (s: AppSession | null) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  setSession: () => {},
  logout: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<AppSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const s = getSession();
    setSessionState(s);
    setIsLoading(false);
  }, []);

  const setSession = (s: AppSession | null) => {
    setSessionState(s);
    if (s) saveSession(s);
    else clearSession();
  };

  const logout = () => {
    clearSession();
    setSessionState(null);
  };

  return (
    <AuthContext.Provider value={{ session, setSession, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
