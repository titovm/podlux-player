'use client'

import { useTheme } from "next-themes"
import { Button } from "./ui/button"
import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="dark:hover:bg-gray-800"
    >
      {theme === "dark" ? (
        <Sun size={24} className="dark:text-gray-200" />
      ) : (
        <Moon size={24} />
      )}
    </Button>
  )
} 