import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { setApiToken, loginUser, logoutUser } from '@/lib/api';

// ─── Helper: persisted token storage ───────────────────────
const TOKEN_KEY = 'z_erp_session';

function persistSession(session: Session | null) {
  if (session) {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function loadPersistedSession(): Session | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

// ─── Context type ──────────────────────────────────────────
type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  login: async () => ({}),
  logout: async () => { },
});

// ─── Provider ──────────────────────────────────────────────
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount – ALWAYS clear existing session to force fresh login
  useEffect(() => {
    localStorage.removeItem(TOKEN_KEY);
    setSession(null);
    setUser(null);
    setLoading(false);
  }, []);

  // ── Login ──────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    const { data, error } = await loginUser(email, password);

    if (error) return { error };

    setSession(data!.session as unknown as Session);
    setUser(data!.user as unknown as User);
    setApiToken(data!.session.access_token);
    return {};
  }, []);

  // ── Logout ─────────────────────────────────────────────
  const logout = useCallback(async () => {
    // setApiToken must be set before calling logoutUser so the Bearer header is sent
    try {
      await logoutUser();
    } catch {
      // Ignore network errors on logout
    } finally {
      setSession(null);
      setUser(null);
      setApiToken(null);
      localStorage.removeItem(TOKEN_KEY);
    }
  }, []);

  const contextValue = useMemo(() => ({
    session,
    user,
    loading,
    login,
    logout,
  }), [session, user, loading, login, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
