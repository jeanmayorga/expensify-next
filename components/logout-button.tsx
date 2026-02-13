"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut, Eye } from "lucide-react";

export function LogoutButton() {
  const { logout, accessMode } = useAuth();

  return (
    <div className="flex items-center gap-2">
      {accessMode === "readonly" && (
        <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded">
          <Eye className="h-3 w-3" />
          <span className="hidden sm:inline">Solo lectura</span>
        </div>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={logout}
        title="Cerrar sesión"
        className="text-primary-foreground hover:bg-white/15 hover:text-primary-foreground"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
