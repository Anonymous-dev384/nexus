"use client"

import { useState, useEffect } from "react"
import { Outlet } from "react-router-dom"
import { useAuth } from "@/lib/auth-provider"
import Sidebar from "@/components/sidebar/sidebar"
import MobileNav from "@/components/sidebar/mobile-nav"
import RightSidebar from "@/components/sidebar/right-sidebar"
import { useMobile } from "@/hooks/use-mobile"

export function MainLayout() {
  const { user } = useAuth()
  const isMobile = useMobile()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - hidden on mobile */}
      {!isMobile && <Sidebar />}

      {/* Mobile navigation */}
      {isMobile && <MobileNav />}

      {/* Main content */}
      <main className="flex-1 border-x border-border max-w-2xl mx-auto w-full min-h-screen">
        <div className="p-4">
          <Outlet />
        </div>
      </main>

      {/* Right sidebar - hidden on mobile */}
      {!isMobile && user && <RightSidebar />}
    </div>
  )
}

// Default export for backward compatibility
export default MainLayout
