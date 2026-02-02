"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";

export function LoginScreen() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Small delay to feel more natural
    await new Promise((resolve) => setTimeout(resolve, 300));

    const success = login(password);
    if (!success) {
      setError("Contraseña incorrecta");
      setPassword("");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Expensify</h1>
          <p className="text-muted-foreground mt-2">
            Ingresa tu contraseña para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-center text-lg h-12"
              autoFocus
              disabled={isLoading}
            />
            {error && (
              <p className="text-destructive text-sm mt-2 text-center">
                {error}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12"
            disabled={!password || isLoading}
          >
            {isLoading ? "Verificando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
