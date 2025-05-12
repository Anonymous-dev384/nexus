"use client"
import { NavLink } from "react-router-dom"
import { useAuth } from "@/lib/auth-provider"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Home,
  Compass,
  Bell,
  MessageSquare,
  User,
  Settings,
  Trophy,
  Crown,
  Award,
  Users,
  Calendar,
  Target,
  Clock,
  MessageCircle,
} from "lucide-react"

export function Sidebar() {
  const { user, isPremium } = useAuth()

  return (
    <div className="h-screen w-64 border-r p-4 flex flex-col">
      <div className="mb-8">
        <Logo />
      </div>

      <nav className="space-y-2 flex-1">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`
          }
        >
          <Home size={20} />
          <span>Feed</span>
        </NavLink>

        <NavLink
          to="/explore"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`
          }
        >
          <Compass size={20} />
          <span>Explore</span>
        </NavLink>

        <NavLink
          to="/notifications"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`
          }
        >
          <Bell size={20} />
          <span>Notifications</span>
        </NavLink>

        <NavLink
          to="/messages"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`
          }
        >
          <MessageSquare size={20} />
          <span>Messages</span>
        </NavLink>

        <NavLink
          to="/stories"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`
          }
        >
          <Clock size={20} />
          <span>Stories</span>
        </NavLink>

        <NavLink
          to="/events"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`
          }
        >
          <Calendar size={20} />
          <span>Events</span>
        </NavLink>

        <NavLink
          to="/challenges"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`
          }
        >
          <Target size={20} />
          <span>Challenges</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`
          }
        >
          <User size={20} />
          <span>Profile</span>
        </NavLink>

        <NavLink
          to="/leaderboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`
          }
        >
          <Trophy size={20} />
          <span>Leaderboard</span>
        </NavLink>

        {isPremium && (
          <NavLink
            to="/premium-lounge"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`
            }
          >
            <Crown size={20} />
            <span>Premium</span>
          </NavLink>
        )}

        {isPremium && (
          <NavLink
            to="/premium-suggestions"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`
            }
          >
            <MessageCircle size={20} />
            <span>Suggestions</span>
          </NavLink>
        )}

        <NavLink
          to="/achievements"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`
          }
        >
          <Award size={20} />
          <span>Achievements</span>
        </NavLink>

        <NavLink
          to="/referrals"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`
          }
        >
          <Users size={20} />
          <span>Referrals</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`
          }
        >
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
      </nav>

      <div className="mt-auto pt-4 border-t">
        <ThemeToggle />
      </div>
    </div>
  )
}

export default Sidebar
