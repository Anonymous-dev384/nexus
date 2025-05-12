"use client"

import { useEffect } from "react"
import { BrowserRouter as Router } from "react-router-dom"
import AppRouter from "@/components/app-router"
import { AuthProvider } from "@/lib/auth-provider"
import { Toaster } from "@/components/ui/toaster"

export default function App() {
  // Persist theme from localStorage on initial load
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme")
    if (storedTheme) {
      try {
        const theme = JSON.parse(storedTheme)
        document.documentElement.classList.remove("light", "dark")

        if (theme === "system") {
          const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
          document.documentElement.classList.add(systemTheme)
        } else {
          document.documentElement.classList.add(theme)
        }
      } catch (e) {
        console.error("Failed to parse stored theme:", e)
      }
    }
  }, [])

  return (
    <AuthProvider>
      <Router>
        <AppRouter />
      </Router>
      <Toaster />
    </AuthProvider>
  )
}
