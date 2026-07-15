import { fetchCurrentUser, type AuthUser } from "@/api/auth";
import {
  AUTH_UNAUTHORIZED_EVENT,
  clearAccessToken,
  getAccessToken,
  storeAccessToken,
} from "@/lib/auth-session";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  completeLogin: (token: string, user: AuthUser, rememberMe: boolean) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>(() => getAccessToken() ? "loading" : "anonymous");
  const [user, setUser] = useState<AuthUser | null>(null);

  const forgetSession = useCallback(() => {
    clearAccessToken();
    queryClient.clear();
    setUser(null);
    setStatus("anonymous");
  }, [queryClient]);

  useEffect(() => {
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, forgetSession);

    const token = getAccessToken();
    if (token) {
      setStatus("loading");
      void fetchCurrentUser()
        .then((currentUser) => {
          setUser(currentUser);
          setStatus("authenticated");
        })
        .catch(() => forgetSession());
    } else {
      setStatus("anonymous");
    }

    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, forgetSession);
  }, [forgetSession]);

  const completeLogin = useCallback((token: string, currentUser: AuthUser, rememberMe: boolean) => {
    queryClient.clear();
    storeAccessToken(token, rememberMe);
    setUser(currentUser);
    setStatus("authenticated");
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(() => ({
    status,
    user,
    completeLogin,
    logout: forgetSession,
  }), [completeLogin, forgetSession, status, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
