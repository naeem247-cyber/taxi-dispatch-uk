import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { jwtDecode } from 'jwt-decode';
import {
  clearStoredToken,
  getStoredToken,
  login as loginRequest,
  setStoredToken,
} from '../services/api';
import { disconnectSocket } from '../services/socket';

type DecodedToken = {
  exp?: number;
  sub?: string;
  email?: string;
  role?: string;
  name?: string;
};

type AuthContextValue = {
  token: string | null;
  user: DecodedToken | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function parseToken(token: string): DecodedToken | null {
  try {
    return jwtDecode<DecodedToken>(token);
  } catch {
    return null;
  }
}

function isTokenExpired(decoded: DecodedToken | null) {
  if (!decoded?.exp) return false;
  return decoded.exp * 1000 < Date.now();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<DecodedToken | null>(null);

  useEffect(() => {
    const stored = getStoredToken();
    if (!stored) return;

    const decoded = parseToken(stored);

    if (isTokenExpired(decoded)) {
      clearStoredToken();
      return;
    }

    setToken(stored);
    setUser(decoded);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await loginRequest(email, password);

    // ✅ NestJS returns access_token
    setStoredToken(res.access_token);

    const decoded = parseToken(res.access_token);

    setToken(res.access_token);
    setUser(decoded);
  };

  const logout = () => {
    clearStoredToken();
    disconnectSocket();
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
