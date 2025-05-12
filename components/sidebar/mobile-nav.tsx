"use client"
import { NavLink } from "react-router-dom"
import { useAuth } from "@/lib/auth-provider"
import { Home, Compass, Bell, Menu, Clock } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "./sidebar"

export function MobileNav() {
  const { user } = useAuth()

  return (
    <>
      <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t md:hidden">
        <div className="grid h-full grid-cols-5">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `inline-flex flex-col items-center justify-center px-5 ${isActive ? "text-primary" : "hover:text-primary"}`
            }
          >
            <Home size={20} />
            <span className="text-xs mt-1">Feed</span>
          </NavLink>

          <NavLink
            to="/explore"
            className={({ isActive }) =>
              `inline-flex flex-col items-center justify-center px-5 ${isActive ? "text-primary" : "hover:text-primary"}`
            }
          >
            <Compass size={20} />
            <span className="text-xs mt-1">Explore</span>
          </NavLink>

          <NavLink
            to="/stories"
            className={({ isActive }) =>
              `inline-flex flex-col items-center justify-center px-5 ${isActive ? "text-primary" : "hover:text-primary"}`
            }
          >
            <Clock size={20} />
            <span className="text-xs mt-1">Stories</span>
          </NavLink>

          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `inline-flex flex-col items-center justify-center px-5 ${isActive ? "text-primary" : "hover:text-primary"}`
            }
          >
            <Bell size={20} />
            <span className="text-xs mt-1">Alerts</span>
          </NavLink>

          <Sheet>
            <SheetTrigger asChild>
              <button className="inline-flex flex-col items-center justify-center px-5 hover:text-primary">
                <Menu size={20} />
                <span className="text-xs mt-1">Menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  )
}

export default MobileNav
