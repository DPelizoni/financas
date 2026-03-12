import apiClient from "./apiClient";
import { AuthSession, AuthUser, LoginInput, RegisterInput } from "@/types/auth";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

const setAuthCookie = (token: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `auth_token=${token}; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; SameSite=Lax`;
};

const clearAuthCookie = () => {
  if (typeof document === "undefined") return;
  document.cookie = "auth_token=; Path=/; Max-Age=0; SameSite=Lax";
};

const setStoredSession = (session: AuthSession) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem("auth_token", session.token);
  window.localStorage.setItem("auth_user", JSON.stringify(session.usuario));
  setAuthCookie(session.token);
};

const clearStoredSession = () => {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem("auth_token");
  window.localStorage.removeItem("auth_user");
  clearAuthCookie();
};

const getStoredUser = (): AuthUser | null => {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem("auth_user");
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};

const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("auth_token");
};

const isAuthenticated = (): boolean => Boolean(getStoredToken());

export const authService = {
  async login(input: LoginInput): Promise<AuthSession> {
    const response = await apiClient.post<{
      success: boolean;
      data: AuthSession;
    }>("/api/auth/login", input);

    const session = response.data.data;
    setStoredSession(session);
    return session;
  },

  async register(input: RegisterInput): Promise<AuthSession> {
    const response = await apiClient.post<{
      success: boolean;
      data: AuthSession;
    }>("/api/auth/register", input);

    const session = response.data.data;
    setStoredSession(session);
    return session;
  },

  async me(): Promise<AuthUser> {
    const response = await apiClient.get<{ success: boolean; data: AuthUser }>(
      "/api/auth/me",
    );

    const user = response.data.data;
    if (typeof window !== "undefined") {
      window.localStorage.setItem("auth_user", JSON.stringify(user));
    }

    return user;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post("/api/auth/logout");
    } catch {
      // Ignora falha no backend e limpa sessão local de qualquer forma.
    } finally {
      clearStoredSession();
    }
  },

  setStoredSession,
  clearStoredSession,
  getStoredUser,
  getStoredToken,
  isAuthenticated,
};
