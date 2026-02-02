"use client";

import { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { LoginScreen } from "./login-screen";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}
