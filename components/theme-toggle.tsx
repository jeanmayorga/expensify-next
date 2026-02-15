"use client"

import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <SunIcon className="size-4 text-muted-foreground" />
        <Switch disabled />
        <MoonIcon className="size-4 text-muted-foreground" />
      </div>
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2">
          <SunIcon
            className={`size-4 transition-colors ${!isDark ? "text-foreground" : "text-muted-foreground"}`}
          />
          <Switch
            checked={isDark}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            aria-label="Cambiar tema"
          />
          <MoonIcon
            className={`size-4 transition-colors ${isDark ? "text-foreground" : "text-muted-foreground"}`}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{isDark ? "Modo oscuro" : "Modo claro"}</p>
      </TooltipContent>
    </Tooltip>
  )
}
