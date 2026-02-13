"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export type AccessMode = "full" | "readonly";

interface AuthState {
  isAuthenticated: boolean;
  accessMode: AccessMode;
  budgetId: string | null;
}

interface AuthContextType extends AuthState {
  login: (password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "expensify_auth";

// Password configurations
const PASSWORDS = {
  SublimeText3: { accessMode: "full" as AccessMode, budgetId: null },
  key: {
    accessMode: "readonly" as AccessMode,
    budgetId: "0dc7502d-9d2a-4be1-a83d-6afb53545cb7", // amor budget
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    accessMode: "full",
    budgetId: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthState;
        setAuthState(parsed);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (password: string): boolean => {
    const config = PASSWORDS[password as keyof typeof PASSWORDS];
    if (config) {
      const newState: AuthState = {
        isAuthenticated: true,
        accessMode: config.accessMode,
        budgetId: config.budgetId,
      };
      setAuthState(newState);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return true;
    }
    return false;
  };

  const logout = () => {
    const newState: AuthState = {
      isAuthenticated: false,
      accessMode: "full",
      budgetId: null,
    };
    setAuthState(newState);
    localStorage.removeItem(STORAGE_KEY);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Hook to check if actions are allowed.
// Full access: can edit. Budget-scoped (key with budgetId): can edit but data is filtered by that budget.
export function useCanEdit() {
  const { accessMode, budgetId } = useAuth();
  return accessMode === "full" || budgetId !== null;
}
