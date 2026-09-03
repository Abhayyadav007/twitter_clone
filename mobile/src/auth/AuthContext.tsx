import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as authApi from '../api/auth';
import type { AuthResponse, UserPublic } from '../types';
import { clearSession, loadSession, saveSession } from './tokenStore';

type AuthContextValue = {
  user: UserPublic | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (res: AuthResponse) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: UserPublic) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const session = await loadSession();
        if (!session || cancelled) {
          return;
        }
        const parsed = JSON.parse(session.userJson) as UserPublic;
        setUserState(parsed);
      } catch {
        await clearSession();
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (res: AuthResponse) => {
    await saveSession({
      accessToken: res.access_token,
      refreshToken: res.refresh_token,
      userId: res.user.id,
      userJson: JSON.stringify(res.user),
    });
    setUserState(res.user);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // still clear local session
    }
    await clearSession();
    setUserState(null);
  }, []);

  const setUser = useCallback((next: UserPublic) => {
    setUserState(next);
    void saveSessionFromUser(next);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      signIn,
      signOut,
      setUser,
    }),
    [user, isLoading, signIn, signOut, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

async function saveSessionFromUser(user: UserPublic): Promise<void> {
  const session = await loadSession();
  if (!session) {
    return;
  }
  await saveSession({
    ...session,
    userJson: JSON.stringify(user),
  });
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
